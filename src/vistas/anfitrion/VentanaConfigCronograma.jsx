// Sub-ventana de Configuración: cronograma/logística del día. Reemplaza
// por completo a la subida manual de imagen (versión anterior) -- a
// petición del usuario, 2026-08-27: en vez de editar una foto en otra
// aplicación cada vez que cambia un horario, aquí se editan los 9
// bloques y la app dibuja sola la imagen a partir de esos datos (ver
// lib/cronograma.js), siempre al día.
//
// Tercer ajuste, mismo día: en vez de escribir la hora exacta de cada
// bloque (y tener que recalcular a mano todas las siguientes si cambia
// una), cada bloque solo dice cuántos MINUTOS dura -- la hora de inicio
// de cada uno se calcula sola sumando los minutos anteriores a la hora
// de inicio del cronograma entero ("cronogramaHoraInicio"). La propia
// imagen de abajo (que ya se regenera sola) es la que enseña las horas
// resultantes de cada bloque, sin tener que ir mirando bloque a bloque.
import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { generarImagenCronograma, calcularHorasAbsolutas } from "../../lib/cronograma";
import { VentanaFlotante } from "../../components/VentanaFlotante";

// Todas las horas del día en pasos de 5 minutos, en un único <select> --
// a petición del usuario ("un único reloj, no dos relojes distintos").
// Un <select> normal, nunca un <input type="time">: ese tipo de campo
// es justo el que Safari trataba como una fecha de verdad y le
// superponía su propio menú (Crear evento, etc.) -- solo hace falta
// para la hora de INICIO del cronograma entero (el único dato que sigue
// siendo una hora absoluta elegida a mano).
const TODAS_LAS_HORAS = Array.from({ length: 24 * 12 }, (_, i) => {
  const h = Math.floor(i / 12);
  const m = (i % 12) * 5;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

export function VentanaConfigCronograma({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  const bloques = Array.isArray(evento.cronogramaBloques) ? evento.cronogramaBloques : [];
  const horaInicio = evento.cronogramaHoraInicio || "18:00";
  const [imagen, setImagen] = useState("");
  const [seleccionado, setSeleccionado] = useState(0);

  // Se regenera sola cada vez que cambia algún dato -- no hace falta
  // ningún botón de "actualizar imagen".
  useEffect(() => {
    if (bloques.length === 0) return;
    setImagen(generarImagenCronograma(horaInicio, bloques));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se compara por JSON.stringify más abajo para no recalcular en cada tecla de campos que no son estos
  }, [horaInicio, JSON.stringify(bloques)]);

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
  const horasAbsolutas = calcularHorasAbsolutas(horaInicio, bloques);

  return (
    <VentanaFlotante clave="config-cronograma" titulo="Cronograma" onCerrar={onCerrar} ancho={420}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
        Cada bloque dice cuántos minutos dura, no una hora exacta -- la hora de cada uno se
        calcula sola (la imagen de abajo la enseña). Si cambias la duración de uno, todos los
        que van después se desplazan solos.
      </p>

      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-sm" style={{ color: C.charcoal, opacity: 0.8 }}>
          Inicio del cronograma
        </span>
        <select
          value={horaInicio}
          onChange={(e) => persistEvento({ ...evento, cronogramaHoraInicio: e.target.value })}
          style={{ ...inputStyle, width: 90 }}
        >
          {TODAS_LAS_HORAS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

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
        <>
          <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.6 }}>
            Empieza a las <b style={{ color: C.ink }}>{horasAbsolutas[seleccionado]}</b>
          </p>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="number"
              min={0}
              step={5}
              value={bloqueActual.duracionMin ?? 0}
              onChange={(e) => cambiarBloque(seleccionado, "duracionMin", Number(e.target.value))}
              style={{ ...inputStyle, width: 80, flexShrink: 0 }}
              title="Cuántos minutos dura este bloque"
            />
            <span className="text-sm" style={{ color: C.charcoal, opacity: 0.7, flexShrink: 0 }}>
              min
            </span>
            <input
              type="text"
              value={bloqueActual.texto}
              onChange={(e) => cambiarBloque(seleccionado, "texto", e.target.value)}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
        </>
      )}

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
