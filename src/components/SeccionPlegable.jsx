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
import { C } from "../theme";

export function SeccionPlegable({ icono: Icono, titulo, resumen, children, abiertaPorDefecto = false }) {
  const [abierta, setAbierta] = useState(abiertaPorDefecto);
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <button
        onClick={() => setAbierta((a) => !a)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm min-w-0" style={{ color: C.ink, fontWeight: 600 }}>
          {Icono && <Icono size={15} style={{ color: C.gold, flexShrink: 0 }} />}
          <span className="truncate">{titulo}</span>
        </span>
        <span className="flex items-center gap-2 flex-shrink-0 min-w-0">
          <span className="text-xs truncate" style={{ color: C.charcoal, opacity: 0.7, maxWidth: 180 }}>
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
