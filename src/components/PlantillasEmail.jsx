// Las 4 plantillas de email automático, cada una en su propia sección
// plegable.
//
// Vivía en su propia ventana del menú (VentanaConfigPlantillasEmail.jsx)
// hasta el 2026-09-06, cuando el usuario pidió juntarlo con Datos del
// evento: "es parte del texto que hay que editar o manipular, y así está
// todo el texto de la aplicación concentrado en un solo lugar".
//
// ⚠️ Sigue existiendo la ventana suelta, pero SOLO para el colaborador
// con el permiso "Editar el texto de los emails" (ver lib/permisos.js y
// VistaColaborador.jsx): a ese no se le puede abrir "Datos del evento"
// entera, que es otro permiso distinto. Por eso el contenido vive aquí,
// compartido, en vez de duplicarse en los dos sitios.
import { useRef } from "react";
import { Bold, Italic, Underline, Undo2, Mail } from "lucide-react";
import { C, inputStyle } from "../theme";
import { Field } from "./Formulario";
import { SeccionPlegable } from "./SeccionPlegable";
import { envolverSeleccion } from "../lib/textoEnriquecido";
import { useDeshacer } from "../lib/useDeshacer";
import { BotonHistorial } from "./HistorialTexto";

// Las cuatro, con un título corto para la fila plegada (el largo de
// antes no cabía) y el de siempre como explicación dentro.
const PLANTILLAS = [
  {
    campo: "plantillaAsignacion",
    titulo: "Aviso al colaborador",
    label: "Tiene invitados nuevos o cambiados asignados",
  },
  {
    campo: "plantillaDatosCompletados",
    titulo: "Aviso a ti: datos completos",
    label: "Un colaborador completó todos los datos de sus invitados",
  },
  {
    campo: "plantillaPagoRegistrado",
    titulo: "Aviso a ti: pagos completos",
    label: "Un colaborador completó todos sus pagos",
  },
  {
    campo: "plantillaInvitacionFamilia",
    titulo: "Invitación a la familia",
    label: "Email con el que se envía la invitación",
  },
];

// Un vistazo al contenido sin desplegar: se quitan las etiquetas HTML
// para que el resumen no salga lleno de <b> y <br>.
function resumenDe(texto) {
  const limpio = String(texto || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!limpio) return "sin texto";
  return limpio.length > 38 ? `${limpio.slice(0, 38)}…` : limpio;
}

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

export function PlantillasEmail({ data }) {
  const { evento, persistEvento, obtenerHistorialTexto } = data;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs" style={{ color: C.charcoal, opacity: 0.75 }}>
        Texto de los avisos automáticos por email. Usa <code>{"{colaborador}"}</code> donde
        quieras que aparezca ese nombre — se rellena solo al enviar. Admite HTML sencillo, o
        usa los botones de formato de cada campo. Se guarda al salir del campo, no mientras
        escribes.
      </p>
      {PLANTILLAS.map((p) => (
        <SeccionPlegable key={p.campo} icono={Mail} titulo={p.titulo} resumen={resumenDe(evento[p.campo])}>
          <PlantillaEditable
            label={p.label}
            valor={evento[p.campo]}
            campo={p.campo}
            obtenerHistorialTexto={obtenerHistorialTexto}
            onCambio={(v) => persistEvento({ ...evento, [p.campo]: v })}
          />
        </SeccionPlegable>
      ))}
    </div>
  );
}
