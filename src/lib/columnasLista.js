// Las columnas de la Lista de invitados, y cuáles se ocultan (él, v89.3:
// «una versión reducida de la lista»). La misma Lista, no una copia (norma
// 8): solo deja de dibujar las columnas ocultas. Paso 1: ocultar y volver a
// la original; moverlas de sitio, más adelante si hace falta.
//
// Se recuerda EN CADA APARATO (localStorage), no en la base: el móvil de la
// entrada puede llevar la reducida y el Mac la completa. El nombre no se
// oculta nunca: es de quién es la fila.

// Una sola definición (norma 7): el título de la cabecera, el de la ventana
// «Columnas» y el ancho de la rejilla salen de aquí. `nota`, lo que se
// lleva consigo al ocultarla.
export const COLUMNAS_LISTA = [
  { id: "invitado", titulo: "Invitado", ancho: "1.5fr", fija: true },
  { id: "grupoFamiliar", titulo: "Familia", ancho: "1fr" },
  { id: "rolFamiliar", titulo: "Rol", ancho: "0.5fr" },
  { id: "anioBoda", titulo: "Boda", ancho: "0.7fr" },
  { id: "zona", titulo: "Zona", ancho: "0.85fr" },
  { id: "colaborador", titulo: "Colaborador", ancho: "1.4fr" },
  { id: "mesa", titulo: "Mesa", ancho: "1fr" },
  { id: "confirmado", titulo: "Confirm.", ancho: "0.9fr" },
  // 0.75fr → 0.85fr (v85): su filtro dice «Sin alerg.», y a 0.75 se cortaba.
  { id: "datos", titulo: "Datos", ancho: "0.85fr" },
  { id: "pagado", titulo: "Pagado", ancho: "0.75fr" },
  { id: "presente", titulo: "Llegó", ancho: "0.7fr" },
  // 100px FIJOS: lleva los tres iconos de cada fila (función, tablón y
  // papelera); con "auto" cada rejilla le daba un ancho y se descuadraban.
  { id: "rolTrabajo", titulo: "Función", ancho: "100px", nota: "y la papelera" },
];

export const tituloColumna = (id) => COLUMNAS_LISTA.find((c) => c.id === id)?.titulo || "";

// El filtro de cada columna en `filtros` (casi todas, con su mismo nombre).
export const filtroDeColumna = (id) => ({ invitado: "texto", colaborador: "colaboradorId" })[id] || id;

export const CLAVE_COLUMNAS_OCULTAS = "listaColumnasOcultas";
const OCULTABLES = new Set(COLUMNAS_LISTA.filter((c) => !c.fija).map((c) => c.id));
const limpiar = (ids) => new Set([...ids].filter((id) => OCULTABLES.has(id)));

// Sin localStorage (modo privado estricto), la elección vale mientras la
// pestaña siga abierta.
let ocultasEnMemoria = new Set();

export function leerColumnasOcultas(almacen = globalThis.localStorage) {
  try {
    const guardado = JSON.parse(almacen?.getItem(CLAVE_COLUMNAS_OCULTAS) || "null");
    if (Array.isArray(guardado)) return limpiar(guardado);
  } catch (_) {
    /* sin localStorage, o algo ilegible: se ve todo */
  }
  return new Set(ocultasEnMemoria);
}

export function guardarColumnasOcultas(ocultas, almacen = globalThis.localStorage) {
  const limpias = limpiar(ocultas);
  ocultasEnMemoria = limpias;
  try {
    if (limpias.size === 0) almacen?.removeItem(CLAVE_COLUMNAS_OCULTAS);
    else almacen?.setItem(CLAVE_COLUMNAS_OCULTAS, JSON.stringify([...limpias]));
  } catch (_) {
    /* sin localStorage: queda en memoria */
  }
  return limpias;
}

// Marcar o desmarcar una columna en la ventana «Columnas».
export function alternarColumna(ocultas, id) {
  if (!OCULTABLES.has(id)) return ocultas;
  const nuevas = new Set(ocultas);
  if (nuevas.has(id)) nuevas.delete(id);
  else nuevas.add(id);
  return nuevas;
}

// La rejilla, solo con las que se ven. `telefono`: el ancho de la columna
// del teléfono, que en «Editar» va junto al nombre.
export function plantillaColumnas(ocultas, telefono = "") {
  return COLUMNAS_LISTA.filter((c) => !ocultas.has(c.id))
    .flatMap((c) => (c.id === "invitado" && telefono ? [c.ancho, telefono] : [c.ancho]))
    .join(" ");
}

// El ancho mínimo de la tabla (más estrecha, se desliza de lado). Entera, el
// de siempre: 1088 (Safari no siempre da a una ventana nueva el ancho
// pedido, y con más se quedaban fuera Pagado y los iconos). Reducida, el de
// sus columnas: si no, en el móvil habría que seguir deslizando de lado
// aunque se vean tres. 80 px por «fr»: Invitado, Mesa y Llegó caben en un
// móvil (≈ 260).
export const ANCHO_MINIMO_LISTA = 1088;
const PX_POR_FR = 80;
const FILETE = 4;
export function anchoMinimoLista(ocultas, telefono = "") {
  if (ocultas.size === 0) return ANCHO_MINIMO_LISTA;
  const anchos = plantillaColumnas(ocultas, telefono).split(" ");
  const total = anchos.reduce((s, a) => s + (a.endsWith("fr") ? parseFloat(a) * PX_POR_FR : parseFloat(a)), 0);
  return Math.round(total + FILETE);
}

// ¿Va sombreada? Una sí y otra no, contando solo las que se ven: si no, al
// ocultar una quedarían dos seguidas del mismo tono.
export function columnaSombreada(ocultas, id) {
  const visibles = COLUMNAS_LISTA.filter((c) => !ocultas.has(c.id));
  return visibles.findIndex((c) => c.id === id) % 2 === 1;
}

// Al ocultar una columna se quitan su filtro y su orden: si no, desaparecerían
// filas, o se ordenarían, por algo que no se ve. Devuelven lo mismo si no
// cambia nada.
export function filtrosSinOcultas(filtros, ocultas) {
  const claves = [...ocultas].map(filtroDeColumna).filter((k) => filtros?.[k]);
  if (claves.length === 0) return filtros;
  return { ...filtros, ...Object.fromEntries(claves.map((k) => [k, ""])) };
}

export function ordenSinOcultas(orden, ocultas) {
  const quedan = orden.filter((n) => !ocultas.has(n.columna));
  return quedan.length === orden.length ? orden : quedan;
}

export const textoOcultas = (n) => (n === 1 ? "1 columna oculta" : `${n} columnas ocultas`);
