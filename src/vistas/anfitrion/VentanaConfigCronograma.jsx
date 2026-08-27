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
            <input
              type="time"
              step="300"
              value={b.hora}
              onChange={(e) => cambiarBloque(i, "hora", e.target.value)}
              style={{ ...inputStyle, width: 110, flexShrink: 0 }}
              title="Hora de inicio de este bloque, en pasos de 5 minutos"
            />
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
        <input
          type="time"
          step="300"
          value={evento.cronogramaHoraFin || ""}
          onChange={(e) => persistEvento({ ...evento, cronogramaHoraFin: e.target.value })}
          style={{ ...inputStyle, width: 110 }}
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

      {/* Nadie la ve por defecto -- a petición del usuario, para poder
          revisarla con calma antes de decidir a quién enseñársela.
          Dos casillas independientes: puede interesar enseñársela
          primero solo a los colaboradores (para repartir tareas del
          día) sin decidir todavía si también se la enseña a los
          invitados. */}
      <div className="pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${C.line}` }}>
        <label className="flex items-center gap-2 text-sm" style={{ color: C.charcoal }}>
          <input
            type="checkbox"
            checked={Boolean(evento.cronogramaVisibleColaboradores)}
            onChange={(e) => persistEvento({ ...evento, cronogramaVisibleColaboradores: e.target.checked })}
          />
          Visible para colaboradores
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: C.charcoal }}>
          <input
            type="checkbox"
            checked={Boolean(evento.cronogramaVisibleInvitados)}
            onChange={(e) => persistEvento({ ...evento, cronogramaVisibleInvitados: e.target.checked })}
          />
          Visible para invitados (tablón público)
        </label>
      </div>
    </VentanaFlotante>
  );
}
