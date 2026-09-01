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
  // Qué está haciendo el canal, en palabras, para poder DECIRLO en vez
  // de un simple icono tachado.
  const [estadoCanal, setEstadoCanal] = useState("CONECTANDO");
  // Cuándo llegó el último mensaje del otro aparato. Es la prueba más
  // sólida de que el canal funciona: si algo ha llegado hace tres
  // segundos, está conectado, se diga lo que se diga por otro lado.
  const ultimoMensajeRef = useRef(0);
  // Qué OTROS aparatos hay ahora mismo en el canal, por su papel
  // ("reproductor" / "mando"). Esto es lo que de verdad quiere saber
  // quien mira el icono de wifi: no si mi navegador ha enganchado con
  // Supabase (eso pasa aunque esté yo solo), sino si el otro aparato
  // está ahí. Confundir las dos cosas fue un problema real: el Mac
  // decía "conectado" sin haber abierto el mando siquiera.
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
    // ⚠️ TODO el montaje del canal va dentro de un try. `subscribe()`
    // llama por dentro a `socket.connect()`, que LANZA de verdad si el
    // navegador no puede abrir el WebSocket ("WebSocket not available")
    // o si falta la clave. Al ocurrir dentro de un efecto, ese error
    // sube hasta React y tumba la ventana entera -- y esta ventana tiene
    // que seguir funcionando sin canal: la música se reproduce en local,
    // el mando es un extra. Nunca dejar que una llamada de Realtime
    // quede fuera de un try aquí dentro.
    let canal;
    try {
      canal = supabase.channel(NOMBRE_CANAL, {
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

      // Se pasa SIEMPRE el mismo manejador al resuscribir: `subscribe()`
      // solo registra los avisos de error y cierre si se le da uno, así
      // que un reintento sin él dejaría el canal mudo para siempre.
      const avisarEstado = (estado) => {
        setEstadoCanal(estado);
        // Anunciarse en cuanto el canal está listo. Sin este `track`, el
        // otro aparato no sabe que existo.
        if (estado === "SUBSCRIBED") anunciarse(canal, rolRef.current);
        // Un canal caído no se recupera solo. Sin este reintento, si la
        // conexión falla una vez (wifi del local, suspensión del Mac...)
        // el mando se queda muerto para el resto de la noche.
        if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT" || estado === "CLOSED") {
          clearTimeout(reintentoRef.current);
          reintentoRef.current = setTimeout(() => {
            setEstadoCanal("REINTENTANDO");
            try {
              canal.subscribe(avisarEstado);
            } catch {
              setEstadoCanal("CHANNEL_ERROR");
            }
          }, 4000);
        }
      };
      canal.subscribe(avisarEstado);
      canalRef.current = canal;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("No se ha podido abrir el canal del mando:", error);
      setEstadoCanal("CHANNEL_ERROR");
      return undefined;
    }

    // ⚠️ El indicador NO puede depender solo del aviso de arriba, y esto
    // es un bug real (2026-09-01): el usuario tenía el mando gobernando
    // el Mac de verdad y la ventana seguía diciendo "conectando" en los
    // dos aparatos. Motivo: ese aviso se dispara UNA vez, y solo si al
    // suscribirse el canal estaba cerrado -- si el aviso no llega o
    // llega a destiempo, el estado se queda congelado aunque el canal
    // esté trabajando. Así que cada 2 segundos se mira la realidad: el
    // estado interno del propio canal ("joined") y si ha llegado algún
    // mensaje hace poco. Cualquiera de las dos cosas es prueba de que
    // funciona, y manda sobre lo que dijera el aviso.
    const vigilante = setInterval(() => {
      const unido = canalRef.current?.state === "joined";
      const recibiendoAhora = Date.now() - ultimoMensajeRef.current < 12000;
      const vivo = unido || recibiendoAhora;
      setConectado(vivo);
      // Los setState con el mismo valor no repintan nada (React los
      // descarta), así que este latido de 2s no cuesta repintados.
      if (vivo) setEstadoCanal("SUBSCRIBED");
      else if (canalRef.current?.state === "errored") setEstadoCanal("CHANNEL_ERROR");
    }, 2000);

    return () => {
      clearTimeout(reintentoRef.current);
      clearInterval(vigilante);
      supabase.removeChannel(canal);
      canalRef.current = null;
    };
  }, []);

  // `accion` es una cadena corta ("play", "pausa", "bloque", "saltar",
  // "volumen", "silencio", "cortinilla") y `valor` lo que necesite esa
  // acción (el número de bloque, los segundos a saltar...). Se ignora
  // en silencio si el canal todavía no está listo -- es un mando: más
  // vale que un toque se pierda a que la app reviente en plena boda.
  const enviarOrden = useCallback((accion, valor) => {
    try {
      canalRef.current?.send({ type: "broadcast", event: "orden", payload: { accion, valor } });
    } catch {
      // Un toque perdido es preferible a la app reventando en plena boda.
    }
  }, []);

  // Cuando este aparato deja de estar "sin definir" y se declara
  // reproductor o mando, hay que volver a anunciarlo: el otro extremo
  // pinta su aviso a partir de ese papel.
  useEffect(() => {
    if (canalRef.current?.state === "joined") anunciarse(canalRef.current, rol);
  }, [rol]);

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
    // "Está el otro" es lo que se muestra en la cabecera; `conectado`
    // (canal enganchado) se queda para el diagnóstico de por qué no.
    hayReproductor: otrosAparatos.includes("reproductor"),
    hayMando: otrosAparatos.includes("mando"),
    enviarOrden,
    enviarEstado,
  };
}
