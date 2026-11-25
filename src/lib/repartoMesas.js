// «Mesas y acomodación» (él, v74.6; antes «Repartir familias», v74): probar el reparto de mesas moviendo
// familias enteras de una mesa a otra, en su ventana propia, y solo al
// final «Aplicar a la Lista». Las reglas son las de siempre, en una sola
// pieza (asignarMesaConSuFamilia): una familia no se separa y no se sienta
// donde no cabe (él: «si la mesa 6 es de 9, que no deje sentar a más»).
//
// La prueba es un BORRADOR de solo las mesas que cambian, { idInvitado:
// mesa }, nunca una copia de la Lista: si mientras tanto un colaborador
// confirma a alguien, al aplicar no se le pisa (norma 12).
import { asignarMesaConSuFamilia, autoAsignarMesas, claveFamiliaMesa, claveInvitacion, mesaFija, ocupacion, seSientaEnMesa } from "./mesas";
import { listaConY, nombreCompleto } from "./formato";
import { uid } from "./id";
import { tieneAlergiaReal, esDj } from "./invitados";
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
export function familiasParaRepartir(vista, { conSinConfirmar = false, ordenFamiliares } = {}) {
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
    return { clave, representante, nombre: nombreCompleto(representante), cuantos: miembros.length, sinConfirmar, conAlergia, mesa: representante.mesa ?? null, fija: mesaFija(representante, ordenFamiliares) };
  });
}

// Mueve una familia a una mesa (o a «Sin mesa», con numero = null) dentro
// del borrador. Devuelve { borrador, aviso }: con aviso, no se ha movido.
export function moverFamilia(invitados, borrador, idRepresentante, numero, mesas, { conSinConfirmar = false, ordenFamiliares } = {}) {
  const vista = conBorrador(invitados, borrador);
  const representante = vista.find((g) => g.id === idRepresentante);
  const bloque = familiasQueVanCon(vista, representante, { conSinConfirmar, ordenFamiliares });
  if (bloque.length > 1) return moverBloque(invitados, borrador, vista, bloque, numero, mesas, { conSinConfirmar, ordenFamiliares });
  const desde = representante?.mesa ?? null;
  if (desde != null && desde !== numero && mesaBloqueada(mesas, desde)) {
    return { borrador, aviso: `La mesa ${desde} está bloqueada: nadie sale de ella. Desmarca «Bloqueada» para cambiarla.` };
  }
  const { invitados: tras, aviso } = asignarMesaConSuFamilia(vista, idRepresentante, numero, mesas, {
    comoSeLlama: representante && `de ${nombreCompleto(representante)}`,
    conSinConfirmar,
    ordenFamiliares,
  });
  if (aviso) return { borrador, aviso };
  return { borrador: borradorDesde(invitados, tras), aviso: "" };
}

// Una mesa bloqueada (él, v101: «los invitados que sí o sí tienen que ir en
// esa mesa»): nadie sale de ella —ni moviéndolo, ni con «Vaciar» o «Vaciar
// mesas»— y no se puede quitar. Sus huecos libres sí se llenan, a mano o con
// Auto-asignar (él: «bloquear deja sitios libres si los hay»). La marca vive
// en la mesa (`bloqueada`, tabla mesas): se guarda al momento, como sus
// sitios, y va en las memorias con ella.
export const mesaBloqueada = (mesas = [], numero) => numero != null && mesas.some((m) => m.numero === numero && m.bloqueada);

// Marcar o desmarcar «Bloqueada»: las mesas con ese cambio.
export function conBloqueo(mesas, numero, bloqueada) {
  return mesas.map((m) => (m.numero === numero ? { ...m, bloqueada: Boolean(bloqueada) } : m));
}

// ---------- «Van juntos» (él, v101.1) ----------
//
// Familias que viajan juntas y se sientan juntas, sin hacerlas una familia
// (él: «no quiero vincularlos por apellidos»): la invitación, el pago y las
// fotos siguen siendo de cada una. La marca, un código común en
// orden_familias (`vanJuntos`), por familia: si se le cambia el código de
// familia, la base se lo muda con ella. Al mover una, va todo el grupo;
// Auto-asignar las sienta juntas; si no caben, no se mueve nada y se dice.

