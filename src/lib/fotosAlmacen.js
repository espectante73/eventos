// Fotos de matrimonio guardadas en el ALMACÉN de Supabase, no dentro de la
// base de datos (2026-09-17).
//
// El motivo, decidido con el usuario: van a ser unas 100 fotos (50 de boda
// + 50 de aniversario). Guardadas como texto dentro de la base, la app se
// las descargaría TODAS cada vez que alguien la abre -- también en el móvil
// y también con el wifi del local el día del evento. En el almacén, la base
// solo guarda la dirección del archivo y el navegador se baja cada foto
// cuando va a enseñarla, y se la queda para la próxima.
//
// El cajón es CERRADO: nadie que no haya entrado puede leer nada, ni
// acertando la dirección. Por eso para enseñar una foto hay que pedir antes
// un enlace temporal (createSignedUrl), en vez de apuntar a una URL fija.
import { supabase } from "../supabaseClient";
import { redimensionarImagenArchivo } from "./descargas";

export const CUBO_FOTOS = "fotos-matrimonios";

// 1080 en el lado largo: es la resolución mínima que pidió el usuario para
// que se vean bien en la pantalla del local, y deja cada foto en ~300 KB
// en vez de los 3-4 MB que salen de un móvil.
const LADO_MAXIMO = 1080;
const CALIDAD = 0.82;
const MINUTOS_ENLACE = 60;

// Nombre de archivo estable a partir de la familia: sin acentos, sin
// espacios y en minúsculas. Estable a propósito -- volver a subir la foto
// de una familia REEMPLAZA la suya en vez de dejar basura acumulada.
export function nombreArchivoFamilia(familia) {
  const limpio = String(familia || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return limpio || "sin-familia";
}

function dataUrlABlob(dataUrl) {
  const [cabecera, base64] = String(dataUrl).split(",");
  const tipo = (cabecera.match(/:(.*?);/) || [])[1] || "image/jpeg";
  const binario = atob(base64 || "");
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

// Sube la foto y devuelve la RUTA dentro del cajón, que es lo que se guarda
// en la base. `carpeta` es "aniversario" o "boda": las políticas del cajón
// distinguen las dos (el colaborador solo puede escribir en "boda").
export async function subirFotoMatrimonio(file, familia, carpeta = "aniversario") {
  const dataUrl = await redimensionarImagenArchivo(file, LADO_MAXIMO, CALIDAD);
  const ruta = `${carpeta}/${nombreArchivoFamilia(familia)}.jpg`;
  const { error } = await supabase.storage
    .from(CUBO_FOTOS)
    .upload(ruta, dataUrlABlob(dataUrl), { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return ruta;
}

export async function borrarFotoMatrimonio(ruta) {
  if (!ruta) return;
  const { error } = await supabase.storage.from(CUBO_FOTOS).remove([ruta]);
  if (error) throw error;
}

// Pide un enlace temporal para cada ruta. Devuelve { ruta: enlace }. Las
// que fallen simplemente no salen en el resultado: quien pinta decide qué
// hacer con un hueco, en vez de romperse toda la ventana por una foto.
export async function enlacesTemporales(rutas) {
  const limpias = [...new Set((rutas || []).filter(Boolean))];
  if (limpias.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(CUBO_FOTOS)
    .createSignedUrls(limpias, MINUTOS_ENLACE * 60);
  if (error || !data) return {};
  const mapa = {};
  for (const fila of data) {
    if (fila?.path && fila?.signedUrl) mapa[fila.path] = fila.signedUrl;
  }
  return mapa;
}
