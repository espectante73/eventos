// El equipo de colaboradores, en el panel de cada uno (él, v73.1): para que
// sepa con quién trabaja y a quién consultar. Cada uno, «Apellido, Nombre»
// y su zona, de su ficha de la Lista (norma 8). En orden alfabético por
// apellido y, dentro de cada matrimonio, primero el esposo y luego la
// esposa, como en el resto de la app (él: «todos los que son matrimonio,
// el esposo está arriba»).
import { ROL_FAMILIAR } from "./rolFamiliar";
import { claveFamilia, esDj } from "./invitados";
import { fichaDelColaborador } from "./edicionInvitados";

const ORDEN_ROL = { [ROL_FAMILIAR.ESPOSO]: 0, [ROL_FAMILIAR.ESPOSA]: 1 };
const comparar = (a, b) => String(a || "").localeCompare(String(b || ""), "es", { sensitivity: "base" });

// Un colaborador nuevo sacado de su ficha de la Lista (norma 8): su nombre
// y su email, los de la ficha. Antes el email nacía vacío y, como a un
// colaborador se le cuenta el de su cuenta, quien ya tenía email en su
// ficha pasaba a «datos incompletos» (él, v91.2, con el DJ).
export const colaboradorDesdeFicha = (ficha, id) => ({
  id,
  nombre: `${ficha.apellido || ""}, ${ficha.nombre || ""}`.trim(),
  invitadoId: ficha.id,
  email: String(ficha.email || "").trim(),
});

// El DJ contratado (él, v91.1: «que tenga login porque quiero que tenga
// acceso a multimedia»): entra con una cuenta de colaborador con solo ese
// permiso. Que es el DJ lo dice su ficha de la Lista (zona «DJ», esDj), no
// una copia. No lleva invitados: fuera de las listas para asignarlos, de
// Progreso, de Contabilidad, de «Avisar al equipo» y del Equipo; dentro de
// Permisos, de Datos de colaboradores y de «Cambiar vista», para darle la
// cuenta y el permiso y ver lo que ve él.
export const colaboradorEsDj = (c, invitados = []) => esDj(invitados.find((g) => g.id === c?.invitadoId));
export const colaboradoresSinDj = (colaboradores = [], invitados = []) => colaboradores.filter((c) => !colaboradorEsDj(c, invitados));
// El Equipo (filas con su zona, del servidor o de equipoDesdeDatos): sin el
// DJ, salvo para él mismo.
export const equipoSinDj = (equipo = []) => equipo.filter((p) => p.esYo || !esDj(p));

export function ordenarEquipo(equipo = []) {
  return [...equipo].sort(
    (a, b) =>
      comparar(a.apellido, b.apellido) ||
      comparar(claveFamilia(a), claveFamilia(b)) ||
      (ORDEN_ROL[a.rolFamiliar] ?? 2) - (ORDEN_ROL[b.rolFamiliar] ?? 2) ||
      comparar(a.nombre, b.nombre)
  );
}

// El anfitrión, viendo el panel de un colaborador, ya tiene a todos: el
// mismo equipo sacado de sus datos, con la forma que da colaborador_equipo.
export function equipoDesdeDatos(colaboradores = [], invitados = [], yoId = null) {
  return colaboradores.map((c) => {
    const ficha = invitados.find((g) => g.id === c.invitadoId);
    const copia = fichaDelColaborador(c);
    return {
      id: c.id,
      apellido: String(ficha ? ficha.apellido : copia.apellido || "").trim(),
      nombre: String(ficha ? ficha.nombre : copia.nombre || "").trim(),
      grupoFamiliar: ficha?.grupoFamiliar || "",
      rolFamiliar: ficha?.rolFamiliar || "",
      zona: ficha?.zona || "",
      esYo: c.id === yoId,
    };
  });
}

// El colaborador lo pide al servidor: { equipo } o { aviso } si no se pudo.
export async function leerEquipo(supabase, colaboradorId) {
  const { data, error } = await supabase.rpc("colaborador_equipo", { p_colaborador_id: colaboradorId });
  if (error) return { equipo: null, aviso: "No se ha podido cargar el equipo. Prueba otra vez en un momento." };
  return { equipo: data || [], aviso: "" };
}
