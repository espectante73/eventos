// Sub-ventana de Configuración: BORRAR TODO el contenido de la app, con
// doble confirmación nativa y copia de seguridad automática antes de
// borrar. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 2).
import { Trash2 } from "lucide-react";
import { C } from "../../theme";
import { AvisoDeshacer } from "../../components/AvisoDeshacer";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";

export function VentanaConfigZonaPeligro({ data, onCerrar }) {
  const {
    invitados,
    persistEvento,
    persistColaboradores,
    persistInvitados,
    persistMesas,
    persistFotosFamiliares,
    guardarFotoDeshacer,
  } = data;

  // Los que AUTORIZARON expresamente que se guarden sus datos (la casilla
  // del formulario del colaborador, 2026-09-21). El borrado total los
  // respeta: es lo que promete la nota de privacidad del tablón, y
  // borrarlos igualmente sería incumplir lo que se les dijo.
  const conAutorizacion = (invitados || []).filter((g) => g.conservarDatos);

  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  // Dos preguntas seguidas, como antes, ahora en la ventana de la app.
  const pedirBorrarTodo = () =>
    preguntar({
      titulo: "¿Borrar TODO?",
      texto:
        "Evento, colaboradores, invitados, mesas y fotos — todo el contenido de la aplicación." +
        (conAutorizacion.length > 0
          ? `\n\nSe quedan ${conAutorizacion.length} ${
              conAutorizacion.length === 1 ? "invitado que autorizó" : "invitados que autorizaron"
            } guardar sus datos, con su nombre y sus datos personales. Se les quita todo lo de este evento: mesa, pago, confirmación y colaborador.`
          : "\n\nNadie ha autorizado que se guarden sus datos, así que no se queda ninguno."),
      rotulo: "Sí, continuar",
      alConfirmar: () =>
        preguntar({
          titulo: "Última confirmación",
          texto: "Se borrará TODO de verdad. ¿Lo confirmas definitivamente?",
          rotulo: "Sí, borrar todo",
          alConfirmar: borrarTodoElContenido,
        }),
    });

  const borrarTodoElContenido = async () => {
    // El contenido del backup se captura YA (antes de borrar nada), pero
    // el DISPARO de la descarga se deja para el final, después de lanzar
    // el borrado — en móvil (sobre todo iOS), un <a download> hacia un
    // blob: puede navegar la propia pestaña en vez de descargar sin más;
    // si eso pasara antes de esta llamada, la página se recargaría y el
    // borrado ni siquiera llegaría a intentarse.
    const guardada = await guardarFotoDeshacer("Borrado total");
    if (!guardada) return;
    persistEvento({
      nombre: "",
      fecha: "",
      hora: "",
      precio: "",
      imagen: "/cabecera-defecto.jpg",
      imagenInvitacion: "/invitacion-defecto.jpg",
      lugar: "",
      direccion: "",
      precioAdulto: "",
      precioNino: "",
      edadNinoDesde: "2",
      edadNinoHasta: "12",
      urlPublica: "",
      ocultarTituloEnImagen: true,
      emailAnfitrion: "",
      plantillaAsignacion:
        "Hola,<br><br>Tienes invitados nuevos asignados.<br>Entra en tu enlace cuando puedas para revisarlos y completar sus datos." +
        `<p style="color:${C.peligro};font-weight:700;text-transform:uppercase;font-family:Georgia,serif;margin-top:14px;">` +
        "Si ya has rellenado los datos de los nuevos que adjunto en este email, ignora este aviso." +
        "</p>",
      plantillaDatosCompletados:
        "Hola,<br><br><b>{colaborador}</b> ha completado los datos de todos sus invitados asignados.",
      plantillaPagoRegistrado:
        "Hola,<br><br><b>{colaborador}</b> ha completado todos los pagos de sus invitados asignados.",
      plantillaInvitacionFamilia:
        "Hola,<br><br>Aquí tienes tu invitación. ¡Les esperamos con muchas ganas!",
    });
    persistColaboradores([]);
    // Los que autorizaron se quedan, pero SOLO ellos y SOLO su parte
    // personal: lo de este evento (mesa, pago, confirmación, llegada,
    // colaborador, avisos) se va con el evento. Guardar "para otra
    // ocasión" es guardar a la persona, no la boda.
    persistInvitados(
      conAutorizacion.map((g) => ({
        ...g,
        colaboradorId: null,
        mesa: null,
        confirmado: false,
        pagado: false,
        presente: false,
        avisoPendiente: false,
        rolesTrabajo: [],
        excepcionesRevision: [],
        excluidoTablon: false,
      }))
    );
    persistMesas([]);
    persistFotosFamiliares({});
  };

  return (
    <VentanaFlotante clave="config-zona-peligro" titulo="Borrado total" onCerrar={onCerrar}>
      <AvisoDeshacer data={data} />
      <p className="text-xs mb-2" style={{ color: C.wax, fontWeight: 700 }}>
        ⚠ Zona de peligro: esto borra evento, colaboradores, invitados, mesas y fotos —
        todo el contenido de la aplicación. No se puede deshacer.
      </p>
      {conAutorizacion.length > 0 && (
        <p className="text-xs mb-2" style={{ color: C.charcoal }}>
          Se quedarán <b>{conAutorizacion.length}</b>{" "}
          {conAutorizacion.length === 1 ? "invitado que autorizó" : "invitados que autorizaron"}{" "}
          expresamente guardar sus datos, sin nada de este evento.
        </p>
      )}
      <Boton variante="peligro" onClick={pedirBorrarTodo}>
        <Trash2 size={14} /> BORRAR TODO
      </Boton>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
