// ¿Se exigen los requisitos de "antes rellena esto"? Una sola definición
// para toda la app (norma 7): en Modo Pruebas el anfitrión puede probar
// cualquier paso sin los datos previos -- enviar la invitación sin pago,
// mesa ni email; marcar el pago sin datos; la llegada sin datos, sin pago
// y con las llegadas cerradas; dar mesa a un no confirmado.
//
// Lo que NO se salta: la capacidad de las mesas y que una familia no se
// separe (reglas del mundo real), ni los permisos. En la base, la pareja
// de esto es modo_pruebas_activo() (schema.sql): ahí deja fuera a los
// colaboradores y manda los correos solo al anfitrión.
export function requisitosActivos(evento) {
  return !evento?.modoPruebasActivo;
}
