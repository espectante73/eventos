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
  const [saltoAbierto, setSaltoAbierto] = useState(false);
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
    <div className="flex flex-col" style={{ height: "100%", background: C.paper, fontFamily: "'Inter', sans-serif" }}>
      <audio ref={audioRef} onEnded={() => setSonando(false)} onLoadedMetadata={(e) => setDuracion(e.target.duration || 0)} />
      <audio ref={cortinillaRef} src={cortinilla?.url} />

      <div className="panel-flotante-cristal flex items-center justify-between px-4 py-3" style={{ flexShrink: 0 }}>
        <h3 className="text-lg flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700 }}>
          <Music size={19} /> Música del evento
        </h3>
        <span
          className="flex items-center gap-1.5 text-xs"
          style={{ color: C.goldClaro, opacity: 0.75 }}
          title={conectado ? "Conectado con los demás dispositivos" : "Sin conexión con el mando"}
        >
          {conectado ? <Wifi size={14} /> : <WifiOff size={14} />}
          {esReproductor ? <Speaker size={14} /> : <Smartphone size={14} />}
        </span>
      </div>

      <div className="p-4 space-y-4" style={{ flex: 1, overflowY: "auto" }}>
        {/* Antes de nada: quién suena. Este botón es también el que
            desbloquea el audio del navegador (ver cabecera). */}
        {rol === "sin-definir" && (
          <div
            className="rounded-2xl p-4 flex flex-col items-center gap-3 text-center"
            style={{ background: C.paperDark, border: `1.5px dashed ${C.line}` }}
          >
            <Speaker size={26} style={{ color: C.gold }} />
            <p className="text-sm" style={{ color: C.charcoal }}>
              ¿Es este el ordenador conectado a los altavoces?
            </p>
            <button onClick={declararReproductor} className="boton-3d boton-verde-solido px-4 py-2.5 rounded-full text-sm font-medium">
              Sí, este dispositivo reproduce el sonido
            </button>
            <button onClick={() => setRol("mando")} className="text-xs underline" style={{ color: C.charcoal, opacity: 0.7 }}>
              No, usar este aparato como mando a distancia
            </button>
          </div>
        )}

        {rol !== "sin-definir" && (
          <>
            {/* Los 9 bloques, mismo texto y hora que el Cronograma */}
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {bloques.map((b, i) => {
                const esActual = i === seleccionado;
                const yaPaso = minutosDesdeMedianoche(horas[i]) < ahora.getHours() * 60 + ahora.getMinutes();
                return (
                  <button
                    key={i}
                    onClick={hacer("bloque", i)}
                    className="relative rounded-xl flex items-center justify-center p-1.5"
                    style={{
                      aspectRatio: "1 / 1",
                      background: esActual ? "linear-gradient(180deg, #24402F, #12201A)" : "#fff",
                      border: `1px solid ${esActual ? "rgba(255,255,255,0.25)" : C.line}`,
                      opacity: !esActual && yaPaso ? 0.45 : 1,
                      boxShadow: esActual ? "inset 0 1px 0 rgba(255,255,255,.22), 0 4px 10px rgba(31,25,15,.28)" : "none",
                    }}
                  >
                    <span
                      className="absolute font-medium"
                      style={{ top: 6, left: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: esActual ? "rgba(217,183,120,.85)" : "#8a8171" }}
                    >
                      {horas[i]}
                    </span>
                    {pistas[i] && (
                      <span
                        className="absolute rounded-full"
                        style={{ top: 7, right: 8, width: 6, height: 6, background: esActual ? C.goldClaro : C.gold }}
                        title="Tiene pista"
                      />
                    )}
                    <span
                      className="text-center"
                      style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.15, color: esActual ? C.goldClaro : C.charcoal }}
                    >
                      {b.texto || `Bloque ${i + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reloj en vivo + UN indicador que cambia según el momento */}
            <div>
              <div className="flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                <span className="flex items-center gap-2">
                  <Clock size={17} style={{ color: C.charcoal }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 16, color: C.charcoal }}>
                    {String(ahora.getHours()).padStart(2, "0")}:{String(ahora.getMinutes()).padStart(2, "0")}
                  </span>
                </span>
                <span
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{ background: coloresEstado.fondo, border: `1px solid ${coloresEstado.borde}` }}
                >
                  <coloresEstado.Icono size={14} style={{ color: coloresEstado.texto }} />
                  <span className="text-xs font-bold" style={{ color: coloresEstado.texto }}>{estadoReloj.texto}</span>
                </span>
              </div>
              <p className="text-xs mt-1 px-0.5" style={{ color: C.charcoal, opacity: 0.6 }}>{estadoReloj.detalle}</p>
            </div>

            {/* Pista del bloque elegido */}
            <div className="rounded-2xl p-4" style={{ background: C.paperDark, border: `1px solid ${C.line}` }}>
              {pistaActual ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Music size={15} style={{ color: C.gold, flexShrink: 0 }} />
                    <span className="flex-1 text-xs truncate" style={{ color: C.charcoal }}>{pistaActual.nombre}</span>
                  </div>
                  <div className="rounded-full mb-1.5" style={{ height: 6, background: C.line }}>
                    <div
                      className="rounded-full"
                      style={{ height: 6, width: `${duracion ? Math.min(100, (posicion / duracion) * 100) : 0}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldClaro})` }}
                    />
                  </div>
                  <div className="flex justify-between mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6b6355" }}>
                    <span>{formatearTiempo(posicion)}</span>
                    <span>{formatearTiempo(duracion)}</span>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button onClick={hacer("saltar", -salto)} className="boton-3d rounded-xl flex flex-col items-center justify-center" style={{ width: 52, height: 46, background: "#fff", border: `1px solid ${C.line}`, color: C.charcoal }}>
                      <ChevronsLeft size={17} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#8a8171" }}>{salto}s</span>
                    </button>
                    <button
                      onClick={hacer("alternar")}
                      className="boton-3d boton-verde-solido rounded-full flex items-center justify-center"
                      style={{ width: 72, height: 72 }}
                    >
                      {sonando ? <Pause size={26} fill={C.goldClaro} /> : <Play size={26} fill={C.goldClaro} style={{ marginLeft: 3 }} />}
                    </button>
                    <button onClick={hacer("saltar", salto)} className="boton-3d rounded-xl flex flex-col items-center justify-center" style={{ width: 52, height: 46, background: "#fff", border: `1px solid ${C.line}`, color: C.charcoal }}>
                      <ChevronsRight size={17} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#8a8171" }}>{salto}s</span>
                    </button>
                  </div>

                  <button onClick={() => setSaltoAbierto((a) => !a)} className="text-xs mt-3 mx-auto block underline" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Salto: {salto}s
                  </button>
                  {saltoAbierto && (
                    <div className="flex justify-center gap-2 mt-2">
                      {SALTOS.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSalto(s);
                            setSaltoAbierto(false);
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium"
                          style={
                            s === salto
                              ? { background: C.ink, color: C.paper }
                              : { background: "#fff", border: `1px solid ${C.line}`, color: C.charcoal }
                          }
                        >
                          {s < 60 ? `${s} s` : "1 min"}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <Music size={22} style={{ color: "#8a8171" }} />
                  <p className="text-xs" style={{ color: "#6b6355" }}>
                    {esReproductor ? "Este bloque no tiene pista todavía" : "Este bloque no tiene pista (se eligen en el Mac)"}
                  </p>
                </div>
              )}
            </div>

            {/* Volumen: pasos cortos y curva ajustada al oído (lib/volumen.js) */}
            <div className="rounded-2xl p-3.5" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-3">
                <button onClick={hacer("silencio")} className="boton-3d rounded-full p-2" style={{ background: silenciado ? C.wax : C.ink, color: C.paper }} title={silenciado ? "Quitar el silencio" : "Silenciar"}>
                  {silenciado ? <VolumeX size={16} /> : <Volume2 size={16} />}
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
                  style={{ accentColor: C.ink }}
                />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.charcoal, width: 34, textAlign: "right" }}>
                  {silenciado ? "—" : `${volumen}%`}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1.5">
                  <button onClick={() => (esReproductor ? aplicarVolumen(ajustarPorcentaje(volumen, -1)) : enviarOrden("volumen", ajustarPorcentaje(volumen, -1)))} className="rounded-lg px-2.5 py-1 text-xs font-bold" style={{ background: C.paperDark, color: C.charcoal }}>
                    −
                  </button>
                  <button onClick={() => (esReproductor ? aplicarVolumen(ajustarPorcentaje(volumen, 1)) : enviarOrden("volumen", ajustarPorcentaje(volumen, 1)))} className="rounded-lg px-2.5 py-1 text-xs font-bold" style={{ background: C.paperDark, color: C.charcoal }}>
                    +
                  </button>
                </div>
                {cortinilla && (
                  <button onClick={hacer("cortinilla")} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ background: C.paperDark, color: C.charcoal }}>
                    <Radio size={13} /> Cortinilla
                  </button>
                )}
              </div>
            </div>

            {aviso && (
              <p className="text-xs rounded-lg p-2.5" style={{ background: C.avisoFondo, color: C.peligro }}>
                ⚠ {aviso}
              </p>
            )}

            {/* Elegir archivos: solo en el aparato que suena. En el paso 3
                pasarán a guardarse dentro del navegador; por ahora se
                eligen cada vez que se abre la ventana. */}
            {esReproductor && (
              <div className="rounded-2xl p-3.5 space-y-2" style={{ background: C.paperDark, border: `1px solid ${C.line}` }}>
                <p className="text-xs font-medium" style={{ color: C.charcoal }}>
                  Pista para "{bloques[seleccionado]?.texto || `Bloque ${seleccionado + 1}`}"
                </p>
                <label className="flex items-center gap-2 text-xs cursor-pointer rounded-lg px-3 py-2" style={{ background: "#fff", border: `1px dashed ${C.line}`, color: C.charcoal }}>
                  <Upload size={14} /> {pistaActual ? "Cambiar archivo" : "Elegir archivo de audio"}
                  <input type="file" accept="audio/*" onChange={elegirArchivo(seleccionado)} style={{ display: "none" }} />
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer rounded-lg px-3 py-2" style={{ background: "#fff", border: `1px dashed ${C.line}`, color: C.charcoal }}>
                  <Radio size={14} /> {cortinilla ? `Cortinilla: ${cortinilla.nombre}` : "Elegir cortinilla de transición"}
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
