// «Mesas del local» (él, v101.2): cuántas mesas tiene el local de cada
// tamaño («4 de 11, 10 de 9»). Es el MÁXIMO: en Acomodación ninguna mesa
// pasa del tamaño más grande, ni hay más mesas de un tamaño de las que
// tiene el local; bajar sitios, siempre. No mira quién está sentado: solo
// las mesas y sus sitios. Sin configurar, Acomodación no pone límites.
//
// Cada mesa de Acomodación ocupa una del local: la más pequeña en que cabe
// (una de 10 gasta una de 11). Por eso bajar una de 11 a 9 libera una de 11,
// si quedan de 9 para ella: las cuentas cuadran siempre con las mesas de
// verdad. Se reparte de la mesa más grande a la más pequeña, cada una en la
// más pequeña libre en que cabe; así, si hay forma de que quepan todas, la
// encuentra.

const entero = (x) => {
  const n = Number(String(x ?? "").trim());
  return Number.isInteger(n) && n > 0 ? n : 0;
};

// Sin la columna en la base (falta subir el SQL de la v101.2).
export const faltaSqlMesasLocal = (evento) => !evento || !("mesasLocal" in evento);

// Lo guardado en evento."mesasLocal", de mayor a menor. [] = sin configurar.
export function mesasLocalDe(evento) {
  const lista = Array.isArray(evento?.mesasLocal) ? evento.mesasLocal : [];
  return lista
    .map((t) => ({ sitios: entero(t?.sitios), cuantas: entero(t?.cuantas) }))
    .filter((t) => t.sitios && t.cuantas)
    .sort((a, b) => b.sitios - a.sitios);
}

// Cada tamaño del local (de mayor a menor) con cuántas usan las mesas de
// Acomodación y cuántas faltan. Una mesa que no cabe en ninguna libre falta
// en el tamaño más pequeño en que cabría (o en el más grande, si es mayor).
export function usoDelLocal(local, mesas = []) {
  const tipos = [...local].sort((a, b) => a.sitios - b.sitios).map((t) => ({ ...t, usadas: 0, faltan: 0 }));
  if (tipos.length === 0) return [];
  for (const m of [...mesas].sort((a, b) => b.capacidad - a.capacidad)) {
    const libre = tipos.find((t) => t.sitios >= m.capacidad && t.usadas < t.cuantas);
    if (libre) libre.usadas++;
    else (tipos.find((t) => t.sitios >= m.capacidad) || tipos[tipos.length - 1]).faltan++;
  }
  return tipos.reverse();
}

const faltan = (local, mesas) => usoDelLocal(local, mesas).reduce((s, t) => s + t.faltan, 0);
const POR_SI_TIENE_MAS = "Si el local tiene más, ponlas en «Del local».";

// El «+» de una mesa: vale si después siguen cabiendo todas en el local.
export function subirSitio(mesas, numero, local) {
  const siguientes = mesas.map((m) => (m.numero === numero ? { ...m, capacidad: m.capacidad + 1 } : m));
  if (local.length === 0 || faltan(local, siguientes) === 0) return { mesas: siguientes, aviso: "" };
  // Hechas antes de configurar el local, o con una memoria de otras mesas.
  if (faltan(local, mesas) > 0) {
    return { mesas, aviso: `Ya hay más mesas de las que tiene el local (en rojo, arriba): quita alguna o bájale sitios antes de subir otra. ${POR_SI_TIENE_MAS}` };
  }
  const capacidad = siguientes.find((m) => m.numero === numero).capacidad;
  const tipo = [...local].reverse().find((t) => t.sitios >= capacidad);
  if (!tipo) {
    return { mesas, aviso: `La mesa ${numero} ya tiene ${capacidad - 1} sitios: el local no tiene mesas más grandes. ${POR_SI_TIENE_MAS}` };
  }
  const son = tipo.cuantas === 1 ? "solo hay 1 y ya está puesta" : `son ${tipo.cuantas} y ya están todas puestas`;
  return { mesas, aviso: `No quedan mesas de ${tipo.sitios} libres en el local: ${son}. Para subir la mesa ${numero}, baja otra. ${POR_SI_TIENE_MAS}` };
}

// Sin configurar, como siempre.
export const SITIOS_MESA_NUEVA = 10;

// «Añadir mesa»: del tamaño más grande que quede libre.
export function anadirMesaDelLocal(mesas, local) {
  const numero = mesas.reduce((max, m) => Math.max(max, m.numero), 0) + 1;
  if (local.length === 0) return { mesas: [...mesas, { numero, capacidad: SITIOS_MESA_NUEVA }], aviso: "" };
  for (const t of local) {
    const siguientes = [...mesas, { numero, capacidad: t.sitios }];
    if (faltan(local, siguientes) === 0) return { mesas: siguientes, aviso: "" };
  }
  const total = local.reduce((s, t) => s + t.cuantas, 0);
  return { mesas, aviso: `El local no tiene más mesas: ${total === 1 ? "la única ya está puesta" : `las ${total} ya están puestas`}. ${POR_SI_TIENE_MAS}` };
}

// Lo escrito en «Mesas del local», para guardar: sin las líneas vacías y de
// mayor a menor. Con `aviso`, no se guarda.
export function limpiarMesasLocal(filas) {
  const valor = [];
  for (const [i, f] of filas.entries()) {
    const sitios = String(f.sitios ?? "").trim();
    const cuantas = String(f.cuantas ?? "").trim();
    if (!sitios && !cuantas) continue;
    const t = { sitios: entero(sitios), cuantas: entero(cuantas) };
    if (!t.sitios || !t.cuantas) {
      return { valor: null, aviso: `En la línea ${i + 1} falta un número: los sitios de cada mesa y cuántas hay, los dos enteros y mayores que 0. Las líneas vacías no importan: se quitan solas.` };
    }
    if (valor.some((v) => v.sitios === t.sitios)) {
      return { valor: null, aviso: `Hay dos líneas de mesas de ${t.sitios} sitios: súmalas en una.` };
    }
    valor.push(t);
  }
  return { valor: valor.sort((a, b) => b.sitios - a.sitios), aviso: "" };
}

// Cuántas mesas y cuántos comensales caben, como mucho.
export const totalDelLocal = (local) => ({
  mesas: local.reduce((s, t) => s + t.cuantas, 0),
  sitios: local.reduce((s, t) => s + t.cuantas * t.sitios, 0),
});
