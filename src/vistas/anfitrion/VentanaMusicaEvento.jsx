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
import { guardarPista, leerTodasLasPistas } from "../../lib/almacenPistas";

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
  // DOS conceptos distintos, y confundirlos fue un bug real (2026-08-31):
  // `seleccionado` es el bloque que estás MIRANDO (para comprobar que
  // tiene pista, ver su hora...), y `bloqueSonando` es el que de verdad
  // está cargado en el reproductor. Antes eran el mismo, así que tocar
  // otro bloque para echarle un vistazo cortaba la música, y volver al
  // que sonaba lo hacía empezar desde cero. Ahora mirar no toca el
  // sonido: solo el botón de play cambia lo que suena.
  const [seleccionado, setSeleccionado] = useState(0);
  const [bloqueSonando, setBloqueSonando] = useState(null);
  const [sonando, setSonando] = useState(false);
  const [volumen, setVolumen] = useState(70);
  const [silenciado, setSilenciado] = useState(false);
  const [volumenPrevio, setVolumenPrevio] = useState(70);
  const [posicion, setPosicion] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [salto, setSalto] = useState(30);
  // Las tres opciones de salto (10/30/60) están escondidas tras un chip
  // -- a petición del usuario, 2026-08-31: "menos es más", pero de fácil
  // acceso. Un toque las abre, otro toque elige y se vuelven a cerrar.
  const [saltoAbierto, setSaltoAbierto] = useState(false);
  // { [indiceBloque]: { nombre, url } }. Las URLs son temporales (se
  // crean al abrir la ventana), pero los archivos en sí viven guardados
  // dentro del navegador -- ver lib/almacenPistas.js.
  const [pistas, setPistas] = useState({});
  const [cargandoPistas, setCargandoPistas] = useState(true);
  const [cortinilla, setCortinilla] = useState(null);
  const [ahora, setAhora] = useState(() => new Date());
  const [aviso, setAviso] = useState("");

  const audioRef = useRef(null);
  const cortinillaRef = useRef(null);
  const wakeLockRef = useRef(null);
  // publicarEstado se define más abajo (necesita el canal, que a su vez
  // necesita este manejador) -- esta ref rompe ese círculo.
  const publicarEstadoRef = useRef(null);
  // Volumen en curso, para la repetición al mantener pulsado: el
  // temporizador no puede leer el `volumen` del estado (se quedaría
  // congelado en el valor de cuando empezó la pulsación).
  const volumenRef = useRef(70);
  // Mientras se mantiene pulsado, el mando ignora el volumen que le
  // anuncia el Mac -- si no, el latido de cada 3s le daría un tirón
  // hacia atrás justo mientras estás ajustando.
  const ajustandoVolumenRef = useRef(false);
  const repeticionRef = useRef({ espera: null, ciclo: null });
  // Igual que publicarEstadoRef: el canal se crea más abajo, pero la
  // repetición de volumen (definida antes) necesita poder mandar.
  const enviarOrdenRef = useRef(null);
  // ¿Ha llegado ya alguna noticia del ordenador? Solo para que el mando
  // pueda decir "esperando" en vez de mentir con una pantalla vacía.
  const [recibidoEstado, setRecibidoEstado] = useState(false);

  const esReproductor = rol === "reproductor";
  const pistaActual = pistas[seleccionado];
  // ¿Estoy mirando justo el bloque que está sonando? De eso depende que
  // la barra de progreso muestre algo real y que el botón grande pause
  // en vez de arrancar otra pista.
  const mirandoElQueSuena = bloqueSonando != null && seleccionado === bloqueSonando;

  // ---------- Recuperar las pistas ya guardadas ----------
  // Al abrir la ventana se leen del almacén del navegador y se les crea
  // una URL reproducible. Las URLs se liberan al cerrar, pero los
  // archivos siguen guardados: la próxima vez vuelven a aparecer solas,
  // sin tener que elegirlas de nuevo.
  useEffect(() => {
    let cancelado = false;
    const urlsCreadas = [];
    // La ventana emergente tiene su propio URL/createObjectURL; usarlo
    // ata la vida del enlace a ESA ventana, que es justo lo que
    // queremos. Si todavía no está lista, sirve el de la pestaña.
    const fabricaUrl = ventana?.URL || URL;

    leerTodasLasPistas()
      .then((guardadas) => {
        if (cancelado) return;
        const recuperadas = {};
        let cortinillaGuardada = null;
        for (const [clave, valor] of Object.entries(guardadas)) {
          if (!valor?.datos) continue;
          const url = fabricaUrl.createObjectURL(valor.datos);
          urlsCreadas.push(url);
          if (clave === "cortinilla") cortinillaGuardada = { nombre: valor.nombre, url };
          else recuperadas[clave] = { nombre: valor.nombre, url };
        }
        setPistas(recuperadas);
        if (cortinillaGuardada) setCortinilla(cortinillaGuardada);
        setCargandoPistas(false);
      })
      .catch(() => {
        if (cancelado) return;
        setCargandoPistas(false);
        setAviso("No se han podido recuperar las pistas guardadas en este navegador.");
      });

    return () => {
      cancelado = true;
      for (const url of urlsCreadas) fabricaUrl.revokeObjectURL(url);
    };
  }, [ventana]);

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

  // ---------- Subir/bajar volumen manteniendo pulsado ----------
  // A petición del usuario (2026-08-31): con pasos del 2%, ir de 80 a 40
  // exigía 20 toques. Ahora un toque suelto da un paso, y si se mantiene
  // pulsado sigue avanzando solo, paso a paso.
  useEffect(() => {
    volumenRef.current = volumen;
  }, [volumen]);

  const darPasoVolumen = useCallback(
    (direccion) => {
      const siguiente = ajustarPorcentaje(volumenRef.current, direccion);
      if (siguiente === volumenRef.current) return; // ya está en el tope
      volumenRef.current = siguiente;
      if (esReproductor) {
        aplicarVolumen(siguiente);
      } else {
        setVolumen(siguiente);
        setSilenciado(false);
        enviarOrdenRef.current?.("volumen", siguiente);
      }
    },
    [esReproductor, aplicarVolumen]
  );

  const pararRepeticion = useCallback(() => {
    clearTimeout(repeticionRef.current.espera);
    clearInterval(repeticionRef.current.ciclo);
    repeticionRef.current = { espera: null, ciclo: null };
    ajustandoVolumenRef.current = false;
  }, []);

  // Primer paso al instante, y si se sigue pulsando (400ms), arranca la
  // repetición cada 120ms -- lo bastante rápido para recorrer la escala
  // sin que se escape de las manos.
  const empezarRepeticion = useCallback(
    (direccion) => {
      pararRepeticion();
      ajustandoVolumenRef.current = true;
      darPasoVolumen(direccion);
      repeticionRef.current.espera = setTimeout(() => {
        repeticionRef.current.ciclo = setInterval(() => darPasoVolumen(direccion), 120);
      }, 400);
    },
    [darPasoVolumen, pararRepeticion]
  );

  useEffect(() => pararRepeticion, [pararRepeticion]);

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

  // Solo MIRAR otro bloque: no toca el sonido en absoluto. Lo que esté
  // sonando sigue sonando, en su mismo minuto.
  const verBloque = useCallback((indice) => {
    setSeleccionado(indice);
    setAviso("");
  }, []);

  // Poner a sonar un bloque: suena la cortinilla y entra su pista. Es el
  // gesto con más riesgo de todo el invento (cambiar la fuente de un
  // <audio> ya desbloqueado) -- por eso el paso 1 existe: para probarlo
  // de verdad, no para suponerlo. Si ese bloque YA es el que suena, no
  // se recarga nada (eso lo reiniciaría desde cero, que era justo el
  // fallo que reportó el usuario).
  const reproducirBloque = useCallback(
    (indice) => {
      setAviso("");
      const audio = audioRef.current;
      const siguiente = pistas[indice];
      if (!audio || !siguiente) return;

      if (bloqueSonando === indice && audio.src) {
        audio
          .play()
          .then(() => setSonando(true))
          .catch(() => setAviso("El navegador no ha dejado reanudar. Pulsa play aquí en el Mac."));
        return;
      }

      sonarCortinilla();
      audio.src = siguiente.url;
      audio.volume = porcentajeAVolumen(silenciado ? 0 : volumen);
      setPosicion(0);
      setBloqueSonando(indice);
      audio
        .play()
        .then(() => setSonando(true))
        .catch(() => {
          setSonando(false);
          setAviso("El navegador ha bloqueado el cambio de pista. Pulsa play aquí en el Mac.");
        });
    },
    [pistas, silenciado, volumen, sonarCortinilla, bloqueSonando]
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
      else if (accion === "alternar") {
        // El botón grande hace lo que toca según lo que estés mirando:
        // si miras el bloque que ya suena, pausa/reanuda sin reiniciar;
        // si miras otro, lo pone a sonar (con su cortinilla).
        if (valor != null && valor !== bloqueSonando) reproducirBloque(valor);
        else if (sonando) pausar();
        else reproducirBloque(valor ?? bloqueSonando ?? 0);
      } else if (accion === "pedirEstado") {
        // Un mando acaba de conectarse y no sabe nada: estos mensajes no
        // se guardan en ningún sitio, así que quien llega tarde no
        // recibe lo ya anunciado. Se le contesta con la foto completa.
        publicarEstadoRef.current?.();
      } else if (accion === "bloque") verBloque(valor);
      else if (accion === "reproducirBloque") reproducirBloque(valor);
      else if (accion === "saltar") saltarSegundos(valor);
      else if (accion === "volumen") aplicarVolumen(valor);
      else if (accion === "silencio") alternarSilencio();
      else if (accion === "cortinilla") sonarCortinilla();
    },
    [esReproductor, sonando, bloqueSonando, reproducir, pausar, verBloque, reproducirBloque, saltarSegundos, aplicarVolumen, alternarSilencio, sonarCortinilla]
  );

  // El mando pinta lo que de verdad está haciendo el Mac, no lo que
  // supone -- si alguien toca el Mac a mano, el móvil se entera igual.
  const alRecibirEstado = useCallback(
    (estado) => {
      if (esReproductor) return; // el reproductor es la fuente, no escucha
      if (!estado) return;
      setRecibidoEstado(true);
      setSeleccionado(estado.bloque ?? 0);
      setBloqueSonando(estado.bloqueSonando ?? null);
      setSonando(Boolean(estado.sonando));
      // Mientras se mantiene pulsado −/+, el volumen que manda el Mac se
      // ignora: si no, el latido de cada 3s daría un tirón hacia atrás
      // justo mientras estás ajustando.
      if (!ajustandoVolumenRef.current) {
        setVolumen(estado.volumen ?? 70);
        setSilenciado(Boolean(estado.silenciado));
      }
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
      bloqueSonando,
      sonando,
      volumen,
      silenciado,
      posicion,
      duracion,
      // Solo los nombres, nunca las URLs: son direcciones de memoria
      // locales del Mac, no significan nada en otro aparato.
      pistas: Object.fromEntries(Object.entries(pistas).map(([i, p]) => [i, { nombre: p.nombre }])),
    });
  }, [esReproductor, seleccionado, bloqueSonando, sonando, volumen, silenciado, posicion, duracion, pistas, enviarEstado]);

  useEffect(() => {
    enviarOrdenRef.current = enviarOrden;
  }, [enviarOrden]);

  useEffect(() => {
    publicarEstadoRef.current = publicarEstado;
    publicarEstado();
  }, [publicarEstado]);

  // Latido: el reproductor repite su estado cada 3 segundos, suene o no.
  // Es la red de seguridad del problema de fondo -- estos mensajes no se
  // guardan, así que un mando que se conecte tarde (o que se quede sin
  // cobertura un rato y vuelva) no recibiría nada nunca. Con esto, como
  // mucho tarda 3 segundos en enterarse de todo, sin depender de que
  // alguien toque algo en el Mac.
  useEffect(() => {
    if (!esReproductor) return;
    const id = setInterval(() => publicarEstadoRef.current?.(), 3000);
    return () => clearInterval(id);
  }, [esReproductor]);

  // Y el mando, en cuanto se conecta, pide la foto completa en vez de
  // esperar al siguiente latido -- así aparece todo al instante.
  useEffect(() => {
    if (esReproductor || !conectado) return;
    enviarOrden("pedirEstado");
  }, [esReproductor, conectado, enviarOrden]);

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

  // ---------- Aviso al cerrar la ventana ----------
  // Antes había una X propia en la cabecera con su aviso, pero eso
  // dejaba DOS botones de cerrar (el del sistema operativo va aparte, y
  // no se puede quitar desde una página web). A petición del usuario
  // (2026-08-31) se quitó el nuestro y el aviso pasa aquí: el navegador
  // pregunta antes de cerrar de verdad.
  //
  // Solo cuando hay algo que perder -- es decir, cuando este aparato es
  // el que suena y hay música puesta. Un mando se cierra sin preguntar
  // nada: la música sigue en el ordenador igualmente.
  //
  // Ojo: el texto lo pone el navegador, no nosotros (hace años que no
  // dejan personalizarlo, para que nadie escriba mensajes engañosos).
  // Lo único que podemos decidir es SI pregunta o no.
  useEffect(() => {
    if (!ventana || !esReproductor || bloqueSonando == null) return;
    const avisarAntesDeCerrar = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    ventana.addEventListener("beforeunload", avisarAntesDeCerrar);
    return () => ventana.removeEventListener("beforeunload", avisarAntesDeCerrar);
  }, [ventana, esReproductor, bloqueSonando]);

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

  // Elegir un archivo lo guarda TAMBIÉN en el navegador, no solo en
  // memoria -- así sigue ahí la próxima vez que se abra la ventana, sin
  // tener que buscarlo otra vez en el disco.
  const elegirArchivo = (indice) => (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const url = (ventana?.URL || URL).createObjectURL(archivo);
    if (indice === "cortinilla") setCortinilla({ nombre: archivo.name, url });
    else setPistas((previas) => ({ ...previas, [indice]: { nombre: archivo.name, url } }));
    setAviso("");
    guardarPista(indice, archivo).catch(() =>
      setAviso(`"${archivo.name}" suena ahora, pero no se ha podido guardar para la próxima vez (¿espacio del navegador?).`)
    );
  };

  // Un gesto en la interfaz: si este aparato es el que suena, lo hace;
  // si es un mando, lo manda por el canal. Así los botones son los
  // mismos en los dos sitios, sin duplicar la pantalla.
  const hacer = (accion, valor) => () => {
    if (esReproductor) {
      alRecibirOrden({ accion, valor });
      return;
    }
    // Adelanto local: el mando cambia su vista al instante, sin esperar
    // a que el Mac conteste. Sin esto, tocar un bloque tardaba en
    // responder lo que durase la ida y vuelta.
    if (accion === "bloque") setSeleccionado(valor);
    enviarOrden(accion, valor);
  };


  // ---------- Paleta propia de esta ventana ----------
  // Verde profundo con dorado, en vez del crema del resto de la app --
  // a petición del usuario (2026-08-31): el verde claro anterior le
  // pareció "muy pobre" y pedía más contraste. Aquí encaja: es la única
  // pantalla que se usa a oscuras y de un vistazo rápido, y es el mismo
  // lenguaje fuerte que ya usan las cabeceras y los botones flotantes.
  // MISMA apariencia en el Mac y en el móvil (también a petición suya);
  // lo único que sigue cambiando entre los dos son los TAMAÑOS y el
  // reparto en columnas, no los colores.
  const P = {
    fondo: "linear-gradient(160deg, #1F3A2E 0%, #101C15 100%)",
    panel: "rgba(255, 255, 255, 0.06)",
    panelBorde: "rgba(217, 183, 120, 0.28)",
    texto: "#EFE9DE",
    tenue: "rgba(239, 233, 222, 0.6)",
    oro: C.goldClaro,
    oroRelleno: "linear-gradient(180deg, #E4C88A, #B08D57)",
    oscuro: "#12201A",
  };

  const esMovil = rol === "mando";
  const M = esMovil
    ? { base: 16, bloque: 92, nombre: 19, hora: 13, play: 96, playIcono: 38, saltoAncho: 74, saltoAlto: 66, silencio: 56, botonVol: 54, reloj: 21, titulo: 20, texto: 15, ancho: 560 }
    : { base: 14, bloque: 72, nombre: 16, hora: 12, play: 66, playIcono: 26, saltoAncho: 58, saltoAlto: 52, silencio: 44, botonVol: 42, reloj: 18, titulo: 18, texto: 13, ancho: 900 };

  const coloresEstado = {
    enHora: { fondo: "rgba(120, 190, 140, 0.16)", borde: "rgba(120, 190, 140, 0.5)", texto: "#9FD9B4", Icono: CheckCircle2 },
    retraso: { fondo: "rgba(228, 120, 130, 0.16)", borde: "rgba(228, 120, 130, 0.5)", texto: "#F0A4AC", Icono: AlertTriangle },
    antes: { fondo: "rgba(239, 233, 222, 0.1)", borde: "rgba(239, 233, 222, 0.3)", texto: P.tenue, Icono: Hourglass },
  }[estadoReloj.tipo];

  // Minimalismo (2026-08-31, a petición del usuario: "menos es más"):
  // las tarjetas se distinguen por su fondo translúcido, sin contorno.
  // Sobre el verde profundo ya se leen solas, y quitar las líneas deja
  // la pantalla mucho más tranquila.
  const tarjeta = { background: P.panel };

  const cuadriculaBloques = (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
      {bloques.map((b, i) => {
        const esActual = i === seleccionado;
        const suenaAqui = i === bloqueSonando;
        const yaPaso = minutosDesdeMedianoche(horas[i]) < ahora.getHours() * 60 + ahora.getMinutes();
        return (
          <button
            key={i}
            onClick={hacer("bloque", i)}
            className={`relative rounded-xl flex flex-col items-center justify-center gap-1.5 p-2${suenaAqui ? " bloque-sonando" : ""}`}
            style={{
              aspectRatio: "1 / 1",
              minHeight: M.bloque,
              // Seleccionado = dorado relleno sobre fondo oscuro: es el
              // máximo contraste posible dentro de la paleta.
              background: esActual ? P.oroRelleno : P.panel,
              border: `1px solid ${esActual ? P.oro : P.panelBorde}`,
              opacity: !esActual && yaPaso && !suenaAqui ? 0.45 : 1,
              ...(suenaAqui || esActual ? {} : { boxShadow: "none" }),
            }}
          >
            <span
              className="absolute font-semibold"
              style={{ top: 7, left: 9, fontFamily: "'IBM Plex Mono', monospace", fontSize: M.hora, color: esActual ? "rgba(18,32,26,.7)" : P.tenue }}
            >
              {horas[i]}
            </span>
            {pistas[i] && !suenaAqui && (
              <span className="absolute rounded-full" style={{ top: 8, right: 9, width: 8, height: 8, background: esActual ? P.oscuro : P.oro }} title="Tiene pista" />
            )}
            <span className="text-center" style={{ fontSize: M.nombre, fontWeight: 800, lineHeight: 1.15, color: esActual ? P.oscuro : P.texto }}>
              {b.texto || `Bloque ${i + 1}`}
            </span>
            {suenaAqui && (
              <span className="flex items-end justify-center gap-1" style={{ height: 22 }} title={sonando ? "Sonando ahora" : "En pausa"}>
                {[0, 1, 2, 3].map((barra) => (
                  <span
                    key={barra}
                    className={sonando ? "ecualizador-barra rounded-sm" : "rounded-sm"}
                    style={{
                      width: 5,
                      height: 22,
                      background: esActual ? P.oscuro : P.oro,
                      opacity: sonando ? 1 : 0.45,
                      transform: sonando ? undefined : "scaleY(0.45)",
                      transformOrigin: "bottom center",
                      animationDelay: `${barra * 0.16}s`,
                    }}
                  />
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const relojEstado = (
    <div>
      <div className="flex items-center justify-between rounded-xl px-4" style={{ ...tarjeta, minHeight: esMovil ? 58 : 48 }}>
        <span className="flex items-center gap-2.5">
          <Clock size={esMovil ? 20 : 17} style={{ color: P.oro }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: M.reloj, color: P.texto }}>
            {String(ahora.getHours()).padStart(2, "0")}:{String(ahora.getMinutes()).padStart(2, "0")}
          </span>
        </span>
        <span className="flex items-center gap-2 rounded-full px-3.5 py-2" style={{ background: coloresEstado.fondo, border: `1px solid ${coloresEstado.borde}` }}>
          <coloresEstado.Icono size={esMovil ? 17 : 15} style={{ color: coloresEstado.texto }} />
          <span className="font-bold" style={{ color: coloresEstado.texto, fontSize: M.texto }}>{estadoReloj.texto}</span>
        </span>
      </div>
      <p className="mt-1.5 px-1" style={{ color: P.tenue, fontSize: M.texto - 1 }}>{estadoReloj.detalle}</p>
    </div>
  );

  const reproductor = (
    <div className="rounded-2xl p-4" style={tarjeta}>
      {pistaActual ? (
        <>
          <p className="truncate mb-4" style={{ color: P.tenue, fontSize: M.texto - 1 }}>
            {pistaActual.nombre}
          </p>
          <div className="rounded-full mb-2" style={{ height: esMovil ? 9 : 7, background: "rgba(255,255,255,0.12)" }}>
            <div
              className="rounded-full"
              style={{
                height: esMovil ? 9 : 7,
                width: mirandoElQueSuena && duracion ? `${Math.min(100, (posicion / duracion) * 100)}%` : 0,
                background: P.oroRelleno,
              }}
            />
          </div>
          <div className="flex justify-between mb-5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: M.texto, color: P.tenue }}>
            <span>{mirandoElQueSuena ? formatearTiempo(posicion) : "—"}</span>
            <span>{mirandoElQueSuena ? formatearTiempo(duracion) : "sin sonar"}</span>
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              onClick={hacer("saltar", -salto)}
              className="boton-3d rounded-2xl flex flex-col items-center justify-center gap-0.5"
              style={{ width: M.saltoAncho, height: M.saltoAlto, background: P.panel, border: `1px solid ${P.panelBorde}`, color: P.texto }}
            >
              <ChevronsLeft size={esMovil ? 26 : 22} />
            </button>
            {/* Botón principal en dorado relleno: sobre el verde
                profundo es lo que más canta de la pantalla, que es
                justo lo que tiene que ser. */}
            <button
              onClick={hacer("alternar", seleccionado)}
              className="boton-3d rounded-full flex items-center justify-center"
              style={{ width: M.play, height: M.play, background: P.oroRelleno, border: `1px solid ${P.oro}` }}
              title={mirandoElQueSuena ? (sonando ? "Pausar" : "Reanudar") : `Poner "${bloques[seleccionado]?.texto || ""}"`}
            >
              {mirandoElQueSuena && sonando ? (
                <Pause size={M.playIcono} fill={P.oscuro} color={P.oscuro} />
              ) : (
                <Play size={M.playIcono} fill={P.oscuro} color={P.oscuro} style={{ marginLeft: 5 }} />
              )}
            </button>
            <button
              onClick={hacer("saltar", salto)}
              className="boton-3d rounded-2xl flex flex-col items-center justify-center gap-0.5"
              style={{ width: M.saltoAncho, height: M.saltoAlto, background: P.panel, border: `1px solid ${P.panelBorde}`, color: P.texto }}
            >
              <ChevronsRight size={esMovil ? 26 : 22} />
            </button>
          </div>

          {/* Escondido tras un chip discreto: en uso normal no estorba,
              y está a un toque cuando hace falta. */}
          <div className="flex justify-center mt-4" style={{ minHeight: esMovil ? 40 : 34 }}>
            {saltoAbierto ? (
              <div className="flex gap-2">
                {SALTOS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSalto(s);
                      setSaltoAbierto(false);
                    }}
                    className="rounded-full font-semibold"
                    style={{
                      minWidth: esMovil ? 64 : 56,
                      minHeight: esMovil ? 40 : 34,
                      fontSize: M.texto,
                      ...(s === salto
                        ? { background: P.oro, color: P.oscuro }
                        : { background: P.panel, border: `1px solid ${P.panelBorde}`, color: P.texto }),
                    }}
                  >
                    {s < 60 ? `${s}s` : "1min"}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setSaltoAbierto(true)}
                className="rounded-full px-4"
                style={{ minHeight: esMovil ? 40 : 34, fontSize: M.texto - 1, color: P.tenue, letterSpacing: "0.03em" }}
                title="Cambiar cuánto salta"
              >
                ± {salto < 60 ? `${salto}s` : "1min"}
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Music size={28} style={{ color: P.tenue }} />
          <p style={{ color: P.tenue, fontSize: M.texto }}>
            {esReproductor ? "Este bloque no tiene pista todavía" : "Este bloque no tiene pista (se eligen en el Mac)"}
          </p>
        </div>
      )}
    </div>
  );

  // ⚠️ "Ir" manda la orden como cualquier otro cambio de bloque (hacer),
  // NO cambia solo la vista local: en el mando, el latido del Mac (cada
  // 3s) sobrescribía la selección y la vista se volvía sola al bloque
  // anterior al segundo -- bug real reportado por el usuario, 2026-08-31.
  const avisoOtroSonando =
    bloqueSonando != null && !mirandoElQueSuena ? (
      <button
        onClick={hacer("bloque", bloqueSonando)}
        className={`w-full flex items-center gap-3 rounded-2xl px-4${sonando ? " bloque-sonando" : ""}`}
        style={{ minHeight: esMovil ? 72 : 60, background: P.oroRelleno, border: `1.5px solid ${P.oro}`, color: P.oscuro }}
      >
        <span className="flex items-end gap-1" style={{ height: 26, flexShrink: 0 }}>
          {[0, 1, 2, 3].map((barra) => (
            <span
              key={barra}
              className={sonando ? "ecualizador-barra rounded-sm" : "rounded-sm"}
              style={{
                width: 5,
                height: 26,
                background: P.oscuro,
                opacity: sonando ? 1 : 0.45,
                transform: sonando ? undefined : "scaleY(0.45)",
                transformOrigin: "bottom center",
                animationDelay: `${barra * 0.16}s`,
              }}
            />
          ))}
        </span>
        <span className="flex-1 text-left min-w-0">
          <span className="block" style={{ fontSize: M.texto - 1, opacity: 0.7, letterSpacing: "0.04em" }}>
            {sonando ? "SONANDO AHORA" : "EN PAUSA"}
          </span>
          <span className="block truncate" style={{ fontSize: M.nombre, fontWeight: 800, lineHeight: 1.15 }}>
            {bloques[bloqueSonando]?.texto || `Bloque ${bloqueSonando + 1}`}
          </span>
        </span>
        <span
          className="rounded-full px-3.5 flex items-center"
          style={{ background: P.oscuro, color: P.oro, fontWeight: 700, fontSize: M.texto, minHeight: 38, flexShrink: 0 }}
        >
          Ir
        </span>
      </button>
    ) : null;

  const controlVolumen = (
    <div className="rounded-2xl p-4" style={tarjeta}>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={hacer("silencio")}
          className="boton-3d rounded-full flex items-center justify-center"
          style={{
            width: M.silencio,
            height: M.silencio,
            background: silenciado ? C.wax : P.panel,
            border: `1px solid ${silenciado ? C.wax : P.panelBorde}`,
            color: silenciado ? P.texto : P.oro,
            flexShrink: 0,
          }}
          title={silenciado ? "Quitar el silencio" : "Silenciar"}
        >
          {silenciado ? <VolumeX size={esMovil ? 24 : 19} /> : <Volume2 size={esMovil ? 24 : 19} />}
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
          style={{ accentColor: C.gold, height: esMovil ? 34 : 24 }}
        />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: M.texto + 2, fontWeight: 700, color: P.texto, width: 52, textAlign: "right", flexShrink: 0 }}>
          {silenciado ? "—" : `${volumen}%`}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        {[-1, 1].map((direccion) => (
          <button
            key={direccion}
            onPointerDown={(e) => {
              e.preventDefault();
              empezarRepeticion(direccion);
            }}
            onPointerUp={pararRepeticion}
            onPointerLeave={pararRepeticion}
            onPointerCancel={pararRepeticion}
            onContextMenu={(e) => e.preventDefault()}
            className="boton-3d rounded-xl flex-1 font-bold"
            style={{
              minHeight: M.botonVol,
              fontSize: esMovil ? 24 : 19,
              background: P.panel,
              border: `1px solid ${P.panelBorde}`,
              color: P.oro,
              touchAction: "manipulation",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            title={`${direccion < 0 ? "Bajar" : "Subir"} ${PASO_VOLUMEN}% (mantén pulsado para seguir)`}
          >
            {direccion < 0 ? "−" : "+"}
          </button>
        ))}
        {cortinilla && (
          <button
            onClick={hacer("cortinilla")}
            className="boton-3d rounded-xl flex items-center justify-center gap-2 font-medium"
            style={{ minHeight: M.botonVol, flex: 1.4, fontSize: M.texto, background: P.panel, border: `1px solid ${P.panelBorde}`, color: P.texto }}
          >
            <Radio size={esMovil ? 18 : 15} /> Cortinilla
          </button>
        )}
      </div>
    </div>
  );

  const gestionPistas = (
    <div className="rounded-2xl p-4" style={tarjeta}>
      <p className="font-medium" style={{ color: P.texto, fontSize: M.texto }}>
        Pistas por bloque
      </p>
      <p className="mb-2.5" style={{ color: P.tenue, fontSize: M.texto - 1 }}>
        {cargandoPistas ? "Recuperando las pistas guardadas…" : "Se quedan guardadas en este ordenador: no hay que volver a elegirlas."}
      </p>
      <div className="space-y-1.5" style={{ maxHeight: 260, overflowY: "auto" }}>
        {bloques.map((b, i) => (
          <label
            key={i}
            className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2"
            style={{
              background: i === seleccionado ? "rgba(255,255,255,0.08)" : "transparent",
              border: `1px solid ${i === seleccionado ? P.panelBorde : "transparent"}`,
              fontSize: M.texto,
              color: P.texto,
            }}
          >
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: P.tenue, width: 38, flexShrink: 0 }}>{horas[i]}</span>
            <span className="font-semibold" style={{ width: 82, flexShrink: 0 }}>{b.texto || `Bloque ${i + 1}`}</span>
            <span className="flex-1 truncate" style={{ opacity: pistas[i] ? 0.85 : 0.45 }}>
              {pistas[i] ? pistas[i].nombre : "— sin pista —"}
            </span>
            <Upload size={15} style={{ color: P.oro, flexShrink: 0 }} />
            <input type="file" accept="audio/*" onChange={elegirArchivo(i)} style={{ display: "none" }} />
          </label>
        ))}
      </div>
      <label
        className="flex items-center gap-2.5 cursor-pointer rounded-xl px-4 mt-3"
        style={{ background: P.panel, border: `1px dashed ${P.panelBorde}`, color: P.texto, minHeight: 46, fontSize: M.texto }}
      >
        <Radio size={17} style={{ flexShrink: 0, color: P.oro }} />
        <span className="truncate">{cortinilla ? `Cortinilla: ${cortinilla.nombre}` : "Elegir cortinilla de transición"}</span>
        <input type="file" accept="audio/*" onChange={elegirArchivo("cortinilla")} style={{ display: "none" }} />
      </label>
    </div>
  );

  const avisoVisible = aviso ? (
    <p className="rounded-xl p-3.5" style={{ background: "rgba(228,120,130,0.16)", border: "1px solid rgba(228,120,130,0.45)", color: "#F0A4AC", fontSize: M.texto }}>
      ⚠ {aviso}
    </p>
  ) : null;

  return (
    <div className="flex flex-col" style={{ height: "100%", background: P.fondo, fontFamily: "'Inter', sans-serif", fontSize: M.base }}>
      <audio ref={audioRef} onEnded={() => setSonando(false)} onLoadedMetadata={(e) => setDuracion(e.target.duration || 0)} />
      <audio ref={cortinillaRef} src={cortinilla?.url} />

      <div className="panel-flotante-cristal flex items-center justify-between px-4 py-3" style={{ flexShrink: 0 }}>
        <h3 className="flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif", color: P.oro, fontWeight: 700, fontSize: M.titulo }}>
          <Music size={M.titulo + 1} /> Música del evento
        </h3>
        {/* Sin X propia: la ventana ya trae la del sistema operativo
            (en macOS, arriba a la izquierda) y tener dos confundía -- a
            petición del usuario, 2026-08-31. El aviso de "ojo, que se
            para la música" no se pierde: pasa a engancharse al cierre
            real de la ventana (ver el efecto de beforeunload). */}
        <span className="flex items-center gap-2" style={{ color: P.oro, opacity: 0.8 }} title={conectado ? "Conectado" : "Sin conexión"}>
          {conectado ? <Wifi size={17} /> : <WifiOff size={17} />}
          {rol === "sin-definir" ? null : esReproductor ? <Speaker size={17} /> : <Smartphone size={17} />}
        </span>
      </div>

      <div className="px-4 py-4" style={{ flex: 1, overflowY: "auto" }}>
        {rol === "sin-definir" && (
          <div className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center" style={{ ...tarjeta, maxWidth: 460, margin: "0 auto" }}>
            <Speaker size={38} style={{ color: P.oro }} />
            <p style={{ color: P.texto, fontSize: 17 }}>¿Qué papel tiene este aparato?</p>
            <button
              onClick={declararReproductor}
              className="boton-3d rounded-2xl font-medium w-full flex flex-col items-center justify-center gap-1"
              style={{ minHeight: 88, background: P.oroRelleno, color: P.oscuro }}
            >
              <span className="flex items-center gap-2" style={{ fontSize: 17, fontWeight: 700 }}>
                <Speaker size={20} /> Este reproduce el sonido
              </span>
              <span style={{ fontSize: 13, opacity: 0.75 }}>El ordenador conectado a los altavoces</span>
            </button>
            <button
              onClick={() => setRol("mando")}
              className="boton-3d rounded-2xl font-medium w-full flex flex-col items-center justify-center gap-1"
              style={{ minHeight: 88, background: P.panel, border: `1px solid ${P.panelBorde}`, color: P.texto }}
            >
              <span className="flex items-center gap-2" style={{ fontSize: 17 }}>
                <Smartphone size={20} /> Mando a distancia
              </span>
              <span style={{ fontSize: 13, opacity: 0.7 }}>Controla el sonido sin tocar el ordenador</span>
            </button>
          </div>
        )}

        {rol === "mando" && (
          <div className="space-y-4" style={{ maxWidth: M.ancho, margin: "0 auto" }}>
            {!recibidoEstado && (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(228,120,130,0.16)", border: "1px solid rgba(228,120,130,0.45)", color: "#F0A4AC", fontSize: M.texto }}
              >
                <WifiOff size={18} style={{ flexShrink: 0 }} />
                <span>
                  Esperando al ordenador… Comprueba que la ventana "Música del evento" está abierta en el Mac y marcada
                  como el aparato que reproduce.
                </span>
              </div>
            )}
            {cuadriculaBloques}
            {avisoOtroSonando}
            {relojEstado}
            {reproductor}
            {controlVolumen}
            {avisoVisible}
          </div>
        )}

        {rol === "reproductor" && (
          <div style={{ maxWidth: M.ancho, margin: "0 auto" }}>
            <div className="flex flex-wrap gap-4 items-start">
              <div className="space-y-4" style={{ flex: "1 1 300px", minWidth: 280 }}>
                {cuadriculaBloques}
                {avisoOtroSonando}
                {relojEstado}
              </div>
              <div className="space-y-4" style={{ flex: "1 1 320px", minWidth: 300 }}>
                {reproductor}
                {controlVolumen}
                {avisoVisible}
                {gestionPistas}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
