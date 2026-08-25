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
import { C } from "../theme";
import { supabase } from "../supabaseClient";
import { formatearFecha, formatearDiaSemana } from "../lib/formato";
import { InfoItem } from "../components/Portada";

const BUCKET_MUSICA = "musica-ambiental";

export function VistaTablon({ token }) {
  // "cargando" | "invalido" | "listo"
  const [estado, setEstado] = useState("cargando");
  const [evento, setEvento] = useState(null);
  const [novedades, setNovedades] = useState([]);
  // Solo una novedad abierta a la vez -- a petición del usuario: con 5+
  // novedades, tenerlas todas desplegadas de golpe (o ir abriendo varias
  // sin plegar las anteriores) era un muro de texto imposible de leer.
  const [idAbierto, setIdAbierto] = useState(null);

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

  const cargar = useCallback(
    async (primeraVez) => {
      const { data: esValido } = await supabase.rpc("tablon_verificar_token", { p_token: token });
      if (esValido !== true) {
        if (primeraVez) setEstado("invalido");
        return;
      }
      const [{ data: eventoFilas }, { data: novedadesFilas }] = await Promise.all([
        supabase.from("evento").select("*").limit(1),
        supabase.rpc("tablon_listar_novedades", { p_token: token }),
      ]);
      setEvento(eventoFilas && eventoFilas[0] ? eventoFilas[0] : null);
      setNovedades(novedadesFilas || []);
      if (primeraVez && novedadesFilas && novedadesFilas[0]) {
        // La más reciente empieza abierta — el resto, plegado, para que
        // "todo el texto" no se vea como un bloque grande de lectura.
        setIdAbierto(novedadesFilas[0].id);
      }
      setEstado("listo");
    },
    [token]
  );

  useEffect(() => {
    cargar(true);
    // Mismo espíritu que useLedgerData: sin Realtime de verdad, se vuelve
    // a preguntar sola cada minuto y al volver a esta pestaña, para que
    // una novedad nueva aparezca sin que nadie tenga que recargar a mano.
    const intervalo = setInterval(() => cargar(false), 60 * 1000);
    const alVolverVisible = () => {
      if (document.visibilityState === "visible") cargar(false);
    };
    document.addEventListener("visibilitychange", alVolverVisible);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolverVisible);
    };
  }, [cargar]);

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

        <h2
          className="text-sm uppercase mb-2"
          style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}
        >
          Novedades
        </h2>

        <div className="space-y-2">
          {novedades.map((n) => {
            const abierta = idAbierto === n.id;
            return (
              <div key={n.id} className="rounded-lg overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                <button
                  onClick={() => alternar(n.id)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                    {n.titulo || "(sin título)"}
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
