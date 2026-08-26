// Ventana "Permisos": qué colaborador tiene acceso a qué zona de la app,
// más allá de sus invitados asignados de siempre -- a petición del
// usuario, 2026-08-25, empezando por poder editar el texto de Novedades.
// Diseñada para crecer: cada fila de PERMISOS (lib/permisos.js) se
// convierte sola en una fila de checkbox aquí, sin tocar este fichero al
// añadir una zona nueva.
//
// Rediseño a petición del usuario (misma sesión): una sola columna (no
// varias etiquetas por fila, que obligaba a leer en zigzag), con el
// ancho de la ventana ajustado a la etiqueta más larga ("Enviar
// invitaciones (solo confirmados y pagados)") para que ninguna rompa
// línea. Cada colaborador es un desplegable plegado por defecto (mismo
// criterio de "solo uno abierto a la vez" ya usado en Novedades/tablón),
// para que la ventana entera quepa cómoda en un móvil en vez de mostrar
// de golpe los checkboxes de todos. El checkbox va a la DERECHA de su
// etiqueta -- mismo criterio "pulgar derecho" ya aplicado al resto de la
// app (botones flotantes, Modo Pruebas).
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { C } from "../../theme";
import { PERMISOS, ETIQUETAS_PERMISOS } from "../../lib/permisos";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaPermisos({ data, onCerrar }) {
  const { colaboradores, persistColaboradores } = data;
  const claves = Object.values(PERMISOS);
  const [abiertoId, setAbiertoId] = useState(null);

  const alternarPermiso = (colaboradorId, clave) => {
    persistColaboradores(
      colaboradores.map((c) => {
        if (c.id !== colaboradorId) return c;
        const actuales = Array.isArray(c.permisos) ? c.permisos : [];
        const siguiente = actuales.includes(clave)
          ? actuales.filter((p) => p !== clave)
          : [...actuales, clave];
        return { ...c, permisos: siguiente };
      })
    );
  };

  return (
    <VentanaFlotante
      clave="permisos"
      titulo="Permisos"
      onCerrar={onCerrar}
      ancho="min(420px, calc(100vw - 48px))"
    >
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
        Acceso extra para un colaborador
      </p>
      {colaboradores.length === 0 ? (
        <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
          Todavía no hay ningún colaborador.
        </p>
      ) : (
        <div className="space-y-2">
          {colaboradores.map((c) => {
            const permisos = Array.isArray(c.permisos) ? c.permisos : [];
            const abierto = abiertoId === c.id;
            return (
              <div key={c.id} className="rounded overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                <button
                  onClick={() => setAbiertoId((actual) => (actual === c.id ? null : c.id))}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <span style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>{c.nombre}</span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    {permisos.length > 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: C.ink, color: C.paper }}
                      >
                        {permisos.length}
                      </span>
                    )}
                    <ChevronDown
                      size={16}
                      style={{ color: C.gold, transform: abierto ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </span>
                </button>
                {abierto && (
                  <div className="px-3 pb-3 pt-1 flex flex-col gap-2" style={{ borderTop: `1px solid ${C.line}` }}>
                    {claves.map((clave) => (
                      <label key={clave} className="flex items-center justify-between gap-3 text-sm py-0.5" style={{ color: C.charcoal }}>
                        <span>{ETIQUETAS_PERMISOS[clave]}</span>
                        <input
                          type="checkbox"
                          checked={permisos.includes(clave)}
                          onChange={() => alternarPermiso(c.id, clave)}
                          className="flex-shrink-0"
                          style={{ width: 18, height: 18 }}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </VentanaFlotante>
  );
}
