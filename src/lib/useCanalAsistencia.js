// Canal en vivo de las llegadas del día del evento (2026-09-06).
//
// Por qué existe: toda la app se refresca PREGUNTANDO cada minuto (ver
// useLedgerData.js), lo cual está bien para datos que cambian de higos a
// brevas, pero no para esto -- el usuario lo señaló al probarlo: marcas
// a alguien en el móvil del colaborador y el recuento del anfitrión
// tarda casi un minuto en moverse, mientras que el mando de la música
// reacciona al instante.
//
// Se usa el MISMO mecanismo que la música (broadcast de Supabase
// Realtime, ver lib/useMandoMusica.js): mensajes de un navegador a otro
// pasando por Supabase, sin tocar ninguna tabla. Por eso no hace falta
// nada nuevo en schema.sql, y sobre todo no hace falta abrir la tabla
// `invitados` a Realtime -- que exigiría darle políticas de lectura
// directa a `authenticated`, justo lo que esta app evita a propósito
// (todo pasa por funciones `security definer`).
//
// El mensaje lleva solo el id y si está o no: quien lo recibe ya tiene
// al invitado cargado y solo necesita corregir ese campo. Si un mensaje
// se pierde, el refresco de cada minuto lo arregla solo -- esto es una
// mejora de latencia, no la fuente de verdad.
import { useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const NOMBRE_CANAL = "asistencia-evento";

export function useCanalAsistencia(onLlegada) {
  const canalRef = useRef(null);
  // El manejador vive en una ref y NO en las dependencias del efecto:
  // si estuviera, cada repintado cerraría y reabriría el canal entero
  // (misma razón, y mismo arreglo, que en useMandoMusica.js).
  const onLlegadaRef = useRef(onLlegada);
  useEffect(() => {
    onLlegadaRef.current = onLlegada;
  }, [onLlegada]);

  useEffect(() => {
    // Todo dentro de un try: `subscribe()` llama por dentro a
    // `socket.connect()`, que LANZA si el navegador no puede abrir el
    // WebSocket -- y un fallo del canal no puede tumbar la app entera.
    // Sin canal, el refresco de cada minuto sigue funcionando.
    try {
      const canal = supabase.channel(NOMBRE_CANAL, { config: { broadcast: { self: false } } });
      canal.on("broadcast", { event: "llegada" }, ({ payload }) => {
        if (payload?.id) onLlegadaRef.current?.(payload.id, Boolean(payload.presente));
      });
      canal.subscribe();
      canalRef.current = canal;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("No se pudo abrir el canal de asistencia:", error);
    }

    return () => {
      if (canalRef.current) supabase.removeChannel(canalRef.current);
      canalRef.current = null;
    };
  }, []);

  const avisarLlegada = (id, presente) => {
    try {
      canalRef.current?.send({ type: "broadcast", event: "llegada", payload: { id, presente } });
    } catch {
      // Que no llegue el aviso instantáneo no es grave: el otro lado se
      // enterará en el siguiente refresco.
    }
  };

  return { avisarLlegada };
}
