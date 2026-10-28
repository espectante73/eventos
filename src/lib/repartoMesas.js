// «Mesas y acomodación» (él, v74.6; antes «Repartir familias», v74): probar el reparto de mesas moviendo
// familias enteras de una mesa a otra, en su ventana propia, y solo al
// final «Aplicar a la Lista». Las reglas son las de siempre, en una sola
// pieza (asignarMesaConSuFamilia): una familia no se separa y no se sienta
// donde no cabe (él: «si la mesa 6 es de 9, que no deje sentar a más»).
//
// La prueba es un BORRADOR de solo las mesas que cambian, { idInvitado:
// mesa }, nunca una copia de la Lista: si mientras tanto un colaborador
// confirma a alguien, al aplicar no se le pisa (norma 12).
import { asignarMesaConSuFamilia, autoAsignarMesas, claveFamiliaMesa, ocupacion, seSientaEnMesa } from "./mesas";
import { nombreCompleto } from "./formato";
import { tieneAlergiaReal } from "./invitados";
import { ROL_FAMILIAR } from "./rolFamiliar";

// La Lista tal como quedaría con el borrador.
export function conBorrador(invitados, borrador = {}) {
  return invitados.map((g) => (Object.hasOwn(borrador, g.id) ? { ...g, mesa: borrador[g.id] } : g));
}

// Quién da nombre a la familia (él: «solo mostrar el rol O»): su esposo;
// si no tiene, el primer adulto (A, P, S) y, si no, el primero.
const ORDEN_NOMBRE = [ROL_FAMILIAR.ESPOSO, ROL_FAMILIAR.ESPOSA, ROL_FAMILIAR.PADRE, ROL_FAMILIAR.SUELTO];
const puesto = (g) => {
  const i = ORDEN_NOMBRE.indexOf(g.rolFamiliar);
  return i === -1 ? ORDEN_NOMBRE.length : i;
};

// Las familias que se sientan: quién las nombra, cuántos son, cuántos de
// ellos aún sin confirmar (salen sombreados: él, «que se sombreen hasta
// confirmar»), en qué mesa están y quiénes tienen alergias o intolerancias
// (el aviso, en la familia y no en la mesa: él, v74.9, «solo donde
// aplique»). La ventana pide `conSinConfirmar`.
export function familiasParaRepartir(vista, { conSinConfirmar = false } = {}) {
  const porClave = new Map();
  for (const g of vista) {
    if (!seSientaEnMesa(g, conSinConfirmar)) continue;
    const clave = claveFamiliaMesa(g);
    if (!porClave.has(clave)) porClave.set(clave, []);
    porClave.get(clave).push(g);
  }
  return [...porClave.entries()].map(([clave, miembros]) => {
    const representante = [...miembros].sort((a, b) => puesto(a) - puesto(b) || nombreCompleto(a).localeCompare(nombreCompleto(b), "es"))[0];
    const sinConfirmar = miembros.filter((g) => !g.confirmado).length;
    const conAlergia = miembros.filter(tieneAlergiaReal);
    return { clave, representante, nombre: nombreCompleto(representante), cuantos: miembros.length, sinConfirmar, conAlergia, mesa: representante.mesa ?? null };
  });
}

// Mueve una familia a una mesa (o a «Sin mesa», con numero = null) dentro
// del borrador. Devuelve { borrador, aviso }: con aviso, no se ha movido.
export function moverFamilia(invitados, borrador, idRepresentante, numero, mesas, { conSinConfirmar = false } = {}) {
  const vista = conBorrador(invitados, borrador);
  const representante = vista.find((g) => g.id === idRepresentante);
  const { invitados: tras, aviso } = asignarMesaConSuFamilia(vista, idRepresentante, numero, mesas, {
    comoSeLlama: representante && `de ${nombreCompleto(representante)}`,
    conSinConfirmar,
  });
  if (aviso) return { borrador, aviso };
  return { borrador: borradorDesde(invitados, tras), aviso: "" };
}

// El borrador que lleva de la Lista real a `propuesta`: solo las mesas que cambian.
export function borradorDesde(invitados, propuesta) {
  const real = new Map(invitados.map((g) => [g.id, g.mesa ?? null]));
  const borrador = {};
  for (const g of propuesta) {
    const mesa = g.mesa ?? null;
    if (real.has(g.id) && mesa !== real.get(g.id)) borrador[g.id] = mesa;
  }
  return borrador;
}

