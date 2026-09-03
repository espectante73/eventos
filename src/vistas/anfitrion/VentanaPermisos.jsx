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
// línea. El colaborador se elige con un <select> (uno a la vez, no una
// lista larga con todos a la vista) -- los checkboxes de sus permisos
// quedan siempre visibles debajo, sin ningún desplegable adicional que
// abrir: es justo el <select> el que hace pequeña la ventana, no un
// acordeón por persona (primer intento, descartado por el usuario). El
// checkbox va a la DERECHA de su etiqueta -- mismo criterio "pulgar
// derecho" ya aplicado al resto de la app (botones flotantes, Modo
// Pruebas).
import { useState } from "react";
import { ChevronDown, KeyRound } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { PERMISOS, ETIQUETAS_PERMISOS } from "../../lib/permisos";
import { VentanaFlotante } from "../../components/VentanaFlotante";

// Misma pieza plegable que traía la ventana Logística (retirada el
// 2026-09-05) para este mismo resumen -- se recrea aquí, plegada por
// defecto, a petición del usuario: quiere poder ignorarla de un vistazo
// sin que ocupe sitio, igual que antes.
function SeccionPlegable({ icono: Icono, titulo, resumen, children }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className="rounded-lg overflow-hidden mt-4" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <button
        onClick={() => setAbierta((a) => !a)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm min-w-0" style={{ color: C.ink, fontWeight: 600 }}>
          <Icono size={15} style={{ color: C.gold, flexShrink: 0 }} />
          <span className="truncate">{titulo}</span>
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
            {resumen}
          </span>
          <ChevronDown
            size={15}
            style={{ color: C.gold, transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
          />
        </span>
      </button>
      {abierta && (
        <div className="px-3 pb-3 pt-1 text-xs" style={{ borderTop: `1px solid ${C.line}`, color: C.charcoal }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function VentanaPermisos({ data, onCerrar }) {
  const { colaboradores, persistColaboradores } = data;
  const claves = Object.values(PERMISOS);
  const [seleccionadoId, setSeleccionadoId] = useState(colaboradores[0]?.id ?? null);
  const colaborador = colaboradores.find((c) => c.id === seleccionadoId) || null;
  const permisos = Array.isArray(colaborador?.permisos) ? colaborador.permisos : [];
  const colaboradoresConPermisos = colaboradores.filter((c) => Array.isArray(c.permisos) && c.permisos.length > 0);

  const alternarPermiso = (clave) => {
    persistColaboradores(
      colaboradores.map((c) => {
        if (c.id !== seleccionadoId) return c;
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
        <>
          {/* Etiqueta a la izquierda, <select> a la derecha -- mismo
              criterio "pulgar derecho" que el resto de la app (y que los
              checkboxes de abajo): el control que hay que tocar siempre
              del lado del pulgar, nunca al fondo a la izquierda. */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-sm" style={{ color: C.charcoal, opacity: 0.8 }}>
              Colaborador
            </span>
            <select
              value={seleccionadoId ?? ""}
              onChange={(e) => setSeleccionadoId(e.target.value)}
              style={{ ...inputStyle, height: 42, textAlign: "right", width: "auto" }}
            >
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            {claves.map((clave) => (
              <label key={clave} className="flex items-center justify-between gap-3 text-sm py-0.5" style={{ color: C.charcoal }}>
                <span>{ETIQUETAS_PERMISOS[clave]}</span>
                <input
                  type="checkbox"
                  checked={permisos.includes(clave)}
                  onChange={() => alternarPermiso(clave)}
                  className="flex-shrink-0"
                  style={{ width: 18, height: 18 }}
                />
              </label>
            ))}
          </div>

          {/* Resumen de solo lectura de TODOS los colaboradores con algún
              permiso, no solo el elegido arriba -- venía de la ventana
              "Logística" (retirada el 2026-09-05 por quedarse sin
              utilidad real; esto era lo único de ella que el usuario
              quería conservar, y encaja aquí de forma natural). */}
          {colaboradoresConPermisos.length > 0 && (
            <SeccionPlegable icono={KeyRound} titulo="Permisos concedidos" resumen={`${colaboradoresConPermisos.length} colaborador(es)`}>
              <div className="flex flex-col gap-1.5">
                {colaboradoresConPermisos.map((c) => (
                  <div key={c.id} className="text-sm" style={{ color: C.charcoal }}>
                    <span style={{ fontWeight: 600 }}>{c.nombre}:</span>{" "}
                    {c.permisos.map((p) => ETIQUETAS_PERMISOS[p] || p).join(", ")}
                  </div>
                ))}
              </div>
            </SeccionPlegable>
          )}
        </>
      )}
    </VentanaFlotante>
  );
}
