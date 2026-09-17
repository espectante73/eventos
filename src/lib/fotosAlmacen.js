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

export const CUBO_FOTOS = "fotos-matrimonios";

// Las fotos se proyectan en una pantalla 16:9, así que se guardan para que
// quepan en 1920x1080 (Full HD), sin deformarlas ni recortarlas. Antes se
// limitaba el LADO LARGO a 1080, y una foto apaisada se quedaba en
// ~1080x608: poco para una pantalla. Corregido el 2026-09-17. Cada foto
// ronda los 400-600 KB; 100 fotos caben de sobra en el almacén gratuito.
const ANCHO_MAXIMO = 1920;
const ALTO_MAXIMO = 1080;
const CALIDAD = 0.85;

// Reduce la foto para que quepa en ANCHO_MAXIMO x ALTO_MAXIMO manteniendo su
// forma. Nunca la agranda. No se usa redimensionarImagenArchivo (descargas.js)
// porque esa limita solo el lado más largo, y aquí importa la caja 16:9.
function ajustarAPantalla(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, ANCHO_MAXIMO / img.width, ALTO_MAXIMO / img.height);
      const ancho = Math.round(img.width * escala);
      const alto = Math.round(img.height * escala);
      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      canvas.getContext("2d").drawImage(img, 0, 0, ancho, alto);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo preparar la imagen"))),
        "image/jpeg",
        CALIDAD
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}
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

// Sube la foto y devuelve la RUTA dentro del cajón, que es lo que se guarda
// en la base. `carpeta` es "aniversario" o "boda": las políticas del cajón
// distinguen las dos (el colaborador solo puede escribir en "boda").
export async function subirFotoMatrimonio(file, familia, carpeta = "aniversario") {
  const blob = await ajustarAPantalla(file);
  const ruta = `${carpeta}/${nombreArchivoFamilia(familia)}.jpg`;
  const { error } = await supabase.storage
    .from(CUBO_FOTOS)
    .upload(ruta, blob, { contentType: "image/jpeg", upsert: true });
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
