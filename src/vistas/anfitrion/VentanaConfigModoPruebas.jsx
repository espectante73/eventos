// Sub-ventana de Configuración: Modo Pruebas — probar la app con datos
// reales sabiendo que se puede volver todo atrás de un golpe. Activar
// guarda una foto completa de los datos operativos; desactivar la
// restaura entera (reset global de TODO lo hecho mientras estuvo
// activo, no solo lo tocado en esta sesión). Mientras está activo, toda
// la app (para cualquier rol, no solo el anfitrión) se ve con un aviso
// rojo — ver App.jsx. Añadida el 2026-08-12, a petición del usuario.
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { C, OP } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";

export function VentanaConfigModoPruebas({ data, onCerrar }) {
  const {
    evento,
    colaboradores,
    activarModoPruebas,
    desactivarModoPruebas,
    guardarFotoDeshacer,
  } = data;
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

  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();

  const pedirActivar = () =>
    preguntar({
      titulo: "¿Activar Modo Pruebas?",
      texto: "Se guarda una foto completa de los datos actuales del evento. Podrás volver a este estado exacto en cualquier momento apagando el Modo Pruebas.",
      rotulo: "Sí, activar",
      peligro: false,
      alConfirmar: activar,
    });

  const pedirDesactivar = () =>
    preguntar({
      titulo: "¿Desactivar y restaurar todo?",
      texto: "Se restaura TODO exactamente a como estaba al activar el Modo Pruebas — se deshace cualquier cambio hecho desde entonces, sea de prueba o real.",
      rotulo: "Sí, restaurar",
      alConfirmar: desactivar,
    });

  const activar = async () => {
    setEjecutando(true);
    await activarModoPruebas(Array.from(habilitados));
    // activarModoPruebas() recarga la página al terminar -- no hace
    // falta poner ejecutando a false, este componente ya no seguirá
    // montado.
  };

  const desactivar = async () => {
    setEjecutando(true);
    // La foto del estado ACTUAL se guarda en el servidor antes de
    // restaurar: si un colaborador tocó algo de verdad mientras el Modo
    // Pruebas estaba activo, ese cambio se puede recuperar con "Deshacer".
    // Antes se descargaba un JSON que no se podía volver a subir.
    const guardada = await guardarFotoDeshacer("Salida del Modo Pruebas");
    if (!guardada) {
      setEjecutando(false);
      return;
    }
    const restaurado = await desactivarModoPruebas();
    if (!restaurado) setEjecutando(false);
  };

  if (activo) {
    return (
      <VentanaFlotante clave="config-modo-pruebas" titulo="Modo pruebas" onCerrar={onCerrar}>
        <div className="p-4 rounded mb-3" style={{ background: "#F0D3C8", border: `1px solid ${C.wax}` }}>
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
        <Boton variante="peligro" onClick={pedirDesactivar} disabled={ejecutando}>
          {ejecutando ? "Restaurando…" : "Desactivar y restaurar todo"}
        </Boton>
        {ventanaPregunta}
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
            <div className="w-px my-1 self-stretch" style={{ background: C.line, opacity: OP.linea }} />
            <div className="flex-1 min-w-0 pl-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs" style={{ color: C.line }}>
                  Colaboradores habilitados durante la prueba:
                </p>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <Boton tamano="pequeno" onClick={marcarTodos}>
                    Todos
                  </Boton>
                  <Boton tamano="pequeno" onClick={desmarcarTodos}>
                    Ninguno
                  </Boton>
                </div>
              </div>
              <div className="space-y-1">
                {colaboradores.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center justify-end zurdo:flex-row-reverse gap-2 text-sm py-0.5"
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
      <div className="flex justify-end zurdo:justify-start">
        <Boton variante="peligro" onClick={pedirActivar} disabled={ejecutando}>
          <FlaskConical size={16} /> Activar Modo Pruebas
        </Boton>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
