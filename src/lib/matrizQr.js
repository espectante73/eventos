// Un QR como cuadrícula de sí/no, para dibujarlo donde haga falta (la
// invitación, v83.2). La librería, solo cuando se usa: no pesa al abrir.
export async function matrizQr(texto) {
  const { default: qrcode } = await import("qrcode-generator");
  const q = qrcode(0, "M");
  q.addData(texto);
  q.make();
  const n = q.getModuleCount();
  return Array.from({ length: n }, (_, fila) => Array.from({ length: n }, (_, columna) => q.isDark(fila, columna)));
}
