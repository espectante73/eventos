// Sub-ventana de Configuración: URL pública de la web, usada para
// construir el enlace mágico de cada colaborador. Extraída de
// VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4, Ronda 1).
import { C } from "../../theme";
import { Field, TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaConfigUrlWeb({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  return (
    <VentanaFlotante clave="config-url-web" titulo="URL web" onCerrar={onCerrar}>
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
        <strong>Importante:</strong> pega aquí la URL de tu web ya publicada (la del
        dominio que te dé Vercel, o el tuyo propio si le pones uno). Sin este dato, los
        enlaces que copies para cada colaborador no apuntarán al sitio correcto.
      </p>
      <Field label="URL de la web">
        <TextInput
          value={evento.urlPublica}
          onChange={(e) => persistEvento({ ...evento, urlPublica: e.target.value })}
          placeholder="https://tu-boda.vercel.app"
          className="w-full"
        />
      </Field>
    </VentanaFlotante>
  );
}
