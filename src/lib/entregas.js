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

// Todas las propinas entregadas: suman al balance (v85.9).
export const propinasTotales = (colaboradores) =>
  (colaboradores || []).reduce((s, c) => s + entregasDe(c).reduce((t, e) => t + (Number(e.propina) || 0), 0), 0);

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
