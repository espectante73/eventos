// Ventana "Novedades": el anfitrión escribe aquí el tablón de anuncios
// público de solo lectura (VistaTablon.jsx) — sustituye/complementa al
// grupo de WhatsApp "tablón" donde los ya confirmados solo pueden leer.
// Un único enlace (?tablon=<token>) se comparte una vez en ese grupo;
// cualquiera con el enlace ve las novedades publicadas, sin login ni
// cuenta — a petición del usuario, 2026-08-25.
import { useState, useRef } from "react";
import { Plus, Trash2, Link as LinkIcon, Check, Bold, Italic, Underline, List, MessageCircle, ChevronDown, Lock, Undo2, AlertTriangle } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { uid } from "../../lib/id";
import { formatearFecha } from "../../lib/formato";
import { construirEnlaceTablon } from "../../lib/url";
// envolverSeleccion vive en su propio módulo desde 2026-08-27 -- se
// reutiliza también en VentanaConfigPlantillasEmail.jsx (mismos botones
// de negrita/cursiva/subrayado, a petición del usuario).
import { envolverSeleccion } from "../../lib/textoEnriquecido";
// "Deshacer" en vivo (antes de guardar) + historial guardado en
// servidor (después de guardar) -- a petición del usuario, 2026-08-29.
// Ver los comentarios de cada módulo para la diferencia entre los dos.
import { useDeshacer } from "../../lib/useDeshacer";
import { BotonHistorial } from "../../components/HistorialTexto";

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

