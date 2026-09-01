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

// Una foto del carrete o una captura de pantalla puede pesar 15-20 MB,
// y subir eso por el wifi de un local es justo lo que dejó la ventana
// colgada "subiendo" sin fin (2026-09-01). Antes de subir nada se
// reduce a 1920px de lado mayor y se reencoda: el fondo de una ventana
// no necesita más, y así lo que viaja son unos cientos de KB.
export const LADO_MAXIMO = 1920;
const PESO_SIN_TOCAR = 1.5 * 1024 * 1024;
const ESPERA_MAXIMA = 45000;

function conTiempoLimite(promesa, mensaje) {
  // ⚠️ Esto no CANCELA la subida (supabase-js no admite una señal de
  // aborto), pero devuelve el control a la ventana: sin ello, una
  // subida que nunca contesta deja la pantalla bloqueada para siempre,
  // sin botón al que agarrarse.
  return Promise.race([
    promesa,
    new Promise((_, rechazar) => setTimeout(() => rechazar(new Error(mensaje)), ESPERA_MAXIMA)),
  ]);
}

async function decodificar(archivo, ventana) {
  if (ventana.createImageBitmap) return ventana.createImageBitmap(archivo);
  // Safari viejo: se decodifica con un <img> y una URL temporal.
  const url = ventana.URL.createObjectURL(archivo);
  try {
    return await new Promise((resolver, rechazar) => {
      const imagen = new ventana.Image();
      imagen.onload = () => resolver(imagen);
      imagen.onerror = () => rechazar(new Error("No se ha podido leer la imagen."));
      imagen.src = url;
    });
  } finally {
    ventana.URL.revokeObjectURL(url);
  }
}

export async function prepararImagen(archivo, ventana = globalThis) {
  if (!archivo.type?.startsWith("image/")) throw new Error("Eso no parece una imagen.");
  const imagen = await decodificar(archivo, ventana);
  const lado = Math.max(imagen.width, imagen.height);
  if (lado <= LADO_MAXIMO && archivo.size <= PESO_SIN_TOCAR) return archivo;

  const escala = Math.min(1, LADO_MAXIMO / lado);
  const lienzo = ventana.document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  const blob = await new Promise((resolver) => lienzo.toBlob(resolver, "image/jpeg", 0.85));
  if (!blob) return archivo;
  const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new ventana.File([blob], nombre, { type: "image/jpeg" });
}

export async function subirFondo(archivoOriginal, ventana = globalThis) {
  const archivo = await prepararImagen(archivoOriginal, ventana);
  const nombre = sanearNombre(archivo.name) || "fondo.jpg";
  // Se borra lo que hubiera ANTES de subir: si el nombre nuevo coincide
  // con el viejo, `upsert` lo reemplaza igual; si no coincide, sin este
  // borrado se quedarían dos y el catálogo mostraría el que no es.
  const { data: previos } = await conTiempoLimite(
    supabase.storage.from(BUCKET).list(),
    "El almacén no contesta. Revisa la conexión e inténtalo otra vez."
  );
  const sobrantes = (previos || []).map((f) => f.name).filter((n) => n !== MARCADOR && n !== nombre);
  if (sobrantes.length) await supabase.storage.from(BUCKET).remove(sobrantes);

  const { error } = await conTiempoLimite(
    supabase.storage.from(BUCKET).upload(nombre, archivo, { upsert: true, cacheControl: "3600" }),
    "La imagen está tardando demasiado en subir. Inténtalo otra vez o prueba con una más pequeña."
  );
  if (error) throw error;
  return conUrl(nombre);
}

export async function borrarFondo() {
  const { data } = await supabase.storage.from(BUCKET).list();
  const nombres = (data || []).map((f) => f.name).filter((n) => n !== MARCADOR);
  if (nombres.length) await supabase.storage.from(BUCKET).remove(nombres);
}
