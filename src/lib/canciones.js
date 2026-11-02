// Hasta 3 canciones por invitado (él, v69), cada una con su título y su
// artista en dos huecos de la misma línea. Se guardan en el mismo campo de
// siempre (`cancion`, texto), una por línea y como «Título — Artista»: sin
// tocar la base. La canción que ya tuviera cada uno es la primera; si se
// escribió en un solo hueco, sin « — », entera va al título.
//
// Los huecos vacíos de en medio se guardan como línea vacía: así, mientras
// se escribe, una canción no salta de un hueco a otro. Para enseñarlas, se
// leen solo las que tienen algo.
import { paraBuscar } from "./formato";

export const MAX_CANCIONES = 3;
const SEPARADOR = " — ";

// Los 3 huecos del formulario, en su sitio.
export function huecosCanciones(texto) {
  const lineas = String(texto || "").split("\n");
  return Array.from({ length: MAX_CANCIONES }, (_, i) => {
    const [titulo = "", ...resto] = (lineas[i] || "").split(SEPARADOR);
    return { titulo, artista: resto.join(SEPARADOR) };
  });
}

// De los huecos al campo. Sin recortar lo escrito: recortar mientras se
// teclea se comería el espacio entre dos palabras.
export function textoDeHuecos(huecos) {
  const lineas = huecos.slice(0, MAX_CANCIONES).map(({ titulo = "", artista = "" }) => (artista ? `${titulo}${SEPARADOR}${artista}` : titulo));
  while (lineas.length && !lineas.at(-1).trim()) lineas.pop();
  return lineas.join("\n");
}

// Las que tienen algo, ya limpias: «Título — Artista», o solo una de las dos.
export function cancionesDe(texto) {
  return huecosCanciones(texto)
    .map(({ titulo, artista }) => [titulo.trim(), artista.trim()].filter(Boolean).join(SEPARADOR))
    .filter(Boolean);
}

export const tieneCancion = (g) => cancionesDe(g?.cancion).length > 0;

// En una línea, para el apartado plegado del formulario.
export const resumenCanciones = (texto) => cancionesDe(texto).join(" · ");

// La lista «Canciones para bailar» (él, v79.5): una fila por cada vez que
// alguien pide una canción, con la edad de quien la pidió y sin nombres,
// para poder ordenarla por edad real. Cada fila lleva cuántas veces se ha
// pedido esa canción en toda la lista. Es la misma aunque cambien las
// mayúsculas, las tildes o falte el artista (se compara el título); una
// errata cuenta como otra. Todas sus filas se escriben igual: como la
// primera que trae el artista (o, si ninguna, como la primera).
export function cancionesPedidas(invitados, edadDe) {
  const filas = invitados.flatMap((g) => {
    const edad = edadDe(g) ?? null;
    return huecosCanciones(g.cancion)
      .map(({ titulo, artista }) => [titulo.trim(), artista.trim()])
      .filter(([titulo, artista]) => titulo || artista)
      .map(([titulo, artista]) => ({ cancion: [titulo, artista].filter(Boolean).join(SEPARADOR), clave: paraBuscar(titulo || artista), conArtista: Boolean(titulo && artista), edad }));
  });
  const veces = new Map();
  const nombre = new Map();
  for (const f of filas) {
    veces.set(f.clave, (veces.get(f.clave) || 0) + 1);
    if (!nombre.has(f.clave) || (f.conArtista && !nombre.get(f.clave).conArtista)) nombre.set(f.clave, f);
  }
  return filas.map(({ clave, edad }) => ({ cancion: nombre.get(clave).cancion, clave, edad, veces: veces.get(clave) }));
}

// Una estrella por vez; de 6 en adelante no caben en la línea: «★ 7».
export const estrellas = (veces) => (veces <= 5 ? "★".repeat(veces) : `★ ${veces}`);

// El orden, tocando la cabecera como en la Lista: al abrir, las más pedidas
// (sus filas, juntas); la edad empieza de mayor a menor y el título por la A.
// Tocar otra vez la misma columna le da la vuelta. Sin edad, siempre al final.
export const ORDEN_CANCIONES_INICIAL = { columna: "veces", direccion: "desc" };
const PRIMERA_VEZ = { veces: "desc", cancion: "asc", edad: "desc" };
export const tocarOrdenCanciones = (orden, columna) =>
  orden.columna === columna
    ? { columna, direccion: orden.direccion === "asc" ? "desc" : "asc" }
    : { columna, direccion: PRIMERA_VEZ[columna] };

const COMPARAR = {
  veces: (x, y) => x.veces - y.veces,
  cancion: (x, y) => x.clave.localeCompare(y.clave),
  edad: (x, y) => x.edad - y.edad,
};
export function ordenarCanciones(filas, { columna, direccion }) {
  const signo = direccion === "asc" ? 1 : -1;
  return [...filas].sort((x, y) => {
    if (columna === "edad" && (x.edad === null) !== (y.edad === null)) return x.edad === null ? 1 : -1;
    return (
      signo * COMPARAR[columna](x, y) || y.veces - x.veces || x.clave.localeCompare(y.clave) || (y.edad ?? -1) - (x.edad ?? -1)
    );
  });
}
