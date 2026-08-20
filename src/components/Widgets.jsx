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

// `pequeno` + `dorado`: variante más compacta (menos padding/letra más
// chica, sin la rotación) y con los mismos colores que los botones de la
// app (fondo verde C.ink + letra dorada C.goldClaro, como
// .boton-verde-solido en index.css) en vez del sello de contorno de
// siempre -- solo para la lista de Invitados (Confirmado/Pagado), a
// petición del usuario, 2026-08-18: "el sello confirmado en esta lista es
// muy grande, mejor más pequeño y ponle los colores como los botones".
// Sin estos props, se comporta exactamente igual que antes (Versiones,
// VistaColaborador).
export function Stamp({ children, color = C.ink, pequeno, dorado }) {
  if (dorado) {
    return (
      <span
        className={`inline-block rounded font-semibold uppercase ${
          pequeno ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
        }`}
        style={{
          background: C.ink,
          color: C.goldClaro,
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: "0.04em",
          // Inclinación del sello original (-2deg) + 2deg más, a
          // petición del usuario, 2026-08-20.
          transform: "rotate(-4deg)",
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`inline-block tracking-widest uppercase font-semibold ${
        pequeno ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      }`}
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
// navegador). Usada por VentanaProgreso (por colaborador y en el
// recuadro general) y VistaColaborador (su propio progreso) — movida
// aquí al pasar a usarla 2 sitios, 2026-08-12.
// `claro`: variante para fondos oscuros (mismo criterio que InfoItem en
// Portada.jsx) -- el porcentaje pasa a texto claro en vez de C.charcoal.
export function BarraCompacta({ icono: Icono, completado, total, color, claro }) {
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
          color: claro ? "rgba(255,255,255,0.9)" : C.charcoal,
          opacity: claro ? 1 : 0.7,
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

// `claro`: variante para usar sobre fondo oscuro (la barra verde de
// cabecera de una VentanaFlotante, vía `subtitulo`) -- mismo patrón que
// `claro` en BarraCompacta (VentanaProgreso.jsx). Sin él, se comporta
// exactamente igual que antes (fondos claros: la tabla de Invitados y
// Avisos). A petición del usuario, 2026-08-18.
// `sinDivisor`: quita la línea vertical entre columnas -- se usa cuando
// el propio llamador ya diferencia cada columna con su recuadro/sombra
// (ver `tintaColumnaCabecera` en SeccionInvitados.jsx), a petición del
// usuario, 2026-08-20. Sin este prop, se comporta igual que antes.
export function EncabezadoOrdenable({ columna, orden, onClick, children, claro, sinDivisor }) {
  const activo = orden.columna === columna;
  return (
    <button
      onClick={() => onClick(columna)}
      className="flex items-center justify-center gap-1 w-full"
      style={{
        borderRight: sinDivisor ? "none" : `1px solid ${claro ? "rgba(255,255,255,0.25)" : C.line}`,
        // En la variante `claro` (barra verde de Invitados), TODAS las
        // columnas van del mismo dorado -- antes la columna activa
        // (Invitado, al ser el orden por defecto) se veía en un color
        // distinto (C.paper) al resto, a petición del usuario,
        // 2026-08-20. La flecha (▲/▼ vs ⇅) ya distingue cuál está
        // activa, no hace falta además un color distinto. La variante
        // normal (fondo claro, p.ej. Avisos) no cambia.
        color: claro ? C.goldClaro : activo ? C.ink : C.gold,
        // `minWidth: 0`: sin esto, un <button> dentro de una celda de
        // CSS grid NUNCA se encoge por debajo del ancho de su propio
        // contenido (min-width:auto es el valor por defecto en un
        // grid item) -- así que si el texto de una columna es más
        // ancho que la fracción `fr` que le toca, el navegador ensancha
        // la columna entera para hacerle sitio, y esa anchura real
        // ganada deja de coincidir con la de la MISMA columna en otra
        // fila con menos texto (p.ej. la cabecera vs. un filtro vs. una
        // fila de datos, cada una con contenido distinto). Forzarlo a 0
        // es el arreglo estándar de CSS Grid para que las columnas
        // respeten de verdad su `fr` en vez del contenido -- a
        // petición del usuario, 2026-08-19 (la pregunta del millón: el
        // ancho de cada columna tiene que salir del `fr`, no del texto
        // que le toque en cada fila).
        minWidth: 0,
      }}
    >
      {children}
      <span style={{ fontSize: 10 }}>
        {/* En la variante `claro` (barra verde de Invitados), todas las
            columnas usan el mismo tipo de flecha que ya llevaba
            Invitado (▲/▼ de un solo sentido) en vez de mezclar con la
            ⇅ de doble sentido para las que no están activas -- a
            petición del usuario, 2026-08-20. La variante normal (fondo
            claro, Avisos) no cambia. */}
        {claro
          ? activo && orden.direccion === "desc"
            ? "▼"
            : "▲"
          : activo
          ? orden.direccion === "asc"
            ? "▲"
            : "▼"
          : "⇅"}
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
      style={{ ...inputStyle, padding: "3px 5px", fontSize: 12, width: "100%", minWidth: 0 }}
    />
  );
}
