// Las fotos de la fiesta desde el tablón (v67.4; v68, él: 2 por persona de
// 16 años o más —15 desde la v98—, «3 por familia» era injusto con las grandes) y 1,5 MB como
// mucho, en el cajón CERRADO «fotos-fiesta». Quien cuenta y decide es el
// servidor (tablon_reservar_foto): aquí solo se prepara la foto y se sube.
//
// Subir son tres pasos: reservar el sitio (el servidor dice la ruta, o por
// qué no), subir el archivo a esa ruta y confirmar. Si la subida falla, la
// reserva se suelta en el acto: si no, ocuparía uno de sus sitios hasta
// que caduque, a los 15 minutos. Cada paso lleva el móvil (`dispositivo`):
// solo el que la subió puede quitarla.
import { nombreDelEvento } from "./mensajesWhatsapp";
import { reducirImagen } from "./fotosAlmacen";
import { horaCorta } from "./formato";
import { EDAD_EMAIL } from "./invitados";

export const CUBO_FOTOS_FIESTA = "fotos-fiesta";

// Su frase, pulida con él: «en UNA pantalla», no «en la pantalla» (no se
// proyectan ese día en el local). Va junto al botón del tablón (en las
// tarjetas QR ya no, v92.9: él la quitó).
export const FRASE_HORIZONTAL =
  "Puedes hacerla en horizontal o en vertical; solo ten en cuenta que en horizontal se verá mejor en una pantalla.";
// Su frase para quien tiene de 15 a 17 años (él, v68; 15 desde la v98), en el tablón (la
// tarjeta QR lleva la suya, v92.9).
export const FRASE_PERMISO_PADRES = "Puedes subir la foto con el permiso de tus padres, si eres menor de edad.";
// Qué foto es cada una (v85.5, él): una de toda la familia, que sube solo
// uno de ellos, y las demás personales. A quien viene solo, solo lo suyo.
export const FRASE_FOTO_FAMILIA = "Si vienen en familia, una foto de toda la familia: que la suba solo uno de ustedes.";
export const FRASE_FOTOS_PERSONALES = "Las demás son personales: lo que para ti ha sido el evento.";
export const FRASE_FOTOS_SOLO = "Son personales: lo que para ti ha sido el evento.";
export const fraseFotoFamiliaHecha = (quien) => `Foto de familia: ya la subió ${quien}.`;

// La edad, la del email (v98, él: 15).
export const SOLO_MAYORES = `Las fotos se suben a partir de los ${EDAD_EMAIL} años.`;
// Sin mesa en su ficha no se confirma el móvil (el año ya lo pide la
// entrada del tablón, v70; las dos claves siguen siendo obligatorias).
export const FALTAN_CLAVES = "Para subir fotos, tu ficha tiene que tener tu mesa. Pregúntale a tu colaborador.";

// 1,5 MB (v68): 132 personas x 2 fotos caben en el almacén gratuito (él:
// nada de pagar). El cajón tiene el mismo tope.
export const LIMITE_FOTO_FIESTA = 1.5 * 1024 * 1024;

// De más a menos: lado largo y calidad. Vale la primera que quepa en el tope.
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
  throw new Error("La foto pasa de 1,5 MB incluso reducida");
}

// Con las suyas ya subidas: también si las subió desde otro móvil, que es
// el único que puede quitarlas.
// Solo eso (él, v85.6): cómo cambiar una ya lo dice su papelera.
export const textoCompleta = (maximo) => `Ya tienes tus ${maximo} fotos.`;

const MOTIVOS = {
  nombre: "No te hemos reconocido: vuelve a entrar con tu nombre.",
  cerrada: "Ya no se pueden subir fotos.",
  menor: SOLO_MAYORES,
  verificar: "Antes de subir fotos, escanea con la cámara el QR de tu mesa.",
  completa: textoCompleta(2),
};

// Confirmar que es quien dice, una vez por móvil (él, v68.1): su número de
// mesa, más el año con el que entró al tablón (v70), que el servidor coteja
// con su ficha (tablon_verificar_foto). Los datos de la ficha no viajan al
// móvil. La mesa, desde la v93, la del QR de su tarjeta (él): número y
// código secreto, sin que elija nada.
export const ESCANEA_QR_MESA = "Para subir fotos desde este móvil, escanea con la cámara el QR de tu mesa.";
export const COMPROBANDO_QR_MESA = "Comprobando el QR de tu mesa…";
const RESPUESTAS_VERIFICAR = {
  ok: "",
  no: "Ese QR no vale: escanea con la cámara el de tu mesa.",
  otra: "Ese QR es de otra mesa: escanea el de la tuya.",
  faltan: FALTAN_CLAVES,
  bloqueado: "Demasiados intentos con este nombre. Espera 15 minutos y vuelve a probar.",
  nombre: MOTIVOS.nombre,
  movil: "Este navegador no deja recordar tu móvil: ábrelo fuera del modo privado y vuelve a probar.",
};

// `respuesta` (la del servidor) dice además si el QR guardado ya no sirve
// ('no', 'otra'): se olvida, y la próxima vez se le pide escanear.
export async function verificarFotoFiesta(supabase, { token, respuesta, dispositivo, anio, mesa, codigo }) {
  const { data, error } = await supabase.rpc("tablon_verificar_foto", {
    p_token: token,
    p_respuesta: respuesta,
    p_dispositivo: dispositivo,
    p_anio: String(anio || "").trim(),
    p_mesa: Number.parseInt(mesa, 10) || null,
    p_codigo: String(codigo || "").trim(),
  });
  if (error || !Object.hasOwn(RESPUESTAS_VERIFICAR, data || "")) return { aviso: "No se pudo comprobar. Prueba otra vez.", detalle: error?.message };
  return { aviso: RESPUESTAS_VERIFICAR[data], respuesta: data };
}

