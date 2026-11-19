// La lista del DJ en su cuenta (v91.5) y qué hay nuevo en ella (v92), en un
// solo sitio: el aviso rojo de su inicio y la ventana «Canciones para
// bailar» leen de aquí y dicen siempre lo mismo (norma 7).
//
// - El DJ la pide a la base (colaborador_canciones_dj) al entrar, cada
//   minuto y al volver a la pestaña; el anfitrión, con «Cambiar vista», la
//   saca de sus datos sin preguntar a nadie.
// - Lo nuevo, con la memoria de este aparato (lib/dj.js): se empieza a
//   recordar en cuanto llega la lista por primera vez, y después solo
//   mientras tiene la ventana abierta (`mirando`). Ver el aviso del inicio
//   no cuenta como haberla visto.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  datosDjDesdeLista,
  clavesDelDj,
  diaDe,
  referenciaCancionesDj,
  memoriaCancionesDj,
  clavesNuevas,
  leerMemoriaDj,
  guardarMemoriaDj,
} from "./dj";

const CADA = 60 * 1000;

export function useCancionesDj({ activo, esAnfitrion, invitados, evento, quien, mirando }) {
  const [delServidor, setDelServidor] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [hora, setHora] = useState(null);
  const [memoria, setMemoria] = useState(() => leerMemoriaDj(quien));

  const cargar = useCallback(async () => {
    try {
      const { data: d, error } = await supabase.rpc("colaborador_canciones_dj");
      if (error || d?.error) {
        setMotivo("No se ha podido cargar la lista. Si sigue sin salir, pide al anfitrión que revise tu permiso «Canciones para bailar».");
        return;
      }
      setMotivo("");
      setDelServidor(d);
      setHora(new Date());
    } catch {
      setMotivo("No se ha podido cargar la lista. Prueba otra vez en un momento.");
    }
  }, []);

  useEffect(() => {
    if (!activo || esAnfitrion) return undefined;
    cargar();
    const t = setInterval(cargar, CADA);
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [activo, esAnfitrion, cargar]);

  const datos = !activo ? null : esAnfitrion ? datosDjDesdeLista(invitados, evento) : delServidor;
  const claves = datos ? clavesDelDj(datos) : null;
  // Para el efecto, la lista como texto: los datos del anfitrión son un
  // objeto nuevo en cada dibujo y lo repetirían sin fin.
  const firma = claves ? JSON.stringify(claves) : null;

  useEffect(() => {
    if (firma === null) return;
    const guardada = leerMemoriaDj(quien);
    if (guardada && !mirando) {
      setMemoria(guardada);
      return;
    }
    const nueva = memoriaCancionesDj(guardada, diaDe(), JSON.parse(firma));
    guardarMemoriaDj(quien, nueva);
    setMemoria(nueva);
  }, [firma, mirando, quien]);

  const { referencia, desde } = claves ? referenciaCancionesDj(memoria, diaDe(), claves) : { referencia: [], desde: null };
  return { datos, motivo, hora, nuevas: claves ? clavesNuevas(claves, referencia) : new Set(), desde };
}
