// ¿Una respuesta de Supabase ha fallado porque el SERVIDOR no contesta
// (caído, lento, sin conexión), y no por lo que se le ha preguntado? Sirve
// para no confundir "no hay respuesta" con "la respuesta es no": antes, si
// el servidor no contestaba al entrar, la app decía "tu cuenta no está
// vinculada a ningún acceso", y era falso (v53.1).
//   status 0      -> ni siquiera llegó (sin conexión, cortado por el camino)
//   status >= 500 -> el servidor (o su puerta, Cloudflare: 522) falló
export function esFalloDelServidor(respuesta) {
  if (!respuesta?.error) return false;
  const status = Number(respuesta.status || 0);
  return status === 0 || status >= 500 || /failed to fetch|network|fetch/i.test(respuesta.error.message || "");
}
