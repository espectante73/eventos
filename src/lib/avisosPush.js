// Los avisos al móvil (él, v79), del lado del móvil: saber qué se puede
// hacer en este aparato, activarlos (el permiso, el programa que los recibe
// —public/sw.js— y apuntarse en la base) y quitarlos. Y, del lado del
// anfitrión, pedírselos al «cartero» (api/avisos.js).
//
// En el iPhone, Apple solo los deja con la app instalada (añadida a la
// pantalla de inicio y abierta desde su icono). El email sigue siempre de
// respaldo: un aviso puede no llegar.
import { CLAVE_PUBLICA_AVISOS } from "./clavePublicaAvisos";

// Cómo instalar la app, para «Lo nuevo» y «Avisos en este móvil»: una sola
// vez, para que digan siempre lo mismo (él, v81.7: corto, en lista).
export const PASOS_INSTALAR = {
  iphone: "Safari → Compartir → «Añadir a pantalla de inicio».",
  android: "Chrome → ⋮ → «Instalar» (o «Añadir a pantalla de inicio»).",
};
export const AVISO_BLOQUEADOS = "Los avisos están bloqueados en este móvil. Se activan en Ajustes → Notificaciones → Las Bodas.";

const esIphone = (nav) => /iPhone|iPad|iPod/.test(nav.userAgent || "") || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
export const esAppInstalada = (w) => Boolean(w.matchMedia?.("(display-mode: standalone)").matches || w.navigator.standalone === true);
const soporta = (w) => "serviceWorker" in w.navigator && "PushManager" in w && "Notification" in w;

// Qué se puede hacer aquí: "activar", "activos", "bloqueados", "instalar"
// (iPhone fuera de la app instalada) o "no" (este navegador no puede).
export async function estadoAvisos(w = window) {
  if (esIphone(w.navigator) && !esAppInstalada(w)) return "instalar";
  if (!soporta(w)) return "no";
  if (w.Notification.permission === "denied") return "bloqueados";
  const registro = await w.navigator.serviceWorker.getRegistration();
  const suscripcion = registro && (await registro.pushManager.getSubscription());
  return suscripcion ? "activos" : "activar";
}

// La clave pública, en los bytes que pide el móvil.
export function claveEnBytes(base64url) {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

// Dentro del propio toque (el iPhone solo pregunta el permiso así).
// `guardar({ endpoint, p256dh, auth })` la apunta en la base y dice si pudo.
export async function activarAvisos(guardar, w = window) {
  const permiso = await w.Notification.requestPermission();
  if (permiso !== "granted") return { ok: false, aviso: permiso === "denied" ? AVISO_BLOQUEADOS : "" };
  const registro = await w.navigator.serviceWorker.register("/sw.js");
  await w.navigator.serviceWorker.ready;
  const suscripcion =
    (await registro.pushManager.getSubscription()) ||
    (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveEnBytes(CLAVE_PUBLICA_AVISOS) }));
  const { endpoint, keys } = suscripcion.toJSON();
  if (!(await guardar({ endpoint, p256dh: keys.p256dh, auth: keys.auth }))) {
    return { ok: false, aviso: "No se pudieron guardar los avisos. Prueba otra vez en un momento." };
  }
  return { ok: true, aviso: "" };
}

export async function desactivarAvisos(quitar, w = window) {
  const registro = await w.navigator.serviceWorker.getRegistration();
  const suscripcion = registro && (await registro.pushManager.getSubscription());
  if (!suscripcion) return;
  await quitar(suscripcion.endpoint);
  await suscripcion.unsubscribe();
}

// El anfitrión pide un aviso al «cartero». `colaboradores`: sus ids, o null
// para todo el equipo. Devuelve { enviados, fallidos } o { error }.
export async function pedirAvisos({ token, colaboradores = null, titulo, texto, url = "/" }, f = fetch) {
  try {
    const r = await f("/api/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, colaboradores, titulo, texto, url }),
    });
    const datos = await r.json().catch(() => ({}));
    return r.ok ? datos : { error: datos.error || `El cartero respondió ${r.status}.` };
  } catch (e) {
    return { error: `No se pudo llegar al cartero (${e.message}).` };
  }
}

// El texto del aviso automático de invitados nuevos.
export const textoInvitadosNuevos = (n) =>
  n === 1 ? "Tienes 1 invitado nuevo. Abre la app para ver su ficha." : `Tienes ${n} invitados nuevos. Abre la app para ver sus fichas.`;
