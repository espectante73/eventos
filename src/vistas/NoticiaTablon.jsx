// Las piezas de una noticia del tablón (v84, él: la vista previa tenía otros
// colores). Las usan el tablón y la vista previa de Novedades, para que se
// vean siempre igual.
import { ChevronDown } from "lucide-react";
import { C, OP } from "../theme";
import { ZonasTablon } from "./ZonasTablon";

export function TarjetaNoticia({ children }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: C.blanco, border: `1px solid ${C.line}` }}>
      {children}
    </div>
  );
}

// El título se queda con toda la línea y la etiqueta va a la derecha: con la
// letra del móvil aumentada, el título salía cortado (2026-09-14). La regla
// de «una sola línea por fila» es para las tablas, no para esto.
export function CabeceraNoticia({ titulo, esNovedad, abierta }) {
  return (
    <>
      <span className="min-w-0 flex-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600, lineHeight: 1.3 }}>
        {titulo || "(sin título)"}
      </span>
      <span className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap font-medium"
          style={esNovedad ? { background: C.ink, color: C.paper } : { border: `1px solid ${C.line}`, color: C.charcoal, opacity: OP.secundario }}
        >
          {esNovedad ? "NOVEDADES" : "FAQ"}
        </span>
        <ChevronDown size={16} style={{ color: C.gold, transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </span>
    </>
  );
}

export function CuerpoZonas({ datos }) {
  return (
    <div className="px-4 pt-3 pb-4" style={{ borderTop: `1px solid ${C.line}` }}>
      <ZonasTablon datos={datos} />
    </div>
  );
}
