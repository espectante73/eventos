// Canal de mando a distancia para "Música del evento" (2026-08-31).
//
// PRIMER USO DE SUPABASE REALTIME EN ESTE PROYECTO. Todo lo demás en la
// app se refresca preguntando cada minuto (ver useLedgerData.js), que
// para datos está bien pero es inservible aquí: si pulsas "pausa" en el
// móvil, la música tiene que parar AHORA, no dentro de 60 segundos.
//
// Usa "broadcast", no "postgres_changes": son mensajes que van de un
// navegador a otro pasando por Supabase, sin tocar ninguna tabla. Por
// eso este fichero NO necesita ningún cambio en schema.sql -- no hay
// nada que guardar, solo que transmitir.
//
// Dos tipos de mensaje, en sentidos opuestos:
// - "orden"  (mando -> reproductor): "pausa", "bloque 4", "volumen 60"...
// - "estado" (reproductor -> mando): qué suena, en qué minuto, a qué
//   volumen. Así el móvil pinta la realidad de lo que hace el Mac, en
//   vez de suponerla -- si alguien toca el Mac a mano, el móvil se
//   entera igual.
//
// `self: false`: quien manda un mensaje no lo recibe de vuelta. Sin
// esto, el reproductor se contestaría a sí mismo cada vez que informa
// de su estado.
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const NOMBRE_CANAL = "musica-evento";
const ESPERA_REINTENTO = 4000;
// Si en este tiempo no ha llegado nada del otro aparato Y el canal no
// está unido, se da por caído. 12s da margen de sobra: el reproductor
// anuncia su estado cada 3.
const SILENCIO_SOSPECHOSO = 12000;

// Identidad de este aparato dentro del canal. Se calcula una sola vez
// por carga de página: si cambiara, cada repintado se contaría como un
// aparato distinto en la lista de presentes.
const ID_APARATO = Math.random().toString(36).slice(2);

// Anunciar el papel de este aparato. Envuelto en try como el resto de
// llamadas a Realtime: nada de esto puede tumbar la ventana.
function anunciarse(canal, rol) {
  try {
    canal?.track({ rol: rol || "sin-definir" });
  } catch {
    // Sin presencia, la cabecera dirá "falta el otro aparato". El mando
    // sigue funcionando: la presencia solo sirve para informar.
  }
}