export const grupoJuntos = (g, ordenFamiliares) => (g ? ordenFamiliares?.[claveInvitacion(g)]?.vanJuntos || null : null);

const porNombreFamilia = (a, b) => a.nombre.localeCompare(b.nombre, "es");

// Los grupos de ahora, de las familias que se sientan, numerados 1, 2, 3…
// por orden alfabético de su primera familia (el número de la cadena 🔗).
// Un grupo que se ha quedado con una sola familia no cuenta.
export function gruposJuntos(familias, ordenFamiliares) {
  const porGrupo = new Map();
  for (const f of familias) {
    const id = grupoJuntos(f.representante, ordenFamiliares);
    if (id) porGrupo.set(id, [...(porGrupo.get(id) || []), f]);
  }
  return [...porGrupo.entries()]
    .filter(([, fs]) => fs.length > 1)
    .map(([id, fs]) => ({ id, familias: [...fs].sort(porNombreFamilia) }))
    .sort((a, b) => porNombreFamilia(a.familias[0], b.familias[0]))
    .map((grupo, i) => ({ ...grupo, numero: i + 1 }));
}

// La familia de `g` y las que van con ella (familiasParaRepartir).
function familiasQueVanCon(vista, g, { conSinConfirmar, ordenFamiliares }) {
  const id = grupoJuntos(g, ordenFamiliares);
  if (!id) return [];
  return familiasParaRepartir(vista, { conSinConfirmar, ordenFamiliares }).filter((f) => grupoJuntos(f.representante, ordenFamiliares) === id);
}

// Mover un grupo entero a una mesa (o a «Sin mesa»): todo o nada.
function moverBloque(invitados, borrador, vista, bloque, numero, mesas, { conSinConfirmar, ordenFamiliares }) {
  const claves = new Set(bloque.map((f) => f.clave));
  const sentados = vista.filter((g) => claves.has(claveFamiliaMesa(g)) && seSientaEnMesa(g, conSinConfirmar));
  const nombres = listaConY(bloque.map((f) => f.nombre));
  const sale = sentados.find((g) => g.mesa != null && g.mesa !== numero && mesaBloqueada(mesas, g.mesa));
  if (sale) return { borrador, aviso: `La mesa ${sale.mesa} está bloqueada: nadie sale de ella. Desmarca «Bloqueada» para cambiarla.` };
  const mesa = numero != null && mesas.find((m) => m.numero === numero);
  if (mesa) {
    const entran = sentados.filter((g) => g.mesa !== numero).length;
    const libres = Math.max(mesa.capacidad - ocupacion(vista, numero), 0);
    if (entran > libres) {
      const quedan = libres === 0 ? "no queda ningún sitio" : libres === 1 ? "solo queda 1 sitio" : `solo quedan ${libres} sitios`;
      return { borrador, aviso: `${nombres} van juntos: son ${sentados.length} y en la mesa ${numero} ${quedan}. Sube la capacidad de la mesa o elige otra.` };
    }
  }
  let lista = vista;
  for (const f of bloque) {
    const suyos = sentados.filter((g) => claveFamiliaMesa(g) === f.clave);
    if (suyos.every((g) => (g.mesa ?? null) === numero)) continue;
    const { invitados: tras, aviso } = asignarMesaConSuFamilia(lista, f.representante.id, numero, mesas, { comoSeLlama: `de ${f.nombre}`, conSinConfirmar, ordenFamiliares });
    if (aviso) return { borrador, aviso };
    lista = tras;
  }
  return { borrador: borradorDesde(invitados, lista), aviso: "" };
}

