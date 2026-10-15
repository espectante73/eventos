// Las fotos de la fiesta desde el tablón (v67.4): 3 por familia y 2 MB como
// mucho, en el cajón CERRADO «fotos-fiesta». Quien cuenta y decide es el
// servidor (tablon_reservar_foto): aquí solo se prepara la foto y se sube.
//
// Subir son tres pasos: reservar el sitio (el servidor dice la ruta, o por
// qué no), subir el archivo a esa ruta y confirmar. Si la subida falla, la
// reserva se suelta en el acto: si no, ocuparía uno de los 3 sitios hasta
// que caduque, a los 15 minutos.
import { reducirImagen } from "./fotosAlmacen";
import { claveFamilia } from "./invitados";
import { horaCorta } from "./formato";

export const CUBO_FOTOS_FIESTA = "fotos-fiesta";
export const LIMITE_FOTO_FIESTA = 2 * 1024 * 1024;

// De más a menos: lado largo y calidad. Vale la primera que quepa en 2 MB.
// La foto se guarda entera, sin recortar (se verá en una pantalla 16:9).
const INTENTOS = [
  [2560, 0.85],
  [2560, 0.7],
  [2048, 0.7],
  [1600, 0.7],
];

export async function prepararFotoFiesta(archivo, reducir = reducirImagen) {
  for (const [lado, calidad] of INTENTOS) {
    const blob = await reducir(archivo, lado, lado, calidad);
    if (blob.size <= LIMITE_FOTO_FIESTA) return blob;
  }
  throw new Error("La foto pasa de 2 MB incluso reducida");
}

const MOTIVOS = {
  nombre: "No te hemos reconocido: vuelve a entrar con tu nombre.",
  cerrada: "Ya no se pueden subir fotos.",
  completa: "Tu familia ya tiene sus 3 fotos. Para cambiar una, eliminen antes otra.",
};

// La miniatura de las que sube cada uno, guardada en SU móvil (él, v67.5):
// sin verla no sabría cuál eliminar, y el cajón sigue cerrado para todos.
// Si la subió desde otro móvil o borró los datos del navegador, su línea
// sale sin miniatura.
const claveMiniatura = (id) => `fotos-fiesta-miniatura-${id}`;
export function miniaturaFotoFiesta(id) {
  try {
    return window.localStorage.getItem(claveMiniatura(id)) || "";
  } catch {
    return "";
  }
}
function olvidarMiniatura(id) {
  try {
    window.localStorage.removeItem(claveMiniatura(id));
  } catch {
    // Sin almacenamiento, no había nada guardado.
  }
}
const comoDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(blob);
  });
// Pequeña (cabe en 320x180, para el marco de 96 px); si falla, la foto
// está subida igual y su línea sale sin miniatura.
async function guardarMiniatura(id, archivo, reducir) {
  try {
    window.localStorage.setItem(claveMiniatura(id), await comoDataUrl(await reducir(archivo, 320, 180, 0.7)));
  } catch {
    // Sin miniatura: no impide nada.
  }
}

const NO_SE_PUDO = "No se pudo subir la foto. Prueba otra vez; si sigue fallando, prueba con otra foto.";

