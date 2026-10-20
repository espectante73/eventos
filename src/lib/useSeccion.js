// Una ventana cuyos datos se traen al abrirla (v72.3): Cuentas, el
// historial de avisos de Colaboradores y Novedades (ver cargarSeccion en
// useLedgerData). Avisa al abrirse y devuelve si ya han llegado: hasta
// entonces la ventana solo dice «Cargando…».
// ⚠️ No enseñar nada antes: un campo que se rellena al montar (la pregunta
// del tablón, norma 2.4) se quedaría vacío y, al salir de él, guardaría el
// vacío encima del texto de verdad.
import { useEffect } from "react";

export function useSeccion(data, nombre) {
  const { abrirSeccion, seccionesCargadas, esAnfitrion } = data;
  useEffect(() => abrirSeccion?.(nombre), [abrirSeccion, nombre]);
  // El colaborador con permiso de Novedades ya las trae al abrir la app.
  return !esAnfitrion || !abrirSeccion || Boolean(seccionesCargadas?.[nombre]);
}