export function useMandoMusica({ onOrden, onEstado, rol } = {}) {
  const canalRef = useRef(null);
  const reintentoRef = useRef(null);
  const [conectado, setConectado] = useState(false);
  // Estado crudo del canal ("SUBSCRIBED", "CHANNEL_ERROR"...) y el texto
  // del error si lo hay: se enseñan tal cual en la ventana. El icono
  // tachado a secas ya nos costó dos rondas de diagnóstico a ciegas.
  const [estadoCanal, setEstadoCanal] = useState("CONECTANDO");
  const [detalleCanal, setDetalleCanal] = useState("");
  // Cuándo llegó el último mensaje del otro aparato. Es la prueba más
  // sólida de que el canal funciona: si algo ha llegado hace tres
  // segundos, está conectado, se diga lo que se diga por otro lado.
  const ultimoMensajeRef = useRef(0);
  // Qué OTROS aparatos hay ahora mismo en el canal, por su papel. Esto
  // es lo que de verdad quiere saber quien mira el icono de wifi: no si
  // mi navegador ha enganchado con Supabase (eso pasa aunque esté yo
  // solo), sino si el otro aparato está ahí.
  const [otrosAparatos, setOtrosAparatos] = useState([]);
  const rolRef = useRef(rol);
  rolRef.current = rol;

  // Los dos callbacks viven en refs y NO en las dependencias del efecto
  // de abajo a propósito: si estuvieran, cada repintado del componente
  // (que llega solo, con cada refresco de datos) cerraría y reabriría el
  // canal entero. Con refs, el canal se abre una vez y se queda.
  const onOrdenRef = useRef(onOrden);
  const onEstadoRef = useRef(onEstado);
  useEffect(() => {
    onOrdenRef.current = onOrden;
  }, [onOrden]);
  useEffect(() => {
    onEstadoRef.current = onEstado;
  }, [onEstado]);

  useEffect(() => {
    let vivo = true;

    // ⚠️ Reconectar es CREAR UN CANAL NUEVO, no volver a suscribir el
    // viejo. Fallo real del 2026-09-01: el Mac se quedaba clavado en
    // "el canal no conecta" mientras el móvil iba fino. Motivo: la
    // reconexión llamaba otra vez a `canal.subscribe()`, y por dentro
    // esa función no hace ABSOLUTAMENTE NADA si el canal no está
    // cerrado (todo su cuerpo va dentro de un `if (isClosed())`) --
    // así que un canal en estado "errored" nunca se recuperaba y nadie
    // volvía a avisar de nada. Se tira el canal y se levanta otro.
    const programarReintento = () => {
      if (!vivo || reintentoRef.current) return;
      reintentoRef.current = setTimeout(() => {
        reintentoRef.current = null;
        if (!vivo) return;
        setEstadoCanal("REINTENTANDO");
        const viejo = canalRef.current;
        canalRef.current = null;
        try {
          if (viejo) supabase.removeChannel(viejo);
        } catch {
          // Da igual por qué no se pudo soltar: lo importante es el
          // canal nuevo que viene detrás.
        }
        montar();
      }, ESPERA_REINTENTO);
    };

    // ⚠️ TODO el montaje va dentro de un try. `subscribe()` llama por
    // dentro a `socket.connect()`, que LANZA de verdad si el navegador
    // no puede abrir el WebSocket ("WebSocket not available"). Al
    // ocurrir dentro de un efecto, ese error sube hasta React y tumba la
    // ventana entera -- y esta ventana tiene que seguir funcionando sin
    // canal: la música se reproduce en local, el mando es un extra.
    function montar() {
      if (!vivo) return;
      try {
        const canal = supabase.channel(NOMBRE_CANAL, {
          config: { broadcast: { self: false } },
        });

        canal.on("presence", { event: "sync" }, () => {
          const presentes = canal.presenceState();
          setOtrosAparatos(
            Object.entries(presentes)
              .filter(([clave]) => clave !== ID_APARATO)
              .flatMap(([, apariciones]) => apariciones.map((a) => a.rol))
              .filter(Boolean)
          );
        });

        canal.on("broadcast", { event: "orden" }, ({ payload }) => {
          ultimoMensajeRef.current = Date.now();
          onOrdenRef.current?.(payload);
        });
        canal.on("broadcast", { event: "estado" }, ({ payload }) => {
          ultimoMensajeRef.current = Date.now();
          onEstadoRef.current?.(payload);
        });

        canal.subscribe((estado, error) => {
          setEstadoCanal(estado);
          setDetalleCanal(error?.message || "");
          // Anunciarse en cuanto el canal está listo. Sin este `track`,
          // el otro aparato no sabe que existo.
          if (estado === "SUBSCRIBED") anunciarse(canal, rolRef.current);
          if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT" || estado === "CLOSED") programarReintento();
        });
        canalRef.current = canal;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("No se ha podido abrir el canal del mando:", error);
        setEstadoCanal("CHANNEL_ERROR");
        setDetalleCanal(error?.message || "");
        programarReintento();
      }
    }

    montar();

    // El indicador NO puede depender solo del aviso de `subscribe()`:
    // ese aviso se dispara UNA vez, y solo si al suscribirse el canal
    // estaba cerrado. Cada 2 segundos se mira la realidad -- el estado
    // interno del canal y si ha llegado algo hace poco -- y si lleva un
    // buen rato mudo se levanta un canal nuevo. Los setState con el
    // mismo valor no repintan, así que este latido no cuesta nada.
    const vigilante = setInterval(() => {
      const unido = canalRef.current?.state === "joined";
      const recibiendoAhora = Date.now() - ultimoMensajeRef.current < SILENCIO_SOSPECHOSO;
      const vivoElCanal = unido || recibiendoAhora;
      setConectado(vivoElCanal);
      if (vivoElCanal) {
        setEstadoCanal("SUBSCRIBED");
        setDetalleCanal("");
      } else {
        if (canalRef.current?.state === "errored") setEstadoCanal("CHANNEL_ERROR");
        programarReintento();
      }
    }, 2000);

    // ⚠️ `document`/`window` a secas SÍ es lo correcto aquí, aunque este
    // hook lo use una ventana emergente: el WebSocket vive en el realm
    // de la pestaña principal, que es justo la que el navegador puede
    // congelar cuando queda por detrás. Al volver a primer plano (o al
    // recuperar la red) se comprueba enseguida en vez de esperar al
    // siguiente ciclo. Es lo que le pasaba al Mac mientras el móvil,
    // en primer plano, seguía fino.
    const alDespertar = () => {
      if (canalRef.current?.state !== "joined") programarReintento();
    };
    document.addEventListener("visibilitychange", alDespertar);
    window.addEventListener("online", alDespertar);
    window.addEventListener("focus", alDespertar);

    return () => {
      vivo = false;
      clearTimeout(reintentoRef.current);
      reintentoRef.current = null;
      clearInterval(vigilante);
      document.removeEventListener("visibilitychange", alDespertar);
      window.removeEventListener("online", alDespertar);
      window.removeEventListener("focus", alDespertar);
      if (canalRef.current) supabase.removeChannel(canalRef.current);
      canalRef.current = null;
    };
  }, []);

  // Cuando este aparato deja de estar "sin definir" y se declara
  // reproductor o mando, hay que volver a anunciarlo: el otro extremo
  // pinta su aviso a partir de ese papel.
  useEffect(() => {
    if (canalRef.current?.state === "joined") anunciarse(canalRef.current, rol);
  }, [rol]);

  // `accion` es una cadena corta ("play", "pausa", "bloque", "saltar",
  // "volumen", "silencio", "cortinilla") y `valor` lo que necesite esa
  // acción. Se ignora en silencio si el canal todavía no está listo --
  // es un mando: más vale que un toque se pierda a que la app reviente
  // en plena boda.
  const enviarOrden = useCallback((accion, valor) => {
    try {
      canalRef.current?.send({ type: "broadcast", event: "orden", payload: { accion, valor } });
    } catch {
      // Un toque perdido es preferible a la app reventando en plena boda.
    }
  }, []);

  const enviarEstado = useCallback((estado) => {
    try {
      canalRef.current?.send({ type: "broadcast", event: "estado", payload: estado });
    } catch {
      // Igual que enviarOrden: informar del estado nunca puede tumbar
      // la ventana que está sonando.
    }
  }, []);

  return {
    conectado,
    estadoCanal,
    detalleCanal,
    // "Está el otro" es lo que se muestra en la cabecera; `conectado`
    // (canal enganchado) se queda para el diagnóstico de por qué no.
    hayReproductor: otrosAparatos.includes("reproductor"),
    hayMando: otrosAparatos.includes("mando"),
    enviarOrden,
    enviarEstado,
  };
}
