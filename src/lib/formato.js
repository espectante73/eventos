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
export function diasHasta(fechaISO) {
  if (!fechaISO) return null;
  const partes = fechaISO.split("-").map((p) => parseInt(p, 10));
  if (partes.length !== 3 || partes.some((p) => isNaN(p))) return null;
  const [anio, mes, dia] = partes;
  const objetivo = Date.UTC(anio, mes - 1, dia);
  const hoy = new Date();
  const hoyUTC = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  return Math.round((objetivo - hoyUTC) / 86400000);
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
