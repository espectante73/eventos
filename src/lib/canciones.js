// Hasta 3 canciones por invitado (él, v69), cada una con su título y su
// artista en dos huecos de la misma línea. Se guardan en el mismo campo de
// siempre (`cancion`, texto), una por línea y como «Título — Artista»: sin
// tocar la base. La canción que ya tuviera cada uno es la primera; si se
// escribió en un solo hueco, sin « — », entera va al título.
//
// Los huecos vacíos de en medio se guardan como línea vacía: así, mientras
// se escribe, una canción no salta de un hueco a otro. Para enseñarlas, se
// leen solo las que tienen algo.
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
