// Sub-ventana de Configuración: BORRAR TODO el contenido de la app, con
// doble confirmación nativa y copia de seguridad automática antes de
// borrar. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 2).
import { Trash2 } from "lucide-react";
import { C } from "../../theme";
import { exportarTodo } from "../../lib/backup";
import { descargarJSON } from "../../lib/descargas";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaConfigZonaPeligro({ data, onCerrar }) {
  const {
    evento,
    mesas,
    fotosFamiliares,
    colaboradores,
    invitados,
    persistEvento,
    persistColaboradores,
    persistInvitados,
    persistMesas,
    persistFotosFamiliares,
  } = data;

  const borrarTodoElContenido = () => {
    const aviso = "¡ADVERTENCIA SE BORRARÁ TODO EL CONTENIDO DE LA APLICACIÓN!";
    const primera = window.confirm(`${aviso}\n\nEvento, colaboradores, invitados, mesas y fotos — todo. Esta acción no se puede deshacer.\n\n¿Quieres continuar?`);
    if (!primera) return;
    const segunda = window.confirm(`${aviso}\n\nÚltima confirmación: se borrará TODO de verdad. ¿Confirmas definitivamente?`);
    if (!segunda) return;
    // El contenido del backup se captura YA (antes de borrar nada), pero
    // el DISPARO de la descarga se deja para el final, después de lanzar
    // el borrado — en móvil (sobre todo iOS), un <a download> hacia un
    // blob: puede navegar la propia pestaña en vez de descargar sin más;
    // si eso pasara antes de esta llamada, la página se recargaría y el
    // borrado ni siquiera llegaría a intentarse.
    const datosBackup = JSON.parse(exportarTodo({ evento, mesas, fotosFamiliares, colaboradores, invitados }));
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
        '<p style="color:#B00020;font-weight:700;text-transform:uppercase;font-family:Georgia,serif;margin-top:14px;">' +
        "Si ya has rellenado los datos de los nuevos que adjunto en este email, ignora este aviso." +
        "</p>",
      plantillaDatosCompletados:
        "Hola,<br><br><b>{colaborador}</b> ha completado los datos de todos sus invitados asignados.",
      plantillaPagoRegistrado:
        "Hola,<br><br><b>{colaborador}</b> ha completado todos los pagos de sus invitados asignados.",
      plantillaInvitacionFamilia:
        "Hola,<br><br>Aquí tienes tu invitación. ¡Os esperamos con muchas ganas!",
    });
    persistColaboradores([]);
    persistInvitados([]);
    persistMesas([]);
    persistFotosFamiliares({});
    descargarJSON(`backup-antes-de-borrar-todo-${Date.now()}.json`, datosBackup);
  };

  return (
    <VentanaFlotante clave="config-zona-peligro" titulo="Borrado total" onCerrar={onCerrar}>
      <p className="text-xs mb-2" style={{ color: C.wax, fontWeight: 700 }}>
        ⚠ Zona de peligro: esto borra evento, colaboradores, invitados, mesas y fotos —
        todo el contenido de la aplicación. No se puede deshacer.
      </p>
      <button
        onClick={borrarTodoElContenido}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
        style={{ background: "#B00020", color: "#fff" }}
      >
        <Trash2 size={14} /> BORRAR TODO
      </button>
    </VentanaFlotante>
  );
}
