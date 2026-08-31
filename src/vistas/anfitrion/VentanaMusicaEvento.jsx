// Ventana "Música del evento" (2026-08-31) -- PASO 1 de los 4
// acordados: lo imprescindible para validar el mando a distancia.
//
// Qué es: una pista larga por cada bloque del cronograma, que suena
// desde el MacBook conectado a los altavoces, y que se controla desde
// el móvil sin acercarse al Mac. Sigue el mismo ciclo de 9 bloques que
// Configuración → Cronograma, pero es una función APARTE: lee de ahí
// los nombres y las horas (nunca datos propios), y añade lo suyo.
//
// ⚠️ Vive en una ventana emergente de verdad (usePopupWindow.js), así
// que NUNCA usar `window`/`navigator`/`document`/`alert` a secas aquí
// dentro -- siempre el objeto `ventana` que llega por props. Ver la
// lección larga en CLAUDE.md ("usar siempre el objeto window de ESA
// ventana"): ya nos costó tres rondas de bugs reales en Novedades.
//
// EL PRIMER CLIC HACE DOS COSAS A LA VEZ, y es a propósito: al pulsar
// "Este dispositivo reproduce el sonido" en el Mac, (1) se declara qué
// aparato suena y (2) se desbloquea el audio del navegador, que exige
// un gesto humano real antes de dejar sonar nada. Convertimos esa
// restricción en el propio mecanismo de configuración, en vez de
// pelearnos con ella. Se desbloquean de golpe TODOS los elementos de
// audio de la noche (pista + cortinilla), no solo el primero, para
// dejar el permiso "en el banco" desde el minuto uno.
//
// Y se usa SIEMPRE el mismo elemento <audio> durante toda la noche,
// cambiándole solo la fuente al pasar de bloque -- nunca se crea uno
// nuevo, porque el permiso concedido se queda pegado al elemento.
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  Smartphone,
  Speaker,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Radio,
  ChevronsLeft,
  ChevronsRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { C } from "../../theme";
import { calcularHorasAbsolutas } from "../../lib/cronograma";
import { useMandoMusica } from "../../lib/useMandoMusica";
import { porcentajeAVolumen, ajustarPorcentaje, PASO_VOLUMEN } from "../../lib/volumen";

// Opciones del desplegable de salto, en segundos -- a petición del
// usuario: al menos tres, no un salto fijo.
const SALTOS = [10, 30, 60];

