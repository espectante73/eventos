// «Aviso de pago» (él, v89): el ANFITRIÓN escribe por WhatsApp, uno a uno,
// a CADA persona que no ha pagado (no a la familia): el mismo mensaje para
// toda la familia, con el nombre de quien lo recibe y lo que debe toda la
// familia. Enviar a todos de un toque exige la plataforma de pago de
// WhatsApp: descartado (sin servicios de pago). La app deja cada mensaje
// escrito; él pulsa «Enviar».
//
// El mensaje lleva la fecha de HOY y los días que quedan desde hoy (él: «si
// vuelve a leer el mensaje mañana o pasado, sabrá que no quedan 24 días»),
// y la fecha límite que elige él. Sin «cancelar»: si no se resuelve, «no
// podrán continuar como invitados» (él).
import { euros, diasHasta, nombreCompleto } from "./formato";
import { claveFamilia, importeEsperadoInvitado, resolverColaborador } from "./invitados";
import { saludoWhatsapp, nombreDelEvento } from "./mensajesWhatsapp";

const COMUN =
  "Sin ese pago, el anfitrión tiene las manos atadas: no puede enviar las invitaciones con las mesas asignadas, " +
  "preparar las imágenes ni cerrar las cuentas con el local.";

// Los huecos: {evento}, {hoy} («17 de noviembre»), {quedan} («quedan 24
// días»), {importe} (lo que debe la familia), {limite} («24 de noviembre») y
// {colaborador} («su colaborador (Barrios, Jacob)»; sin colaborador, «el
// anfitrión»).
export const AVISO_PAGO = {
  porDefecto:
    "Les escribe el ANFITRIÓN de «{evento}». Hoy, {hoy}, {quedan} para la boda y el pago de la familia ({importe}) sigue pendiente. " +
    `${COMUN} Además, un pago pendiente hace dudar de su asistencia.\n\n` +
    "Si el pago no está resuelto antes del {limite}, no podrán continuar como invitados.\n\n" +
    "Para pagar, hablen con {colaborador} o contesten a este mensaje.",
  porDefectoSolo:
    "Te escribe el ANFITRIÓN de «{evento}». Hoy, {hoy}, {quedan} para la boda y tu pago ({importe}) sigue pendiente. " +
    `${COMUN} Además, un pago pendiente hace dudar de tu asistencia.\n\n` +
    "Si el pago no está resuelto antes del {limite}, no podrás seguir en la lista de invitados.\n\n" +
    "Para pagar, habla con {colaborador} o contesta a este mensaje.",
};

// «17 de noviembre».
const diaYMes = (fecha) => fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
export function diaYMesISO(iso) {
  const [a, m, d] = String(iso || "").split("-").map(Number);
  return a && m && d ? diaYMes(new Date(a, m - 1, d)) : "";
}

const rellenar = (plantilla, valores) => plantilla.replace(/\{(evento|hoy|quedan|importe|limite|colaborador)\}/g, (_, h) => valores[h] ?? "");

const debePagar = (g) => Boolean(g?.confirmado) && !g?.pagado && !g?.noAsiste;

// Las personas a avisar, ordenadas por familia: confirmadas, sin pagar y con
// algo que pagar (el DJ y los bebés, no). Cada una con lo que debe su
// familia, su teléfono (vacío: «Sin teléfono») y su mensaje, ya escrito
// cuando hay fecha límite (`limite`, AAAA-MM-DD; sin ella, `texto` null).
// Sin fecha del evento (o ya pasada) no hay días que contar: `aviso`.
export function avisosDePago({ invitados = [], evento, colaboradores = [], limite = "", hoy = new Date() }) {
  const dias = evento?.fechaSinConfirmar ? null : diasHasta(evento?.fecha, hoy);
  if (dias === null || dias <= 0) return { filas: [], aviso: "Falta la fecha del evento (Datos del evento): el mensaje dice cuántos días quedan." };
  const pendienteDe = new Map();
  for (const g of invitados.filter(debePagar)) {
    const clave = claveFamilia(g);
    pendienteDe.set(clave, (pendienteDe.get(clave) || 0) + importeEsperadoInvitado(g, evento));
  }
  const confirmadosDe = (clave) => invitados.filter((m) => m.confirmado && !m.noAsiste && claveFamilia(m) === clave).length;
  const comunes = {
    evento: nombreDelEvento(evento),
    hoy: diaYMes(hoy),
    quedan: dias === 1 ? "queda 1 día" : `quedan ${dias} días`,
    limite: diaYMesISO(limite),
  };
  const filas = invitados
    .filter((g) => debePagar(g) && importeEsperadoInvitado(g, evento) > 0)
    .map((g) => {
      const solo = confirmadosDe(claveFamilia(g)) === 1;
      const col = resolverColaborador(g, colaboradores);
      const importe = euros(pendienteDe.get(claveFamilia(g)) || 0);
      const valores = { ...comunes, importe, colaborador: col ? `${solo ? "tu" : "su"} colaborador (${col.nombre})` : "el anfitrión" };
      const cuerpo = solo ? AVISO_PAGO.porDefectoSolo : AVISO_PAGO.porDefecto;
      return {
        invitado: g,
        nombre: nombreCompleto(g),
        importe,
        telefono: String(g.telefono || "").trim(),
        texto: limite ? `${saludoWhatsapp(g)}:\n${rellenar(cuerpo, valores)}` : null,
      };
    })
    .sort((a, b) => saludoWhatsapp(a.invitado).localeCompare(saludoWhatsapp(b.invitado), "es"));
  return { filas, aviso: "" };
}
