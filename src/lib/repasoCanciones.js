// «Repasar canciones» (él, v80): la lista de canciones, contrastada con el
// catálogo de Deezer (gratis, sin cuenta ni clave; Spotify pedía Premium y
// una clave). Cada canción distinta se busca UNA vez y lo encontrado se
// guarda en `evento.catalogoCanciones`:
//   { [clave]: { titulo, artista, duracion } | { noEncontrada: true } }
// con `descartada: true` si él no quiso la propuesta. Sirve para dos cosas:
// proponer cómo dejarla escrita (canción y cantante, cada uno en su hueco,
// aunque el colaborador los metiera juntos) y saber cuánto dura. Nada cambia
// solo: él marca lo que se aplica. Lo busca api/canciones.js.
import { huecosCanciones, textoDeHuecos, textoCancion, claveCancion } from "./canciones";

// Lo que cuenta una canción sin buscar, no encontrada o descartada: 3½ min.
export const DURACION_ESTIMADA = 210;
// Cuántas se le piden al buscador de una vez.
export const POR_TANDA = 8;

// Cada canción distinta de la lista (cancionesPedidas), una vez.
export function cancionesDistintas(filas) {
  const vistas = new Map();
  for (const f of filas) if (!vistas.has(f.clave)) vistas.set(f.clave, { clave: f.clave, cancion: f.cancion, veces: f.veces });
  return [...vistas.values()];
}

// Lo que se le pregunta a Deezer: título y artista, sin el guion de en medio.
export const consultaDe = (cancion) => cancion.replace(/\s+[—–-]\s+/g, " ").trim();

export const sinBuscar = (distintas, catalogo) => distintas.filter((d) => !catalogo?.[d.clave]);

// Lo que trae el buscador, al catálogo. Si Deezer no respondió (`fallo`),
// no se apunta nada: se vuelve a buscar la próxima vez.
export function conResultados(catalogo, claves, resultados) {
  const siguiente = { ...(catalogo || {}) };
  claves.forEach((clave, i) => {
    const r = resultados?.[i];
    if (!r || r.fallo) return;
    siguiente[clave] = r.pista ? { titulo: r.pista.titulo, artista: r.pista.artista, duracion: r.pista.duracion } : { noEncontrada: true };
  });
  return siguiente;
}

// El repaso: qué proponer, qué ya está bien (igual que en Deezer, salvo
// mayúsculas), qué no encontró y cuántas faltan por buscar.
export function repasoCanciones(distintas, catalogo) {
  const r = { proponer: [], bien: [], noEncontradas: [], pendientes: 0 };
  for (const d of distintas) {
    const e = catalogo?.[d.clave];
    if (!e) r.pendientes += 1;
    else if (e.noEncontrada) r.noEncontradas.push(d);
    else {
      const propuesta = textoCancion(e.titulo, e.artista);
      if (propuesta.toLowerCase() === d.cancion.toLowerCase()) r.bien.push({ ...d, duracion: e.duracion });
      else r.proponer.push({ ...d, propuesta, duracion: e.duracion, descartada: Boolean(e.descartada) });
    }
  }
  return r;
}

// Aplicar el repaso (norma 14): las de `aplicar` se escriben como en Deezer
// en TODAS las fichas que las pidieron (también las pagadas: lo hace el
// anfitrión), y su forma nueva queda en el catálogo con su duración; las de
// `descartar` ya no salen marcadas. Devuelve las dos listas y el aviso.
export function aplicarRepaso(invitados, catalogo, { aplicar = [], descartar = [] }) {
  const elegidas = new Set(aplicar);
  let cambiadas = 0;
  const siguientes = invitados.map((g) => {
    let tocada = false;
    const huecos = huecosCanciones(g.cancion).map((h) => {
      const clave = claveCancion(h.titulo.trim(), h.artista.trim());
      const e = clave && elegidas.has(clave) ? catalogo?.[clave] : null;
      if (!e?.titulo || (h.titulo === e.titulo && h.artista === e.artista)) return h;
      tocada = true;
      cambiadas += 1;
      return { titulo: e.titulo, artista: e.artista };
    });
    return tocada ? { ...g, cancion: textoDeHuecos(huecos) } : g;
  });
  const nuevo = { ...(catalogo || {}) };
  for (const clave of aplicar) {
    const e = catalogo?.[clave];
    if (e?.titulo) nuevo[claveCancion(e.titulo, e.artista)] = { titulo: e.titulo, artista: e.artista, duracion: e.duracion };
  }
  for (const clave of descartar) if (nuevo[clave]) nuevo[clave] = { ...nuevo[clave], descartada: true };
  return {
    invitados: cambiadas ? siguientes : invitados,
    catalogo: nuevo,
    aviso: cambiadas ? `Corregidas ${cambiadas} ${cambiadas === 1 ? "petición" : "peticiones"}.` : "",
  };
}

// La duración de todas juntas (cada canción distinta, una vez). La que no
// tiene la suya cuenta 3½ min, y se dice cuántas son.
export function duracionTotal(distintas, catalogo) {
  let segundos = 0;
  let estimadas = 0;
  for (const d of distintas) {
    const e = catalogo?.[d.clave];
    if (e?.duracion && !e.descartada) segundos += e.duracion;
    else {
      segundos += DURACION_ESTIMADA;
      estimadas += 1;
    }
  }
  return { segundos, estimadas };
}

// «7 h 5 min» o «45 min».
export function textoDuracion(segundos) {
  const minutos = Math.round(segundos / 60);
  const horas = Math.floor(minutos / 60);
  return horas ? `${horas} h ${minutos % 60} min` : `${minutos} min`;
}

// «2:23».
export const minutosYSegundos = (segundos) => `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;

// El anfitrión pide al buscador (api/canciones.js) unas cuantas canciones.
// Devuelve { resultados } o { error }.
export async function buscarEnDeezer({ token, consultas }, f = fetch) {
  try {
    const r = await f("/api/canciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, consultas }),
    });
    const datos = await r.json().catch(() => ({}));
    return r.ok ? datos : { error: datos.error || `El buscador respondió ${r.status}.` };
  } catch (e) {
    return { error: `No se pudo llegar al buscador (${e.message}).` };
  }
}
