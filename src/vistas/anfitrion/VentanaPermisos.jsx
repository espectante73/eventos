// Ventana "Permisos": qué colaborador tiene acceso a qué zona de la app,
// más allá de sus invitados asignados de siempre -- a petición del
// usuario, 2026-08-25, empezando por poder editar el texto de Novedades.
// Diseñada para crecer: cada fila de PERMISOS (lib/permisos.js) se
// convierte sola en una columna de checkboxes aquí, sin tocar este
// fichero al añadir una zona nueva.
import { C } from "../../theme";
import { PERMISOS, ETIQUETAS_PERMISOS } from "../../lib/permisos";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaPermisos({ data, onCerrar }) {
  const { colaboradores, persistColaboradores } = data;
  const claves = Object.values(PERMISOS);

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
    <VentanaFlotante clave="permisos" titulo="Permisos" onCerrar={onCerrar}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
        Acceso extra para un colaborador, más allá de sus invitados asignados de siempre.
        Sigue entrando con su mismo login — esto solo destapa controles nuevos para él.
      </p>
      {colaboradores.length === 0 ? (
        <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
          Todavía no hay ningún colaborador.
        </p>
      ) : (
        <div className="space-y-2">
          {colaboradores.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded"
              style={{ background: "#fff", border: `1px solid ${C.line}` }}
            >
              <div className="mb-1.5" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                {c.nombre}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {claves.map((clave) => (
                  <label
                    key={clave}
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: C.charcoal, opacity: 0.85 }}
                  >
                    <input
                      type="checkbox"
                      checked={Array.isArray(c.permisos) && c.permisos.includes(clave)}
                      onChange={() => alternarPermiso(c.id, clave)}
                    />
                    {ETIQUETAS_PERMISOS[clave]}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </VentanaFlotante>
  );
}
