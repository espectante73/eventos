// El teléfono de un invitado (él, v78): para que su colaborador le llame o
// le escriba por WhatsApp desde la app. Se escribe como sea («612 34 56 78»,
// «+34 612…», «0034…») y se guarda limpio, con el prefijo: sin él, WhatsApp
// no sabe a qué país llamar. Sin prefijo y con 9 cifras, es de España (+34).
import { pideEmail } from "./invitados";
import { esAparatoTactil } from "./mano";

// El mismo criterio que el email: desde los 16 años cumplidos (norma 7).
export const pideTelefono = pideEmail;

export function limpiarTelefono(texto) {
  const escrito = String(texto || "").trim();
  if (!escrito) return "";
  let cifras = escrito.replace(/[^\d+]/g, "");
  if (cifras.startsWith("00")) cifras = `+${cifras.slice(2)}`;
  if (!cifras.startsWith("+")) cifras = cifras.length === 9 ? `+34${cifras}` : `+${cifras.replace(/^0+/, "")}`;
  return `+${cifras.slice(1).replace(/\+/g, "")}`;
}

export const telefonoValido = (texto) => /^\+\d{8,15}$/.test(limpiarTelefono(texto));

export const AVISO_TELEFONO = "Ese teléfono no parece válido: escribe sus 9 números, como 612 34 56 78.";

// Cómo se lee: los de España, «612 34 56 78»; los de fuera, con su prefijo.
export function telefonoParaVer(texto) {
  const limpio = limpiarTelefono(texto);
  const espanol = limpio.match(/^\+34(\d{3})(\d{2})(\d{2})(\d{2})$/);
  if (espanol) return espanol.slice(1).join(" ");
  return limpio;
}

export const enlaceLlamar = (texto) => `tel:${limpiarTelefono(texto)}`;
// Con `mensaje`, WhatsApp se abre con él ya escrito (v82.4): solo falta
// pulsar «Enviar».
export const enlaceWhatsApp = (texto, mensaje = "") =>
  `https://wa.me/${limpiarTelefono(texto).slice(1)}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`;

// El enlace propio de la app de WhatsApp (v82.7): la abre directamente, sin
// pasar por el navegador.
export function enlaceWhatsAppDirecto(texto, mensaje = "") {
  const numero = limpiarTelefono(texto).slice(1);
  const partes = [numero && `phone=${numero}`, mensaje && `text=${encodeURIComponent(mensaje)}`].filter(Boolean);
  return `whatsapp://send${partes.length ? `?${partes.join("&")}` : ""}`;
}

// Abrir WhatsApp, una sola manera en toda la app (v82.7). En el móvil, con
// su enlace propio y en la misma ventana: con wa.me en una ventana nueva, al
// volver de WhatsApp quedaba una ventana del navegador en blanco que había
// que cerrar (él). En el ordenador, wa.me en otra pestaña: ahí se elige la
// app del Mac o WhatsApp Web. `win`: la ventana del botón (realmDe).
export function abrirWhatsApp({ telefono = "", mensaje = "", win = window } = {}) {
  if (esAparatoTactil(win)) win.location.href = enlaceWhatsAppDirecto(telefono, mensaje);
  else win.open(enlaceWhatsApp(telefono, mensaje), "_blank", "noopener,noreferrer");
}
