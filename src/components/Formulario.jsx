// Bloques básicos de formulario reutilizados por toda la app: título de
// sección (plegable o no), etiqueta+contenido de un campo, y el input de
// texto con el estilo estándar. Movidos fuera de App.jsx en el reparto del
// 2026-08-08 (ver CLAUDE.md).
import { C, inputStyle } from "../theme";

export function SectionTitle({ icon: Icon, children, onToggle, abierto, compacto }) {
  const plegable = typeof onToggle === "function";
  const contenido = (
    <>
      {Icon && <Icon size={18} strokeWidth={2} />}
      {children}
    </>
  );
  const estilo = {
    fontFamily: "'Fraunces', serif",
    color: C.ink,
    fontWeight: 600,
    ...(compacto ? {} : { borderBottom: `1.5px solid ${C.line}` }),
  };
  if (plegable) {
    return (
      <button
        onClick={onToggle}
        className={
          compacto
            ? "flex items-center gap-2 text-xl text-left"
            : "flex items-center gap-2 text-xl mb-4 pb-2 w-full text-left"
        }
        style={estilo}
      >
        {contenido}
      </button>
    );
  }
  return (
    <h2 className="flex items-center gap-2 text-xl mb-4 pb-2" style={estilo}>
      {contenido}
    </h2>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span
        className="uppercase tracking-wide text-xs"
        style={{
          color: C.gold,
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}
