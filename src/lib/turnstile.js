// El script anti-robots del login (Cloudflare Turnstile, Fase D,
// 2026-08-24) se pide al abrir la pantalla de entrar (v72.4). Antes iba en
// index.html y se descargaba SIEMPRE: con la sesión ya iniciada y en el
// tablón, donde no se usa, robando conexión al móvil al abrir la app.
// No es un import de npm porque el widget vive fuera del árbol de React:
// VistaLogin.jsx llama a window.turnstile.render(...) directamente.
export const URL_TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/api.js";

let pedido = null;

// Una sola vez aunque se llame varias (volver a la pantalla de entrar no
// lo vuelve a descargar). Si falla, la próxima llamada lo reintenta.
export function cargarTurnstile(doc = document) {
  const win = doc.defaultView;
  if (win?.turnstile) return Promise.resolve(win.turnstile);
  if (!pedido) {
    pedido = new Promise((resolve, reject) => {
      const script = doc.createElement("script");
      script.src = URL_TURNSTILE;
      script.async = true;
      script.onload = () => resolve(win?.turnstile);
      script.onerror = () => {
        pedido = null;
        script.remove();
        reject(new Error("No se pudo cargar el captcha"));
      };
      doc.head.appendChild(script);
    });
  }
  return pedido;
}