// Devuelve { aviso, detalle }: sin aviso, la foto está subida.
export async function subirFotoFiesta(supabase, { token, respuesta, archivo }, reducir = reducirImagen) {
  let blob;
  try {
    blob = await prepararFotoFiesta(archivo, reducir);
  } catch (e) {
    return { aviso: "No se pudo leer esa foto. Prueba con otra de tu galería.", detalle: e.message };
  }
  const quien = { p_token: token, p_respuesta: respuesta };
  const { data: reserva, error } = await supabase.rpc("tablon_reservar_foto", quien);
  if (error || !reserva) return { aviso: NO_SE_PUDO, detalle: error?.message };
  if (reserva.error) return { aviso: MOTIVOS[reserva.error] || NO_SE_PUDO, detalle: reserva.error };

  const soltar = () => supabase.rpc("tablon_quitar_foto", { ...quien, p_id: reserva.id });
  const { error: errorSubida } = await supabase.storage
    .from(CUBO_FOTOS_FIESTA)
    .upload(reserva.ruta, blob, { contentType: "image/jpeg" });
  if (errorSubida) {
    await soltar();
    return { aviso: NO_SE_PUDO, detalle: errorSubida.message };
  }
  const { data: confirmada, error: errorConfirmar } = await supabase.rpc("tablon_confirmar_foto", { ...quien, p_id: reserva.id });
  if (errorConfirmar || !confirmada) {
    await soltar();
    await supabase.storage.from(CUBO_FOTOS_FIESTA).remove([reserva.ruta]);
    return { aviso: NO_SE_PUDO, detalle: errorConfirmar?.message || "sin confirmar" };
  }
  await guardarMiniatura(reserva.id, archivo, reducir);
  return { aviso: "" };
}

// Elimina una foto suya: el servidor la da por quitada y devuelve la ruta;
// el archivo lo borra este mismo móvil (el cajón solo le deja borrar las
// quitadas). Si eso falla, la foto ya no cuenta ni se ve: solo queda el
// archivo en el cajón.
export async function eliminarFotoFiesta(supabase, { token, respuesta, id }) {
  const { data: ruta, error } = await supabase.rpc("tablon_quitar_foto", { p_token: token, p_respuesta: respuesta, p_id: id });
  if (error || !ruta) return { aviso: "No se pudo eliminar la foto. Prueba otra vez.", detalle: error?.message };
  await supabase.storage.from(CUBO_FOTOS_FIESTA).remove([ruta]);
  olvidarMiniatura(id);
  return { aviso: "" };
}

// El ZIP de las fotos, para elegirlas FUERA de la app (él, v67.6): una
// carpeta por familia, con su nombre de la lista (grupo o apellido), y cada
// foto con quién la subió y a qué hora: «Medina/Medina, Ana · 22.47.jpg».
export const ARCHIVO_FOTOS_FIESTA = "Fotos de la fiesta.zip";
const limpiarNombre = (t) => String(t || "").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();

export function nombresDescargaFotosFiesta(fotos, invitados = []) {
  const carpetas = {};
  for (const g of invitados) {
    const clave = claveFamilia(g);
    if (clave && !carpetas[clave]) carpetas[clave] = String(g.grupoFamiliar || g.apellido).trim();
  }
  const usados = new Set();
  return fotos.map((f) => {
    const base = `${limpiarNombre(carpetas[f.familia] || f.familia)}/${limpiarNombre(f.quien)} · ${horaCorta(f.creadaEn).replace(":", ".")}`;
    let nombre = `${base}.jpg`;
    // Dos de la misma persona en el mismo minuto: no pisar.
    for (let i = 2; usados.has(nombre); i++) nombre = `${base} (${i}).jpg`;
    usados.add(nombre);
    return { ruta: f.ruta, nombre };
  });
}

// Baja las fotos del cajón (el anfitrión puede leerlas) de 6 en 6, para no
// pedir 200 a la vez. Devuelve los archivos para el ZIP y cuántas fallaron.
export async function bajarFotosFiesta(supabase, fotos, invitados) {
  const pendientes = nombresDescargaFotosFiesta(fotos, invitados);
  const archivos = [];
  let fallidas = 0;
  for (let i = 0; i < pendientes.length; i += 6) {
    await Promise.all(
      pendientes.slice(i, i + 6).map(async ({ ruta, nombre }) => {
        const { data, error } = await supabase.storage.from(CUBO_FOTOS_FIESTA).download(ruta);
        if (error || !data) fallidas++;
        else archivos.push({ nombre, datos: new Uint8Array(await data.arrayBuffer()) });
      })
    );
  }
  archivos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return { archivos, fallidas };
}
