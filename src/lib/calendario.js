// «Añadir a mi calendario» (él, v92.6): el evento en el calendario del móvil
// de cada invitado, con un aviso la víspera (él: «Sí, un día antes»). Una
// sola dirección, /api/calendario, para el botón del tablón y el de la
// invitación (que lo pone la base al final, anfitrion_enviar_invitacion_familia):
// - en el iPhone, el Mac y casi todo lo demás, un archivo de calendario
//   (.ics): el móvil pregunta «Añadir» y lo guarda con su aviso;
// - en Android, la página de Google Calendar con el evento ya escrito:
//   Google Calendar de Android no abre esos archivos. Ahí el aviso es el
//   que cada uno tenga puesto en su calendario (Google no deja elegirlo).
//
// Solo con la fecha confirmada y a la vista: sin ella no hay nada que
// apuntar (la misma condición, en la base, para el botón del email).
// Lo ya añadido no se actualiza solo si luego cambia algo.
//
// Empieza a la hora del evento (la que ven los invitados) y acaba a la del
// fin del cronograma; sin ella, 5 horas después. Las horas son de las
// Canarias (el evento es en Icod): un móvil de la Península lo ve una hora
// más tarde, como de verdad es allí.
export const RUTA_CALENDARIO = "/api/calendario";
export const ZONA_EVENTO = "Atlantic/Canary";
const HORAS_SIN_FIN = 5;

const HORA = /^(\d{1,2}):(\d{2})$/;
const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

// La fecha del evento, si se puede apuntar: confirmada y a la vista.
export function fechaApuntable(evento) {
  if (!evento || evento.fechaSinConfirmar || evento.tablonOcultarFecha) return null;
  return FECHA.test(String(evento.fecha || "")) ? evento.fecha : null;
}

// La hora de un reloj de pared de `zona` ese día, en UTC (en milisegundos).
export function utcDeHoraLocal(fecha, hora, zona = ZONA_EVENTO) {
  const [, a, m, d] = FECHA.exec(fecha);
  const [, h, mi] = HORA.exec(hora);
  const supuesta = Date.UTC(+a, +m - 1, +d, +h, +mi);
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: zona, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(supuesta))
      .map((p) => [p.type, p.value])
  );
  const enLaZona = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute);
  return supuesta - (enLaZona - supuesta);
}

// Lo que se apunta, o null si todavía no se puede.
export function eventoDelCalendario(evento) {
  const fecha = fechaApuntable(evento);
  if (!fecha) return null;
  const lugar = [evento.lugar, evento.direccion].map((t) => String(t || "").trim()).filter(Boolean).join(", ");
  const base = { titulo: String(evento.nombre || "").trim() || "Evento", lugar, uid: `evento-${evento.id || "unico"}@nexuspoint.rsvp` };
  const hora = String(evento.hora || "").trim();
  if (!HORA.test(hora)) return { ...base, todoElDia: true, fecha };
  const inicio = utcDeHoraLocal(fecha, hora);
  const horaFin = String(evento.cronogramaHoraFin || "").trim();
  let fin = HORA.test(horaFin) ? utcDeHoraLocal(fecha, horaFin) : inicio + HORAS_SIN_FIN * 3600 * 1000;
  // Un fin «antes» que el inicio es de madrugada: al día siguiente.
  if (fin <= inicio) fin += 24 * 3600 * 1000;
  return { ...base, todoElDia: false, inicio, fin };
}

const sello = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const soloDia = (fecha) => fecha.replace(/-/g, "");
const diaSiguiente = (fecha) => soloDia(new Date(Date.parse(`${fecha}T00:00:00Z`) + 24 * 3600 * 1000).toISOString().slice(0, 10));
const escapar = (t) => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Las líneas de un .ics, de 60 caracteres como mucho (la norma pide 75
// bytes; con tildes, 60 caracteres caben de sobra).
const plegar = (linea) => {
  const trozos = [];
  for (let i = 0; i < linea.length; i += 60) trozos.push((i ? " " : "") + linea.slice(i, i + 60));
  return trozos.join("\r\n");
};

// El archivo de calendario, con su aviso la víspera.
export function icsDelEvento(cal, ahora = Date.now()) {
  const cuando = cal.todoElDia
    ? [`DTSTART;VALUE=DATE:${soloDia(cal.fecha)}`, `DTEND;VALUE=DATE:${diaSiguiente(cal.fecha)}`]
    : [`DTSTART:${sello(cal.inicio)}`, `DTEND:${sello(cal.fin)}`];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//nexuspoint.rsvp//Las Bodas de todos//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${cal.uid}`,
    `DTSTAMP:${sello(ahora)}`,
    ...cuando,
    `SUMMARY:${escapar(cal.titulo)}`,
    ...(cal.lugar ? [`LOCATION:${escapar(cal.lugar)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapar(`Mañana: ${cal.titulo}`)}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(plegar)
    .join("\r\n")
    .concat("\r\n");
}

// Google Calendar con el evento ya escrito (Android).
export function enlaceGoogleCalendar(cal) {
  const fechas = cal.todoElDia ? `${soloDia(cal.fecha)}/${diaSiguiente(cal.fecha)}` : `${sello(cal.inicio)}/${sello(cal.fin)}`;
  const q = new URLSearchParams({ action: "TEMPLATE", text: cal.titulo, dates: fechas, ...(cal.lugar ? { location: cal.lugar } : {}), ctz: ZONA_EVENTO });
  return `https://calendar.google.com/calendar/render?${q}`;
}