// Juntar dos familias: la primera va con la segunda (y con las que ya iban
// con cualquiera de las dos: un solo grupo). Lo que en la vida real va
// junto, la app lo junta sola (norma 11): si la segunda tiene mesa, el
// grupo se sienta en ella; si no y la primera sí, en la de la primera. En la
// prueba, como sentar. Si no caben, no se junta nada y se dice. Devuelve
// { ordenFamiliares, borrador, aviso }; el código del grupo, `nuevoId`.
export function juntarFamilias(invitados, borrador, idA, idB, mesas, { ordenFamiliares = {}, conSinConfirmar = false, nuevoId = uid } = {}) {
  const vista = conBorrador(invitados, borrador);
  const a = vista.find((g) => g.id === idA);
  const b = vista.find((g) => g.id === idB);
  const sinCambios = { ordenFamiliares, borrador };
  if (!a || !b) return { ...sinCambios, aviso: "Elige las dos familias." };
  if (claveFamiliaMesa(a) === claveFamiliaMesa(b)) return { ...sinCambios, aviso: "Es la misma familia: ya se sientan juntos." };
  const ga = grupoJuntos(a, ordenFamiliares);
  const gb = grupoJuntos(b, ordenFamiliares);
  if (ga && ga === gb) return { ...sinCambios, aviso: "Ya van juntos." };
  const id = gb || ga || nuevoId();
  const siguiente = { ...ordenFamiliares };
  const marcar = (clave) => {
    siguiente[clave] = { orden: [], invitacionEnviada: false, invitacionEnviadaEn: null, ...siguiente[clave], vanJuntos: id };
  };
  for (const [clave, datos] of Object.entries(ordenFamiliares)) if (datos?.vanJuntos && (datos.vanJuntos === ga || datos.vanJuntos === gb)) marcar(clave);
  marcar(claveInvitacion(a));
  marcar(claveInvitacion(b));
  const destino = b.mesa ?? a.mesa ?? null;
  if (destino == null) return { ordenFamiliares: siguiente, borrador, aviso: "" };
  const { borrador: sentado, aviso } = moverFamilia(invitados, borrador, b.mesa != null ? idA : idB, destino, mesas, { conSinConfirmar, ordenFamiliares: siguiente });
  if (aviso) return { ...sinCambios, aviso };
  return { ordenFamiliares: siguiente, borrador: sentado, aviso: "" };
}

// Separar un grupo: cada familia, por su cuenta. Nadie cambia de mesa.
export function separarJuntos(ordenFamiliares = {}, id) {
  return Object.fromEntries(Object.entries(ordenFamiliares).map(([clave, datos]) => [clave, datos?.vanJuntos === id ? { ...datos, vanJuntos: null } : datos]));
}

// La cifra de una familia en su pastilla: cuántos son; con parte sin
// confirmar, «2+1» (sombreada si no ha confirmado nadie: él, v74.2).
export function cifraFamilia(f) {
  return f.sinConfirmar && f.sinConfirmar !== f.cuantos ? `${f.cuantos - f.sinConfirmar}+${f.sinConfirmar}` : String(f.cuantos);
}

