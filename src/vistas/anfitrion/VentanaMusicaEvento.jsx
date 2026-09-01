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
  Radio,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
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
  // La lista de pistas del Mac nace plegada: se usa una vez, la semana
  // antes de la boda, no en directo -- así no roba altura el resto del
  // tiempo (compactación del 2026-09-01).
  const [pistasAbierto, setPistasAbierto] = useState(false);
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


  // ---------- Paleta y sistema visual de esta ventana ----------
  // Repaso de pulido (2026-08-31) + COMPACTACIÓN (2026-09-01).
  //
  // El problema que resuelve la compactación: en el móvil había que
  // hacer SCROLL para llegar al volumen o al play. En una fiesta, de
  // pie y con una mano, eso no vale -- lo esencial tiene que caber en
  // una pantalla. Tres fusiones lo consiguen sin quitar nada:
  //   1. El reloj y su estado se meten en la cabecera (era una tarjeta
  //      entera de ~85px solo para decir la hora).
  //   2. El volumen pasa de tres filas (rótulo / barra / botones) a UNA
  //      sola: silencio + barra + % + menos + más.
  //   3. En el reproductor, el nombre del bloque y los tiempos comparten
  //      línea con la barra de progreso, y el chip de salto se sube a la
  //      fila de los botones en vez de ocupar una fila propia.
  //
  // Reglas de estilo que se mantienen del repaso anterior:
  // - UN solo dorado macizo: el botón de play.
  // - Tres niveles de peso: acción > navegación > información.
  // - Radios y sombras constantes; nada que se toque baja de 44px.
  const P = {
    fondo: "linear-gradient(160deg, #22402F 0%, #0E1A13 100%)",
    panel: "rgba(255, 255, 255, 0.055)",
    panelVivo: "rgba(255, 255, 255, 0.11)",
    linea: "rgba(217, 183, 120, 0.18)",
    texto: "#F2EDE3",
    tenue: "rgba(242, 237, 227, 0.52)",
    oro: C.goldClaro,
    oroRelleno: "linear-gradient(180deg, #E8CE94, #C29A5E)",
    oscuro: "#12201A",
  };
  const RELIEVE = "inset 0 1px 0 rgba(255,255,255,0.07), 0 10px 26px rgba(0,0,0,0.32)";
  const SUAVE = "all .18s ease";

  const esMovil = rol === "mando";
  const M = esMovil
    ? { base: 16, bloque: 78, nombre: 17, hora: 11, play: 76, playIcono: 30, salto: 56, silencio: 48, reloj: 17, titulo: 17, texto: 14, etiqueta: 10.5, ancho: 520 }
    : { base: 14, bloque: 70, nombre: 15, hora: 10, play: 64, playIcono: 26, salto: 50, silencio: 44, reloj: 16, titulo: 16, texto: 13, etiqueta: 10, ancho: 900 };

  const tarjeta = { background: P.panel, borderRadius: 18, boxShadow: RELIEVE };
  const etiqueta = {
    fontSize: M.etiqueta,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: P.tenue,
    fontWeight: 600,
  };
  const cifra = { fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" };

  const colorEstado = { enHora: "#7FC99A", retraso: "#E88C97", antes: "rgba(242,237,227,0.45)" }[estadoReloj.tipo];

  const barrasEcualizador = (alto, ancho, color) => (
    <span className="flex items-end gap-1" style={{ height: alto, flexShrink: 0 }}>
      {[0, 1, 2, 3].map((barra) => (
        <span
          key={barra}
          className={sonando ? "ecualizador-barra rounded-sm" : "rounded-sm"}
          style={{
            width: ancho,
            height: alto,
            background: color,
            opacity: sonando ? 0.95 : 0.4,
            transform: sonando ? undefined : "scaleY(0.4)",
            transformOrigin: "bottom center",
            animationDelay: `${barra * 0.16}s`,
          }}
        />
      ))}
    </span>
  );

  const cuadriculaBloques = (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
      {bloques.map((b, i) => {
        const esActual = i === seleccionado;
        const suenaAqui = i === bloqueSonando;
        const yaPaso = minutosDesdeMedianoche(horas[i]) < ahora.getHours() * 60 + ahora.getMinutes();
        return (
          <button
            key={i}
            onClick={hacer("bloque", i)}
            className={`relative flex flex-col items-center justify-center gap-1 p-2${suenaAqui ? " bloque-sonando" : ""}`}
            style={{
              // Rectángulo suave, no cuadrado: se le quita poca altura
              // (0.82 del ancho) -- a petición del usuario, 2026-09-01.
              // De paso el conjunto ocupa menos alto sin encoger la
              // letra ni perder superficie donde tocar.
              aspectRatio: "1 / 0.82",
              minHeight: M.bloque,
              borderRadius: 14,
              transition: SUAVE,
              background: esActual ? P.panelVivo : P.panel,
              border: `1px solid ${esActual ? P.oro : "rgba(255,255,255,0.06)"}`,
              // Relieve de verdad, también sin seleccionar: filo de luz
              // arriba y sombra proyectada debajo. Antes los no
              // seleccionados iban planos ("boxShadow: none") y por eso
              // parecían recuadros pintados, no botones.
              boxShadow: esActual
                ? "inset 0 1px 0 rgba(255,255,255,0.16), 0 6px 16px rgba(0,0,0,0.4)"
                : "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.28)",
              opacity: !esActual && yaPaso && !suenaAqui ? 0.4 : 1,
            }}
          >
            <span className="absolute" style={{ top: 7, left: 8, ...cifra, fontSize: M.hora, color: P.tenue }}>
              {horas[i]}
            </span>
            {pistas[i] && !suenaAqui && (
              <span className="absolute rounded-full" style={{ top: 8, right: 8, width: 6, height: 6, background: P.oro, opacity: 0.75 }} title="Tiene pista" />
            )}
            <span
              className="text-center"
              style={{ fontSize: M.nombre, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.01em", color: esActual ? P.texto : "rgba(242,237,227,0.82)" }}
            >
              {b.texto || `Bloque ${i + 1}`}
            </span>
            {suenaAqui && barrasEcualizador(12, 3, P.oro)}
          </button>
        );
      })}
    </div>
  );

  // Barra fina: solo aparece cuando estás mirando un bloque distinto al
  // que suena. Antes ocupaba 72px con dos líneas de texto; ahora una
  // sola línea basta, porque el nombre ya se lee en el ecualizador que
  // late arriba, en su propio bloque.
  const avisoOtroSonando =
    bloqueSonando != null && !mirandoElQueSuena ? (
      <button
        onClick={hacer("bloque", bloqueSonando)}
        className="w-full flex items-center gap-2.5 px-3"
        style={{ minHeight: 46, borderRadius: 12, background: P.panelVivo, border: `1px solid ${P.oro}`, color: P.texto, transition: SUAVE }}
      >
        {barrasEcualizador(14, 3, P.oro)}
        <span className="flex-1 text-left truncate" style={{ fontSize: M.texto }}>
          {sonando ? "Suena " : "En pausa "}
          <strong style={{ fontWeight: 600 }}>{bloques[bloqueSonando]?.texto || `Bloque ${bloqueSonando + 1}`}</strong>
        </span>
        <span style={{ ...etiqueta, color: P.oro, flexShrink: 0 }}>Ir</span>
      </button>
    ) : null;

  const reproductor = (
    <div className="px-4 pt-3 pb-4" style={tarjeta}>
      {pistaActual ? (
        <>
          {/* Nombre del bloque y tiempos en la MISMA línea: antes eran
              tres filas (rótulo, nombre de archivo, tiempos). */}
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <span className="truncate" style={{ fontSize: M.texto + 1, fontWeight: 600 }}>
              {bloques[seleccionado]?.texto || `Bloque ${seleccionado + 1}`}
            </span>
            <span style={{ ...cifra, fontSize: M.texto - 1, color: P.tenue, flexShrink: 0 }}>
              {mirandoElQueSuena ? `${formatearTiempo(posicion)} / ${formatearTiempo(duracion)}` : "sin sonar"}
            </span>
          </div>

          <div className="rounded-full mb-4" style={{ height: 5, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
            <div
              className="rounded-full"
              style={{
                height: 5,
                width: mirandoElQueSuena && duracion ? `${Math.min(100, (posicion / duracion) * 100)}%` : 0,
                background: P.oro,
                transition: "width .9s linear",
              }}
            />
          </div>

          {/* Transporte y chip de salto en la MISMA fila: el chip ya no
              se lleva una fila entera para él solo. */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={hacer("saltar", -salto)}
                className="flex items-center justify-center"
                style={{ width: M.salto, height: M.salto, borderRadius: 14, background: P.panelVivo, color: P.texto, transition: SUAVE }}
              >
                <ChevronsLeft size={esMovil ? 22 : 19} />
              </button>
              <button
                onClick={hacer("alternar", seleccionado)}
                className="rounded-full flex items-center justify-center"
                style={{
                  width: M.play,
                  height: M.play,
                  background: P.oroRelleno,
                  boxShadow: "0 8px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
                  transition: SUAVE,
                }}
                title={mirandoElQueSuena ? (sonando ? "Pausar" : "Reanudar") : `Poner "${bloques[seleccionado]?.texto || ""}"`}
              >
                {mirandoElQueSuena && sonando ? (
                  <Pause size={M.playIcono} fill={P.oscuro} color={P.oscuro} />
                ) : (
                  <Play size={M.playIcono} fill={P.oscuro} color={P.oscuro} style={{ marginLeft: 4 }} />
                )}
              </button>
              <button
                onClick={hacer("saltar", salto)}
                className="flex items-center justify-center"
                style={{ width: M.salto, height: M.salto, borderRadius: 14, background: P.panelVivo, color: P.texto, transition: SUAVE }}
              >
                <ChevronsRight size={esMovil ? 22 : 19} />
              </button>
            </div>

            <div className="flex flex-col items-end gap-1.5" style={{ flexShrink: 0 }}>
              {saltoAbierto ? (
                <div className="flex flex-col gap-1">
                  {SALTOS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSalto(s);
                        setSaltoAbierto(false);
                      }}
                      className="rounded-full px-2.5"
                      style={{
                        minHeight: 30,
                        fontSize: M.texto - 1,
                        fontWeight: 600,
                        transition: SUAVE,
                        ...(s === salto ? { background: P.oro, color: P.oscuro } : { background: P.panelVivo, color: P.texto }),
                      }}
                    >
                      {s < 60 ? `${s}s` : "1min"}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setSaltoAbierto(true)}
                    className="rounded-full px-3"
                    style={{ minHeight: 34, ...etiqueta, transition: SUAVE }}
                    title="Cambiar cuánto salta"
                  >
                    ±{salto < 60 ? `${salto}s` : "1m"}
                  </button>
                  {cortinilla && (
                    <button
                      onClick={hacer("cortinilla")}
                      className="rounded-full flex items-center justify-center"
                      style={{ width: 34, height: 34, background: P.panelVivo, color: P.oro, transition: SUAVE }}
                      title="Lanzar la cortinilla"
                    >
                      <Radio size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Music size={24} style={{ color: P.tenue }} />
          <p style={{ color: P.tenue, fontSize: M.texto }}>
            {esReproductor ? "Este bloque no tiene pista todavía" : "Este bloque no tiene pista (se eligen en el Mac)"}
          </p>
        </div>
      )}
    </div>
  );

  // UNA sola fila: silencio, barra, porcentaje, menos y más. Antes eran
  // tres filas apiladas (rótulo / barra / botones) para lo mismo.
  const controlVolumen = (
    <div className="flex items-center gap-2 px-3" style={{ ...tarjeta, minHeight: M.silencio + 16 }}>
      <button
        onClick={hacer("silencio")}
        className="flex items-center justify-center"
        style={{
          width: M.silencio,
          height: M.silencio,
          borderRadius: 14,
          background: silenciado ? C.wax : P.panelVivo,
          color: silenciado ? P.texto : P.oro,
          flexShrink: 0,
          transition: SUAVE,
        }}
        title={silenciado ? "Quitar el silencio" : "Silenciar"}
      >
        {silenciado ? <VolumeX size={esMovil ? 21 : 18} /> : <Volume2 size={esMovil ? 21 : 18} />}
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
        className="flex-1 min-w-0"
        style={{ accentColor: C.gold, height: 28 }}
      />
      <span style={{ ...cifra, fontSize: M.texto, fontWeight: 600, color: P.tenue, width: 40, textAlign: "right", flexShrink: 0 }}>
        {silenciado ? "—" : `${volumen}%`}
      </span>
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
          className="flex items-center justify-center"
          style={{
            width: M.silencio,
            height: M.silencio,
            borderRadius: 14,
            fontSize: esMovil ? 21 : 18,
            fontWeight: 600,
            background: P.panelVivo,
            color: P.texto,
            flexShrink: 0,
            touchAction: "manipulation",
            userSelect: "none",
            WebkitUserSelect: "none",
            transition: SUAVE,
          }}
          title={`${direccion < 0 ? "Bajar" : "Subir"} ${PASO_VOLUMEN}% (mantén pulsado para seguir)`}
        >
          {direccion < 0 ? "−" : "+"}
        </button>
      ))}
    </div>
  );

  // Solo en el Mac, y PLEGADA por defecto: se usa una vez, la semana
  // antes de la boda, no en directo.
  const gestionPistas = (
    <div style={tarjeta}>
      <button
        onClick={() => setPistasAbierto((a) => !a)}
        className="w-full flex items-center justify-between px-4"
        style={{ minHeight: 48, color: P.texto }}
      >
        <span style={etiqueta}>Pistas por bloque</span>
        <span className="flex items-center gap-2" style={{ fontSize: M.texto - 1, color: P.tenue }}>
          {cargandoPistas ? "cargando…" : `${Object.keys(pistas).length}/${bloques.length}`}
          <ChevronDown size={16} style={{ transform: pistasAbierto ? "rotate(180deg)" : "none", transition: SUAVE }} />
        </span>
      </button>
      {pistasAbierto && (
        <div className="px-3 pb-3">
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {bloques.map((b, i) => (
              <label
                key={i}
                className="flex items-center gap-3 cursor-pointer px-2"
                style={{
                  minHeight: 38,
                  borderRadius: 10,
                  background: i === seleccionado ? P.panelVivo : "transparent",
                  fontSize: M.texto,
                  color: P.texto,
                  transition: SUAVE,
                }}
              >
                <span style={{ ...cifra, fontSize: 11, color: P.tenue, width: 36, flexShrink: 0 }}>{horas[i]}</span>
                <span style={{ width: 76, flexShrink: 0, fontWeight: 500 }}>{b.texto || `Bloque ${i + 1}`}</span>
                <span className="flex-1 truncate" style={{ color: pistas[i] ? P.texto : P.tenue }}>
                  {pistas[i] ? pistas[i].nombre : "sin pista"}
                </span>
                <Upload size={15} style={{ color: P.oro, flexShrink: 0, opacity: 0.8 }} />
                <input type="file" accept="audio/*" onChange={elegirArchivo(i)} style={{ display: "none" }} />
              </label>
            ))}
          </div>
          <label
            className="flex items-center gap-2.5 cursor-pointer px-3 mt-2"
            style={{ background: P.panelVivo, borderRadius: 12, color: P.texto, minHeight: 44, fontSize: M.texto, transition: SUAVE }}
          >
            <Radio size={16} style={{ flexShrink: 0, color: P.oro }} />
            <span className="truncate">{cortinilla ? `Cortinilla: ${cortinilla.nombre}` : "Elegir cortinilla"}</span>
            <input type="file" accept="audio/*" onChange={elegirArchivo("cortinilla")} style={{ display: "none" }} />
          </label>
        </div>
      )}
    </div>
  );

  const avisoVisible = aviso ? (
    <p className="px-4 py-3" style={{ borderRadius: 14, background: "rgba(228,120,130,0.14)", color: "#F0A4AC", fontSize: M.texto }}>
      {aviso}
    </p>
  ) : null;

  return (
    <div className="flex flex-col" style={{ height: "100%", background: P.fondo, fontFamily: "'Inter', sans-serif", fontSize: M.base, color: P.texto }}>
      <audio ref={audioRef} onEnded={() => setSonando(false)} onLoadedMetadata={(e) => setDuracion(e.target.duration || 0)} />
      <audio ref={cortinillaRef} src={cortinilla?.url} />

      {/* Cabecera con el RELOJ dentro: la hora y el retraso ya no
          necesitan una tarjeta propia, que era pura altura perdida. */}
      <div
        className="flex items-center justify-between gap-3 px-4"
        style={{ flexShrink: 0, minHeight: 52, borderBottom: `1px solid ${P.linea}` }}
      >
        <h3 style={{ fontFamily: "'Fraunces', serif", color: P.texto, fontWeight: 600, fontSize: M.titulo, letterSpacing: "-0.01em", flexShrink: 0 }}>
          Música
        </h3>
        {rol !== "sin-definir" && (
          <div className="flex items-center gap-2 min-w-0">
            <span style={{ ...cifra, fontSize: M.reloj, fontWeight: 600 }}>
              {String(ahora.getHours()).padStart(2, "0")}:{String(ahora.getMinutes()).padStart(2, "0")}
            </span>
            <span className="rounded-full" style={{ width: 6, height: 6, background: colorEstado, flexShrink: 0 }} />
            <span className="truncate" style={{ fontSize: M.texto - 1, color: P.tenue }} title={estadoReloj.detalle}>
              {estadoReloj.texto}
            </span>
          </div>
        )}
        <span className="flex items-center gap-2" style={{ color: P.tenue, flexShrink: 0 }} title={conectado ? "Conectado" : "Sin conexión"}>
          {conectado ? <Wifi size={16} /> : <WifiOff size={16} />}
          {rol === "sin-definir" ? null : esReproductor ? <Speaker size={16} /> : <Smartphone size={16} />}
        </span>
      </div>

      <div className="px-4 py-3" style={{ flex: 1, overflowY: "auto" }}>
        {rol === "sin-definir" && (
          <div className="flex flex-col gap-3" style={{ maxWidth: 420, margin: "0 auto" }}>
            <p className="text-center mb-1" style={{ color: P.tenue, fontSize: M.texto }}>
              ¿Qué papel tiene este aparato?
            </p>
            <button
              onClick={declararReproductor}
              className="flex flex-col items-center justify-center gap-1 px-4"
              style={{ minHeight: 92, borderRadius: 18, background: P.oroRelleno, color: P.oscuro, boxShadow: RELIEVE, transition: SUAVE }}
            >
              <span className="flex items-center gap-2" style={{ fontSize: 17, fontWeight: 600 }}>
                <Speaker size={20} /> Este reproduce el sonido
              </span>
              <span style={{ fontSize: 13, opacity: 0.7 }}>El ordenador conectado a los altavoces</span>
            </button>
            <button
              onClick={() => setRol("mando")}
              className="flex flex-col items-center justify-center gap-1 px-4"
              style={{ minHeight: 92, borderRadius: 18, background: P.panel, color: P.texto, boxShadow: RELIEVE, transition: SUAVE }}
            >
              <span className="flex items-center gap-2" style={{ fontSize: 17, fontWeight: 600 }}>
                <Smartphone size={20} /> Mando a distancia
              </span>
              <span style={{ fontSize: 13, color: P.tenue }}>Controla el sonido sin tocar el ordenador</span>
            </button>
          </div>
        )}

        {rol === "mando" && (
          <div className="flex flex-col gap-2.5" style={{ maxWidth: M.ancho, margin: "0 auto" }}>
            {!recibidoEstado && (
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderRadius: 14, background: "rgba(228,120,130,0.14)", color: "#F0A4AC", fontSize: M.texto }}
              >
                <WifiOff size={18} style={{ flexShrink: 0 }} />
                <span>Esperando al ordenador… Abre "Música del evento" en el Mac y márcalo como el aparato que reproduce.</span>
              </div>
            )}
            {cuadriculaBloques}
            {avisoOtroSonando}
            {reproductor}
            {controlVolumen}
            {avisoVisible}
          </div>
        )}

        {rol === "reproductor" && (
          <div style={{ maxWidth: M.ancho, margin: "0 auto" }}>
            <div className="flex flex-wrap gap-4 items-start">
              <div className="flex flex-col gap-2.5" style={{ flex: "1 1 300px", minWidth: 280 }}>
                {cuadriculaBloques}
                {avisoOtroSonando}
              </div>
              <div className="flex flex-col gap-2.5" style={{ flex: "1 1 320px", minWidth: 300 }}>
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
