// Imagen de fondo de "Música del evento" (2026-09-01).
//
// ⚠️ Vive en Supabase Storage, NO en IndexedDB como las pistas, y el
// motivo es un fallo real reportado por el usuario: subió su imagen en
// el Mac y en el móvil no aparecía por ningún sitio, solo el botón de
// "añadir imagen" pidiéndole que la eligiera otra vez. IndexedDB
// pertenece al navegador de CADA aparato: lo que se guarda en el Mac no
// existe para el móvil. Una pista de una hora tiene que quedarse en
// local (pesa decenas de megas y solo la necesita el que suena), pero
// el fondo lo tienen que ver los dos aparatos, así que va a Storage --
// mismo patrón que `musica-ambiental` y `og-imagen`.
//
// Se guarda con el NOMBRE que le puso el usuario (saneado), no con un
// nombre fijo: así el catálogo de acabados puede mostrar su nombre de
// verdad en vez de un genérico. Solo hay un fondo a la vez -- subir uno
// nuevo borra el anterior.
import { supabase } from "../supabaseClient";

const BUCKET = "musica-fondo";
// Marcador que crea Supabase solo, al quedarse un bucket vacío.
const MARCADOR = ".emptyFolderPlaceholder";

// Los nombres de objeto de Storage se llevan mal con espacios y tildes,
// así que se sanean al subir y se deshace al mostrar.
function sanearNombre(nombre) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tildes sueltas tras normalizar
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function nombreParaMostrar(nombreArchivo) {
  return nombreArchivo.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function conUrl(nombre) {
  return { nombre, url: supabase.storage.from(BUCKET).getPublicUrl(nombre).data.publicUrl };
}

// null si no hay ninguna (o si el bucket todavía no existe: el fondo es
// un adorno, nunca debe romper la ventana de música).
export async function leerFondo() {
  const { data, error } = await supabase.storage.from(BUCKET).list();
  if (error || !data) return null;
  const archivos = data.filter((f) => f.name !== MARCADOR);
  if (!archivos.length) return null;
  return conUrl(archivos[archivos.length - 1].name);
}

export async function subirFondo(archivo) {
  const nombre = sanearNombre(archivo.name) || "fondo.jpg";
  // Se borra lo que hubiera ANTES de subir: si el nombre nuevo coincide
  // con el viejo, `upsert` lo reemplaza igual; si no coincide, sin este
  // borrado se quedarían dos y el catálogo mostraría el que no es.
  const { data: previos } = await supabase.storage.from(BUCKET).list();
  const sobrantes = (previos || []).map((f) => f.name).filter((n) => n !== MARCADOR && n !== nombre);
  if (sobrantes.length) await supabase.storage.from(BUCKET).remove(sobrantes);

  const { error } = await supabase.storage.from(BUCKET).upload(nombre, archivo, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  return conUrl(nombre);
}

export async function borrarFondo() {
  const { data } = await supabase.storage.from(BUCKET).list();
  const nombres = (data || []).map((f) => f.name).filter((n) => n !== MARCADOR);
  if (nombres.length) await supabase.storage.from(BUCKET).remove(nombres);
}