// El ancho de los recuadros de «Sin mesa» y de las mesas (él, v98.7: «que
// corresponda al largo del nombre más largo»): lo que pide la pastilla de
// la familia más larga, de todas (también las de «Sin mesa» plegada, para
// que plegarla no lo cambie), y nunca menos que la cabecera de una mesa
// (`minimo`). Lo mide quien dibuja: `medirNombre(texto, negrita)` y
// `medirCifra(texto)`, en px; `icono`, lo que ocupa cada icono con su
// hueco; `fijo`, márgenes y bordes de la pastilla y del recuadro.
export function anchoColumnas(familias, { medirNombre, medirCifra, icono, fijo, minimo }) {
  let mayor = minimo;
  for (const f of familias) {
    const dj = esDj(f.representante);
    const nombre = medirNombre(f.nombre, dj) + (dj ? icono : 0);
    // `junto`: el número de su grupo de «Van juntos» (v101.1), con su cadena.
    const resto = medirCifra(cifraFamilia(f)) + (f.fija ? icono : 0) + (f.conAlergia?.length ? icono : 0) + (f.junto ? icono + medirCifra(String(f.junto)) : 0);
    mayor = Math.max(mayor, Math.ceil(nombre + resto + fijo));
  }
  return mayor;
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

// Cambiar una mesa de orden (él, v83): la mesa `desde` ocupa el lugar de
// `hasta`, las de en medio se corren, y todas se renumeran 1, 2, 3… en el
// orden en que quedan. Cada mesa se lleva a su gente, sus sitios y su lugar
// en el plano. Va a la prueba, como sentar: devuelve { borrador, mesas, aviso }.
// Sin nada que cambiar, las mismas mesas. Una mesa con invitaciones enviadas
// no cambia de número (v83.1): si fuera a cambiar, no se mueve nada y se dice.
export function moverMesa(invitados, borrador, mesas, desde, hasta, ordenFamiliares) {
  const orden = [...mesas].sort((a, b) => a.numero - b.numero);
  const i = orden.findIndex((m) => m.numero === desde);
  const j = orden.findIndex((m) => m.numero === hasta);
  if (i === -1 || j === -1 || i === j) return { borrador, mesas, aviso: "" };
  const [cogida] = orden.splice(i, 1);
  orden.splice(j, 0, cogida);
  const { numeroNuevo, aviso } = renumerar(invitados, orden, ordenFamiliares);
  if (aviso) return { borrador, mesas, aviso };
  const propuesta = conBorrador(invitados, borrador).map((g) => (numeroNuevo.has(g.mesa) ? { ...g, mesa: numeroNuevo.get(g.mesa) } : g));
  return { borrador: borradorDesde(invitados, propuesta), mesas: orden.map((m, k) => ({ ...m, numero: k + 1 })), aviso: "" };
}

// Las mesas, 1, 2, 3… en el orden dado: el número nuevo de cada una. Si
// alguna con invitaciones enviadas cambiaría de número, el `aviso`.
function renumerar(invitados, orden, ordenFamiliares) {
  const numeroNuevo = new Map(orden.map((m, k) => [m.numero, k + 1]));
  const fijas = [...new Set(invitados.filter((g) => mesaFija(g, ordenFamiliares) && numeroNuevo.has(g.mesa) && numeroNuevo.get(g.mesa) !== g.mesa).map((g) => g.mesa))].sort((a, b) => a - b);
  const aviso = fijas.length
    ? `No se puede: ${fijas.length === 1 ? `la mesa ${fijas[0]} tiene` : `las mesas ${fijas.join(", ")} tienen`} invitaciones enviadas y cambiaría${fijas.length === 1 ? "" : "n"} de número.`
    : "";
  return { numeroNuevo, aviso };
}

// Quitar una mesa (él, v98.4: «al ordenar o mover las mesas se renumeran»):
// las demás quedan 1, 2, 3…, sin huecos, y cada una se lleva a su gente,
// sus sitios y su lugar en el plano. Quien estaba en ella, sin mesa; no se
// borra a nadie. Como al moverlas, una mesa con invitaciones enviadas no
// cambia de número: si fuera a cambiar, no se quita y se dice. Recibe la
// lista que se ve (la de verdad, o la de la prueba) y devuelve
// { invitados, mesas, aviso }.
export function quitarMesaRenumerando(invitados, mesas, numero, ordenFamiliares) {
  const orden = [...mesas].sort((a, b) => a.numero - b.numero).filter((m) => m.numero !== numero);
  if (orden.length === mesas.length) return { invitados, mesas, aviso: "" };
  if (mesaBloqueada(mesas, numero)) return { invitados, mesas, aviso: `No se puede: la mesa ${numero} está bloqueada.` };
  if (invitados.some((g) => g.mesa === numero && mesaFija(g, ordenFamiliares))) {
    return { invitados, mesas, aviso: `No se puede: la mesa ${numero} tiene invitaciones enviadas.` };
  }
  const { numeroNuevo, aviso } = renumerar(invitados, orden, ordenFamiliares);
  if (aviso) return { invitados, mesas, aviso };
  const siguiente = invitados.map((g) => {
    if (g.mesa === numero) return { ...g, mesa: null };
    return numeroNuevo.has(g.mesa) && numeroNuevo.get(g.mesa) !== g.mesa ? { ...g, mesa: numeroNuevo.get(g.mesa) } : g;
  });
  return { invitados: siguiente, mesas: orden.map((m, k) => ({ ...m, numero: k + 1 })), aviso: "" };
}

// «Vaciar» una mesa, en la prueba: todas sus familias a «Sin mesa».
// Las familias con la mesa fija se quedan; una mesa bloqueada, entera.
export function vaciarMesaEnBorrador(invitados, borrador, numero, ordenFamiliares, mesas = []) {
  if (mesaBloqueada(mesas, numero)) return borrador;
  const propuesta = conBorrador(invitados, borrador).map((g) => (g.mesa === numero && !mesaFija(g, ordenFamiliares) ? { ...g, mesa: null } : g));
  return borradorDesde(invitados, propuesta);
}

// «Vaciar mesas» (él, v75.1), en la prueba: todas las mesas, vacías; las
// mesas se quedan. Las bloqueadas (v101), con su gente.
export function vaciarTodasEnBorrador(invitados, borrador, ordenFamiliares, mesas = []) {
  const propuesta = conBorrador(invitados, borrador).map((g) =>
    g.mesa != null && !mesaFija(g, ordenFamiliares) && !mesaBloqueada(mesas, g.mesa) ? { ...g, mesa: null } : g
  );
  return borradorDesde(invitados, propuesta);
}

// Auto-asignar, en la prueba: lo propone sobre lo que ya hay en ella. Las
// que van juntas (v101.1), como un bloque.
export function autoAsignarEnBorrador(invitados, borrador, mesas, ordenFamiliares) {
  const bloque = (g) => {
    const id = grupoJuntos(g, ordenFamiliares);
    return id ? `juntos:${id}` : claveFamiliaMesa(g);
  };
  const { invitados: propuesta, avisos } = autoAsignarMesas(conBorrador(invitados, borrador), mesas, { bloque });
  return { borrador: borradorDesde(invitados, propuesta), avisos };
}

// Lo que se manda al aplicar: la Lista de ahora con solo esas mesas cambiadas.
// Quien haya recibido su invitación mientras tanto, se queda como está.
export function aplicarBorrador(invitados, borrador, ordenFamiliares) {
  const fijos = new Set(invitados.filter((g) => mesaFija(g, ordenFamiliares)).map((g) => g.id));
  return conBorrador(invitados, Object.fromEntries(Object.entries(borrador).filter(([id]) => !fijos.has(id))));
}

// Los sentados de una mesa con su mesa fija: no se mueven con «Vaciar».
export const fijosEnMesa = (vista, numero, ordenFamiliares) => vista.filter((g) => g.mesa === numero && seSientaEnMesa(g) && mesaFija(g, ordenFamiliares)).length;

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
// Las familias con la mesa fija siguen en la suya (v83.1), aunque la memoria
// dijera otra cosa o no tuviera esa mesa (se añade, con la de verdad).
export function cargarMemoria(invitados, memoria, { ordenFamiliares, mesasReales = [] } = {}) {
  const numerosFijos = [...new Set(invitados.filter((g) => mesaFija(g, ordenFamiliares)).map((g) => g.mesa))];
  const delPlano = new Set(memoria.mesas.map((m) => m.numero));
  const mesasMemoria = [...memoria.mesas, ...mesasReales.filter((m) => numerosFijos.includes(m.numero) && !delPlano.has(m.numero))];
  const numeros = new Set(mesasMemoria.map((m) => m.numero));
  const asientos = memoria.asientos || {};
  const mesaDeFamilia = {};
  for (const g of invitados) {
    const mesa = asientos[g.id];
    if (mesa != null && numeros.has(mesa)) mesaDeFamilia[claveFamiliaMesa(g)] ??= mesa;
  }
  const nuevos = invitados.filter((g) => !Object.hasOwn(asientos, g.id));
  const propuesta = invitados.map((g) => {
    if (mesaFija(g, ordenFamiliares)) return g;
    const mesa = Object.hasOwn(asientos, g.id) ? asientos[g.id] : (mesaDeFamilia[claveFamiliaMesa(g)] ?? g.mesa ?? null);
    return { ...g, mesa: mesa != null && numeros.has(mesa) ? mesa : null };
  });
  const aviso =
    nuevos.length === 0
      ? ""
      : `${nuevos.length === 1 ? "Hay 1 invitado nuevo" : `Hay ${nuevos.length} invitados nuevos`} desde que se guardó: con su familia si ella estaba sentada; si no, donde ya estaba.`;
  return { mesas: mesasMemoria.map((m) => ({ ...m })), borrador: borradorDesde(invitados, propuesta), aviso };
}
