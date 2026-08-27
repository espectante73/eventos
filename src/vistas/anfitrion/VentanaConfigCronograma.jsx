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
import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { generarImagenCronograma } from "../../lib/cronograma";
import { VentanaFlotante } from "../../components/VentanaFlotante";

const HORAS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTOS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

// Dos <select> (hora / minutos de 5 en 5) en vez de <input type="time"> --
// a petición del usuario, 2026-08-27: Safari trata ese tipo de campo como
// una fecha y le superpone su propio menú ("Crear evento", "Abrir
// calendario"...), sin flechas visibles para subir/bajar -- la etiqueta
// "format-detection" en index.html no lo evitaba. Un <select> normal no
// sufre este problema.
function SelectorHora({ valor, onCambio }) {
  const [hora, minuto] = String(valor || "00:00").split(":");
  return (
    <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
      <select
        value={hora}
        onChange={(e) => onCambio(`${e.target.value}:${minuto}`)}
        style={{ ...inputStyle, width: 62 }}
      >
        {HORAS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span style={{ color: C.charcoal }}>:</span>
      <select
        value={minuto}
        onChange={(e) => onCambio(`${hora}:${e.target.value}`)}
        style={{ ...inputStyle, width: 62 }}
      >
        {MINUTOS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

export function VentanaConfigCronograma({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  const bloques = Array.isArray(evento.cronogramaBloques) ? evento.cronogramaBloques : [];
  const [imagen, setImagen] = useState("");

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

  return (
    <VentanaFlotante clave="config-cronograma" titulo="Cronograma" onCerrar={onCerrar} ancho={520}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
        Los horarios y nombres de cada bloque, en orden. La imagen de abajo se dibuja sola a
        partir de estos datos — el ancho de cada bloque representa cuánto dura de verdad, hasta
        que empieza el siguiente.
      </p>

      <div className="flex flex-col gap-2 mb-3">
        {bloques.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <SelectorHora valor={b.hora} onCambio={(v) => cambiarBloque(i, "hora", v)} />
            <input
              type="text"
              value={b.texto}
              onChange={(e) => cambiarBloque(i, "texto", e.target.value)}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
        <label className="text-sm" style={{ color: C.charcoal }}>
          Fin del evento (cierra el último bloque)
        </label>
        <SelectorHora
          valor={evento.cronogramaHoraFin || "23:45"}
          onCambio={(v) => persistEvento({ ...evento, cronogramaHoraFin: v })}
        />
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
          que solo viene a disfrutarlo. Se quitó la casilla de
          "invitados" (tablón público) a petición explícita del usuario,
          2026-08-27, tras aclarar que esa nunca debía existir. Nadie la
          ve por defecto -- para poder revisarla con calma antes de
          decidir. */}
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
