// Ventana "Novedades": el anfitrión escribe aquí el tablón de anuncios
// público de solo lectura (VistaTablon.jsx) — sustituye/complementa al
// grupo de WhatsApp "tablón" donde los ya confirmados solo pueden leer.
// Un único enlace (?tablon=<token>) se comparte una vez en ese grupo;
// cualquiera con el enlace ve las novedades publicadas, sin login ni
// cuenta — a petición del usuario, 2026-08-25.
import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Link as LinkIcon, Check, Bold, Italic, Underline, List, MessageCircle, ChevronDown } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { uid } from "../../lib/id";
import { formatearFecha } from "../../lib/formato";
import { construirEnlaceTablon } from "../../lib/url";

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

// Añade "prefijo" al principio de cada línea tocada por la selección
// actual (o solo la línea del cursor, si no hay nada seleccionado) --
// usado para el botón de viñetas. Encuentra los límites de línea a mano
// (el último "\n" antes del cursor / el primero después) en vez de
// depender de que la selección ya empiece y acabe justo en un salto de
// línea, para que funcione igual seleccionando texto a medias.
function prefijarLineas(textarea, valor, prefijo, onCambio) {
  const inicio = textarea.selectionStart;
  const fin = textarea.selectionEnd;
  const inicioBloque = valor.lastIndexOf("\n", inicio - 1) + 1;
  const finNewline = valor.indexOf("\n", fin);
  const finBloque = finNewline === -1 ? valor.length : finNewline;
  const bloque = valor.slice(inicioBloque, finBloque);
  const nuevoBloque = bloque
    .split("\n")
    .map((linea) => (linea.startsWith(prefijo) ? linea : prefijo + linea))
    .join("\n");
  const nuevo = valor.slice(0, inicioBloque) + nuevoBloque + valor.slice(finBloque);
  onCambio(nuevo);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(inicioBloque, inicioBloque + nuevoBloque.length);
  });
}

function NovedadCard({ n, onCambiar, onEliminar, expandida, onAlternar }) {
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

  const anadirVineta = () => {
    if (cuerpoRef.current) prefijarLineas(cuerpoRef.current, cuerpo, "• ", setCuerpo);
  };

  // Tab en un <textarea> normal salta al siguiente campo del formulario
  // en vez de escribir nada -- hay que interceptarlo a propósito para
  // que sirva de sangría. Junto con el "white-space: pre-wrap" del
  // tablón público (VistaTablon.jsx), el tabulador y los saltos de línea
  // sueltos ya se ven de verdad ahí, no solo aquí mientras se escribe.
  const manejarTeclado = (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = e.target;
    const inicio = ta.selectionStart;
    const fin = ta.selectionEnd;
    const nuevo = cuerpo.slice(0, inicio) + "\t" + cuerpo.slice(fin);
    setCuerpo(nuevo);
    requestAnimationFrame(() => {
      ta.setSelectionRange(inicio + 1, inicio + 1);
    });
  };

  return (
    <div className="rounded" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={onAlternar}
          title={expandida ? "Plegar" : "Desplegar para editar el texto"}
          className="p-0.5 flex-shrink-0"
        >
          <ChevronDown
            size={16}
            style={{ color: C.gold, transform: expandida ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
          />
        </button>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => titulo !== n.titulo && onCambiar({ ...n, titulo })}
          placeholder="Título de la novedad"
          className="flex-1"
          style={{ ...inputStyle, fontFamily: "'Fraunces', serif", fontWeight: 600 }}
        />
        {!n.publicada && (
          <span
            className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{ background: C.paperDark, color: C.charcoal, opacity: 0.7 }}
          >
            Borrador
          </span>
        )}
        <span className="text-xs whitespace-nowrap" style={{ color: C.charcoal, opacity: 0.5 }}>
          {formatearFecha(String(n.creadaEn).slice(0, 10))}
        </span>
        <button onClick={() => onEliminar(n.id)} title="Eliminar esta novedad" className="p-1 flex-shrink-0">
          <Trash2 size={16} style={{ color: C.wax }} />
        </button>
      </div>
      {expandida && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-1 pt-2">
            {botonFormato(Bold, "b", "Negrita")}
            {botonFormato(Italic, "i", "Cursiva")}
            {botonFormato(Underline, "u", "Subrayado")}
            <button
              type="button"
              title="Viñeta (en la línea actual, o en cada línea seleccionada)"
              onMouseDown={(e) => e.preventDefault()}
              onClick={anadirVineta}
              className="p-1.5 rounded"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              <List size={13} />
            </button>
          </div>
          <textarea
            ref={cuerpoRef}
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            onKeyDown={manejarTeclado}
            onBlur={() => cuerpo !== n.cuerpo && onCambiar({ ...n, cuerpo })}
            rows={3}
            placeholder="Texto de la novedad — Tab sangra, el botón de lista añade viñetas, selecciona texto y usa los botones para darle formato"
            className="w-full"
            style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}
          />
          <label className="flex items-center gap-1.5 text-xs" style={{ color: C.charcoal, opacity: 0.75 }}>
            <input
              type="checkbox"
              checked={n.publicada}
              onChange={(e) => onCambiar({ ...n, publicada: e.target.checked })}
            />
            Publicada (visible en el tablón)
          </label>
        </div>
      )}
    </div>
  );
}

