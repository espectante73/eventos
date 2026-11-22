// Las entregas de dinero de cada colaborador (él, v87): «un colaborador puede
// tener varias rondas de recogida de dinero». Por el tamaño de su lista, puede
// entregar lo cobrado en varias veces; cada entrega lleva su importe, su
// propina y su acuse, solo con los invitados de esa entrega.
//
// Una sola pieza dice qué está entregado (norma 7): la lista
// `colaboradores.entregas` de la base, con los invitados de cada una. Lo que
// falta por entregar se calcula: sus confirmados ya pagados que no están en
// ninguna entrega. Una foto de Deshacer anterior trae la lista vacía (null).
import { importeEsperadoInvitado } from "./invitados";
import { ordenarPorApellidoNombre } from "./formato";

export const entregasDe = (c) => (Array.isArray(c?.entregas) ? c.entregas : []);

// Los invitados que ya entraron en alguna entrega, de cualquier colaborador:
// si a uno ya entregado se le cambia de colaborador, no vuelve a salir (la
// base lo comprueba igual, en anfitrion_confirmar_entrega).
export const entregados = (colaboradores) =>
  new Set((colaboradores || []).flatMap((c) => entregasDe(c).flatMap((e) => e.invitados || [])));

// Lo que tiene cobrado y todavía no ha entregado: sus confirmados pagados que
// no están en ninguna entrega, con el importe de cada uno. `todos`, los
// colaboradores (sin ellos, solo mira las suyas).
export function porEntregar(c, invitados, evento, todos = [c]) {
  const ya = entregados(todos);
  const pendientes = (invitados || []).filter((g) => g.colaboradorId === c?.id && g.confirmado && g.pagado && !ya.has(g.id));
  const items = ordenarPorApellidoNombre(pendientes).map((g) => ({
    id: g.id,
    apellido: g.apellido,
    nombre: g.nombre,
    importe: importeEsperadoInvitado(g, evento),
  }));
  return { items, total: items.reduce((s, it) => s + it.importe, 0) };
}

// Los invitados de una entrega ya hecha, para reenviar su acuse. Nombre e
// importe salen de la Lista (norma 8); el total, el de ese día.
export function itemsDeEntrega(entrega, invitados, evento) {
  const ids = new Set(entrega?.invitados || []);
  return ordenarPorApellidoNombre((invitados || []).filter((g) => ids.has(g.id))).map((g) => ({
    apellido: g.apellido,
    nombre: g.nombre,
    importe: importeEsperadoInvitado(g, evento),
  }));
}

// Lo que dicen los acuses frente a lo que cuenta la app (él, v94.5: «no me
// cuadra», «todo se repasó varias veces antes de entregar acuse»). Lo
// entregado (importe y propina de cada acuse) más lo que aún tienen los
// colaboradores tiene que dar lo recaudado más las propinas. Si no, la
// diferencia, y las causas que la app puede ver:
// - `sinColaborador`: pagados que no lleva nadie: no están en ningún acuse;
// - `yaNoPagados`: de un acuse, pero hoy sin pagar o sin confirmar;
// - `acusesDistintos`: acuses cuyo importe no es el de hoy (cambiado a mano
//   al entregar, o cambió después un precio o una edad).
const redondear = (n) => Math.round(n * 100) / 100;
export function cuadreEntregas({ invitados = [], evento, colaboradores = [], recaudado = 0, propinas = 0 }) {
  const todos = colaboradores || [];
  const lasEntregas = todos.flatMap((c) => entregasDe(c));
  const entregado = redondear(lasEntregas.reduce((s, e) => s + (Number(e.importe) || 0) + (Number(e.propina) || 0), 0));
  const pendiente = redondear(todos.reduce((s, c) => s + porEntregar(c, invitados, evento, todos).total, 0));
  const porId = new Map(invitados.map((g) => [g.id, g]));
  const ids = new Set(todos.map((c) => c.id));
  const sinColaborador = invitados.filter(
    (g) => g.confirmado && g.pagado && importeEsperadoInvitado(g, evento) > 0 && !ids.has(g.colaboradorId)
  ).length;
  const yaNoPagados = [...entregados(todos)].filter((id) => {
    const g = porId.get(id);
    return !g || !g.confirmado || !g.pagado;
  }).length;
  const acusesDistintos = lasEntregas.filter((e) => {
    const deHoy = (e.invitados || []).reduce((s, id) => s + (porId.has(id) ? importeEsperadoInvitado(porId.get(id), evento) : 0), 0);
    return Math.abs((Number(e.importe) || 0) - deHoy) > 0.005;
  }).length;
  return {
    entregado,
    porEntregar: pendiente,
    diferencia: redondear(recaudado + propinas - entregado - pendiente),
    sinColaborador,
    yaNoPagados,
    acusesDistintos,
  };
}

// Todas las propinas entregadas: suman al balance (v85.9).
export const propinasTotales = (colaboradores) =>
  (colaboradores || []).reduce((s, c) => s + entregasDe(c).reduce((t, e) => t + (Number(e.propina) || 0), 0), 0);

// Cada propina, para comprobarla con lo que él apuntó (v94.6, él: «tengo
// 66 € y el programa me marca 77 €, desglosa las propinas»): una por acuse
// que la lleva, por colaborador y, dentro, por fecha. Suman `propinasTotales`.
export function desglosePropinas(colaboradores) {
  return (colaboradores || [])
    .flatMap((c) =>
      entregasDe(c)
        .filter((e) => (Number(e.propina) || 0) > 0)
        .map((e) => ({ id: e.id, colaborador: c.nombre || "", fecha: String(e.fecha || "").slice(0, 10), propina: Number(e.propina) }))
    )
    .sort((x, y) => x.colaborador.localeCompare(y.colaborador, "es") || x.fecha.localeCompare(y.fecha));
}

// En qué punto está: «pendiente» (tiene algo por entregar), «sin empezar» (ni
// entregas ni nada cobrado) o «entregado» (lo ha entregado todo). Ordena la
// lista de Contabilidad: arriba lo pendiente, abajo lo entregado (v86.1).
export function estadoEntregas(c, invitados, evento, todos = [c]) {
  if (porEntregar(c, invitados, evento, todos).items.length > 0) return "pendiente";
  return entregasDe(c).length > 0 ? "entregado" : "sin empezar";
}

const ORDEN_ESTADO = { pendiente: 0, "sin empezar": 1, entregado: 2 };
export function ordenarPorEntregas(colaboradores, invitados, evento) {
  const estado = (c) => ORDEN_ESTADO[estadoEntregas(c, invitados, evento, colaboradores)];
  return [...(colaboradores || [])].sort((a, b) => estado(a) - estado(b));
}
