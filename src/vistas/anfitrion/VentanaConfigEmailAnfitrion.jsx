// Sub-ventana de Configuración: email del anfitrión, para recibir avisos
// automáticos de datos/pagos completados. Extraída de VistaAnfitrion.jsx
// en el reparto del 2026-08-08 (Fase 4, Ronda 1).
import { C } from "../../theme";
import { Field, TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaConfigEmailAnfitrion({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  return (
    <VentanaFlotante clave="config-email-anfitrion" titulo="Email anfitrión" onCerrar={onCerrar}>
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
        Tu email, para recibir avisos automáticos cuando un colaborador complete todos
        los datos o todos los pagos de sus invitados asignados.
      </p>
      <Field label="Tu email (anfitrión)">
        <TextInput
          value={evento.emailAnfitrion || ""}
          onChange={(e) => persistEvento({ ...evento, emailAnfitrion: e.target.value })}
          placeholder="tu@email.com"
          className="w-full"
        />
      </Field>
    </VentanaFlotante>
  );
}
