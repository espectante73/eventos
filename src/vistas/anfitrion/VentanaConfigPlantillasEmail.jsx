// Sub-ventana de Configuración: texto de las 4 plantillas de email
// automático. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 2).
import { C, inputStyle } from "../../theme";
import { Field } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaConfigPlantillasEmail({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  return (
    <VentanaFlotante clave="config-plantillas-email" titulo="Texto emails" onCerrar={onCerrar}>
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
        Texto de los avisos automáticos por email. Usa <code>{"{colaborador}"}</code>{" "}
        donde quieras que aparezca ese nombre — se rellena solo al enviar. Admite HTML
        sencillo (<code>&lt;b&gt;</code>, <code>&lt;br&gt;</code>).
      </p>
      <Field label="Aviso al colaborador: tiene invitados nuevos o cambiados asignados">
        <textarea
          value={evento.plantillaAsignacion || ""}
          onChange={(e) =>
            persistEvento({ ...evento, plantillaAsignacion: e.target.value })
          }
          rows={3}
          className="w-full"
          style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
        />
      </Field>
      <div className="h-2" />
      <Field label="Aviso al anfitrión: un colaborador completó todos los datos">
        <textarea
          value={evento.plantillaDatosCompletados || ""}
          onChange={(e) =>
            persistEvento({ ...evento, plantillaDatosCompletados: e.target.value })
          }
          rows={3}
          className="w-full"
          style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
        />
      </Field>
      <div className="h-2" />
      <Field label="Aviso al anfitrión: un colaborador completó todos sus pagos">
        <textarea
          value={evento.plantillaPagoRegistrado || ""}
          onChange={(e) =>
            persistEvento({ ...evento, plantillaPagoRegistrado: e.target.value })
          }
          rows={3}
          className="w-full"
          style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
        />
      </Field>
      <div className="h-2" />
      <Field label="Email a la familia: envío de la invitación">
        <textarea
          value={evento.plantillaInvitacionFamilia || ""}
          onChange={(e) =>
            persistEvento({ ...evento, plantillaInvitacionFamilia: e.target.value })
          }
          rows={3}
          className="w-full"
          style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
        />
      </Field>
    </VentanaFlotante>
  );
}
