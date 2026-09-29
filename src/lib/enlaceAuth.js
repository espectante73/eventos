// Lo que trae la dirección al llegar desde un enlace de correo de Supabase
// que NO ha servido (caducado, o ya usado): Supabase devuelve a la web con
// "#error=access_denied&error_code=otp_expired&...". Sin leerlo, la persona
// caía en la pantalla de entrar sin saber qué había pasado (él, v53).
//
// Se lee al CARGAR este archivo, antes de que nada toque la dirección: todo
// el código de la app se carga de un tirón, y la librería de Supabase
// empieza a mirarla después.
export function leerErrorDelEnlace(hash) {
  const datos = new URLSearchParams(String(hash || "").replace(/^#/, ""));
  return datos.get("error_code") || datos.get("error") || "";
}

export const errorDelEnlace = typeof window === "undefined" ? "" : leerErrorDelEnlace(window.location.hash);

// Quita el "#error=…" de la dirección: si no, al recargar volvería a salir
// el aviso de un enlace que ya se ha explicado.
export function limpiarErrorDelEnlace() {
  if (typeof window === "undefined" || !leerErrorDelEnlace(window.location.hash)) return;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}

// ¿El inicio de sesión falló porque el correo está sin confirmar? Supabase lo
// dice con un código (las versiones nuevas) o solo con el texto.
export function esCorreoSinConfirmar(error) {
  return error?.code === "email_not_confirmed" || /not confirmed/i.test(error?.message || "");
}
