// Las familias tal como las dice la invitación: quiénes son, en qué orden
// se nombran y en qué mesa están. Una sola pieza para la invitación
// (useMotorInvitaciones) y la lista impresa de acomodadores (él, v54.1),
// para que digan siempre lo mismo (norma 7).
import { listaConY } from "./formato";
import { familiaListaParaInvitacion } from "./invitados";

// Si el anfitrión reordenó los nombres a mano (p.ej. esposo primero),
// se respeta ese orden; los que falten en él (recién confirmados) van
// al final, en su orden normal.
function ordenarConfirmados(confirmados, ordenIds) {
  if (!ordenIds || ordenIds.length === 0) return confirmados;
  const porId = Object.fromEntries(confirmados.map((m) => [m.id, m]));
  const ordenados = ordenIds.map((id) => porId[id]).filter(Boolean);
  const idsOrdenados = new Set(ordenIds);
  const resto = confirmados.filter((m) => !idsOrdenados.has(m.id));
  return [...ordenados, ...resto];
}

// Todas las familias, con sus confirmados ya en el orden de la invitación.
export function familiasDelEvento(invitados, ordenFamiliares = {}, evento) {
  const grupos = {};
  invitados.forEach((g) => {
    const clave = g.grupoFamiliar || g.apellido || g.id;
    (grupos[clave] = grupos[clave] || []).push(g);
  });
  return Object.entries(grupos).map(([clave, miembros]) => {
    const confirmados = ordenarConfirmados(
      miembros.filter((m) => m.confirmado),
      ordenFamiliares?.[clave]?.orden
    );
    return {
      clave,
      apellido: miembros[0].apellido || clave,
      confirmados,
      invitacionEnviada: Boolean(ordenFamiliares?.[clave]?.invitacionEnviada),
      invitacionEnviadaEn: ordenFamiliares?.[clave]?.invitacionEnviadaEn || null,
      listaParaInvitacion: familiaListaParaInvitacion(confirmados, evento),
    };
  });
}

// "Fariña: Benito, Meritxell y Pablo": la primera línea de la etiqueta.
export function lineaFamilia(apellido, nombres) {
  return `${apellido}: ${listaConY(nombres)}`;
}

// La mesa (o mesas, si la familia está repartida) y cuántos son. La
// invitación lo escribe con palabras; la lista de acomodadores, con iconos.
export function mesasYCantidad(familia) {
  return {
    mesas: [...new Set(familia.confirmados.map((m) => m.mesa).filter(Boolean))],
    cantidad: familia.confirmados.length,
  };
}

// ¿Trabaja de acomodador? El papel lo escribe él a mano en la Lista
// («Acomodador», «acomodadora», «Acomodadores»): vale todo lo que empiece así.
const esAcomodador = (g) => (g.rolesTrabajo || []).some((r) => /^acomodador/i.test(String(r).trim()));

// La lista para acomodadores (él, v63.4): una fila por familia con algún
// confirmado, haya pagado o no, de la A a la Z. Aparte, el EQUIPO: las
// familias de los colaboradores y de los acomodadores, que se sientan los
// últimos. Colaborador = su cuenta enlazada a su ficha (`invitadoId`); los
// que no lo están los encuentra la Revisión.
export function filasAcomodadores(invitados, ordenFamiliares, colaboradores = []) {
  const deColaborador = new Set(colaboradores.map((c) => c.invitadoId).filter(Boolean));
  const filas = familiasDelEvento(invitados, ordenFamiliares)
    .filter((f) => f.confirmados.length > 0)
    .map((f) => ({
      clave: f.clave,
      apellido: f.apellido,
      linea: lineaFamilia(f.apellido, f.confirmados.map((m) => m.nombre)),
      ...mesasYCantidad(f),
      equipo: f.confirmados.some((m) => deColaborador.has(m.id) || esAcomodador(m)),
    }))
    .sort((a, b) => a.apellido.localeCompare(b.apellido, "es"));
  return { principal: filas.filter((f) => !f.equipo), equipo: filas.filter((f) => f.equipo) };
}
