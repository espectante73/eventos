// Tarjeta de un colaborador en la ventana "Formularios": qué invitados
// tiene asignados y el desplegable para reasignarlos — la mitad que se
// separó de ColaboradorCard.jsx (que se queda solo con "quién es cada
// colaborador": nombre, email, invitación, relevo, eliminar) en el
// reparto del 2026-08-09. Aquí la lista va siempre visible (no
// colapsada): es el único propósito de esta ventana.
import { C, inputStyle } from "../theme";
import { resolverColaborador, datosCompletos } from "../lib/invitados";
import { ordenarPorApellidoNombre } from "../lib/formato";

export function ColaboradorFormularioCard({ c, invitados, colaboradores, onAsignarColaborador }) {
  const asignados = ordenarPorApellidoNombre(
    invitados.filter((g) => resolverColaborador(g, colaboradores)?.id === c.id)
  );

  return (
    <div className="p-3 rounded" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
        {c.nombre}
      </div>
      <div className="mt-2 space-y-1.5">
        {asignados.length === 0 && (
          <p className="text-xs italic" style={{ color: C.charcoal, opacity: 0.6 }}>
            Nadie asignado todavía.
          </p>
        )}
        {asignados.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-2 text-xs">
            <span style={{ color: C.charcoal }}>
              {g.apellido}, {g.nombre}{" "}
              <span style={{ opacity: 0.5 }}>
                ({g.confirmado ? (datosCompletos(g) ? "completo" : "confirmado") : "tentativa"})
              </span>
            </span>
            <select
              value={g.colaboradorId || ""}
              onChange={(e) => onAsignarColaborador(g.id, e.target.value)}
              style={{ ...inputStyle, padding: "2px 4px", fontSize: 11 }}
            >
              <option value="">Sin asignar</option>
              {colaboradores.map((otro) => (
                <option key={otro.id} value={otro.id}>
                  {otro.nombre}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
