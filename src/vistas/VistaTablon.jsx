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
import { C, inputStyle, OP, S } from "../theme";
import { supabase } from "../supabaseClient";
import { formatearFecha, valorFechaEvento } from "../lib/formato";
import { InfoItem } from "../components/Portada";
import { EnlaceTexto } from "../components/Boton";
import { NotaPrivacidad } from "../components/NotaPrivacidad";
import { TITULO_NOTA_PRIVACIDAD } from "../constants";
import { uid } from "../lib/id";

const BUCKET_MUSICA = "musica-ambiental";

// Aviso de no reenviar. Existía desde agosto como una línea gris al lado
// de "Volver"; pasó a banner rojo el 2026-09-13, al ir a repartir el
// enlace a los ~140 confirmados. Se muestra en DOS sitios -- la pantalla
// de la pregunta y el tablón ya abierto -- así que vive aquí una sola
// vez: retocar el texto en un sitio y olvidar el otro es justo el fallo
// que esto evita.
function AvisoNoCompartir() {
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg px-4 py-3.5"
      style={{ background: C.peligro, color: "#fff" }}
    >
      <Lock size={19} style={{ flexShrink: 0, marginTop: 4 }} />
      <div>
        <p className="text-lg" style={{ fontWeight: 700, letterSpacing: "0.01em" }}>
          NO COMPARTAS ESTE ENLACE.
        </p>
        <p className="text-lg mt-1.5" style={{ lineHeight: 1.45 }}>
          Este es un enlace exclusivo para los invitados confirmados que tienen acceso a él a
          través del grupo de WhatsApp.
        </p>
      </div>
    </div>
  );
}

