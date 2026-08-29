// Sub-ventana de Configuración: texto de las 4 plantillas de email
// automático. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 2).
import { useRef } from "react";
import { Bold, Italic, Underline, Undo2 } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { Field } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { envolverSeleccion } from "../../lib/textoEnriquecido";
import { useDeshacer } from "../../lib/useDeshacer";
import { BotonHistorial } from "../../components/HistorialTexto";

// Un campo de plantilla con su propia mini barra de negrita/cursiva/
// subrayado -- mismos botones y misma utilidad compartida que ya usa
// Novedades (lib/textoEnriquecido.js), a petición del usuario, 2026-08-27,
// para no tener que escribir <b>/<i>/<u> a mano tampoco aquí.
//
// 2026-08-29: pasa a guardar solo al SALIR del campo (onBlur), no en
// cada pulsación como antes -- necesario para que "Deshacer" (vuelve al
// texto de antes de tu último cambio, SIN guardar) tenga sentido, y
// para que el historial de guardado (ver HistorialTexto.jsx) recoja
// versiones reales, no una fila por cada letra tecleada. Mismo patrón
// ya usado en Novedades (NovedadCard: estado local + onBlur).
function PlantillaEditable({ label, valor, onCambio, campo, obtenerHistorialTexto }) {
  const { valor: texto, cambiar: setTexto, deshacer, puedeDeshacer, fijarValor: fijarTexto } = useDeshacer(valor || "");
  const ref = useRef(null);

  // onMouseDown con preventDefault: sin esto, pulsar el botón le quita el
  // foco al textarea ANTES de que se dispare el click (se pierde la
  // selección de texto) -- mismo gotcha ya resuelto en Novedades.
  const botonFormato = (Icono, tag, etiqueta) => (
    <button
      type="button"
      title={etiqueta}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => ref.current && envolverSeleccion(ref.current, texto, tag, setTexto)}
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
        <div style={{ width: 1, alignSelf: "stretch", background: C.line }} />
        <button
          type="button"
          title="Deshacer (vuelve a como estaba antes de tu último cambio, sin guardar)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={deshacer}
          disabled={!puedeDeshacer}
          className="p-1 rounded"
          style={{ border: `1px solid ${C.line}`, color: C.charcoal, opacity: puedeDeshacer ? 1 : 0.35 }}
        >
          <Undo2 size={12} />
        </button>
        <BotonHistorial
          obtenerHistorial={() => obtenerHistorialTexto("plantilla", null, campo)}
          onRestaurar={(valorAnterior) => {
            fijarTexto(valorAnterior);
            onCambio(valorAnterior);
          }}
        />
      </div>
      <textarea
        ref={ref}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => texto !== (valor || "") && onCambio(texto)}
        rows={3}
        className="w-full"
        style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
      />
    </Field>
  );
}

export function VentanaConfigPlantillasEmail({ data, onCerrar }) {
  const { evento, persistEvento, obtenerHistorialTexto } = data;
  return (
    <VentanaFlotante clave="config-plantillas-email" titulo="Texto emails" onCerrar={onCerrar}>
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
        Texto de los avisos automáticos por email. Usa <code>{"{colaborador}"}</code>{" "}
        donde quieras que aparezca ese nombre — se rellena solo al enviar. Admite HTML
        sencillo (<code>&lt;b&gt;</code>, <code>&lt;br&gt;</code>), o usa los botones de
        formato de cada campo. Los cambios se guardan al salir del campo, no mientras
        escribes.
      </p>
      <PlantillaEditable
        label="Aviso al colaborador: tiene invitados nuevos o cambiados asignados"
        valor={evento.plantillaAsignacion}
        campo="plantillaAsignacion"
        obtenerHistorialTexto={obtenerHistorialTexto}
        onCambio={(v) => persistEvento({ ...evento, plantillaAsignacion: v })}
      />
      <div className="h-2" />
      <PlantillaEditable
        label="Aviso al anfitrión: un colaborador completó todos los datos"
        valor={evento.plantillaDatosCompletados}
        campo="plantillaDatosCompletados"
        obtenerHistorialTexto={obtenerHistorialTexto}
        onCambio={(v) => persistEvento({ ...evento, plantillaDatosCompletados: v })}
      />
      <div className="h-2" />
      <PlantillaEditable
        label="Aviso al anfitrión: un colaborador completó todos sus pagos"
        valor={evento.plantillaPagoRegistrado}
        campo="plantillaPagoRegistrado"
        obtenerHistorialTexto={obtenerHistorialTexto}
        onCambio={(v) => persistEvento({ ...evento, plantillaPagoRegistrado: v })}
      />
      <div className="h-2" />
      <PlantillaEditable
        label="Email a la familia: envío de la invitación"
        valor={evento.plantillaInvitacionFamilia}
        campo="plantillaInvitacionFamilia"
        obtenerHistorialTexto={obtenerHistorialTexto}
        onCambio={(v) => persistEvento({ ...evento, plantillaInvitacionFamilia: v })}
      />
    </VentanaFlotante>
  );
}
