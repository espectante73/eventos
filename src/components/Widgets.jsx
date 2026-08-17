// Piezas pequeñas de presentación, reutilizadas en varias vistas: sello con
// número (Seal), etiqueta tipo "sello de cera" (Stamp), barra de progreso,
// cabecera de columna ordenable, y el input de grupo familiar (con
// confirmación al perder el foco). Movidas fuera de App.jsx en el reparto
// del 2026-08-08 (ver CLAUDE.md).
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { C, inputStyle } from "../theme";

// "Icono de usuario sólido" (relleno) para distinguir al Anfitrión de
// cada colaborador (icono de contorno normal, el mismo User sin
// relleno) en los menús de cambio de vista — a petición del usuario,
// 2026-08-12. Mismo glifo para los dos, solo cambia el relleno.
export function UserSolido(props) {
  return <User fill="currentColor" {...props} />;
}

export function Seal({ count, size = 22 }) {
  if (!count) return null;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{
        background: C.wax,
        color: C.paper,
        width: size,
        height: size,
        fontSize: size > 22 ? 13 : 12,
        fontFamily: "'IBM Plex Mono', monospace",
        boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
      }}
    >
      {count}
    </span>
  );
}

export function Stamp({ children, color = C.ink }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-xs tracking-widest uppercase font-semibold"
      style={{
        color,
        border: `1.5px solid ${color}`,
        borderRadius: 3,
        transform: "rotate(-2deg)",
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
}

// `icono` (opcional): sustituye el texto de `label` por un icono, para las
// barras que ya tienen su equivalente en icono en otro sitio de la app
// (p.ej. los recuadros de colaborador) — más intuitivo que repetir el
// mismo texto en dos formatos distintos. Si no se pasa, se comporta
// exactamente igual que antes (label en texto).
export function ProgresoBar({ label, icono: Icono, completado, total, color }) {
  const pct = total > 0 ? Math.round((completado / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div
        className="flex justify-between items-center text-xs mb-1"
        style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.charcoal }}
      >
        {Icono ? (
          <span title={label} style={{ display: "flex" }}>
            <Icono size={14} style={{ color: color || C.ink }} />
          </span>
        ) : (
          <span>{label}</span>
        )}
        <span>
          {completado}/{total} · {pct}%
        </span>
      </div>
      <div style={{ background: C.paperDark, borderRadius: 4, height: 10, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            background: color || C.ink,
            height: "100%",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

// Icono + barra fina en una sola línea, sin etiqueta de texto (el icono
// hace de etiqueta, el color distingue de qué barra se trata) — pensada
// para caber varias seguidas con un margen mínimo. El detalle exacto
// (n/total y %) sigue disponible al pasar el ratón o tocar (title del
// navegador). Usada por VentanaProgreso (por colaborador) y
// VistaColaborador (su propio progreso) — movida aquí al pasar a
// usarla 2 sitios, 2026-08-12.
export function BarraCompacta({ icono: Icono, completado, total, color }) {
  const pct = total > 0 ? Math.round((completado / total) * 100) : 0;
  return (
    <div
      className="flex items-center gap-1.5 mb-1"
      title={`${completado}/${total} · ${pct}%`}
    >
      <Icono size={14} style={{ color, flexShrink: 0 }} />
      <div style={{ flex: 1, background: C.paperDark, borderRadius: 3, height: 7, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", transition: "width 0.3s ease" }} />
      </div>
      <span
        style={{
          fontSize: 10,
          color: C.charcoal,
          opacity: 0.7,
          fontFamily: "'IBM Plex Mono', monospace",
          minWidth: 30,
          textAlign: "right",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

export function EncabezadoOrdenable({ columna, orden, onClick, children }) {
  const activo = orden.columna === columna;
  return (
    <button
      onClick={() => onClick(columna)}
      className="flex items-center justify-center gap-1 w-full"
      style={{ borderRight: `1px solid ${C.line}`, color: activo ? C.ink : C.gold }}
    >
      {children}
      <span style={{ fontSize: 10 }}>
        {activo ? (orden.direccion === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </button>
  );
}

export function GrupoFamiliarInput({ value, onCommit }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onCommit(v)}
      style={{ ...inputStyle, padding: "3px 5px", fontSize: 12, width: "100%" }}
    />
  );
}
