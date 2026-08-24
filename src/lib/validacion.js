// Validación de formato de email, compartida por los sitios que avisan
// en pantalla si un email "no parece válido" (Colaboradores, Email
// anfitrión, Login) -- a petición del usuario, 2026-08-21 (Fase I de
// mejoras-pendientes-login-y-solidez.md: "avisar en el momento, no
// dejar que falle en silencio"). Deliberadamente simple (no cubre el
// RFC entero, solo el patrón "algo@algo.algo") -- suficiente para
// cazar erratas típicas sin rechazar direcciones raras pero legítimas.
export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