// Contenido de la ventana Novedades -- vive en una ventana de verdad del
// sistema operativo (window.open, ver lib/usePopupWindow.js), no en una
// VentanaFlotante normal como el resto de la app: a petición del
// usuario, 2026-08-25, para poder agrandarla o llevarla a otro monitor
// sin las limitaciones de una ventana flotante dentro de la pestaña. Por
// eso no lleva cabecera arrastrable ni botón de cerrar propio -- la
// ventana del sistema operativo ya trae los suyos.
export function VentanaNovedades({ data }) {
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

  const enlace = construirEnlaceTablon(evento.urlPublica, tokenTablon);

  // Plegadas por defecto, y solo UNA desplegada a la vez -- a petición
  // del usuario: con 5+ novedades ya escritas, tenerlas todas
  // desplegadas de golpe era un muro de texto imposible de repasar (y
  // desplegar una segunda sin plegar la primera solo movía el problema
  // en vez de resolverlo). Una recién creada se despliega sola, plegando
  // cualquier otra que estuviera abierta.
  const [idExpandido, setIdExpandido] = useState(null);
  const alternarExpandida = (id) => {
    setIdExpandido((actual) => (actual === id ? null : id));
  };

  const anadir = () => {
    const nueva = { id: uid(), titulo: "", cuerpo: "", publicada: true, creadaEn: new Date().toISOString() };
    persistNovedades([nueva, ...novedades]);
    setIdExpandido(nueva.id);
  };

  const cambiar = (siguiente) => {
    persistNovedades(novedades.map((n) => (n.id === siguiente.id ? siguiente : n)));
  };

  const eliminar = (id) => {
    persistNovedades(novedades.filter((n) => n.id !== id));
  };

  // Copia el enlace del tablón Y abre el grupo de WhatsApp en un solo
  // clic -- a petición del usuario. Techo real que no se puede saltar:
  // ninguna web (esta ni ninguna otra) puede escribir dentro del cuadro
  // de mensaje de WhatsApp ni pulsar "Enviar" por ti -- es una app ajena
  // sin ninguna puerta para eso. Lo máximo posible es dejarte a un
  // Ctrl/Cmd+V + Enter de terminarlo, en vez de tener que ir a copiar el
  // enlace a otro sitio primero.
  //
  // window.open() va ANTES que el await de portapapeles, no después: si
  // se abriera tras un await, algunos navegadores (Safari sobre todo) ya
  // no lo cuentan como una acción directa del usuario y lo bloquean en
  // silencio.
  const copiarYAbrirGrupo = () => {
    if (evento.enlaceGrupoWhatsapp) {
      window.open(evento.enlaceGrupoWhatsapp, "_blank", "noopener,noreferrer");
    }
    navigator.clipboard.writeText(enlace).then(
      () => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      },
      () => window.prompt("Copia el enlace manualmente:", enlace)
    );
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: "100%", background: C.paper, fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="panel-flotante-cristal flex items-center justify-between px-4 py-3"
        style={{ flexShrink: 0 }}
      >
        <h3 className="text-lg" style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700 }}>
          Novedades
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={copiarYAbrirGrupo}
            disabled={!enlace}
            title={
              enlace
                ? copiado
                  ? "¡Copiado! Pégalo (Ctrl/Cmd+V) en el grupo y dale a enviar"
                  : evento.enlaceGrupoWhatsapp
                  ? "Copia el enlace y abre el grupo de WhatsApp — solo te falta pegarlo y enviarlo"
                  : "Copia el enlace (pega antes el del grupo, en el pie, para que también lo abra)"
                : evento.urlPublica
                ? "Cargando el enlace…"
                : "Rellena primero la URL web en Configuración → URL web"
            }
            className="boton-3d rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium"
            style={{ color: C.goldClaro, opacity: enlace ? 1 : 0.4 }}
          >
            {copiado ? <Check size={16} /> : <LinkIcon size={16} />}
            Enlace
          </button>
          <button
            onClick={anadir}
            title="Nueva novedad"
            className="boton-3d rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium"
            style={{ color: C.goldClaro }}
          >
            <Plus size={16} />
            Nueva
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2" style={{ flex: 1, overflowY: "auto" }}>
        {novedades.map((n) => (
          <NovedadCard
            key={n.id}
            n={n}
            onCambiar={cambiar}
            onEliminar={eliminar}
            expandida={idExpandido === n.id}
            onAlternar={() => alternarExpandida(n.id)}
          />
        ))}
        {novedades.length === 0 && (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
            Todavía no hay ninguna novedad escrita.
          </p>
        )}
      </div>

      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderTop: `1px solid ${C.line}`, flexShrink: 0 }}
      >
        <MessageCircle size={14} style={{ color: "#25D366", flexShrink: 0 }} />
        <input
          value={enlaceWhatsapp}
          onChange={(e) => setEnlaceWhatsapp(e.target.value)}
          onBlur={() =>
            enlaceWhatsapp !== (evento.enlaceGrupoWhatsapp || "") &&
            persistEvento({ ...evento, enlaceGrupoWhatsapp: enlaceWhatsapp })
          }
          placeholder="Enlace de invitación al grupo de WhatsApp"
          title="WhatsApp → grupo → Info del grupo → Invitar mediante enlace"
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
          Abrir grupo
        </a>
      </div>
    </div>
  );
}
