// «Repartir familias» (él, v74): probar el reparto de mesas moviendo
// familias enteras de una mesa a otra, en su ventana propia, y solo al
// final «Aplicar a la Lista». Las reglas son las de siempre, en una sola
// pieza (asignarMesaConSuFamilia): una familia no se separa y no se sienta
// donde no cabe (él: «si la mesa 6 es de 9, que no deje sentar a más»).
//
// La prueba es un BORRADOR de solo las mesas que cambian, { idInvitado:
// mesa }, nunca una copia de la Lista: si mientras tanto un colaborador
// confirma a alguien, al aplicar no se le pisa (norma 12).
import { asignarMesaConSuFamilia, claveFamiliaMesa, ocupacion, seSientaEnMesa } from "./mesas";
import { nombreCompleto } from "./formato";
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
// confirmar») y en qué mesa están. La ventana pide `conSinConfirmar`.
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
    return { clave, representante, nombre: nombreCompleto(representante), cuantos: miembros.length, sinConfirmar, mesa: representante.mesa ?? null };
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
  const siguiente = { ...borrador };
  const real = new Map(invitados.map((g) => [g.id, g.mesa ?? null]));
  for (const g of tras) {
    const mesa = g.mesa ?? null;
    if (mesa === real.get(g.id)) delete siguiente[g.id];
    else siguiente[g.id] = mesa;
  }
  return { borrador: siguiente, aviso: "" };
}

// Lo que se manda al aplicar: la Lista de ahora con solo esas mesas cambiadas.
export const aplicarBorrador = (invitados, borrador) => conBorrador(invitados, borrador);

// Cuántas familias cambian de mesa en la prueba.
export function familiasQueCambian(invitados, borrador = {}) {
  const ids = new Set(Object.keys(borrador));
  return new Set(invitados.filter((g) => ids.has(g.id)).map(claveFamiliaMesa)).size;
}

export { ocupacion };
