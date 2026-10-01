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

// Las filas de la lista de acomodadores: una por familia con algún
// confirmado, haya pagado o no. Por mesa, de la 1 en adelante (la familia
// repartida sale en cada una de sus mesas, y las que no tienen mesa, al
// final); por familia, de la A a la Z.
export function filasAcomodadores(invitados, ordenFamiliares, orden) {
  const comparar = (a, b) => a.apellido.localeCompare(b.apellido, "es");
  const filas = familiasDelEvento(invitados, ordenFamiliares)
    .filter((f) => f.confirmados.length > 0)
    .map((f) => ({
      clave: f.clave,
      apellido: f.apellido,
      linea: lineaFamilia(f.apellido, f.confirmados.map((m) => m.nombre)),
      ...mesasYCantidad(f),
    }));
  if (orden === "familia") return filas.sort(comparar);
  const numero = (m) => (m == null ? Infinity : Number(m));
  return filas
    .flatMap((f) => (f.mesas.length ? f.mesas : [null]).map((m) => ({ ...f, mesaOrden: m })))
    .sort((a, b) => numero(a.mesaOrden) - numero(b.mesaOrden) || comparar(a, b));
}
