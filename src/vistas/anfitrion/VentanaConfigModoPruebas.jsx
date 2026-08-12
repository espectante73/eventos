// Sub-ventana de Configuración: Modo Pruebas — probar la app con datos
// reales sabiendo que se puede volver todo atrás de un golpe. Activar
// guarda una foto completa de los datos operativos; desactivar la
// restaura entera (reset global de TODO lo hecho mientras estuvo
// activo, no solo lo tocado en esta sesión). Mientras está activo, toda
// la app (para cualquier rol, no solo el anfitrión) se ve con un aviso
// rojo — ver App.jsx. Añadida el 2026-08-12, a petición del usuario.
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { C } from "../../theme";
import { exportarTodo } from "../../lib/backup";
import { descargarJSON } from "../../lib/descargas";
import { Field, TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaConfigModoPruebas({ data, onCerrar }) {
  const {
    evento,
    mesas,
    fotosFamiliares,
    colaboradores,
    invitados,
    activarModoPruebas,
    desactivarModoPruebas,
  } = data;
  const [palabra, setPalabra] = useState("");
  const [ejecutando, setEjecutando] = useState(false);
  // Por defecto todos habilitados -- lo normal es que el propio
  // anfitrión sea quien más prueba, así que "todos pueden seguir
  // actuando" es el punto de partida más cómodo; se desmarca a quien no
  // deba tocar nada real mientras dura la prueba.
  const [habilitados, setHabilitados] = useState(() => new Set(colaboradores.map((c) => c.id)));

  const activo = Boolean(evento.modoPruebasActivo);

  const alternarHabilitado = (id) => {
    setHabilitados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const marcarTodos = () => setHabilitados(new Set(colaboradores.map((c) => c.id)));
  const desmarcarTodos = () => setHabilitados(new Set());

  const activar = async () => {
    const ok = window.confirm(
      "Se guarda una foto completa de los datos actuales del evento. Podrás volver a este " +
        "estado exacto en cualquier momento apagando el Modo Pruebas.\n\n¿Activar Modo Pruebas?"
    );
    if (!ok) return;
    setEjecutando(true);
    await activarModoPruebas(Array.from(habilitados));
    // activarModoPruebas() recarga la página al terminar -- no hace
    // falta poner ejecutando a false, este componente ya no seguirá
    // montado.
  };

  const desactivar = async () => {
    setEjecutando(true);
    // Copia de seguridad del estado ACTUAL (antes de restaurar) además
    // de la foto que ya guarda el propio Modo Pruebas al activarse --
    // por si alguien más (un colaborador real) tocó algo de verdad
    // mientras estaba activo y ese cambio también se va a perder.
    const datosBackup = JSON.parse(exportarTodo({ evento, mesas, fotosFamiliares, colaboradores, invitados }));
    const ok = await desactivarModoPruebas();
    if (ok) {
      descargarJSON(`backup-antes-de-desactivar-modo-pruebas-${Date.now()}.json`, datosBackup);
    } else {
      setEjecutando(false);
    }
  };

  if (activo) {
    return (
      <VentanaFlotante clave="config-modo-pruebas" titulo="Modo pruebas" onCerrar={onCerrar}>
        <div className="p-3 rounded mb-3" style={{ background: "#F0D3C8", border: `1px solid ${C.wax}` }}>
          <p className="text-sm font-semibold mb-1" style={{ color: C.wax }}>
            🧪 Modo Pruebas ACTIVO
          </p>
          <p className="text-xs" style={{ color: C.charcoal }}>
            Toda la app se ve con un aviso rojo mientras tanto (también para tus colaboradores).
            Al desactivarlo se restaura TODO exactamente a como estaba al activarlo — deshace
            cualquier cambio hecho desde entonces, sea de prueba o real (incluido lo que haya
            hecho un colaborador de verdad mientras tanto). Se descarga antes una copia de
            seguridad del estado actual, por si hace falta recuperar algo a mano.
          </p>
        </div>
        <Field label='Escribe "RESTAURAR" para confirmar'>
          <TextInput
            value={palabra}
            onChange={(e) => setPalabra(e.target.value)}
            placeholder="RESTAURAR"
            className="w-full"
          />
        </Field>
        <button
          onClick={desactivar}
          disabled={ejecutando || palabra.trim().toUpperCase() !== "RESTAURAR"}
          className="mt-3 px-4 py-2 rounded text-sm font-semibold"
          style={{
            background: palabra.trim().toUpperCase() === "RESTAURAR" ? C.wax : C.line,
            color: "#fff",
          }}
        >
          {ejecutando ? "Restaurando…" : "Desactivar y restaurar todo"}
        </button>
      </VentanaFlotante>
    );
  }

  return (
    <VentanaFlotante clave="config-modo-pruebas" titulo="Modo pruebas" onCerrar={onCerrar}>
      <div className="flex mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm mb-1" style={{ color: C.charcoal }}>
            Guarda una foto de todo ahora mismo; al desactivarlo, vuelve a ella entera.
          </p>
          <p className="text-xs" style={{ color: C.wax }}>
            ⚠ Los cambios reales de tus colaboradores mientras tanto también se perderán.
          </p>
        </div>
        {colaboradores.length > 0 && (
          <>
            <div className="w-px my-1 self-stretch" style={{ background: C.line, opacity: 0.3 }} />
            <div className="flex-1 min-w-0 pl-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs" style={{ color: C.line }}>
                  Colaboradores habilitados durante la prueba:
                </p>
                <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <button
                    type="button"
                    onClick={marcarTodos}
                    className="underline"
                    style={{ color: C.wax }}
                  >
                    Todos
                  </button>
                  <span style={{ color: C.line }}>/</span>
                  <button
                    type="button"
                    onClick={desmarcarTodos}
                    className="underline"
                    style={{ color: C.wax }}
                  >
                    Ninguno
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {colaboradores.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center justify-end gap-2 text-sm py-0.5"
                    style={{ color: C.charcoal }}
                  >
                    {c.nombre}
                    <input
                      type="checkbox"
                      checked={habilitados.has(c.id)}
                      onChange={() => alternarHabilitado(c.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end">
        <button
          onClick={activar}
          disabled={ejecutando}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold"
          style={{ background: C.wax, color: "#fff" }}
        >
          <FlaskConical size={16} /> Activar Modo Pruebas
        </button>
      </div>
    </VentanaFlotante>
  );
}
