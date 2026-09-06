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
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const NOMBRE_CANAL = "asistencia-evento";

export function useCanalAsistencia(onLlegada) {
  const canalRef = useRef(null);
  // Si el canal está unido de verdad. Se enseña en pantalla (marcador de
  // llegada) porque ya nos pasó con el mando de la música: sin un
  // indicador, "no llega el aviso" y "el canal no está conectado" se
  // confunden, y se diagnostica a ciegas.
  const [conectado, setConectado] = useState(false);
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
      // ⚠️ `self: true`, al revés que en la música. Allí el que manda no
      // debe oírse a sí mismo (el reproductor se contestaría solo). Aquí
      // el emisor y el receptor pueden ser LA MISMA sesión del navegador
      // -- el anfitrión previsualizando el formulario de un colaborador,
      // o la Lista de invitados abierta en su ventana aparte, que
      // comparte cliente con la pestaña principal. Con `self: false` ese
      // caso no recibía nada. Aplicar dos veces el mismo cambio no hace
      // daño: es fijar un booleano al mismo valor.
      const canal = supabase.channel(NOMBRE_CANAL, { config: { broadcast: { self: true } } });
      canal.on("broadcast", { event: "llegada" }, ({ payload }) => {
        if (payload?.id) onLlegadaRef.current?.(payload.id, Boolean(payload.presente));
      });
      canal.subscribe();
      canalRef.current = canal;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("No se pudo abrir el canal de asistencia:", error);
    }

    // Se mira el estado REAL del canal cada 2s, no el aviso de
    // `subscribe()`: ese llega una sola vez y puede no llegar nunca --
    // lección aprendida con el mando de la música, que se quedaba
    // diciendo "conectando" con el canal funcionando.
    const vigilante = setInterval(() => {
      setConectado(canalRef.current?.state === "joined");
    }, 2000);

    return () => {
      clearInterval(vigilante);
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

  return { avisarLlegada, conectado };
}
