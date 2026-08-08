// Sub-ventana de Configuración: precios de adulto/niño y el rango de edad
// que decide cuál se aplica. Extraída de VistaAnfitrion.jsx en el reparto
// del 2026-08-08 (Fase 4, Ronda 1).
import { C } from "../../theme";
import { Field, TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaConfigPrecios({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  return (
    <VentanaFlotante clave="config-precios" titulo="Precios" onCerrar={onCerrar}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
        Precios de referencia para calcular el cobro de cada familia (número de adultos
        y niños según los datos que recopile cada colaborador).
      </p>
      <div className="grid grid-cols-2 gap-4" style={{ maxWidth: 400 }}>
        <Field label="Precio adulto">
          <TextInput
            value={evento.precioAdulto}
            onChange={(e) => persistEvento({ ...evento, precioAdulto: e.target.value })}
            placeholder="€ 45"
          />
        </Field>
        <Field label="Precio niño">
          <TextInput
            value={evento.precioNino}
            onChange={(e) => persistEvento({ ...evento, precioNino: e.target.value })}
            placeholder="€ 20"
          />
        </Field>
        <Field label="Edad niño desde">
          <TextInput
            value={evento.edadNinoDesde}
            onChange={(e) => persistEvento({ ...evento, edadNinoDesde: e.target.value })}
            placeholder="2"
          />
          <span className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
            Menores de esta edad no pagan entrada
          </span>
        </Field>
        <Field label="Edad niño hasta">
          <TextInput
            value={evento.edadNinoHasta}
            onChange={(e) => persistEvento({ ...evento, edadNinoHasta: e.target.value })}
            placeholder="12"
          />
          <span className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
            Desde esta edad (incluida) pagan precio adulto
          </span>
        </Field>
      </div>
    </VentanaFlotante>
  );
}
