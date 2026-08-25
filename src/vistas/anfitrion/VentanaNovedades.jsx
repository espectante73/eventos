// Ventana "Novedades": el anfitrión escribe aquí el tablón de anuncios
// público de solo lectura (VistaTablon.jsx) — sustituye/complementa al
// grupo de WhatsApp "tablón" donde los ya confirmados solo pueden leer.
// Un único enlace (?tablon=<token>) se comparte una vez en ese grupo;
// cualquiera con el enlace ve las novedades publicadas, sin login ni
// cuenta — a petición del usuario, 2026-08-25.
import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Link as LinkIcon, Check, Bold, Italic, Underline, MessageCircle } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { uid } from "../../lib/id";
import { formatearFecha } from "../../lib/formato";
import { VentanaFlotante } from "../../components/VentanaFlotante";

// Envuelve la selección actual del textarea con <tag>...</tag> (o la
// inserta vacía si no hay nada seleccionado) -- mismo criterio de "HTML
// sencillo" que ya admiten las plantillas de email de Configuración, solo
// que aquí no hace falta escribir las etiquetas a mano.
function envolverSeleccion(textarea, valor, tag, onCambio) {
  const inicio = textarea.selectionStart;
  const fin = textarea.selectionEnd;
  const seleccion = valor.slice(inicio, fin);
  const nuevo = `${valor.slice(0, inicio)}<${tag}>${seleccion}</${tag}>${valor.slice(fin)}`;
  onCambio(nuevo);
  // Foco y selección dentro de las etiquetas nuevas, para poder seguir
  // escribiendo o encadenar otro formato (p.ej. negrita + cursiva).
  requestAnimationFrame(() => {
    textarea.focus();
    const nuevoInicio = inicio + tag.length + 2;
    textarea.setSelectionRange(nuevoInicio, nuevoInicio + seleccion.length);
  });
}

function NovedadCard({ n, onCambiar, onEliminar }) {
  const [titulo, setTitulo] = useState(n.titulo);
  const [cuerpo, setCuerpo] = useState(n.cuerpo);
  const cuerpoRef = useRef(null);

  // onMouseDown con preventDefault: sin esto, pulsar el botón le quita el
  // foco al textarea ANTES de que se dispare el click (se pierde la
  // selección de texto, y el onBlur del textarea dispara un guardado con
  // el texto todavía sin la etiqueta nueva).
  const botonFormato = (Icono, tag, etiqueta) => (
    <button
      type="button"
      title={etiqueta}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => cuerpoRef.current && envolverSeleccion(cuerpoRef.current, cuerpo, tag, setCuerpo)}
      className="p-1.5 rounded"
      style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
    >
      <Icono size={13} />
    </button>
  );

  return (
    <div className="p-3 rounded space-y-2" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <div className="flex items-start justify-between gap-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => titulo !== n.titulo && onCambiar({ ...n, titulo })}
          placeholder="Título de la novedad"
          className="flex-1"
          style={{ ...inputStyle, fontFamily: "'Fraunces', serif", fontWeight: 600 }}
        />
        <button onClick={() => onEliminar(n.id)} title="Eliminar esta novedad" className="p-1">
          <Trash2 size={16} style={{ color: C.wax }} />
        </button>
      </div>
      <div className="flex items-center gap-1">
        {botonFormato(Bold, "b", "Negrita")}
        {botonFormato(Italic, "i", "Cursiva")}
        {botonFormato(Underline, "u", "Subrayado")}
      </div>
      <textarea
        ref={cuerpoRef}
        value={cuerpo}
        onChange={(e) => setCuerpo(e.target.value)}
        onBlur={() => cuerpo !== n.cuerpo && onCambiar({ ...n, cuerpo })}
        rows={3}
        placeholder="Texto de la novedad — selecciona texto y pulsa un botón de arriba para darle formato"
        className="w-full"
        style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs" style={{ color: C.charcoal, opacity: 0.75 }}>
          <input
            type="checkbox"
            checked={n.publicada}
            onChange={(e) => onCambiar({ ...n, publicada: e.target.checked })}
          />
          Publicada (visible en el tablón)
        </label>
        <span className="text-xs" style={{ color: C.charcoal, opacity: 0.5 }}>
          {formatearFecha(String(n.creadaEn).slice(0, 10))}
        </span>
      </div>
    </div>
  );
}