function minutosDesdeMedianoche(hhmm) {
  const [h, m] = String(hhmm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatearTiempo(segundos) {
  const s = Math.max(0, Math.floor(Number(segundos) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function VentanaMusicaEvento({ data, ventana }) {
  const { evento } = data;
  const bloques = useMemo(
    () => (Array.isArray(evento.cronogramaBloques) ? evento.cronogramaBloques : []),
    [evento.cronogramaBloques]
  );
  const horas = useMemo(
    () => calcularHorasAbsolutas(evento.cronogramaHoraInicio, bloques),
    [evento.cronogramaHoraInicio, bloques]
  );

  // "sin-definir" hasta que alguien declare que este aparato es el que
  // suena. Cualquier otro dispositivo que abra esta ventana se queda
  // como mando (no emite sonido, solo manda órdenes).
  const [rol, setRol] = useState("sin-definir");
  const [seleccionado, setSeleccionado] = useState(0);
  const [sonando, setSonando] = useState(false);
  const [volumen, setVolumen] = useState(70);
  const [silenciado, setSilenciado] = useState(false);
  const [volumenPrevio, setVolumenPrevio] = useState(70);
  const [posicion, setPosicion] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [salto, setSalto] = useState(30);
  // { [indiceBloque]: { nombre, url } } -- en el paso 1 las pistas viven
  // solo en memoria (se eligen cada vez que se abre la ventana). El
  // guardado permanente dentro del navegador es el paso 3.
  const [pistas, setPistas] = useState({});
  const [cortinilla, setCortinilla] = useState(null);
  const [ahora, setAhora] = useState(() => new Date());
  const [aviso, setAviso] = useState("");

  const audioRef = useRef(null);
  const cortinillaRef = useRef(null);
  const wakeLockRef = useRef(null);

  const esReproductor = rol === "reproductor";
  const pistaActual = pistas[seleccionado];

  // Reloj en vivo: refresca cada 15s (suficiente para un indicador que
  // se mide en minutos, y no repinta la ventana sin parar).
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  // ---------- Estado respecto al horario previsto ----------
  // UN SOLO indicador que cambia de aspecto según el momento (el
  // usuario lo dejó claro: no son tres cosas distintas, es uno que
  // cambia). Compara la hora real con la ventana del bloque elegido.
  const estadoReloj = useMemo(() => {
    const inicio = minutosDesdeMedianoche(horas[seleccionado]);
    const dura = Number(bloques[seleccionado]?.duracionMin) || 0;
    const fin = inicio + dura;
    const real = ahora.getHours() * 60 + ahora.getMinutes();
    if (real < inicio) {
      return { tipo: "antes", texto: `Empieza en ${inicio - real} min`, detalle: `Previsto a las ${horas[seleccionado]}` };
    }
    if (real <= fin) {
      return { tipo: "enHora", texto: "En hora", detalle: `Este bloque termina a las ${horas[seleccionado + 1] || "—"}` };
    }
    return {
      tipo: "retraso",
      texto: `${real - fin} min de retraso`,
      detalle: `El bloque "${bloques[seleccionado]?.texto || ""}" debía terminar a las ${horas[seleccionado + 1] || "—"}`,
    };
  }, [ahora, seleccionado, horas, bloques]);

  // ---------- Acciones reales (solo las ejecuta el reproductor) ----------
  const aplicarVolumen = useCallback((porcentaje) => {
    setVolumen(porcentaje);
    setSilenciado(false);
    if (audioRef.current) audioRef.current.volume = porcentajeAVolumen(porcentaje);
  }, []);

  const alternarSilencio = useCallback(() => {
    setSilenciado((estabaSilenciado) => {
      if (estabaSilenciado) {
        if (audioRef.current) audioRef.current.volume = porcentajeAVolumen(volumenPrevio);
        setVolumen(volumenPrevio);
        return false;
      }
      setVolumenPrevio(volumen);
      if (audioRef.current) audioRef.current.volume = 0;
      return true;
    });
  }, [volumen, volumenPrevio]);

  const sonarCortinilla = useCallback(() => {
    if (!cortinillaRef.current || !cortinilla) return;
    cortinillaRef.current.currentTime = 0;
    cortinillaRef.current.play().catch(() => {});
  }, [cortinilla]);

  const reproducir = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    audio
      .play()
      .then(() => setSonando(true))
      .catch(() => setAviso("El navegador no ha dejado sonar. Pulsa play aquí en el Mac una vez."));
  }, []);

  const pausar = useCallback(() => {
    audioRef.current?.pause();
    setSonando(false);
  }, []);

  const saltarSegundos = useCallback((segundos) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + segundos));
    setPosicion(audio.currentTime);
  }, []);

  // Cambiar de bloque: suena la cortinilla y entra la pista nueva. Es
  // el gesto con más riesgo de todo el invento (cambiar la fuente de un
  // <audio> ya desbloqueado) -- por eso el paso 1 existe: para probarlo
  // de verdad, no para suponerlo.
  const irABloque = useCallback(
    (indice, arrancar = true) => {
      setSeleccionado(indice);
      setAviso("");
      const audio = audioRef.current;
      const siguiente = pistas[indice];
      if (!audio || !siguiente) {
        setSonando(false);
        return;
      }
      sonarCortinilla();
      audio.src = siguiente.url;
      audio.volume = porcentajeAVolumen(silenciado ? 0 : volumen);
      setPosicion(0);
      if (!arrancar) {
        setSonando(false);
        return;
      }
      audio
        .play()
        .then(() => setSonando(true))
        .catch(() => {
          setSonando(false);
          setAviso("El navegador ha bloqueado el cambio de pista. Pulsa play aquí en el Mac.");
        });
    },
    [pistas, silenciado, volumen, sonarCortinilla]
  );

  // ---------- Canal de mando ----------
  // Ojo: este componente se repinta con cada refresco de datos, y
  // useMandoMusica guarda estos callbacks en refs que actualiza en cada
  // render -- así que aquí NO hay closures obsoletas: siempre se ejecuta
  // la versión más reciente, con el estado actual.
  const alRecibirOrden = useCallback(
    (payload) => {
      if (!esReproductor) return; // un mando ignora las órdenes de otro mando
      const { accion, valor } = payload || {};
      if (accion === "play") reproducir();
      else if (accion === "pausa") pausar();
      else if (accion === "alternar") (sonando ? pausar : reproducir)();
      else if (accion === "bloque") irABloque(valor);
      else if (accion === "saltar") saltarSegundos(valor);
      else if (accion === "volumen") aplicarVolumen(valor);
      else if (accion === "silencio") alternarSilencio();
      else if (accion === "cortinilla") sonarCortinilla();
    },
    [esReproductor, sonando, reproducir, pausar, irABloque, saltarSegundos, aplicarVolumen, alternarSilencio, sonarCortinilla]
  );

  // El mando pinta lo que de verdad está haciendo el Mac, no lo que
  // supone -- si alguien toca el Mac a mano, el móvil se entera igual.
  const alRecibirEstado = useCallback(
    (estado) => {
      if (esReproductor) return; // el reproductor es la fuente, no escucha
      if (!estado) return;
      setSeleccionado(estado.bloque ?? 0);
      setSonando(Boolean(estado.sonando));
      setVolumen(estado.volumen ?? 70);
      setSilenciado(Boolean(estado.silenciado));
      setPosicion(estado.posicion ?? 0);
      setDuracion(estado.duracion ?? 0);
      setPistas(estado.pistas || {});
    },
    [esReproductor]
  );

  const { conectado, enviarOrden, enviarEstado } = useMandoMusica({
    onOrden: alRecibirOrden,
    onEstado: alRecibirEstado,
  });

  // El reproductor informa de su estado: al cambiar algo relevante, y
  // además cada 2s mientras suena (para que la barra de progreso del
  // móvil avance sola).
  const publicarEstado = useCallback(() => {
    if (!esReproductor) return;
    enviarEstado({
      bloque: seleccionado,
      sonando,
      volumen,
      silenciado,
      posicion,
      duracion,
      // Solo los nombres, nunca las URLs: son direcciones de memoria
      // locales del Mac, no significan nada en otro aparato.
      pistas: Object.fromEntries(Object.entries(pistas).map(([i, p]) => [i, { nombre: p.nombre }])),
    });
  }, [esReproductor, seleccionado, sonando, volumen, silenciado, posicion, duracion, pistas, enviarEstado]);

  useEffect(() => {
    publicarEstado();
  }, [publicarEstado]);

  useEffect(() => {
    if (!esReproductor || !sonando) return;
    const id = setInterval(() => {
      const audio = audioRef.current;
      if (audio) setPosicion(audio.currentTime);
    }, 2000);
    return () => clearInterval(id);
  }, [esReproductor, sonando]);

  // ---------- Mantener el Mac despierto mientras suena ----------
  // ⚠️ `ventana.navigator`, nunca `navigator` a secas (ver cabecera).
  useEffect(() => {
    if (!esReproductor || !sonando || !ventana?.navigator?.wakeLock) return;
    let cancelado = false;
    ventana.navigator.wakeLock
      .request("screen")
      .then((lock) => {
        if (cancelado) lock.release().catch(() => {});
        else wakeLockRef.current = lock;
      })
      .catch(() => {
        // Sin permiso o no soportado: no es crítico, solo significa que
        // el Mac podría dormirse si nadie lo toca.
      });
    return () => {
      cancelado = true;
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [esReproductor, sonando, ventana]);

  // ---------- El primer clic: declara el aparato Y desbloquea el audio ----------
  const declararReproductor = () => {
    setRol("reproductor");
    setAviso("");
    // Se "tocan" los dos elementos dentro del propio gesto real, para
    // que el navegador les conceda permiso a los dos de una vez.
    for (const ref of [audioRef, cortinillaRef]) {
      const el = ref.current;
      if (!el) continue;
      el.volume = porcentajeAVolumen(volumen);
      const intento = el.play();
      if (intento?.then) intento.then(() => el.pause()).catch(() => {});
    }
  };

  const elegirArchivo = (indice) => (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const url = URL.createObjectURL(archivo);
    if (indice === "cortinilla") setCortinilla({ nombre: archivo.name, url });
    else setPistas((previas) => ({ ...previas, [indice]: { nombre: archivo.name, url } }));
  };

  // Un gesto en la interfaz: si este aparato es el que suena, lo hace;
  // si es un mando, lo manda por el canal. Así los botones son los
  // mismos en los dos sitios, sin duplicar la pantalla.
  const hacer = (accion, valor) => () => {
    if (esReproductor) alRecibirOrden({ accion, valor });
    else enviarOrden(accion, valor);
  };

  const coloresEstado = {
    enHora: { fondo: "rgba(36,64,47,0.1)", borde: "rgba(36,64,47,0.3)", texto: C.ink, Icono: CheckCircle2 },
    retraso: { fondo: "rgba(140,47,57,0.1)", borde: "rgba(140,47,57,0.3)", texto: C.wax, Icono: AlertTriangle },
    antes: { fondo: "rgba(138,129,113,0.15)", borde: "rgba(138,129,113,0.35)", texto: "#6b6355", Icono: Hourglass },
  }[estadoReloj.tipo];


  return (
    <div
      className="flex flex-col"
      style={{ height: "100%", background: C.paper, fontFamily: "'Inter', sans-serif", fontSize: 16 }}
    >
      <audio ref={audioRef} onEnded={() => setSonando(false)} onLoadedMetadata={(e) => setDuracion(e.target.duration || 0)} />
      <audio ref={cortinillaRef} src={cortinilla?.url} />

      <div className="panel-flotante-cristal flex items-center justify-between px-4 py-3" style={{ flexShrink: 0 }}>
        <h3 className="flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700, fontSize: 20 }}>
          <Music size={21} /> Música del evento
        </h3>
        <span
          className="flex items-center gap-2"
          style={{ color: C.goldClaro, opacity: 0.8 }}
          title={conectado ? "Conectado con los demás dispositivos" : "Sin conexión con el mando"}
        >
          {conectado ? <Wifi size={17} /> : <WifiOff size={17} />}
          {esReproductor ? <Speaker size={17} /> : <Smartphone size={17} />}
        </span>
      </div>

      {/* Todo el contenido se dimensiona para usarse DE PIE, en penumbra
          y con una sola mano -- nada por debajo de 44px de alto en algo
          que haya que tocar, y ningún texto por debajo de 13px. La
          primera versión se hizo con medidas de escritorio y el usuario
          la rechazó con razón (2026-08-31): "botones tan pequeños como
          el tamaño de una sola letra". */}
      <div className="px-4 py-4 space-y-4" style={{ flex: 1, overflowY: "auto", maxWidth: 560, width: "100%", margin: "0 auto" }}>
        {rol === "sin-definir" && (
          <div
            className="rounded-2xl p-5 flex flex-col items-center gap-4 text-center"
            style={{ background: C.paperDark, border: `1.5px dashed ${C.line}` }}
          >
            <Speaker size={34} style={{ color: C.gold }} />
            <p style={{ color: C.charcoal, fontSize: 16 }}>¿Es este el ordenador conectado a los altavoces?</p>
            <button
              onClick={declararReproductor}
              className="boton-3d boton-verde-solido rounded-full font-medium w-full"
              style={{ fontSize: 16, minHeight: 56 }}
            >
              Sí, este dispositivo reproduce el sonido
            </button>
            <button
              onClick={() => setRol("mando")}
              className="rounded-full font-medium w-full"
              style={{ fontSize: 15, minHeight: 52, background: "#fff", border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              No — usar como mando a distancia
            </button>
          </div>
        )}

        {rol !== "sin-definir" && (
          <>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {bloques.map((b, i) => {
                const esActual = i === seleccionado;
                const yaPaso = minutosDesdeMedianoche(horas[i]) < ahora.getHours() * 60 + ahora.getMinutes();
                return (
                  <button
                    key={i}
                    onClick={hacer("bloque", i)}
                    className="relative rounded-xl flex items-center justify-center p-2"
                    style={{
                      aspectRatio: "1 / 1",
                      minHeight: 92,
                      background: esActual ? "linear-gradient(180deg, #24402F, #12201A)" : "#fff",
                      border: `1px solid ${esActual ? "rgba(255,255,255,0.25)" : C.line}`,
                      opacity: !esActual && yaPaso ? 0.45 : 1,
                      boxShadow: esActual ? "inset 0 1px 0 rgba(255,255,255,.22), 0 4px 10px rgba(31,25,15,.28)" : "none",
                    }}
                  >
                    <span
                      className="absolute font-semibold"
                      style={{ top: 7, left: 9, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: esActual ? "rgba(217,183,120,.85)" : "#8a8171" }}
                    >
                      {horas[i]}
                    </span>
                    {pistas[i] && (
                      <span
                        className="absolute rounded-full"
                        style={{ top: 8, right: 9, width: 8, height: 8, background: esActual ? C.goldClaro : C.gold }}
                        title="Tiene pista"
                      />
                    )}
                    <span
                      className="text-center"
                      style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.15, color: esActual ? C.goldClaro : C.charcoal }}
                    >
                      {b.texto || `Bloque ${i + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div>
              <div className="flex items-center justify-between rounded-xl px-4" style={{ background: "#fff", border: `1px solid ${C.line}`, minHeight: 58 }}>
                <span className="flex items-center gap-2.5">
                  <Clock size={20} style={{ color: C.charcoal }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 21, color: C.charcoal }}>
                    {String(ahora.getHours()).padStart(2, "0")}:{String(ahora.getMinutes()).padStart(2, "0")}
                  </span>
                </span>
                <span
                  className="flex items-center gap-2 rounded-full px-3.5 py-2"
                  style={{ background: coloresEstado.fondo, border: `1px solid ${coloresEstado.borde}` }}
                >
                  <coloresEstado.Icono size={17} style={{ color: coloresEstado.texto }} />
                  <span className="font-bold" style={{ color: coloresEstado.texto, fontSize: 14 }}>{estadoReloj.texto}</span>
                </span>
              </div>
              <p className="mt-1.5 px-1" style={{ color: C.charcoal, opacity: 0.65, fontSize: 13 }}>{estadoReloj.detalle}</p>
            </div>

            <div className="rounded-2xl p-4" style={{ background: C.paperDark, border: `1px solid ${C.line}` }}>
              {pistaActual ? (
                <>
                  <div className="flex items-center gap-2.5 mb-4">
                    <Music size={18} style={{ color: C.gold, flexShrink: 0 }} />
                    <span className="flex-1 truncate" style={{ color: C.charcoal, fontSize: 14 }}>{pistaActual.nombre}</span>
                  </div>
                  <div className="rounded-full mb-2" style={{ height: 9, background: C.line }}>
                    <div
                      className="rounded-full"
                      style={{ height: 9, width: `${duracion ? Math.min(100, (posicion / duracion) * 100) : 0}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldClaro})` }}
                    />
                  </div>
                  <div className="flex justify-between mb-5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: "#6b6355" }}>
                    <span>{formatearTiempo(posicion)}</span>
                    <span>{formatearTiempo(duracion)}</span>
                  </div>

                  <div className="flex items-center justify-center gap-5">
                    <button
                      onClick={hacer("saltar", -salto)}
                      className="boton-3d rounded-2xl flex flex-col items-center justify-center gap-0.5"
                      style={{ width: 74, height: 66, background: "#fff", border: `1px solid ${C.line}`, color: C.charcoal }}
                    >
                      <ChevronsLeft size={24} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8a8171" }}>{salto}s</span>
                    </button>
                    <button
                      onClick={hacer("alternar")}
                      className="boton-3d boton-verde-solido rounded-full flex items-center justify-center"
                      style={{ width: 96, height: 96 }}
                    >
                      {sonando ? <Pause size={38} fill={C.goldClaro} /> : <Play size={38} fill={C.goldClaro} style={{ marginLeft: 5 }} />}
                    </button>
                    <button
                      onClick={hacer("saltar", salto)}
                      className="boton-3d rounded-2xl flex flex-col items-center justify-center gap-0.5"
                      style={{ width: 74, height: 66, background: "#fff", border: `1px solid ${C.line}`, color: C.charcoal }}
                    >
                      <ChevronsRight size={24} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8a8171" }}>{salto}s</span>
                    </button>
                  </div>

                  {/* Los saltos, siempre a la vista: antes estaban detrás
                      de un enlace minúsculo, imposible de acertar. */}
                  <div className="flex items-center justify-center gap-2 mt-5">
                    <span style={{ fontSize: 13, color: C.charcoal, opacity: 0.6 }}>Salto</span>
                    {SALTOS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSalto(s)}
                        className="rounded-xl font-semibold"
                        style={{
                          minWidth: 62,
                          minHeight: 46,
                          fontSize: 15,
                          ...(s === salto
                            ? { background: C.ink, color: C.paper }
                            : { background: "#fff", border: `1px solid ${C.line}`, color: C.charcoal }),
                        }}
                      >
                        {s < 60 ? `${s} s` : "1 min"}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <Music size={28} style={{ color: "#8a8171" }} />
                  <p style={{ color: "#6b6355", fontSize: 15 }}>
                    {esReproductor ? "Este bloque no tiene pista todavía" : "Este bloque no tiene pista (se eligen en el Mac)"}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={hacer("silencio")}
                  className="boton-3d rounded-full flex items-center justify-center"
                  style={{ width: 56, height: 56, background: silenciado ? C.wax : C.ink, color: C.paper, flexShrink: 0 }}
                  title={silenciado ? "Quitar el silencio" : "Silenciar"}
                >
                  {silenciado ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step={PASO_VOLUMEN}
                  value={silenciado ? 0 : volumen}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (esReproductor) aplicarVolumen(v);
                    else enviarOrden("volumen", v);
                  }}
                  className="flex-1"
                  style={{ accentColor: C.ink, height: 34 }}
                />
                <span
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 700, color: C.charcoal, width: 52, textAlign: "right", flexShrink: 0 }}
                >
                  {silenciado ? "—" : `${volumen}%`}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => (esReproductor ? aplicarVolumen(ajustarPorcentaje(volumen, -1)) : enviarOrden("volumen", ajustarPorcentaje(volumen, -1)))}
                  className="boton-3d rounded-xl flex-1 font-bold"
                  style={{ minHeight: 54, fontSize: 24, background: C.paperDark, color: C.charcoal }}
                  title={`Bajar ${PASO_VOLUMEN}%`}
                >
                  −
                </button>
                <button
                  onClick={() => (esReproductor ? aplicarVolumen(ajustarPorcentaje(volumen, 1)) : enviarOrden("volumen", ajustarPorcentaje(volumen, 1)))}
                  className="boton-3d rounded-xl flex-1 font-bold"
                  style={{ minHeight: 54, fontSize: 24, background: C.paperDark, color: C.charcoal }}
                  title={`Subir ${PASO_VOLUMEN}%`}
                >
                  +
                </button>
                {cortinilla && (
                  <button
                    onClick={hacer("cortinilla")}
                    className="boton-3d rounded-xl flex items-center justify-center gap-2 font-medium"
                    style={{ minHeight: 54, flex: 1.4, fontSize: 15, background: C.paperDark, color: C.charcoal }}
                  >
                    <Radio size={18} /> Cortinilla
                  </button>
                )}
              </div>
            </div>

            {aviso && (
              <p className="rounded-xl p-3.5" style={{ background: C.avisoFondo, color: C.peligro, fontSize: 14 }}>
                ⚠ {aviso}
              </p>
            )}

            {esReproductor && (
              <div className="rounded-2xl p-4 space-y-2.5" style={{ background: C.paperDark, border: `1px solid ${C.line}` }}>
                <p className="font-medium" style={{ color: C.charcoal, fontSize: 14 }}>
                  Pista para "{bloques[seleccionado]?.texto || `Bloque ${seleccionado + 1}`}"
                </p>
                <label
                  className="flex items-center gap-2.5 cursor-pointer rounded-xl px-4"
                  style={{ background: "#fff", border: `1px dashed ${C.line}`, color: C.charcoal, minHeight: 54, fontSize: 15 }}
                >
                  <Upload size={19} /> {pistaActual ? "Cambiar archivo" : "Elegir archivo de audio"}
                  <input type="file" accept="audio/*" onChange={elegirArchivo(seleccionado)} style={{ display: "none" }} />
                </label>
                <label
                  className="flex items-center gap-2.5 cursor-pointer rounded-xl px-4"
                  style={{ background: "#fff", border: `1px dashed ${C.line}`, color: C.charcoal, minHeight: 54, fontSize: 15 }}
                >
                  <Radio size={19} />
                  <span className="truncate">{cortinilla ? `Cortinilla: ${cortinilla.nombre}` : "Elegir cortinilla de transición"}</span>
                  <input type="file" accept="audio/*" onChange={elegirArchivo("cortinilla")} style={{ display: "none" }} />
                </label>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
