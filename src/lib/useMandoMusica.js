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

export function useMandoMusica({ onOrden, onEstado } = {}) {
  const canalRef = useRef(null);
  const reintentoRef = useRef(null);
  const [conectado, setConectado] = useState(false);
  // Estado crudo del canal, tal cual lo devuelve Supabase
  // ("SUBSCRIBED", "CHANNEL_ERROR", "TIMED_OUT", "CLOSED"). Se expone
  // para poder DECIR qué pasa en vez de un simple tachado -- el usuario
  // vio el icono tachado mientras la música sonaba y, con razón, no
  // entendía por qué (2026-09-01). La música suena en local desde el
  // archivo guardado, así que puede ir perfecta con el canal caído:
  // son dos cosas independientes, y conviene que la pantalla lo diga.
  const [estadoCanal, setEstadoCanal] = useState("CONECTANDO");

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
    const canal = supabase.channel(NOMBRE_CANAL, {
      config: { broadcast: { self: false } },
    });

    canal.on("broadcast", { event: "orden" }, ({ payload }) => {
      onOrdenRef.current?.(payload);
    });
    canal.on("broadcast", { event: "estado" }, ({ payload }) => {
      onEstadoRef.current?.(payload);
    });

    canal.subscribe((estado) => {
      setEstadoCanal(estado);
      setConectado(estado === "SUBSCRIBED");
      // Un canal caído no se recupera solo. Sin este reintento, si la
      // conexión falla una vez (wifi del local, suspensión del Mac...)
      // el mando se queda muerto para el resto de la noche.
      if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") {
        clearTimeout(reintentoRef.current);
        reintentoRef.current = setTimeout(() => {
          setEstadoCanal("REINTENTANDO");
          canal.subscribe();
        }, 4000);
      }
    });
    canalRef.current = canal;

    return () => {
      clearTimeout(reintentoRef.current);
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
    canalRef.current?.send({
      type: "broadcast",
      event: "orden",
      payload: { accion, valor },
    });
  }, []);

  const enviarEstado = useCallback((estado) => {
    canalRef.current?.send({
      type: "broadcast",
      event: "estado",
      payload: estado,
    });
  }, []);

  return { conectado, estadoCanal, enviarOrden, enviarEstado };
}
