// Sub-ventana de Configuración: texto de las 4 plantillas de email
// automático. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 2).
import { useRef } from "react";
import { Bold, Italic, Underline } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { Field } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { envolverSeleccion } from "../../lib/textoEnriquecido";

// Un campo de plantilla con su propia mini barra de negrita/cursiva/
// subrayado -- mismos botones y misma utilidad compartida que ya usa
// Novedades (lib/textoEnriquecido.js), a petición del usuario, 2026-08-27,
// para no tener que escribir <b>/<i>/<u> a mano tampoco aquí.
function PlantillaEditable({ label, valor, onCambio }) {
  const ref = useRef(null);

  // onMouseDown con preventDefault: sin esto, pulsar el botón le quita el
  // foco al textarea ANTES de que se dispare el click (se pierde la
  // selección de texto) -- mismo gotcha ya resuelto en Novedades.
  const botonFormato = (Icono, tag, etiqueta) => (
    <button
      type="button"
      title={etiqueta}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => ref.current && envolverSeleccion(ref.current, valor || "", tag, onCambio)}
      className="p-1 rounded"
      style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
    >
      <Icono size={12} />
    </button>
  );

  return (
    <Field label={label}>
      <div className="flex items-center gap-1 mb-1">
        {botonFormato(Bold, "b", "Negrita")}
        {botonFormato(Italic, "i", "Cursiva")}
        {botonFormato(Underline, "u", "Subrayado")}
      </div>
      <textarea
        ref={ref}
        value={valor || ""}
        onChange={(e) => onCambio(e.target.value)}
        rows={3}
        className="w-full"
        style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
      />
    </Field>
  );
}

export function VentanaConfigPlantillasEmail({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  return (
    <VentanaFlotante clave="config-plantillas-email" titulo="Texto emails" onCerrar={onCerrar}>
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
        Texto de los avisos automáticos por email. Usa <code>{"{colaborador}"}</code>{" "}
        donde quieras que aparezca ese nombre — se rellena solo al enviar. Admite HTML
        sencillo (<code>&lt;b&gt;</code>, <code>&lt;br&gt;</code>), o usa los botones de
        formato de cada campo.
      </p>
      <PlantillaEditable
        label="Aviso al colaborador: tiene invitados nuevos o cambiados asignados"
        valor={evento.plantillaAsignacion}
        onCambio={(v) => persistEvento({ ...evento, plantillaAsignacion: v })}
      />
      <div className="h-2" />
      <PlantillaEditable
        label="Aviso al anfitrión: un colaborador completó todos los datos"
        valor={evento.plantillaDatosCompletados}
        onCambio={(v) => persistEvento({ ...evento, plantillaDatosCompletados: v })}
      />
      <div className="h-2" />
      <PlantillaEditable
        label="Aviso al anfitrión: un colaborador completó todos sus pagos"
        valor={evento.plantillaPagoRegistrado}
        onCambio={(v) => persistEvento({ ...evento, plantillaPagoRegistrado: v })}
      />
      <div className="h-2" />
      <PlantillaEditable
        label="Email a la familia: envío de la invitación"
        valor={evento.plantillaInvitacionFamilia}
        onCambio={(v) => persistEvento({ ...evento, plantillaInvitacionFamilia: v })}
      />
    </VentanaFlotante>
  );
}
