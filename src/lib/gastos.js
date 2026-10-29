// Los gastos, como una hoja de cálculo (él, v76): Fecha · Concepto ·
// Importe, una fila cada uno, lo último apuntado arriba. Todo gasto
// apuntado está pagado (él: «si hago el asiento, es que está pagado»).
//
// - Fecha: la del gasto, que se elige en el calendario; empieza en hoy,
//   pero puede ser de otro día («a lo mejor registro hoy un gasto del mes
//   pasado»). El orden NO es por ella, sino por cuándo se apuntó
//   (`creadoEn`), para que lo nuevo no se vaya abajo.
// - Concepto: de una lista propia (evento.conceptosGastos), que sustituye
//   a la antigua «categoría» («concepto se sujeta más a la ley contable»).
//   Un concepto puede llevar un precio fijo (las suscripciones): al
//   elegirlo, el importe se rellena solo, y se corrige en su fila si un mes
//   cambia, sin tocar los demás.
import { parsePrecio } from "./formato";

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");
const mismo = (a, b) => a.trim().toLocaleLowerCase("es") === b.trim().toLocaleLowerCase("es");

// El día de hoy, en la hora de quien mira, como AAAA-MM-DD (lo que da el calendario).
export const hoy = (ahora = new Date()) => ahora.toLocaleDateString("sv-SE");

// El concepto de un gasto. Los de antes de la v76 pueden traerlo solo en
// la categoría: se enseña esa, para que no se pierda de vista.
export const conceptoDe = (g) => (g.concepto || "").trim() || (g.categoria || "").trim();

// Lo último apuntado, arriba. Los de antes, sin `creadoEn`, al final y en
// el orden en que llegan.
export function ordenarGastos(gastos) {
  return gastos
    .map((g, i) => ({ g, i }))
    .sort((a, b) => (b.g.creadoEn || "").localeCompare(a.g.creadoEn || "") || a.i - b.i)
    .map(({ g }) => g);
}

export const totalGastos = (gastos) => gastos.reduce((s, g) => s + parsePrecio(g.importe), 0);

// La lista de conceptos. Si aún no hay ninguna guardada, empieza con los
// conceptos de los gastos ya apuntados (sin repetir), sin precio.
export function conceptosDe(guardados, gastos) {
  if (guardados?.length) return [...guardados].sort(porNombre);
  const vistos = [];
  for (const g of gastos) {
    const nombre = conceptoDe(g);
    if (nombre && !vistos.some((n) => mismo(n, nombre))) vistos.push(nombre);
  }
  return vistos.map((nombre) => ({ nombre, precio: "" })).sort(porNombre);
}

// Añade un concepto. Devuelve { conceptos, aviso }: con aviso, no se añadió.
export function conConcepto(conceptos, nombre, precio = "") {
  const limpio = nombre.trim();
  if (!limpio) return { conceptos, aviso: "Escribe el concepto." };
  if (conceptos.some((c) => mismo(c.nombre, limpio))) return { conceptos, aviso: `«${limpio}» ya está en la lista.` };
  return { conceptos: [...conceptos, { nombre: limpio, precio: precio.trim() }].sort(porNombre), aviso: "" };
}

export const sinConcepto = (conceptos, nombre) => conceptos.filter((c) => c.nombre !== nombre);

export const conPrecio = (conceptos, nombre, precio) => conceptos.map((c) => (c.nombre === nombre ? { ...c, precio: precio.trim() } : c));

// El precio fijo de un concepto, o "" si no tiene.
export const precioDe = (conceptos, nombre) => conceptos.find((c) => c.nombre === nombre)?.precio || "";

// El gasto que sale de la fila de escribir. Devuelve { gasto, aviso }: con
// aviso, falta algo y no se apunta.
export function nuevoGasto({ fecha, concepto, importe }, id, ahora = new Date()) {
  if (!concepto) return { gasto: null, aviso: "Elige el concepto." };
  if (!(parsePrecio(importe) > 0)) return { gasto: null, aviso: "Escribe el importe." };
  return {
    gasto: { id, fecha: fecha || hoy(ahora), concepto, categoria: "", importe: importe.trim(), pagado: true, creadoEn: ahora.toISOString() },
    aviso: "",
  };
}