export function VistaTablon({ token }) {
  // "cargando" | "invalido" | "bloqueado" | "listo"
  const [estado, setEstado] = useState("cargando");
  const [evento, setEvento] = useState(null);
  const [novedades, setNovedades] = useState([]);
  // Solo una novedad abierta a la vez -- a petición del usuario: con 5+
  // novedades, tenerlas todas desplegadas de golpe (o ir abriendo varias
  // sin plegar las anteriores) era un muro de texto imposible de leer.
  const [idAbierto, setIdAbierto] = useState(null);
  // La nota de privacidad, al pie: cerrada hasta que alguien la pide.
  const [notaAbierta, setNotaAbierta] = useState(false);
  // ---------- Pregunta de acceso (capa extra sobre el enlace en sí) ----------
  // A petición del usuario, 2026-08-25: aunque el enlace se reenvíe fuera
  // del grupo, sin la respuesta correcta el tablón no enseña nada -- ni
  // siquiera la fecha/hora/lugar del evento. La respuesta correcta ya
  // usada se recuerda en ESTE dispositivo (localStorage), para no tener
  // que volver a escribirla cada vez que se abre el enlace.
  const claveLocalStorage = `tablon-respuesta-${token}`;
  // Texto fijo desde 2026-08-29: la pregunta ya no es un secreto
  // configurable con una respuesta arbitraria -- siempre pide el mismo
  // dato (nombre y apellido), comprobado en servidor contra los
  // invitados confirmados (ver tablon_verificar_respuesta en
  // schema.sql). El anfitrión puede seguir retocando el REDACTADO desde
  // Novedades (persistPreguntaTablon), así que igualmente se carga.
  const [pregunta, setPregunta] = useState("Nombre y apellido tal como en tu invitación");
  const [respuestaEscrita, setRespuestaEscrita] = useState("");
  // Identifica este NAVEGADOR (no a la persona) de forma estable, para
  // poder avisar al anfitrión si el mismo nombre entra desde muchos
  // dispositivos distintos (ver tablon_accesos en schema.sql) -- nunca
  // se usa para identificar a nadie, solo para contar cuántos
  // dispositivos distintos comparten un mismo nombre.
  const dispositivoIdRef = useRef("");
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

  // Carga fecha/hora/lugar + novedades -- solo se llama una vez superado
  // el acceso por nombre.
  const cargarContenido = useCallback(
    async () => {
      const [{ data: eventoFilas }, { data: novedadesFilas }] = await Promise.all([
        supabase.from("evento").select("*").limit(1),
        supabase.rpc("tablon_listar_novedades", {
          p_token: token,
          p_respuesta: respuestaVerificadaRef.current,
          p_dispositivo_id: dispositivoIdRef.current,
        }),
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

  // Primer arranque: valida el token, genera (o recupera) el id de este
  // dispositivo, y mira si ya hay un nombre guardado de una vez anterior
  // (y sigue siendo válido -- por si el anfitrión quitó a esa persona de
  // confirmados desde entonces), para pasar directo sin volver a
  // preguntar. El acceso por nombre es SIEMPRE obligatorio desde
  // 2026-08-29 -- ya no existe un modo "sin pregunta configurada" que
  // deje pasar directo.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data: esValido } = await supabase.rpc("tablon_verificar_token", { p_token: token });
      if (cancelado) return;
      if (esValido !== true) {
        setEstado("invalido");
        return;
      }
      try {
        const claveDispositivo = "tablon-dispositivo-id";
        let idGuardado = window.localStorage.getItem(claveDispositivo);
        if (!idGuardado) {
          idGuardado = uid();
          window.localStorage.setItem(claveDispositivo, idGuardado);
        }
        dispositivoIdRef.current = idGuardado;
      } catch (_) {
        // Sin almacenamiento disponible, cada visita cuenta como un
        // dispositivo "nuevo" para el aviso de accesos sospechosos --
        // no afecta a si se puede entrar o no.
      }
      const { data: preguntaTexto } = await supabase.rpc("tablon_obtener_pregunta", { p_token: token });
      if (cancelado) return;
      if (preguntaTexto) setPregunta(preguntaTexto);
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
      // Norma 13: se dice EN QUÉ se ha podido equivocar. Lo que compara
      // la base (normalizar_nombre_tablon) perdona mayúsculas, tildes,
      // comas y espacios de más — pero NO el orden: apellido primero.
      // Antes solo ponía "Respuesta incorrecta", y el invitado no tenía
      // forma de saber cuál de las cuatro cosas había fallado.
      setErrorRespuesta(
        "No te encontramos. Escribe primero tu apellido y después tu nombre, " +
          "tal como aparecen en tu invitación. Dan igual las mayúsculas y las tildes."
      );
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
          <p className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
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
        <div className="max-w-sm w-full">
        <div className="mb-4">
          <AvisoNoCompartir />
        </div>
        <form
          onSubmit={enviarRespuesta}
          className="w-full p-6 rounded-lg"
          style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: S.flotante }}
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
            placeholder="Ej.: Apellido Nombre"
            className="w-full"
            style={{ ...inputStyle, width: "100%", height: 42 }}
            required
          />
          {/* Aclaración fija, aparte del texto editable de arriba (que el
              anfitrión puede retocar) -- a petición del usuario,
              2026-08-29: el apellido tiene que ser el FAMILIAR (el que
              consta en la invitación), no cualquier otro apellido que la
              persona pueda tener -- si no, no coincidirá nunca con lo
              guardado en la lista de invitados. */}
          <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
            El apellido debe ser el familiar de tu invitación (el mismo con el que te invitamos), no otro apellido que tengas.
          </p>
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
            // A la izquierda si este móvil ya tiene elegida esa mano (se
            // elige dentro de la app; al tablón no se le pregunta).
            className="fixed bottom-5 right-5 zurdo:right-auto zurdo:left-5 flex items-center justify-center rounded-full boton-3d"
            style={{ width: 52, height: 52, background: C.ink, color: C.paper, zIndex: 50 }}
            title={sonando ? "Pausar la música" : "Activar fondo musical"}
          >
            {sonando ? <Pause size={20} /> : <Music size={20} />}
          </button>
        </>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <AvisoNoCompartir />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <a href="/" className="text-xs underline" style={{ color: C.charcoal, opacity: OP.secundario }}>
            ← Volver a la web
          </a>
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
              {/* Fecha ocultable temporalmente desde Novedades -- a
                  petición del usuario, 2026-08-27. Solo afecta a esta
                  pantalla pública, no a la portada ni a la invitación. */}
              {/* La fila de la fecha se enseña SIEMPRE. Antes se podía
                  esconder entera (`tablonOcultarFecha`, 2026-08-27), un
                  parche temporal para el mismo problema que ahora
                  resuelve bien "Todavía no hay fecha confirmada": el
                  invitado veía medio tablón y sin saber por qué. Ahora ve
                  lo mismo que el anfitrión, y cuando no hay día cerrado
                  lo pone con todas las letras (usuario, 2026-09-21).
                  ⚠️ `tablonOcultarFecha` se sigue respetando como si
                  fuera "sin confirmar", y NO es un puente que se pueda
                  quitar sin pensarlo. Nació para cubrir la ventana entre
                  el despliegue y el SQL (ya ejecutado el 2026-09-21),
                  pero se queda por un motivo mejor: una foto de Deshacer
                  o de Modo Pruebas ANTERIOR a esa migración trae
                  `tablonOcultarFecha = true` y `fechaSinConfirmar` vacío.
                  Al restaurarla, sin esta línea, la fecha provisional se
                  les escaparía a los invitados sin que nadie se entere.
                  Quitarla solo cuando ya no quede ninguna foto vieja. */}
              <InfoItem
                claro
                icon={Calendar}
                label="Fecha"
                value={valorFechaEvento(evento.tablonOcultarFecha ? { ...evento, fechaSinConfirmar: true } : evento)}
              />
              <InfoItem claro icon={Clock} label="Hora" value={evento.hora || "—"} />
              <InfoItem claro icon={MapPin} label="Lugar" value={evento.lugar || "—"} />
            </div>
          </div>
        )}

        <h2
          className="text-sm uppercase mb-1"
          style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}
        >
          FAQ
        </h2>
        <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
          Información relativa al evento dividida por secciones
        </p>

        <div className="space-y-2">
          {novedades.map((n) => {
            const abierta = idAbierto === n.id;
            return (
              <div key={n.id} className="rounded-lg overflow-hidden" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                {/* La etiqueta se va a la derecha, donde estaba la
                    fecha, y la fecha baja dentro del apartado abierto --
                    a petición del usuario, 2026-09-14. Motivo: con la
                    etiqueta, la fecha y la flecha compitiendo por el
                    ancho de la misma línea, a quien tiene la letra del
                    móvil aumentada el título le salía cortado. Así el
                    título se queda con toda la línea y puede partirse en
                    dos si hace falta. (La regla de "una sola línea por
                    fila" es para las tablas del anfitrión, no para algo
                    que leen 58 personas en el móvil.) */}
                <button
                  onClick={() => alternar(n.id)}
                  className="boton-3d w-full flex items-start justify-between gap-2 px-4 py-3 text-left"
                >
                  <span
                    className="min-w-0 flex-1"
                    style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600, lineHeight: 1.3 }}
                  >
                    {n.titulo || "(sin título)"}
                  </span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap font-medium"
                      style={
                        n.esNovedad
                          ? { background: C.ink, color: C.paper }
                          : { border: `1px solid ${C.line}`, color: C.charcoal, opacity: OP.secundario }
                      }
                    >
                      {n.esNovedad ? "NOVEDADES" : "FAQ"}
                    </span>
                    <ChevronDown
                      size={16}
                      style={{ color: C.gold, transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </span>
                </button>
                {abierta && (
                  <div style={{ borderTop: `1px solid ${C.line}` }}>
                    <p className="px-4 pt-2.5 text-xs" style={{ color: C.charcoal, opacity: OP.tenue }}>
                      {formatearFecha(String(n.creadaEn).slice(0, 10))}
                    </p>
                  </div>
                )}
                {abierta && (
                  <div
                    className="px-4 pt-2 pb-4 text-sm"
                    style={{
                      color: C.charcoal,
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
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Todavía no hay ninguna novedad publicada.
            </p>
          )}

          {/* Al pie, discreto y sin competir con las novedades: la nota de
              privacidad (usuario, 2026-09-21, eligiendo entre sección
              plegada, link al pie o texto abierto). Link subrayado, no
              botón: te lleva a otro sitio, no hace nada (norma 4, ver
              EnlaceTexto). Y al lado del pulgar. */}
          <div className="flex justify-end zurdo:justify-start mt-6">
            <EnlaceTexto onClick={() => setNotaAbierta(true)}>{TITULO_NOTA_PRIVACIDAD}</EnlaceTexto>
          </div>
        </div>
      </div>
      {notaAbierta && <NotaPrivacidad evento={evento} onCerrar={() => setNotaAbierta(false)} />}
    </div>
  );
}
