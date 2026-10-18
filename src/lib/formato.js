// Utilidades genéricas de formateo de texto (fecha, listas, precios) — sin
// estado, sin JSX, sin depender de nada más de la app. Movidas fuera de
// App.jsx en el reparto del 2026-08-08 (ver CLAUDE.md).

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const DIAS_ES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

// Lo que se lee en la fila "Fecha" cuando todavía no hay día cerrado.
// A petición del usuario (2026-09-21): su boda aún no tiene fecha y un
// "—" no explica nada; los invitados confirmados ya saben que está por
// cerrar y la app tiene que decirlo igual de claro.
export const TEXTO_SIN_FECHA = "No hay fecha confirmada";

// UNA sola definición de "qué pone en la fila Fecha", para la Portada, el
// tablón público y cualquier sitio que venga después. Si cada pantalla lo
// resolviera por su cuenta, acabarían diciendo cosas distintas -- que es
// exactamente lo que pasó con los rojos y con los tamaños de letra.
export function valorFechaEvento(evento) {
  if (evento?.fechaSinConfirmar) return TEXTO_SIN_FECHA;
  if (!evento?.fecha) return "—";
  return [formatearDiaSemana(evento.fecha), formatearFecha(evento.fecha)];
}

// La dirección, como la escribe la Portada y el tablón: en dos líneas,
// partida en la primera coma ("calle" / "ciudad, provincia"); sin coma, en
// una. Una sola pieza: el tablón se había quedado sin ella (v69.3).
export function valorDireccion(direccion) {
  const texto = String(direccion || "").trim();
  const i = texto.indexOf(",");
  return i === -1 ? texto : [texto.slice(0, i).trim(), texto.slice(i + 1).trim()];
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return "";
  const partes = fechaISO.split("-");
  if (partes.length !== 3) return fechaISO;
  const [anio, mes, dia] = partes;
  const mesIndice = parseInt(mes, 10) - 1;
  if (mesIndice < 0 || mesIndice > 11 || isNaN(parseInt(dia, 10))) return fechaISO;
  return `${parseInt(dia, 10)} ${MESES_ES[mesIndice]} ${anio}`;
}

// Día de la semana en español, calculado en UTC a propósito: "fechaISO" es
// solo YYYY-MM-DD (sin hora), y construir la fecha en la zona horaria
// local podría desplazarla al día anterior/siguiente según dónde se abra
// la app — usando Date.UTC para construir y getUTCDay() para leer, el
// resultado no depende de la zona horaria de quien mira la pantalla.
// "17 oct", corto para caber en una línea (los plazos de pago).
export function fechaCorta(iso) {
  const [a, m, d] = String(iso || "").split("-").map(Number);
  if (!a) return "";
  return new Date(a, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
}

// "22:47", la hora de un momento guardado (las fotos de la fiesta), en la
// hora de quien mira.
export function horaCorta(momento) {
  const d = new Date(momento);
  if (!momento || Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export function formatearDiaSemana(fechaISO) {
  if (!fechaISO) return "";
  const partes = fechaISO.split("-").map((p) => parseInt(p, 10));
  if (partes.length !== 3 || partes.some((p) => isNaN(p))) return "";
  const [anio, mes, dia] = partes;
  return DIAS_ES[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()];
}

// Días que faltan hasta `fechaISO` (negativo si ya pasó) -- mismo cálculo
// en UTC que formatearDiaSemana, por el mismo motivo: comparar en hora
// local podría restar o sumar un día de más según dónde se abra la app.
// "Hoy" se trunca también a medianoche UTC, así el día del evento en
// curso da 0, no una fracción.
export function diasHasta(fechaISO, hoy = new Date()) {
  if (!fechaISO) return null;
  const partes = fechaISO.split("-").map((p) => parseInt(p, 10));
  if (partes.length !== 3 || partes.some((p) => isNaN(p))) return null;
  const [anio, mes, dia] = partes;
  const objetivo = Date.UTC(anio, mes - 1, dia);
  const hoyUTC = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  return Math.round((objetivo - hoyUTC) / 86400000);
}

// Los años de un desplegable, del más reciente al más antiguo (sin teclado,
// él, v68.2): el rango que se le pase (los de la lista) o los últimos 100.
export function opcionesAnios(anios, hoy = new Date().getFullYear()) {
  const hasta = anios?.hasta || hoy;
  const desde = anios?.desde || hoy - 100;
  return Array.from({ length: hasta - desde + 1 }, (_, i) => hasta - i);
}

// La cuenta atrás del tablón (él, v69.1): cuántos días faltan, para que
// se vea grande cada vez que se abre. Solo con la fecha confirmada (contar
// hacia una provisional sería mentir); el mismo día, «¡Es hoy!»; después
// del evento, nada.
export function cuentaAtrasEvento(evento, hoy = new Date()) {
  if (!evento || evento.fechaSinConfirmar || evento.tablonOcultarFecha) return null;
  const dias = diasHasta(evento.fecha, hoy);
  if (dias === null || dias < 0) return null;
  if (dias === 0) return { hoy: true, arriba: "", numero: "¡Es hoy!", abajo: "" };
  return { hoy: false, arriba: dias === 1 ? "Falta" : "Faltan", numero: String(dias), abajo: dias === 1 ? "día" : "días" };
}

// Cómo se nombra a una persona en TODA la app: "Apellido, Nombre".
//
// No es una preferencia de estilo: es cómo se busca a alguien aquí. Él,
// 2026-09-24: "los localizo por apellido, es la filosofía de la app", y
// venía "desde su origen primitivo" -- la lista, el buscador, el
// formulario y los desplegables ya lo hacían; lo que se salía eran los
// avisos y las preguntas de confirmación, que decían "Jacob Barrios".
// En un solo sitio para que no vuelva a derivar.
export function nombreCompleto(persona) {
  const apellido = String(persona?.apellido || "").trim();
  const nombre = String(persona?.nombre || "").trim();
  if (!apellido) return nombre;
  if (!nombre) return apellido;
  return `${apellido}, ${nombre}`;
}

export function ordenarPorApellidoNombre(lista) {
  return lista
    .slice()
    .sort(
      (a, b) =>
        (a.apellido || "").localeCompare(b.apellido || "") ||
        (a.nombre || "").localeCompare(b.nombre || "")
    );
}

// Un importe, escrito igual en toda la app (él, v61.4): como en España,
// "47 €", y con coma solo si hay céntimos: "47,50 €". Acepta lo que se
// escribe a mano ("47,5").
export function euros(n) {
  const valor = typeof n === "number" ? n : parsePrecio(n);
  const conCentimos = Math.round(valor * 100) % 100 !== 0;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: conCentimos ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(valor || 0);
}

export function parsePrecio(valor) {
  if (!valor) return 0;
  const limpio = String(valor)
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
}

// "Ana, Pedro y Luis" — coma entre todos salvo el último, que lleva "y".
export function listaConY(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}
