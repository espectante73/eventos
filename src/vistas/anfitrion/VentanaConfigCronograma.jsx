// Sub-ventana de Configuración: cronograma/logística del día. Reemplaza
// por completo a la subida manual de imagen (versión anterior) -- a
// petición del usuario, 2026-08-27: en vez de editar una foto en otra
// aplicación cada vez que cambia un horario, aquí se editan los 9
// bloques (hora + texto) y la app dibuja sola la imagen a partir de esos
// datos (ver lib/cronograma.js), siempre al día. Diseño del dibujo
// validado con el usuario a base de varias rondas de pruebas visuales
// antes de construirlo: ancho de cada bloque proporcional a su duración
// real, altura homogénea, hora arriba-izquierda, etiqueta centrada,
// chevron abierto.
//
// Segundo ajuste, mismo día: el primer diseño mostraba los 9 bloques a
// la vez (9 filas x 2 relojes cada una) -- demasiado espacio para lo que
// pide el criterio de siempre de esta app ("pulgar derecho", ahorrar
// espacio, evitar amontonar secciones, ver VentanaPermisos.jsx). Ahora
// se elige el bloque con un <select> (mismo patrón que el selector de
// colaborador en Permisos) y solo se edita ESE, y la hora es un único
// <select> con todos los horarios en pasos de 5 minutos (no dos relojes
// hora/minuto por separado).
import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { generarImagenCronograma } from "../../lib/cronograma";
import { VentanaFlotante } from "../../components/VentanaFlotante";

// Todos los horarios del día en pasos de 5 minutos, en un único <select>
// -- a petición del usuario ("un único reloj, no dos relojes
// distintos"). Un <select> normal, nunca un <input type="time">: ese
// tipo de campo es justo el que Safari trataba como una fecha de
// verdad y le superponía su propio menú (Crear evento, etc.).
const TODAS_LAS_HORAS = Array.from({ length: 24 * 12 }, (_, i) => {
  const h = Math.floor(i / 12);
  const m = (i % 12) * 5;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

export function VentanaConfigCronograma({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  const bloques = Array.isArray(evento.cronogramaBloques) ? evento.cronogramaBloques : [];
  const [imagen, setImagen] = useState("");
  const [seleccionado, setSeleccionado] = useState(0);

  // Se regenera sola cada vez que cambia algún dato -- no hace falta
  // ningún botón de "actualizar imagen".
  useEffect(() => {
    if (bloques.length === 0) return;
    setImagen(generarImagenCronograma(bloques, evento.cronogramaHoraFin || "23:45"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se compara por JSON.stringify más abajo para no recalcular en cada tecla de campos que no son estos
  }, [JSON.stringify(bloques), evento.cronogramaHoraFin]);

  const cambiarBloque = (indice, campo, valor) => {
    const siguiente = bloques.map((b, i) => (i === indice ? { ...b, [campo]: valor } : b));
    persistEvento({ ...evento, cronogramaBloques: siguiente });
  };

  const imprimir = () => {
    setTimeout(() => {
      try {
        window.print();
      } catch (_) {
        // Bloqueado por el navegador: se puede usar Cmd/Ctrl+P a mano.
      }
    }, 60);
  };

  const bloqueActual = bloques[seleccionado];

  return (
    <VentanaFlotante clave="config-cronograma" titulo="Cronograma" onCerrar={onCerrar} ancho={420}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
        Elige un bloque, y edita su hora y su texto. La imagen de abajo se dibuja sola -- el
        ancho de cada bloque representa cuánto dura de verdad, hasta que empieza el siguiente.
      </p>

      {/* Etiqueta a la izquierda, <select> a la derecha -- mismo criterio
          "pulgar derecho" que el resto de la app (ver VentanaPermisos.jsx). */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm" style={{ color: C.charcoal, opacity: 0.8 }}>
          Bloque
        </span>
        <select
          value={seleccionado}
          onChange={(e) => setSeleccionado(Number(e.target.value))}
          style={{ ...inputStyle, height: 42 }}
        >
          {bloques.map((b, i) => (
            <option key={i} value={i}>
              {b.texto || `Bloque ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      {bloqueActual && (
        <div className="flex items-center gap-2 mb-4">
          <select
            value={bloqueActual.hora}
            onChange={(e) => cambiarBloque(seleccionado, "hora", e.target.value)}
            style={{ ...inputStyle, width: 90, flexShrink: 0 }}
          >
            {TODAS_LAS_HORAS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={bloqueActual.texto}
            onChange={(e) => cambiarBloque(seleccionado, "texto", e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-4 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
        <span className="text-sm" style={{ color: C.charcoal, opacity: 0.8 }}>
          Fin del evento
        </span>
        <select
          value={evento.cronogramaHoraFin || "23:45"}
          onChange={(e) => persistEvento({ ...evento, cronogramaHoraFin: e.target.value })}
          style={{ ...inputStyle, width: 90 }}
        >
          {TODAS_LAS_HORAS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      {imagen && (
        <>
          <div id="zona-imprimible-cronograma">
            <img src={imagen} alt="Cronograma del día" className="w-full rounded mb-2" />
          </div>
          <button
            onClick={imprimir}
            className="boton-3d flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium mb-4"
            style={{ border: `1px solid ${C.line}`, color: C.ink }}
          >
            <Printer size={14} /> Imprimir
          </button>
        </>
      )}

      {/* Solo colaboradores -- el cronograma es una herramienta de
          trabajo para quien organiza el evento, nunca para el invitado
          que solo viene a disfrutarlo. Nadie la ve por defecto -- para
          poder revisarla con calma antes de decidir. */}
      <div className="pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
        <label className="flex items-center gap-2 text-sm" style={{ color: C.charcoal }}>
          <input
            type="checkbox"
            checked={Boolean(evento.cronogramaVisibleColaboradores)}
            onChange={(e) => persistEvento({ ...evento, cronogramaVisibleColaboradores: e.target.checked })}
          />
          Visible para colaboradores
        </label>
      </div>
    </VentanaFlotante>
  );
}
