// Configuración → Modo Pruebas: es SOLO la pregunta de activar o de
// desactivar (él, v49.1: la ventana de antes repetía lo mismo que la
// pregunta). Probar la app con datos
// reales sabiendo que se puede volver todo atrás de un golpe. Activar
// guarda una foto completa de los datos operativos; desactivar la
// restaura entera (reset global de TODO lo hecho mientras estuvo
// activo, no solo lo tocado en esta sesión). Mientras está activo, el
// anfitrión ve la app con un aviso rojo y sin requisitos de datos
// (lib/modoPruebas.js), los colaboradores solo ven "Modo pruebas" (App.jsx)
// y los correos le llegan solo a él (enviar_email en schema.sql).
import { useEffect } from "react";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";

export function VentanaConfigModoPruebas({ data, onCerrar }) {
  const { evento, activarModoPruebas, desactivarModoPruebas, guardarFotoDeshacer } = data;
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();

  // Activar y desactivar recargan la página al terminar. Si algo falla,
  // el aviso ya lo da useLedgerData, y aquí solo se cierra.
  const activar = async () => {
    if (!(await activarModoPruebas())) onCerrar();
  };

  const desactivar = async () => {
    // La foto del estado ACTUAL se guarda en el servidor antes de
    // restaurar: lo hecho durante la prueba se puede recuperar con
    // "Deshacer".
    const guardada = await guardarFotoDeshacer("Salida del Modo Pruebas");
    if (!guardada) {
      onCerrar();
      return;
    }
    if (!(await desactivarModoPruebas())) onCerrar();
  };

  useEffect(() => {
    preguntar(
      evento.modoPruebasActivo
        ? {
            titulo: "¿Desactivar y restaurar todo?",
            texto: "Se restaura TODO exactamente a como estaba al activar el Modo Pruebas — se deshace cualquier cambio hecho desde entonces, sea de prueba o real.",
            rotulo: "Sí, restaurar",
            alConfirmar: desactivar,
            alCancelar: onCerrar,
          }
        : {
            titulo: "¿Activar Modo Pruebas?",
            texto: "Se guarda una foto completa de los datos actuales del evento. Podrás volver a este estado exacto en cualquier momento apagando el Modo Pruebas.",
            rotulo: "Sí, activar",
            peligro: false,
            alConfirmar: activar,
            alCancelar: onCerrar,
          }
    );
    // Solo al abrir: es una pregunta, no una ventana que se repinte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ventanaPregunta;
}
