// Botón "Ver versiones anteriores" para los textos largos con historial
// de guardado (cuerpo de Novedades, plantillas de email) -- a petición
// del usuario, 2026-08-29, junto con el "Deshacer" en vivo
// (lib/useDeshacer.js). Cubre el caso que ese hook NO cubre: "ya
// guardé mal y cerré la ventana" -- lee las últimas versiones
// guardadas en servidor (`anfitrion_listar_historial_texto`, últimas
// 10 por campo, ver schema.sql) y deja restaurar cualquiera de ellas.
//
// Solo para el anfitrión (ver `soloTexto` en VentanaNovedades.jsx): un
// colaborador con permiso de solo-texto no ve este botón -- mantiene
// el mismo criterio ya establecido ahí (edita el texto, no gestiona
// nada más).
import { useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { C } from "../theme";
import { formatearFecha } from "../lib/formato";

// Quita las etiquetas HTML sencillas (<b>/<i>/<u>) para la vista previa
// de cada versión -- aquí solo hace falta un resumen legible, no el
// HTML en sí (que sigue intacto en "valorAnterior" al restaurar).
function textoPlano(html) {
  return (html || "").replace(/<[^>]+>/g, "").trim();
}

export function BotonHistorial({ obtenerHistorial, onRestaurar }) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  // null = todavía no se ha pedido -- se carga la primera vez que se
  // abre, no de entrada (evita una llamada de más por cada texto largo
  // de la pantalla, la mayoría nunca se llegan a abrir).
  const [versiones, setVersiones] = useState(null);

  const alternar = async () => {
    if (abierto) {
      setAbierto(false);
      return;
    }
    setAbierto(true);
    if (versiones === null) {
      setCargando(true);
      const filas = await obtenerHistorial();
      setVersiones(filas || []);
      setCargando(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        title="Ver versiones anteriores guardadas"
        onMouseDown={(e) => e.preventDefault()}
        onClick={alternar}
        className="p-1.5 rounded"
        style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
      >
        <History size={13} />
      </button>
      {abierto && (
        <div
          className="absolute z-10 mt-1 rounded shadow-lg"
          style={{ background: "#fff", border: `1px solid ${C.line}`, width: 260, right: 0 }}
        >
          {cargando && (
            <p className="text-xs p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
              Cargando…
            </p>
          )}
          {!cargando && versiones && versiones.length === 0 && (
            <p className="text-xs p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía no hay versiones anteriores guardadas.
            </p>
          )}
          {!cargando &&
            versiones &&
            versiones.map((v) => (
              <div key={v.id} className="flex items-start gap-2 p-2 text-xs" style={{ borderTop: `1px solid ${C.line}` }}>
                <div className="flex-1 min-w-0">
                  <div style={{ color: C.charcoal, opacity: 0.5 }}>
                    {formatearFecha(String(v.guardadoEn).slice(0, 10))} {String(v.guardadoEn).slice(11, 16)}
                  </div>
                  <div className="truncate" style={{ color: C.charcoal }}>
                    {textoPlano(v.valorAnterior).slice(0, 60) || "(vacío)"}
                  </div>
                </div>
                <button
                  type="button"
                  title="Restaurar esta versión"
                  onClick={() => {
                    onRestaurar(v.valorAnterior);
                    setAbierto(false);
                  }}
                  className="p-1 rounded flex-shrink-0"
                  style={{ border: `1px solid ${C.line}`, color: C.ink }}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
