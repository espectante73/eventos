// Tablón público de novedades — página de solo lectura, sin login ni
// cuenta, accesible solo con el enlace secreto (?tablon=<token>, ver
// VentanaNovedades.jsx). Pensada para sustituir/complementar el grupo de
// WhatsApp "solo lectura" con el que el anfitrión avisa a los ya
// confirmados: se comparte UN enlace en ese grupo, y crece con él sin
// que nadie tenga que repartir enlaces nuevos.
//
// Deliberadamente independiente de useLedgerData/App.jsx: no hay rol, no
// hay sesión, nada que resolver — solo un token de solo lectura. App.jsx
// la monta ANTES de tocar nada de sesión/login en cuanto detecta
// ?tablon= en la URL (ver el routing al principio de App.jsx).
import { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, Clock, MapPin, ChevronDown, Lock, Music, Pause } from "lucide-react";
import { C, inputStyle } from "../theme";
import { supabase } from "../supabaseClient";
import { formatearFecha, formatearDiaSemana } from "../lib/formato";
import { InfoItem } from "../components/Portada";

const BUCKET_MUSICA = "musica-ambiental";
const BUCKET_CRONOGRAMA = "cronograma";
const RUTA_CRONOGRAMA = "cronograma.jpg";

export function VistaTablon({ token }) {
  // "cargando" | "invalido" | "bloqueado" | "listo"
  const [estado, setEstado] = useState("cargando");
  const [evento, setEvento] = useState(null);
  const [novedades, setNovedades] = useState([]);
  // Solo una novedad abierta a la vez -- a petición del usuario: con 5+
  // novedades, tenerlas todas desplegadas de golpe (o ir abriendo varias
  // sin plegar las anteriores) era un muro de texto imposible de leer.
  const [idAbierto, setIdAbierto] = useState(null);

  // ---------- Pregunta de acceso (capa extra sobre el enlace en sí) ----------
  // A petición del usuario, 2026-08-25: aunque el enlace se reenvíe fuera
  // del grupo, sin la respuesta correcta el tablón no enseña nada -- ni
  // siquiera la fecha/hora/lugar del evento. La respuesta correcta ya
  // usada se recuerda en ESTE dispositivo (localStorage), para no tener
  // que volver a escribirla cada vez que se abre el enlace.
  const claveLocalStorage = `tablon-respuesta-${token}`;
  const [pregunta, setPregunta] = useState("");
  const [respuestaEscrita, setRespuestaEscrita] = useState("");
  const [errorRespuesta, setErrorRespuesta] = useState("");
  const [comprobando, setComprobando] = useState(false);
  // La respuesta YA verificada -- se manda en cada refresco periódico
  // (tablon_listar_novedades la exige también, no solo el token), pero
  // vive en un ref (no en estado) porque no hace falta que dispare
  // ningún re-render por sí sola.
  const respuestaVerificadaRef = useRef("");

  // ---------- Música ambiental ----------
  // Los navegadores bloquean el audio automático hasta que la propia
  // persona interactúa con la página -- por eso esto nunca sale sola
  // sola, siempre hace falta el primer clic en el botón de abajo.
  const [pistas, setPistas] = useState([]);
  const [sonando, setSonando] = useState(false);
  const audioRef = useRef(null);
  const indicePistaRef = useRef(0);

  useEffect(() => {
    (async () => {
      const { data: archivos } = await supabase.storage.from(BUCKET_MUSICA).list();
      const urls = (archivos || [])
        .filter((f) => f.name && !f.name.startsWith("."))
        .map((f) => supabase.storage.from(BUCKET_MUSICA).getPublicUrl(f.name).data.publicUrl);
      setPistas(urls);
    })();
  }, []);

  const siguientePista = useCallback(() => {
    if (pistas.length === 0 || !audioRef.current) return;
    indicePistaRef.current = (indicePistaRef.current + 1) % pistas.length;
    audioRef.current.src = pistas[indicePistaRef.current];
    audioRef.current.play().catch(() => {});
  }, [pistas]);

  const alternarMusica = () => {
    if (!audioRef.current || pistas.length === 0) return;
    if (sonando) {
      audioRef.current.pause();
      setSonando(false);
    } else {
      if (!audioRef.current.src) audioRef.current.src = pistas[indicePistaRef.current];
      audioRef.current.play().then(() => setSonando(true)).catch(() => {});
    }
  };

  // Carga fecha/hora/lugar + novedades -- solo se llama una vez superada
  // la pregunta de acceso (o si no hay ninguna configurada).
  const cargarContenido = useCallback(
    async () => {
      const [{ data: eventoFilas }, { data: novedadesFilas }] = await Promise.all([
        supabase.from("evento").select("*").limit(1),
        supabase.rpc("tablon_listar_novedades", { p_token: token, p_respuesta: respuestaVerificadaRef.current }),
      ]);
      setEvento(eventoFilas && eventoFilas[0] ? eventoFilas[0] : null);
      setNovedades(novedadesFilas || []);
      // Todas plegadas por defecto (ni siquiera la más reciente se abre
      // sola) -- a petición del usuario, 2026-08-25. Sigue habiendo como
      // mucho una abierta a la vez (ver `alternar`, más abajo).
      setEstado("listo");
    },
    [token]
  );

  // Primer arranque: valida el token, mira si hace falta responder a
  // algo, y si este dispositivo ya tiene una respuesta guardada de una
  // vez anterior (y sigue siendo válida -- el anfitrión pudo cambiar la
  // pregunta desde entonces), pasa directo sin volver a preguntar.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data: esValido } = await supabase.rpc("tablon_verificar_token", { p_token: token });
      if (cancelado) return;
      if (esValido !== true) {
        setEstado("invalido");
        return;
      }
      const { data: preguntaTexto } = await supabase.rpc("tablon_obtener_pregunta", { p_token: token });
      if (cancelado) return;
      if (!preguntaTexto) {
        cargarContenido();
        return;
      }
      setPregunta(preguntaTexto);
      let guardada = "";
      try {
        guardada = window.localStorage.getItem(claveLocalStorage) || "";
      } catch (_) {
        // Almacenamiento no disponible (navegación privada estricta...)
        // -- se pedirá la respuesta cada vez, sin más.
      }
      if (guardada) {
        const { data: sigueValiendo } = await supabase.rpc("tablon_verificar_respuesta", {
          p_token: token,
          p_respuesta: guardada,
        });
        if (cancelado) return;
        if (sigueValiendo === true) {
          respuestaVerificadaRef.current = guardada;
          cargarContenido();
          return;
        }
        try {
          window.localStorage.removeItem(claveLocalStorage);
        } catch (_) {
          // Nada que hacer si tampoco se puede borrar.
        }
      }
      setEstado("bloqueado");
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- claveLocalStorage se deriva de `token`, no hace falta repetirlo
  }, [token, cargarContenido]);

  // Refresco periódico -- solo tiene sentido una vez desbloqueado (antes
  // de eso no hay nada real que refrescar).
  useEffect(() => {
    if (estado !== "listo") return;
    const intervalo = setInterval(() => cargarContenido(), 60 * 1000);
    const alVolverVisible = () => {
      if (document.visibilityState === "visible") cargarContenido();
    };
    document.addEventListener("visibilitychange", alVolverVisible);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolverVisible);
    };
  }, [estado, cargarContenido]);

  const enviarRespuesta = async (e) => {
    e.preventDefault();
    setComprobando(true);
    setErrorRespuesta("");
    const { data: esCorrecta } = await supabase.rpc("tablon_verificar_respuesta", {
      p_token: token,
      p_respuesta: respuestaEscrita,
    });
    setComprobando(false);
    if (esCorrecta !== true) {
      setErrorRespuesta("Respuesta incorrecta — inténtalo otra vez.");
      return;
    }
    try {
      window.localStorage.setItem(claveLocalStorage, respuestaEscrita);
    } catch (_) {
      // Sin almacenamiento disponible, no pasa nada -- solo tocará
      // responder de nuevo la próxima vez.
    }
    respuestaVerificadaRef.current = respuestaEscrita;
    cargarContenido();
  };

  const alternar = (id) => {
    setIdAbierto((actual) => (actual === id ? null : id));
  };

  if (estado === "cargando") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Fraunces', serif" }}
      >
        Cargando…
      </div>
    );
  }

  if (estado === "invalido") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Inter', sans-serif" }}
      >
        <div className="max-w-md w-full p-6 rounded-lg text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <h1 className="text-xl mb-2" style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700 }}>
            Enlace no válido
          </h1>
          <p className="text-sm" style={{ color: C.charcoal, opacity: 0.8 }}>
            Este enlace no funciona o ha caducado. Pide al anfitrión que te pase el enlace
            correcto del tablón.
          </p>
        </div>
      </div>
    );
  }

  if (estado === "bloqueado") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Inter', sans-serif" }}
      >
        <form
          onSubmit={enviarRespuesta}
          className="max-w-sm w-full p-6 rounded-lg"
          style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: C.gold }}>
            <Lock size={18} />
            <h1 className="text-lg" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700 }}>
              Antes de entrar…
            </h1>
          </div>
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            {pregunta}
          </p>
          <input
            autoFocus
            value={respuestaEscrita}
            onChange={(e) => setRespuestaEscrita(e.target.value)}
            className="w-full mb-2"
            style={{ ...inputStyle, width: "100%", height: 42 }}
            required
          />
          {errorRespuesta && (
            <p className="text-sm mb-2" style={{ color: C.wax }}>
              {errorRespuesta}
            </p>
          )}
          <button
            type="submit"
            disabled={comprobando}
            className="boton-3d boton-verde-solido w-full py-2 rounded-full font-medium"
            style={{ height: 44 }}
          >
            {comprobando ? "Comprobando…" : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.paper }}>
      {/* Botón de música flotante: solo aparece si hay al menos una pista
          subida (Configuración → Fondo musical). El primer clic de
          cada visitante es obligatorio -- ver el comentario de más arriba
          sobre el bloqueo de autoplay de los navegadores. */}
      {pistas.length > 0 && (
        <>
          <audio ref={audioRef} onEnded={siguientePista} />
          <button
            onClick={alternarMusica}
            className="fixed bottom-5 right-5 flex items-center justify-center rounded-full boton-3d"
            style={{ width: 52, height: 52, background: C.ink, color: C.paper, zIndex: 50 }}
            title={sonando ? "Pausar la música" : "Activar fondo musical"}
          >
            {sonando ? <Pause size={20} /> : <Music size={20} />}
          </button>
        </>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <a href="/" className="text-xs underline" style={{ color: C.charcoal, opacity: 0.6 }}>
            ← Volver a la web
          </a>
          <span className="flex items-center gap-1 text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
            <Lock size={11} /> Enlace privado — no lo compartas fuera del grupo
          </span>
        </div>

        {evento && (
          <div
            className="rounded-lg px-5 py-5 mb-6"
            style={{ background: "linear-gradient(180deg, #1F3A2E 0%, #24402F 100%)" }}
          >
            {evento.nombre && (
              <h1 className="text-2xl mb-3" style={{ fontFamily: "'Fraunces', serif", color: "#fff", fontWeight: 700 }}>
                {evento.nombre}
              </h1>
            )}
            <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
              <InfoItem
                claro
                icon={Calendar}
                label="Fecha"
                value={evento.fecha ? [formatearDiaSemana(evento.fecha), formatearFecha(evento.fecha)] : "—"}
              />
              <InfoItem claro icon={Clock} label="Hora" value={evento.hora || "—"} />
              <InfoItem claro icon={MapPin} label="Lugar" value={evento.lugar || "—"} />
            </div>
          </div>
        )}

        {/* Cronograma/logística del día -- imagen única que sube el
            anfitrión desde Configuración → Cronograma (mismo patrón que
            og-imagen: nombre de archivo fijo, así que este enlace nunca
            deja de funcionar aunque la reemplace más adelante). Oculto
            por defecto -- solo se ve aquí si el anfitrión ha marcado
            "Visible para invitados" en esa misma ventana. Si además
            todavía no ha subido ninguna, el bucket devuelve 404 y la
            imagen se oculta igual -- no hay nada que mostrar en ese
            caso, ni conviene un aviso de error real. */}
        {evento?.cronogramaVisibleInvitados && (
          <img
            src={supabase.storage.from(BUCKET_CRONOGRAMA).getPublicUrl(RUTA_CRONOGRAMA).data.publicUrl}
            alt="Cronograma del día"
            className="w-full rounded-lg mb-6"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}

        <h2
          className="text-sm uppercase mb-1"
          style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}
        >
          FAQ
        </h2>
        <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.6 }}>
          Información relativa al evento dividida por secciones
        </p>

        <div className="space-y-2">
          {novedades.map((n) => {
            const abierta = idAbierto === n.id;
            return (
              <div key={n.id} className="rounded-lg overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                <button
                  onClick={() => alternar(n.id)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap font-medium flex-shrink-0"
                      style={
                        n.esNovedad
                          ? { background: C.ink, color: C.paper }
                          : { border: `1px solid ${C.line}`, color: C.charcoal, opacity: 0.7 }
                      }
                    >
                      {n.esNovedad ? "NOVEDADES" : "FAQ"}
                    </span>
                    <span className="truncate" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                      {n.titulo || "(sin título)"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: C.charcoal, opacity: 0.5 }}>
                      {formatearFecha(String(n.creadaEn).slice(0, 10))}
                    </span>
                    <ChevronDown
                      size={16}
                      style={{ color: C.gold, transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </span>
                </button>
                {abierta && (
                  <div
                    className="px-4 pt-3 pb-4 text-sm"
                    style={{
                      color: C.charcoal,
                      borderTop: `1px solid ${C.line}`,
                      // Sin esto, un salto de línea o un tabulador sueltos
                      // (Enter/Tab en VentanaNovedades) se colapsan como
                      // cualquier espacio en blanco de HTML normal -- con
                      // "pre-wrap" se ven de verdad, y el texto sigue
                      // rompiendo línea solo si no cabe (no queda todo en
                      // una única línea horizontal interminable).
                      whiteSpace: "pre-wrap",
                    }}
                    // El anfitrión es el único que escribe este HTML (admite
                    // <b>/<br> sencillo, mismo criterio que las plantillas de
                    // email en Configuración) -- no es contenido de terceros.
                    dangerouslySetInnerHTML={{ __html: n.cuerpo }}
                  />
                )}
              </div>
            );
          })}
          {novedades.length === 0 && (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía no hay ninguna novedad publicada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
