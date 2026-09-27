// Sección plegable reutilizable: título + resumen corto SIEMPRE visibles,
// el detalle solo al desplegar. Plegada por defecto.
//
// Nació dentro de la ventana "Logística" (retirada el 2026-09-05) y se
// saca aquí porque es el patrón que el usuario quiere por defecto en
// toda la app: "la idea general es plegado por defecto, quitar espacio
// en las ventanas". El `resumen` es lo que hace que plegar no esconda
// información -- de un vistazo se ve el estado sin abrir nada.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { C, OP } from "../theme";

// `abierta` + `onAlternar`: modo CONTROLADO, para cuando quien la usa
// necesita que solo haya una sección abierta a la vez (VistaColaborador,
// 2026-09-17). Sin esos dos props se comporta como siempre, con su propio
// estado.
export function SeccionPlegable({
  icono: Icono,
  titulo,
  resumen,
  children,
  abiertaPorDefecto = false,
  abierta: abiertaControlada,
  onAlternar,
  // `sencilla`: SOLO el rótulo de siempre y una flecha, sin tarjeta, sin
  // fondo y sin relieve (él, v52.1: "yo solo te pedí una flecha"). Para los
  // apartados del formulario del colaborador, que ya van sobre su dorado.
  sencilla = false,
}) {
  const [abiertaPropia, setAbiertaPropia] = useState(abiertaPorDefecto);
  const controlada = abiertaControlada !== undefined;
  const abierta = controlada ? abiertaControlada : abiertaPropia;
  const setAbierta = controlada ? () => onAlternar?.() : setAbiertaPropia;
  if (sencilla) {
    // El mismo rótulo que ya llevaban los campos del formulario (Field):
    // mayúsculas pequeñas y su color. La flecha, del mismo color, al lado.
    const rotulo = { color: `var(--etiqueta-campo, ${C.gold})`, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em" };
    return (
      <div>
        {/* Toda la línea se toca, con alto de dedo; la flecha, grande y
            gruesa, en el borde del lado del pulgar (norma 3; él, v52.1:
            "resalta más la flecha para un pulgar"). */}
        <button
          onClick={() => setAbierta((a) => !a)}
          className="w-full flex items-center gap-1.5 text-left py-2"
          style={{ background: "none", border: "none", paddingLeft: 0, paddingRight: 0, minHeight: 40 }}
          aria-expanded={abierta}
        >
          <span className="uppercase text-xs whitespace-nowrap" style={rotulo}>
            {titulo}
          </span>
          {resumen && (
            <span className="text-xs truncate min-w-0" style={{ color: C.charcoal, opacity: OP.secundario }}>
              {resumen}
            </span>
          )}
          <ChevronDown
            size={22}
            strokeWidth={2.75}
            className="ml-auto zurdo:ml-0 zurdo:order-first"
            style={{ ...rotulo, flexShrink: 0, transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
          />
        </button>
        {abierta && <div className="pt-1">{children}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <button
        onClick={() => setAbierta((a) => !a)}
        className="boton-3d w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm min-w-0" style={{ color: C.ink, fontWeight: 600 }}>
          {Icono && <Icono size={15} style={{ color: C.gold, flexShrink: 0 }} />}
          <span className="truncate">{titulo}</span>
        </span>
        <span className="flex items-center gap-2 flex-shrink-0 min-w-0">
          <span className="text-xs truncate" style={{ color: C.charcoal, opacity: OP.secundario, maxWidth: 180 }}>
            {resumen}
          </span>
          <ChevronDown
            size={15}
            style={{ color: C.gold, transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
          />
        </span>
      </button>
      {abierta && (
        <div className="px-3 pb-3 pt-1" style={{ borderTop: `1px solid ${C.line}`, color: C.charcoal }}>
          {children}
        </div>
      )}
    </div>
  );
}
