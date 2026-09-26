// Bloques básicos de formulario reutilizados por toda la app: título de
// sección (plegable o no), etiqueta+contenido de un campo, y el input de
// texto con el estilo estándar. Movidos fuera de App.jsx en el reparto del
// 2026-08-08 (ver CLAUDE.md).
import { useId } from "react";
import { C, inputStyle } from "../theme";

export function SectionTitle({ icon: Icon, children, onToggle, compacto }) {
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
            ? "boton-3d rounded px-2 flex items-center gap-2 text-xl text-left"
            : "boton-3d rounded px-2 flex items-center gap-2 text-xl mb-4 pb-2 w-full text-left"
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

// Un <div> con nombre, NO un <label>: dentro de un <label> el navegador
// reenvía el toque al primer botón o casilla que haya, así que pulsar
// "Quitar" pulsaba también "Subir" (Invitaciones, 47.3). El nombre sigue
// llegando al lector de pantalla por aria-labelledby.
export function Field({ label, children }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-1 text-sm">
      <span
        id={id}
        className="uppercase tracking-wide text-xs"
        style={{
          // El color va por variable CSS para que una pantalla pueda
          // cambiarlo: el formulario del colaborador va sobre dorado y ahí
          // C.gold no se lee (.formulario-dorado en index.css). Un color
          // escrito aquí dentro gana siempre a cualquier regla de CSS, que
          // es justo lo que pasó al primer intento.
          color: `var(--etiqueta-campo, ${C.gold})`,
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}
