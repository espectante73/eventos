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

  const activo = Boolean(evento.modoPruebasActivo);

  const activar = async () => {
    const ok = window.confirm(
      "Se guarda una foto completa de los datos actuales del evento. Podrás volver a este " +
        "estado exacto en cualquier momento apagando el Modo Pruebas.\n\n¿Activar Modo Pruebas?"
    );
    if (!ok) return;
    setEjecutando(true);
    await activarModoPruebas();
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
      <p className="text-sm mb-3" style={{ color: C.charcoal }}>
        Para probar cosas (como ver cómo queda un acuse, o marcar pagos de ejemplo) sabiendo
        que puedes volver atrás de un golpe. Al activarlo se guarda una foto completa de los
        datos de ahora mismo; al desactivarlo, se restaura esa foto entera.
      </p>
      <p className="text-xs mb-3" style={{ color: C.wax }}>
        ⚠ Mientras esté activo, cualquier cambio real que hagan tus colaboradores también se
        perderá al desactivarlo — es un reset global, no distingue pruebas de cambios de verdad.
      </p>
      <button
        onClick={activar}
        disabled={ejecutando}
        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold"
        style={{ background: C.wax, color: "#fff" }}
      >
        <FlaskConical size={16} /> Activar Modo Pruebas
      </button>
    </VentanaFlotante>
  );
}
