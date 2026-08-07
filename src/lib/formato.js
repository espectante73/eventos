// Utilidades genéricas de formateo de texto (fecha, listas, precios) — sin
// estado, sin JSX, sin depender de nada más de la app. Movidas fuera de
// App.jsx en el reparto del 2026-08-08 (ver CLAUDE.md).

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
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