// «Vaciar» una mesa, en la prueba: todas sus familias a «Sin mesa».
export function vaciarMesaEnBorrador(invitados, borrador, numero) {
  const propuesta = conBorrador(invitados, borrador).map((g) => (g.mesa === numero ? { ...g, mesa: null } : g));
  return borradorDesde(invitados, propuesta);
}

// «Vaciar mesas» (él, v75.1), en la prueba: todas las mesas, vacías; las
// mesas se quedan.
export function vaciarTodasEnBorrador(invitados, borrador) {
  const propuesta = conBorrador(invitados, borrador).map((g) => (g.mesa != null ? { ...g, mesa: null } : g));
  return borradorDesde(invitados, propuesta);
}

// Auto-asignar, en la prueba: lo propone sobre lo que ya hay en ella.
export function autoAsignarEnBorrador(invitados, borrador, mesas) {
  const { invitados: propuesta, avisos } = autoAsignarMesas(conBorrador(invitados, borrador), mesas);
  return { borrador: borradorDesde(invitados, propuesta), avisos };
}

// Lo que se manda al aplicar: la Lista de ahora con solo esas mesas cambiadas.
export const aplicarBorrador = (invitados, borrador) => conBorrador(invitados, borrador);

// Cuántas familias cambian de mesa en la prueba.
export function familiasQueCambian(invitados, borrador = {}) {
  const ids = new Set(Object.keys(borrador));
  return new Set(invitados.filter((g) => ids.has(g.id)).map(claveFamiliaMesa)).size;
}

export { ocupacion };

// ---------- Las memorias: «Acomodación 1, 2 y 3» (él, v75) ----------
//
// Una foto de TODO lo de la acomodación (él: «todo lo relacionado»): las
// mesas con sus sitios y su sitio en el plano, y la mesa de cada invitado
// (también los que no tienen: así, al cargarla, se sabe quién es nuevo).
// Se guardan en `evento.acomodaciones`. Cargar una no toca nada: la deja
// como prueba, y todo cambia a la vez con «Aplicar a la Lista».
export const MEMORIAS = [1, 2, 3];

// La prueba entera, que vive en VistaAnfitrion: el borrador de asientos;
// las mesas, solo con una memoria cargada (si no, las de verdad); qué
// memoria está en pantalla; y si se ha tocado algo desde que se cargó o se
// guardó (entonces, cargar otra pregunta antes de descartarlo).
export const PRUEBA_VACIA = { borrador: {}, mesas: null, cargada: null, sucia: false };

export function memoriaDesde(vista, mesas, numero, guardadaEl = new Date().toISOString()) {
  return {
    numero,
    guardadaEl,
    mesas: mesas.map((m) => ({ ...m })),
    asientos: Object.fromEntries(vista.map((g) => [g.id, g.mesa ?? null])),
  };
}

// La lista de memorias con esta puesta en su número (sustituye la que hubiera).
export function conMemoria(memorias = [], memoria) {
  return [...memorias.filter((m) => m.numero !== memoria.numero), memoria].sort((a, b) => a.numero - b.numero);
}

// Lo que se pone en pantalla al cargar una memoria: sus mesas y el
// borrador que lleva de la Lista a sus asientos. Quien se añadió después,
// con su familia si ella estaba sentada; si no, donde esté (si su mesa
// sigue existiendo). Quien se borró, ya no está. Devuelve { mesas,
// borrador, aviso }: el aviso cuenta los nuevos, para que no sorprenda.
export function cargarMemoria(invitados, memoria) {
  const numeros = new Set(memoria.mesas.map((m) => m.numero));
  const asientos = memoria.asientos || {};
  const mesaDeFamilia = {};
  for (const g of invitados) {
    const mesa = asientos[g.id];
    if (mesa != null && numeros.has(mesa)) mesaDeFamilia[claveFamiliaMesa(g)] ??= mesa;
  }
  const nuevos = invitados.filter((g) => !Object.hasOwn(asientos, g.id));
  const propuesta = invitados.map((g) => {
    const mesa = Object.hasOwn(asientos, g.id) ? asientos[g.id] : (mesaDeFamilia[claveFamiliaMesa(g)] ?? g.mesa ?? null);
    return { ...g, mesa: mesa != null && numeros.has(mesa) ? mesa : null };
  });
  const aviso =
    nuevos.length === 0
      ? ""
      : `${nuevos.length === 1 ? "Hay 1 invitado nuevo" : `Hay ${nuevos.length} invitados nuevos`} desde que se guardó: con su familia si ella estaba sentada; si no, donde ya estaba.`;
  return { mesas: memoria.mesas.map((m) => ({ ...m })), borrador: borradorDesde(invitados, propuesta), aviso };
}
