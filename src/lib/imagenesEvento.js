// Las dos imágenes del evento —la portada y la plantilla de invitación—
// guardadas en el ALMACÉN, no dentro de la fila de `evento` (2026-09-24).
//
// El motivo es el mismo que ya estaba escrito para las fotos de boda, y
// por eso esto no es una idea nueva sino una norma que se incumplía: una
// imagen metida como texto en una columna se descarga ENTERA cada vez que
// alguien abre la app. Medido en su boda: la fila pesaba 830 KB (415 la
// portada + 407 la plantilla), y la app la relee sola cada minuto.
//
// Además reventaba el guardado: mandar la fila entera en cada tecla del
// Cronograma hacía que Postgres reescribiera las dos imágenes y la
// sentencia se cortaba sola por "statement timeout".
//
// El cajón es PÚBLICO a propósito (como `og-imagen`): la portada la ve
// cualquiera que abra el tablón, así que no hay nada que esconder y un
// enlace fijo es más rápido que pedir uno firmado cada vez.
import { supabase } from "../supabaseClient";

export const CUBO_IMAGENES_EVENTO = "imagenes-evento";

// Los dos únicos nombres que se usan. Fijos, no con fecha: así reemplazar
// la portada no va dejando archivos viejos olvidados en el cajón.
export const IMAGEN_EVENTO = {
  PORTADA: "portada",
  INVITACION: "plantilla-invitacion",
};

// ¿Este valor es una imagen metida DENTRO de la ficha del evento?
// Las que están bien guardadas son una dirección ("/cabecera-defecto.jpg"
// o "https://…"); las que están mal empiezan por "data:".
export function estaDentroDeLaFicha(valor) {
  return String(valor || "").startsWith("data:");
}

// Cuánto ocupa de verdad eso que está dentro de la ficha, en KB. El texto
// en base64 abulta un tercio más que el archivo, y se enseña para que se
// entienda por qué hay que sacarlo.
export function pesoEnKB(valor) {
  const texto = String(valor || "");
  if (!texto) return 0;
  return Math.round((texto.length * 3) / 4 / 1024);
}

function tipoDe(dataUrl) {
  const m = String(dataUrl).match(/^data:([^;]+);/);
  return m ? m[1] : "image/jpeg";
}

function extensionDe(tipo) {
  if (tipo.includes("png")) return "png";
  if (tipo.includes("webp")) return "webp";
  return "jpg";
}

// Sube una imagen (venga como "data:…" o como archivo) y devuelve su
// dirección pública, que es lo único que se guarda en la fila.
//
// ⚠️ `upsert: true` a propósito: el nombre es fijo, así que subir una
// portada nueva pisa la anterior en vez de acumular archivos. Y al
// devolver la dirección se le añade `?v=…` para que el navegador no siga
// enseñando la vieja que ya tenía guardada.
export async function guardarImagenEvento(origen, nombre) {
  const esDataUrl = typeof origen === "string";
  const cuerpo = esDataUrl ? await (await fetch(origen)).blob() : origen;
  const tipo = esDataUrl ? tipoDe(origen) : cuerpo.type || "image/jpeg";
  const ruta = `${nombre}.${extensionDe(tipo)}`;

  const { error } = await supabase.storage
    .from(CUBO_IMAGENES_EVENTO)
    .upload(ruta, cuerpo, { contentType: tipo, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(CUBO_IMAGENES_EVENTO).getPublicUrl(ruta);
  return `${data.publicUrl}?v=${Date.now()}`;
}
