// Sub-ventana de Configuración: Modo Pruebas — probar la app con datos
// reales sabiendo que se puede volver todo atrás de un golpe. Activar
// guarda una foto completa de los datos operativos; desactivar la
// restaura entera (reset global de TODO lo hecho mientras estuvo
// activo, no solo lo tocado en esta sesión). Mientras está activo, el
// anfitrión ve la app con un aviso rojo y sin requisitos de datos
// (lib/modoPruebas.js), los colaboradores solo ven "Modo pruebas" (App.jsx)
// y los correos le llegan solo a él (enviar_email en schema.sql).
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { C } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";

export function VentanaConfigModoPruebas({ data, onCerrar }) {
  const {
    evento,
    activarModoPruebas,
    desactivarModoPruebas,
    guardarFotoDeshacer,
  } = data;
  const [ejecutando, setEjecutando] = useState(false);
  const activo = Boolean(evento.modoPruebasActivo);

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
    await activarModoPruebas();
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
            Toda la app se ve con un aviso rojo mientras tanto.
            Al desactivarlo se restaura TODO exactamente a como estaba al activarlo — deshace
            cualquier cambio hecho desde entonces.
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
      <p className="text-sm mb-3" style={{ color: C.charcoal }}>
        Guarda una foto de todo ahora mismo; al desactivarlo, vuelve a ella entera.
      </p>
      <div className="flex justify-end zurdo:justify-start">
        <Boton variante="peligro" onClick={pedirActivar} disabled={ejecutando}>
          <FlaskConical size={16} /> Activar Modo Pruebas
        </Boton>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
