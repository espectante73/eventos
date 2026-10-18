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
import { nombresMatrimonio } from "./matrimonios";

export const CUBO_FOTOS = "fotos-matrimonios";

// Las fotos se proyectan en una pantalla 16:9, así que se guardan para que
// quepan en esa caja, sin deformarlas ni recortarlas (antes se limitaba el
// lado largo, y una apaisada se quedaba corta para una pantalla).
//
// ⚠️ Las TERMINADAS (boda con plantilla y aniversario) van en 4K desde la
// v64.7 (él: «las quiero en 4K», unas 50): hasta 3840x2160 y algo más de
// calidad. Como la ventana Aniversarios las enseña todas a la vez, cada una
// lleva además su MINIATURA (carpeta miniaturas/) para las filas; la 4K
// solo se pide al ampliarla.
const ANCHO_MAXIMO = 3840;
const ALTO_MAXIMO = 2160;
const CALIDAD = 0.85;
const CALIDAD_4K = 0.9;
const ANCHO_MINIATURA = 640;
const ALTO_MINIATURA_ALMACEN = 360;
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
export function reducirImagen(file, anchoMax, altoMax, calidad = CALIDAD) {
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
        calidad
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

// Nombre de archivo estable a partir de la familia: sin tildes, sin
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
// Las medidas de una foto antes de subirla.
function medidasDe(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ ancho: img.width, alto: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

// ¿Llega a 4K? Llena la caja de 3840x2160 por algún lado (él, v64.8:
// «ninguna debe quedar sin ser 4K»).
export const llegaA4K = ({ ancho, alto }) => ancho >= ANCHO_MAXIMO || alto >= ALTO_MAXIMO;

export async function subirFotoMatrimonio(file, familia, carpeta = CARPETA.ANIVERSARIO) {
  const ruta = `${carpeta}/${nombreArchivoFamilia(familia)}.jpg`;
  if (carpeta !== CARPETA.BODA) {
    const medidas = await medidasDe(file);
    if (!llegaA4K(medidas))
      throw new Error(
        `Esta foto mide ${medidas.ancho}×${medidas.alto} y no llega a 4K (${ANCHO_MAXIMO} de ancho o ${ALTO_MAXIMO} de alto). Súbela desde el archivo en 4K.`
      );
  }
  const subir = async (destino, blob) => {
    const { error } = await supabase.storage.from(CUBO_FOTOS).upload(destino, blob, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
  };
  if (carpeta === CARPETA.BODA) {
    await subir(ruta, await reducirImagen(file, LADO_ORIGINAL, LADO_ORIGINAL));
    return ruta;
  }
  await subir(ruta, await reducirImagen(file, ANCHO_MAXIMO, ALTO_MAXIMO, CALIDAD_4K));
  await subir(rutaMiniatura(ruta), await reducirImagen(file, ANCHO_MINIATURA, ALTO_MINIATURA_ALMACEN));
  return ruta;
}

// La miniatura de una terminada, para las filas de Aniversarios. Las de
// antes de la v64.7 no la tienen: quien pinta usa entonces la grande.
export function rutaMiniatura(ruta) {
  return esRutaAlmacen(ruta) && !ruta.startsWith(`${CARPETA.BODA}/`) ? `miniaturas/${ruta}` : "";
}

export async function borrarFotoMatrimonio(ruta) {
  if (!ruta) return;
  const { error } = await supabase.storage.from(CUBO_FOTOS).remove([ruta, rutaMiniatura(ruta)].filter(Boolean));
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

// ---------- Hoja de encargo para la otra IA ----------
// El usuario monta cada foto de boda en una plantilla usando ChatGPT, a
// mano. La hoja le ahorra teclear: un bloque por foto, ya redactado, con
// los nombres, el año de boda y los años que cumplen -- todo sacado de la
// lista de invitados, no escrito a mano. Copia, pega y adjunta.
//
// ⚠️ Regla del usuario (2026-09-17): la hoja SOLO se entrega si los datos
// están completos. Con un año a medias, la instrucción saldría mal y el
// error se repetiría en las 48.

// Los matrimonios que entran en el encargo: todos menos los que el
// colaborador ha marcado que NO tienen foto de boda (2026-09-19). Sin foto
// no hay nada que montar, y contarlos dejaría el encargo "incompleto" para
// siempre.
export function matrimoniosParaEncargo(matrimonios, sinFotoBoda) {
  return (matrimonios || []).filter((m) => !sinFotoBoda?.[m.familia]);
}

// Qué falta para poder redactar el encargo.
export function faltaParaEncargo(matrimonios, fotosOriginales) {
  const sinAnio = [];
  const sinFoto = [];
  for (const m of matrimonios || []) {
    if (!String(m.anioBoda || "").trim()) sinAnio.push(m);
    if (!fotosOriginales?.[m.familia]) sinFoto.push(m);
  }
  return { sinAnio, sinFoto, completo: sinAnio.length === 0 && sinFoto.length === 0 };
}

export function hojaDeEncargo(matrimonios) {
  const cabecera = [
    "HOJA DE ENCARGO — fotos de boda para la plantilla",
    "",
    "Para cada foto: copia su bloque, pégalo en ChatGPT y adjunta la foto",
    "con ese mismo nombre, junto con la plantilla.",
    "",
    "============================================================",
    "",
  ];
  const bloques = (matrimonios || []).map((m) => {
    const nombre = nombreDescargaBoda(m);
    const anios = m.aniversario != null ? ` Cumplen ${m.aniversario} años.` : "";
    return [
      nombre,
      "",
      "Monta esta foto en la plantilla adjunta.",
      `Nombres: ${nombresMatrimonio(m)}. Año de boda: ${m.anioBoda}.${anios}`,
      "Devuélvela en 16:9, 1920x1080, y guárdala como archivo con el nombre",
      `exacto "${nombre}".`,
      "",
      "------------------------------------------------------------",
      "",
    ].join("\n");
  });
  return cabecera.join("\n") + bloques.join("\n");
}
