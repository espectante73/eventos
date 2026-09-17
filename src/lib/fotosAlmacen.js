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
import { useEffect, useState } from "react";
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
// La ORIGINAL de boda que sube el colaborador se guarda más grande: no va a
// la pantalla tal cual, sino que el anfitrión la descarga y la pasa por otra
// IA que la monta en una plantilla. Cuanto más detalle llegue, mejor sale
// la cara. 2560 en el lado largo (antes 1600, en base64 dentro de la base).
const LADO_ORIGINAL = 2560;

// Carpetas del cajón, y qué es cada una (2026-09-17):
//   boda/          la original, la sube el colaborador (o el anfitrión)
//   boda-final/    la de boda ya montada en la plantilla, solo el anfitrión
//   aniversario/   la de aniversario, solo el anfitrión
// Las políticas del cajón dejan escribir a cualquiera con sesión SOLO en
// "boda"; en el resto, solo al anfitrión.
export const CARPETA = { BODA: "boda", BODA_FINAL: "boda-final", ANIVERSARIO: "aniversario" };

// Reduce la foto para que quepa en ANCHO_MAXIMO x ALTO_MAXIMO manteniendo su
// forma. Nunca la agranda. No se usa redimensionarImagenArchivo (descargas.js)
// porque esa limita solo el lado más largo, y aquí importa la caja 16:9.
function reducirImagen(file, anchoMax, altoMax) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, anchoMax / img.width, altoMax / img.height);
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
// en la base. `carpeta`: ver CARPETA. La original de boda se reduce menos
// (LADO_ORIGINAL en cualquier sentido); las que van a pantalla, a 1920x1080.
export async function subirFotoMatrimonio(file, familia, carpeta = CARPETA.ANIVERSARIO) {
  const blob =
    carpeta === CARPETA.BODA
      ? await reducirImagen(file, LADO_ORIGINAL, LADO_ORIGINAL)
      : await reducirImagen(file, ANCHO_MAXIMO, ALTO_MAXIMO);
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
  const limpias = [...new Set((rutas || []).filter(esRutaAlmacen))];
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

// Una foto de boda puede venir de tres sitios: una ruta del cajón (lo
// normal desde el 2026-09-17), un data: URI en base64 (como se guardaban
// antes) o un enlace pegado a mano (http). Solo la primera necesita pedir
// enlace temporal; las otras dos se enseñan tal cual.
export function esRutaAlmacen(valor) {
  return Boolean(valor) && !/^(data:|https?:|blob:|\/)/i.test(String(valor));
}

// Lo que va en el src de un <img> para un valor guardado. Pide el enlace
// temporal si hace falta; mientras llega, cadena vacía.
export function useEnlaceFoto(valor) {
  const [enlace, setEnlace] = useState(esRutaAlmacen(valor) ? "" : valor || "");
  useEffect(() => {
    if (!esRutaAlmacen(valor)) {
      setEnlace(valor || "");
      return undefined;
    }
    let cancelado = false;
    setEnlace("");
    enlacesTemporales([valor]).then((mapa) => {
      if (!cancelado) setEnlace(mapa[valor] || "");
    });
    return () => {
      cancelado = true;
    };
  }, [valor]);
  return enlace;
}

// Los bytes de una foto guardada, para meterla en el ZIP de descarga.
export async function bytesDeFoto(valor, enlaceYaFirmado) {
  let url = valor;
  if (esRutaAlmacen(valor)) {
    url = enlaceYaFirmado || (await enlacesTemporales([valor]))[valor];
    if (!url) throw new Error("sin enlace");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

// Nombre del archivo al DESCARGAR la original de boda (decidido con el
// usuario el 2026-09-17): "Abreu01 - Gustavo y Míriam - 1998.jpg". El año
// va en el nombre porque la otra IA lo necesita para la plantilla y así lo
// tiene delante al abrir la foto. Se conservan tildes y eñes (el ZIP marca
// UTF-8); solo se quitan los caracteres que un sistema de archivos no
// admite.
export function nombreDescargaBoda({ familia, esposo, esposa, anioBoda }) {
  const limpiar = (t) => String(t || "").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
  const nombres = [esposo?.nombre, esposa?.nombre].map(limpiar).filter(Boolean).join(" y ");
  const anio = limpiar(anioBoda) || "sin año";
  return `${[limpiar(familia) || "Sin familia", nombres, anio].filter(Boolean).join(" - ")}.jpg`;
}