export function VentanaNovedades({ data, onCerrar }) {
  const { evento, persistEvento, novedades, persistNovedades, tokenTablon } = data;
  const [copiado, setCopiado] = useState(false);
  // Enlace de INVITACIÓN al grupo (chat.whatsapp.com/XXXX) -- a propósito
  // no es tu número de teléfono: un botón basado en número abriría un
  // chat 1 a 1 contigo, y con ~140 confirmados eso te dejaría recibiendo
  // mensajes directos de todos, anulando la figura del colaborador como
  // intermediario. Se genera desde la propia WhatsApp: abre el grupo →
  // Info del grupo → Invitar mediante enlace → copiar enlace.
  const [enlaceWhatsapp, setEnlaceWhatsapp] = useState(evento.enlaceGrupoWhatsapp || "");
  useEffect(() => setEnlaceWhatsapp(evento.enlaceGrupoWhatsapp || ""), [evento.enlaceGrupoWhatsapp]);

  const enlace =
    tokenTablon && evento.urlPublica
      ? `${evento.urlPublica.replace(/\/$/, "")}?tablon=${tokenTablon}`
      : "";

  const anadir = () => {
    persistNovedades([
      { id: uid(), titulo: "", cuerpo: "", publicada: true, creadaEn: new Date().toISOString() },
      ...novedades,
    ]);
  };

  const cambiar = (siguiente) => {
    persistNovedades(novedades.map((n) => (n.id === siguiente.id ? siguiente : n)));
  };

  const eliminar = (id) => {
    persistNovedades(novedades.filter((n) => n.id !== id));
  };

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (_) {
      window.prompt("Copia el enlace manualmente:", enlace);
    }
  };

  return (
    <VentanaFlotante clave="novedades" titulo="Novedades" onCerrar={onCerrar}>
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
        Tablón público de solo lectura para los ya confirmados — compártelo una vez en el
        grupo de WhatsApp en vez de mandar avisos largos ahí. La fecha/hora/lugar del
        evento aparecen fijos arriba de las novedades; nadie sin el enlace lo encuentra.
      </p>

      <div
        className="flex items-center gap-2 p-2 rounded mb-3"
        style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
      >
        <LinkIcon size={14} style={{ color: C.gold, flexShrink: 0 }} />
        {enlace ? (
          <>
            <span
              className="flex-1 text-xs truncate"
              style={{ color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}
              title={enlace}
            >
              {enlace}
            </span>
            <button
              onClick={copiarEnlace}
              className="text-xs px-2 py-1 rounded whitespace-nowrap flex items-center gap-1"
              style={{ background: copiado ? C.ink : "transparent", border: `1px solid ${C.ink}`, color: copiado ? C.paper : C.ink }}
            >
              {copiado ? (
                <>
                  <Check size={12} /> Copiado
                </>
              ) : (
                "Copiar enlace"
              )}
            </button>
          </>
        ) : (
          <span className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
            {evento.urlPublica
              ? "Cargando el enlace…"
              : "Rellena primero la URL web en Configuración → URL web."}
          </span>
        )}
      </div>

      <div
        className="p-2 rounded mb-3"
        style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
      >
        <label className="text-xs block mb-1" style={{ color: C.charcoal, opacity: 0.75 }}>
          Enlace de invitación al grupo de WhatsApp (WhatsApp → grupo → Info del grupo →
          Invitar mediante enlace) — para avisar rápido "hay novedades nuevas" sin dejar que
          te escriban a ti directamente.
        </label>
        <div className="flex items-center gap-2">
          <input
            value={enlaceWhatsapp}
            onChange={(e) => setEnlaceWhatsapp(e.target.value)}
            onBlur={() =>
              enlaceWhatsapp !== (evento.enlaceGrupoWhatsapp || "") &&
              persistEvento({ ...evento, enlaceGrupoWhatsapp: enlaceWhatsapp })
            }
            placeholder="https://chat.whatsapp.com/XXXXXXXXXXXX"
            className="flex-1"
            style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}
          />
          <a
            href={evento.enlaceGrupoWhatsapp || undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => !evento.enlaceGrupoWhatsapp && e.preventDefault()}
            className="text-xs px-2 py-1.5 rounded whitespace-nowrap flex items-center gap-1"
            style={{
              background: evento.enlaceGrupoWhatsapp ? "#25D366" : C.line,
              color: evento.enlaceGrupoWhatsapp ? "#fff" : C.charcoal,
              opacity: evento.enlaceGrupoWhatsapp ? 1 : 0.6,
              cursor: evento.enlaceGrupoWhatsapp ? "pointer" : "not-allowed",
            }}
            title={evento.enlaceGrupoWhatsapp ? "Abrir el grupo en WhatsApp" : "Pega antes el enlace del grupo"}
          >
            <MessageCircle size={13} /> Abrir grupo
          </a>
        </div>
      </div>

      <button
        onClick={anadir}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium mb-3"
        style={{ background: C.ink, color: C.paper }}
      >
        <Plus size={14} /> Nueva novedad
      </button>

      <div className="space-y-2">
        {novedades.map((n) => (
          <NovedadCard key={n.id} n={n} onCambiar={cambiar} onEliminar={eliminar} />
        ))}
        {novedades.length === 0 && (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
            Todavía no hay ninguna novedad escrita.
          </p>
        )}
      </div>
    </VentanaFlotante>
  );
}