// El QR de la mesa leído en ESTE móvil (v93), guardado: con «Solo con el
// enlace personal», el QR solo no abre el tablón; si después entra con su
// enlace personal, el móvil se confirma igual sin volver a escanear.
// `delUrl`, el que trae la dirección (getQrMesaFromUrl): manda sobre el
// guardado. Sin almacenamiento, solo el de la dirección.
const CLAVE_QR_MESA = "tablon-qr-mesa";
export function qrMesaDeEsteMovil(delUrl) {
  try {
    if (delUrl) {
      window.localStorage.setItem(CLAVE_QR_MESA, JSON.stringify(delUrl));
      return delUrl;
    }
    const guardado = JSON.parse(window.localStorage.getItem(CLAVE_QR_MESA) || "null");
    return guardado && Number.isInteger(guardado.mesa) && typeof guardado.codigo === "string" ? guardado : null;
  } catch {
    return delUrl || null;
  }
}
export function olvidarQrMesa() {
  try {
    window.localStorage.removeItem(CLAVE_QR_MESA);
  } catch {
    // Sin almacenamiento, no había nada guardado.
  }
}

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
export async function subirFotoFiesta(supabase, { token, respuesta, dispositivo, archivo }, reducir = reducirImagen) {
  let blob;
  try {
    blob = await prepararFotoFiesta(archivo, reducir);
  } catch (e) {
    return { aviso: "No se pudo leer esa foto. Prueba con otra de tu galería.", detalle: e.message };
  }
  const quien = { p_token: token, p_respuesta: respuesta };
  const { data: reserva, error } = await supabase.rpc("tablon_reservar_foto", { ...quien, p_dispositivo: dispositivo });
  if (error || !reserva) return { aviso: NO_SE_PUDO, detalle: error?.message };
  if (reserva.error) return { aviso: MOTIVOS[reserva.error] || NO_SE_PUDO, detalle: reserva.error };

  const soltar = () => supabase.rpc("tablon_quitar_foto", { ...quien, p_id: reserva.id, p_dispositivo: dispositivo });
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

// Elimina una foto suya, desde el móvil que la subió: el servidor la da por
// quitada y devuelve la ruta; el archivo lo borra este mismo móvil (el
// cajón solo le deja borrar las quitadas). Si eso falla, la foto ya no
// cuenta ni se ve: solo queda el archivo en el cajón.
export async function eliminarFotoFiesta(supabase, { token, respuesta, dispositivo, id }) {
  const { data: ruta, error } = await supabase.rpc("tablon_quitar_foto", {
    p_token: token,
    p_respuesta: respuesta,
    p_id: id,
    p_dispositivo: dispositivo,
  });
  if (error || !ruta) return { aviso: "No se pudo eliminar la foto. Prueba otra vez.", detalle: error?.message };
  await supabase.storage.from(CUBO_FOTOS_FIESTA).remove([ruta]);
  olvidarMiniatura(id);
  return { aviso: "" };
}

// Marcar (o desmarcar) una foto suya como la de familia (v85.5). Una por
// familia: si ya la marcó otro, se dice quién y no se cambia.
export async function marcarFotoFamilia(supabase, { token, respuesta, dispositivo, id, marcar }) {
  const { data, error } = await supabase.rpc("tablon_marcar_foto_familia", {
    p_token: token,
    p_respuesta: respuesta,
    p_id: id,
    p_dispositivo: dispositivo,
    p_marcar: marcar,
  });
  if (error || data === null || data === undefined) return { aviso: "No se pudo marcar la foto. Prueba otra vez.", detalle: error?.message };
  if (data) return { aviso: `La foto de familia ya la subió ${data}: las tuyas son personales.` };
  return { aviso: "" };
}

// El ZIP de las fotos, para elegirlas FUERA de la app (él, v67.6): todas en
// una sola carpeta (v85.5, él: «una por familia son muchas carpetas»), cada
// una con quién la subió, que empieza por su apellido, y a qué hora:
// «Medina, Ana · 22.47.jpg». La de familia, con su nombre detrás del de
// quien la subió, para que siga en su sitio por apellido:
// «Medina, Ana · Foto de familia · 22.47.jpg».
// El ZIP, con el nombre del evento (v85.7, él: «es algo más que una
// fiesta»): «Fotos de Las Bodas de todos.zip». Sin nombre, del evento.
export const archivoFotosEvento = (evento) => {
  const nombre = limpiarNombre(nombreDelEvento(evento));
  return nombre ? `Fotos de ${nombre}.zip` : "Fotos del evento.zip";
};
const limpiarNombre = (t) => String(t || "").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();

export function nombresDescargaFotosFiesta(fotos) {
  const usados = new Set();
  return fotos.map((f) => {
    const base = `${limpiarNombre(f.quien)} · ${f.deFamilia ? "Foto de familia · " : ""}${horaCorta(f.creadaEn).replace(":", ".")}`;
    let nombre = `${base}.jpg`;
    // Dos de la misma persona en el mismo minuto: no pisar.
    for (let i = 2; usados.has(nombre); i++) nombre = `${base} (${i}).jpg`;
    usados.add(nombre);
    return { ruta: f.ruta, nombre };
  });
}

// Baja las fotos del cajón (el anfitrión puede leerlas) de 6 en 6, para no
// pedir 200 a la vez. Devuelve los archivos para el ZIP y cuántas fallaron.
export async function bajarFotosFiesta(supabase, fotos) {
  const pendientes = nombresDescargaFotosFiesta(fotos);
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