function NovedadCard({ n, onCambiar, onEliminar, expandida, onAlternar, soloTexto, obtenerHistorialTexto }) {
  const [titulo, setTitulo] = useState(n.titulo);
  // useDeshacer sustituye al simple useState de antes: mismo valor
  // controlado (`cuerpo`), pero guarda "fotos" para poder volver atrás
  // con el botón Deshacer sin tocar el servidor -- ver lib/useDeshacer.js.
  const { valor: cuerpo, cambiar: setCuerpo, deshacer, puedeDeshacer, fijarValor: fijarCuerpo } = useDeshacer(n.cuerpo);
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
        <span
          className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap font-medium"
          style={
            n.esNovedad
              ? { background: C.ink, color: C.paper }
              : { border: `1px solid ${C.line}`, color: C.charcoal, opacity: 0.7 }
          }
        >
          {n.esNovedad ? "NOVEDADES" : "FAQ"}
        </span>
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
        <button
          onClick={() => onEliminar(n.id)}
          disabled={soloTexto}
          title={soloTexto ? "No tienes permiso para borrar novedades" : "Eliminar esta novedad"}
          className="p-1 flex-shrink-0"
          style={{ opacity: soloTexto ? 0.3 : 1, cursor: soloTexto ? "not-allowed" : "pointer" }}
        >
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
            <div style={{ width: 1, alignSelf: "stretch", background: C.line }} />
            <button
              type="button"
              title="Deshacer (vuelve a como estaba antes de tu último cambio, sin guardar)"
              onMouseDown={(e) => e.preventDefault()}
              onClick={deshacer}
              disabled={!puedeDeshacer}
              className="p-1.5 rounded"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal, opacity: puedeDeshacer ? 1 : 0.35 }}
            >
              <Undo2 size={13} />
            </button>
            {!soloTexto && (
              <BotonHistorial
                obtenerHistorial={() => obtenerHistorialTexto("novedad", n.id, "cuerpo")}
                onRestaurar={(valorAnterior) => {
                  fijarCuerpo(valorAnterior);
                  onCambiar({ ...n, cuerpo: valorAnterior });
                }}
              />
            )}
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
          {/* A diferencia del resto de controles de esta ventana, "Publicada"
              SÍ queda accesible para quien solo tiene permiso de editar
              texto -- a petición del usuario, 2026-08-27: editar el texto
              lleva implícita la opción de publicarlo o no. Reforzado
              también en el servidor (colaborador_guardar_novedades ya
              acepta "publicada", no solo título/cuerpo). */}
          <label className="flex items-center gap-1.5 text-xs" style={{ color: C.charcoal, opacity: 0.75 }}>
            <input
              type="checkbox"
              checked={n.publicada}
              onChange={(e) => onCambiar({ ...n, publicada: e.target.checked })}
            />
            Publicada (visible en el tablón)
          </label>
          <label
            className="flex items-center gap-1.5 text-xs"
            style={{ color: C.charcoal, opacity: soloTexto ? 0.35 : 0.75 }}
            title={soloTexto ? "No tienes permiso para cambiar esto" : undefined}
          >
            <input
              type="checkbox"
              disabled={soloTexto}
              checked={n.esNovedad}
              onChange={(e) => onCambiar({ ...n, esNovedad: e.target.checked })}
            />
            Marcarla como "NOVEDADES" (si no, se etiqueta "FAQ")
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
// `soloTexto`: true para un colaborador con el permiso
// PERMISOS.NOVEDADES_EDITAR (nunca para el anfitrión) -- puede editar
// título/cuerpo de las novedades ya existentes, pero todo lo demás
// (crear, borrar, publicar, marcar NOVEDADES/FAQ, enlace, WhatsApp,
// pregunta de acceso) queda deshabilitado y atenuado, a petición del
// usuario, 2026-08-25.
export function VentanaNovedades({ data, ventana, soloTexto = false }) {
  const {
    evento,
    persistEvento,
    novedades,
    persistNovedades,
    tokenTablon,
    preguntaTablon,
    persistPreguntaTablon,
    obtenerHistorialTexto,
    accesosTablonSospechosos,
  } = data;
  const [copiado, setCopiado] = useState(false);
  // Pie plegado por defecto -- a petición del usuario, 2026-08-27, para
  // no tener siempre a la vista la pregunta de acceso/WhatsApp/ocultar
  // fecha. Y ni siquiera se muestra si soloTexto: es exclusivo del
  // administrador (quien solo edita texto ya tiene su propio acceso al
  // check de "Publicada", más arriba, sin necesitar nada de este pie).
  const [pieAbierto, setPieAbierto] = useState(false);
  // Enlace de INVITACIÓN al grupo (chat.whatsapp.com/XXXX) -- a propósito
  // no es tu número de teléfono: un botón basado en número abriría un
  // chat 1 a 1 contigo, y con ~140 confirmados eso te dejaría recibiendo
  // mensajes directos de todos, anulando la figura del colaborador como
  // intermediario. Se genera desde la propia WhatsApp: abre el grupo →
  // Info del grupo → Invitar mediante enlace → copiar enlace.
  // Se inicializa UNA sola vez, al montar (useState solo lee su
  // argumento la primera vez) -- se probó con un useEffect que la
  // volvía a copiar cada vez que `evento` cambiaba (para reflejar datos
  // que llegan tarde, la primerísima vez que se abre la ventana), pero
  // eso mismo la reescribía a mitad de escribir: guardar la pregunta
  // (más abajo) refresca `data` entero, ese refresco llega aquí como un
  // `evento`/`preguntaTablon` nuevos, y el useEffect borraba lo que ya
  // se hubiera tecleado en el campo de al lado antes de darle tiempo a
  // terminar -- bug real reportado por el usuario, 2026-08-25. Mismo
  // patrón ya usado sin este problema en NovedadCard (más arriba): solo
  // se inicializa al montar, se guarda al salir del campo (onBlur).
  const [enlaceWhatsapp, setEnlaceWhatsapp] = useState(evento.enlaceGrupoWhatsapp || "");

  // Texto de acceso al tablón -- desde 2026-08-29 ya no hay una
  // "respuesta correcta" que editar aquí: el acceso se comprueba contra
  // los invitados confirmados (ver schema.sql). Este campo es solo el
  // REDACTADO que ve la persona antes de entrar.
  const [pregunta, setPregunta] = useState(preguntaTablon);
  const [errorPregunta, setErrorPregunta] = useState("");
  const guardarPregunta = async () => {
    if (pregunta === preguntaTablon) return;
    const ok = await persistPreguntaTablon(pregunta);
    setErrorPregunta(ok ? "" : "No se ha podido guardar — vuelve a intentarlo.");
  };

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
    const nueva = {
      id: uid(),
      titulo: "",
      cuerpo: "",
      // Nace como BORRADOR (no publicada) -- a petición del usuario,
      // 2026-08-30: escribir tranquilo y publicar a propósito cuando
      // esté lista, en vez de que aparezca en el tablón público desde
      // la primera letra.
      publicada: false,
      creadaEn: new Date().toISOString(),
      // NOVEDADES por defecto -- a petición del usuario, 2026-08-30
      // (antes era FAQ): invierte el criterio de la v6.8.
      esNovedad: true,
    };
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
  // ⚠️ Usa `ventana.navigator`/`ventana.open`, NUNCA los globales
  // `navigator`/`window` a secas -- segundo bug real encontrado en
  // producción el 2026-08-25 (el primero, reordenar portapapeles antes
  // de window.open, no bastó). Este componente vive en una ventana
  // emergente (ver usePopupWindow.js), pero su CÓDIGO sigue ejecutándose
  // técnicamente en el realm de JavaScript de la pestaña principal --
  // ahí es donde se cargó el script. El portapapeles del navegador
  // comprueba qué ventana tiene el foco de verdad ANTES de dejar
  // escribir en él; como la que tiene el foco es la emergente pero
  // `navigator` a secas apunta al `navigator` de la pestaña principal
  // (no focalizada), el navegador lo rechazaba en silencio -- sin
  // ninguna alerta, solo dejaba el portapapeles tal cual estuviera
  // antes. `ventana` (prop, el propio objeto `window` de esa ventana
  // emergente, expuesto por usePopupWindow.js) sí tiene el foco real, y
  // su propio `.navigator`/`.open()` funcionan con permisos correctos.
  const copiarYAbrirGrupo = () => {
    const ventanaPropia = ventana || window; // por si acaso, nunca debería faltar
    ventanaPropia.navigator.clipboard.writeText(enlace).then(
      () => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      },
      () => ventanaPropia.prompt("Copia el enlace manualmente:", enlace)
    );
    if (evento.enlaceGrupoWhatsapp) {
      ventanaPropia.open(evento.enlaceGrupoWhatsapp, "_blank", "noopener,noreferrer");
    }
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
            disabled={!enlace || soloTexto}
            title={
              soloTexto
                ? "No tienes permiso para esto"
                : enlace
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
            style={{ color: C.goldClaro, opacity: enlace && !soloTexto ? 1 : 0.35 }}
          >
            {copiado ? <Check size={16} /> : <LinkIcon size={16} />}
            Enlace
          </button>
          <button
            onClick={anadir}
            disabled={soloTexto}
            title={soloTexto ? "No tienes permiso para esto" : "Nueva novedad"}
            className="boton-3d rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium"
            style={{ color: C.goldClaro, opacity: soloTexto ? 0.35 : 1 }}
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
            soloTexto={soloTexto}
            obtenerHistorialTexto={obtenerHistorialTexto}
          />
        ))}
        {novedades.length === 0 && (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
            Todavía no hay ninguna novedad escrita.
          </p>
        )}
      </div>

      {/* Pie exclusivo del administrador -- a petición del usuario,
          2026-08-27: quien solo tiene permiso de editar texto ya tiene su
          propio acceso al check de "Publicada" (más arriba, en cada
          novedad); no necesita ver ni la pregunta de acceso, ni el
          enlace de WhatsApp, ni "ocultar fecha" -- así que ni siquiera se
          muestra para él, en vez de solo deshabilitarlo. Plegado por
          defecto para el administrador (menos ocupado en pantalla al
          entrar). */}
      {!soloTexto && (
        <>
          <button
            onClick={() => setPieAbierto((a) => !a)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs w-full"
            style={{ color: C.charcoal, opacity: 0.7, flexShrink: 0, borderTop: `1px solid ${C.line}` }}
          >
            <ChevronDown size={14} style={{ transform: pieAbierto ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            Grupo de WhatsApp y pregunta de acceso
          </button>
          {pieAbierto && (
            <div className="px-4 py-3 space-y-2" style={{ flexShrink: 0 }}>
              <div className="flex items-center gap-2">
                <Lock size={14} style={{ color: C.gold, flexShrink: 0 }} />
          <input
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            onBlur={guardarPregunta}
            placeholder="Texto que ve la persona antes de entrar"
            title="El acceso en sí ya no depende de esto -- solo comprueba nombre y apellido contra los confirmados. Esto es solo el redactado que ve la persona."
            className="flex-1"
            style={{ ...inputStyle, fontSize: 12 }}
          />
        </div>
        {errorPregunta && (
          <p className="text-xs" style={{ color: C.wax }}>
            ⚠ {errorPregunta}
          </p>
        )}
        {accesosTablonSospechosos.length > 0 && (
          <div className="flex items-start gap-2 p-2 rounded text-xs" style={{ background: C.avisoFondo, color: C.peligro }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="font-medium">Nombres usados desde varios dispositivos:</p>
              {accesosTablonSospechosos.map((a) => (
                <p key={a.nombreNormalizado}>
                  "{a.nombreNormalizado}" — {a.numDispositivos} dispositivos distintos
                </p>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
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
              {/* Ocultar solo la fecha en el tablón público -- a petición
                  del usuario, 2026-08-27, con carácter TEMPORAL (p.ej.
                  mientras todavía no quiere que los confirmados sepan el
                  día exacto). No afecta a la fecha en ningún otro sitio
                  (portada, invitación, Datos evento) -- solo a esta
                  pantalla pública. */}
              <label className="flex items-center gap-2 text-xs" style={{ color: C.charcoal }}>
                <input
                  type="checkbox"
                  checked={Boolean(evento.tablonOcultarFecha)}
                  onChange={(e) => persistEvento({ ...evento, tablonOcultarFecha: e.target.checked })}
                />
                Ocultar la fecha en el tablón público (temporalmente)
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
}
