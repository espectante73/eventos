// Panel "Revisión" de la Lista de invitados (2026-09-04).
//
// Plegado por defecto: cuando no hay nada raro, es una línea verde que
// dice que todo cuadra. Al abrirlo, cada hallazgo trae sus nombres, y
// tocar un nombre lo BUSCA en la propia lista -- el informe señala, la
// lista es donde se corrige (ver CLAUDE.md, "La Lista de invitados es
// la raíz").
import { useState } from "react";
import { ChevronDown, AlertTriangle, CircleCheck, Clock } from "lucide-react";
import { C } from "../theme";

export function InformeInvitados({ hallazgos, onBuscar, onCerrar }) {
  // Nace ABIERTO: se llega hasta aquí desde "Acciones" → Revisión, así
  // que quien lo abre quiere verlo ya, no volver a desplegarlo.
  const [abierto, setAbierto] = useState(true);
  const errores = hallazgos.filter((h) => h.tipo === "error");
  const pendientes = hallazgos.filter((h) => h.tipo === "pendiente");
  const todoBien = hallazgos.length === 0;

  const resumen = todoBien
    ? "Todo cuadra"
    : [
        errores.length ? `${errores.length} ${errores.length === 1 ? "incoherencia" : "incoherencias"}` : null,
        pendientes.length ? `${pendientes.length} pendiente${pendientes.length === 1 ? "" : "s"}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <div
      className="rounded mb-3"
      style={{ border: `1px solid ${errores.length ? C.peligro : C.line}`, background: "#fff" }}
    >
      <button
        onClick={() => setAbierto((a) => !a)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm"
        style={{ color: C.charcoal }}
      >
        {todoBien ? (
          <CircleCheck size={16} style={{ color: C.ink, flexShrink: 0 }} />
        ) : (
          <AlertTriangle size={16} style={{ color: errores.length ? C.peligro : C.gold, flexShrink: 0 }} />
        )}
        <span style={{ fontWeight: 600 }}>Revisión</span>
        <span style={{ opacity: 0.75 }}>{resumen}</span>
        <ChevronDown
          size={16}
          className="ml-auto"
          style={{ transform: abierto ? "rotate(180deg)" : "none", transition: "transform .15s ease", flexShrink: 0 }}
        />
      </button>

      {abierto && todoBien && (
        <p className="px-3 pb-3 text-sm" style={{ color: C.charcoal, opacity: 0.7 }}>
          No hay incoherencias ni nada pendiente en la lista.{" "}
          <button onClick={onCerrar} style={{ textDecoration: "underline" }}>
            Cerrar
          </button>
        </p>
      )}

      {abierto && !todoBien && (
        <div className="px-3 pb-3 space-y-2">
          {[...errores, ...pendientes].map((h) => (
            <div
              key={h.clave}
              className="rounded px-3 py-2"
              style={{
                background: h.tipo === "error" ? C.avisoFondo : C.paperDark,
                border: `1px solid ${h.tipo === "error" ? C.peligro : C.line}`,
              }}
            >
              <div className="flex items-center gap-2 text-sm">
                {h.tipo === "error" ? (
                  <AlertTriangle size={14} style={{ color: C.peligro, flexShrink: 0 }} />
                ) : (
                  <Clock size={14} style={{ color: C.charcoal, opacity: 0.6, flexShrink: 0 }} />
                )}
                <span style={{ fontWeight: 600, color: h.tipo === "error" ? C.peligro : C.charcoal }}>
                  {h.titulo}
                </span>
                <span
                  className="rounded px-1.5"
                  style={{
                    background: h.tipo === "error" ? C.peligro : C.ink,
                    color: "#fff",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                  }}
                >
                  {h.personas.length}
                </span>
              </div>
              {h.ayuda && (
                <p className="text-xs mt-1" style={{ color: C.charcoal, opacity: 0.75 }}>
                  {h.ayuda}
                </p>
              )}
              {/* Los nombres, para ir uno a uno. Se cortan a 12: con más
                  de eso no es un repaso, es la lista entera -- y para
                  eso están los filtros de la propia tabla. */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {h.personas.slice(0, 12).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onBuscar(g)}
                    className="text-xs rounded px-1.5 py-0.5"
                    style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.charcoal }}
                    title="Buscarlo en la lista"
                  >
                    {g.apellido}, {g.nombre}
                  </button>
                ))}
                {h.personas.length > 12 && (
                  <span className="text-xs self-center" style={{ color: C.charcoal, opacity: 0.6 }}>
                    y {h.personas.length - 12} más
                  </span>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={onCerrar}
            className="text-xs rounded px-2 py-1"
            style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
          >
            Cerrar la revisión
          </button>
        </div>
      )}
    </div>
  );
}
