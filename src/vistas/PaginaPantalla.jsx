// La pantalla de la tele (?pantalla, v58): solo el vídeo, a pantalla
// completa. Se abre en el Mac conectado a la tele (Multimedia → Vídeo →
// «Abrir la pantalla»), se arrastra allí y se pulsa «Pantalla completa».
//
// El logo, en bucle, es el reposo: lo que se ve mientras no se pone otra
// cosa. «Fotos 1» y «Fotos 2» se ven una vez y, al terminar, vuelve solo
// al logo. Cada cambio, con un fundido. Siempre en silencio: el sonido de
// un vídeo lo pone el Mac del sonido (paso 2), sea este mismo u otro.
//
// Los vídeos viven dentro del navegador de ESTE Mac (lib/almacenPistas.js):
// se cargan una vez en Multimedia → Vídeo, en el mismo ordenador, y esa
// noche no se descarga nada.
import { useCallback, useEffect, useRef, useState } from "react";
import { useMandoMusica, CANAL_VIDEO } from "../lib/useMandoMusica";
import { leerTodosLosVideos } from "../lib/almacenPistas";
import { cogerCerrojoMusica, NOMBRE_VENTANA_PANTALLA, VIDEOS, VIDEO_REPOSO, despuesDe } from "../lib/ventanaMusica";
import { PantallaCargando } from "../components/PantallaCargando";
import { Boton } from "../components/Boton";
import { C, T, R, OP } from "../theme";

const FUNDIDO = 1500; // ms que tarda un vídeo en fundirse con el siguiente
const LATIDO_ESTADO = 3000; // cada cuánto le cuenta al mando qué se ve

function Aviso({ titulo, texto, children }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ color: C.paper }}>
      <p style={{ fontFamily: "'Fraunces', serif", fontSize: T.titulo, fontWeight: 600 }}>{titulo}</p>
      {texto && <p style={{ fontSize: T.normal, opacity: OP.secundario, maxWidth: 520 }}>{texto}</p>}
      {children}
    </div>
  );
}

export function PaginaPantalla() {
  // Una sola pantalla por aparato: dos a la vez se pisarían el mando.
  const [libre, setLibre] = useState(null);
  useEffect(() => cogerCerrojoMusica(setLibre, undefined, NOMBRE_VENTANA_PANTALLA), []);
  useEffect(() => {
    document.title = "Pantalla del evento";
  }, []);

  if (libre === null) return <PantallaCargando />;
  return (
    <div className="fixed inset-0" style={{ background: "#000" }}>
      {libre ? <Reproductor /> : <Aviso titulo="La pantalla ya está abierta" texto="En otra ventana de este ordenador. Usa esa." />}
    </div>
  );
}

function Reproductor() {
  // Dos <video> que se turnan: el que entra se funde sobre el que sale.
  const videos = useRef([null, null]);
  const [visible, setVisible] = useState(0);
  const visibleRef = useRef(0);
  const [poniendo, setPoniendo] = useState(null);
  const poniendoRef = useRef(null);
  const [urls, setUrls] = useState(null); // null = todavía leyendo
  const urlsRef = useRef({});
  const [completa, setCompleta] = useState(false);

  // Lee los vídeos guardados. No se liberan las URL viejas al recargar:
  // la que se está viendo dejaría de verse. Se liberan al cerrar.
  const cargar = useCallback(async () => {
    let nuevas = {};
    try {
      const guardados = await leerTodosLosVideos();
      for (const [clave, v] of Object.entries(guardados)) nuevas[clave] = URL.createObjectURL(v.datos);
    } catch {
      nuevas = {};
    }
    urlsRef.current = nuevas;
    setUrls(nuevas);
  }, []);
  useEffect(() => {
    cargar();
    return () => Object.values(urlsRef.current).forEach((u) => URL.revokeObjectURL(u));
  }, [cargar]);

  const poner = useCallback((clave) => {
    const url = urlsRef.current[clave];
    if (!url) return;
    const sale = visibleRef.current;
    const entra = 1 - sale;
    const el = videos.current[entra];
    if (!el) return;
    el.src = url;
    el.loop = clave === VIDEO_REPOSO;
    el.muted = true;
    el.currentTime = 0;
    el.play()?.catch?.(() => {});
    visibleRef.current = entra;
    setVisible(entra);
    poniendoRef.current = clave;
    setPoniendo(clave);
    setTimeout(() => {
      if (visibleRef.current !== sale) videos.current[sale]?.pause();
    }, FUNDIDO);
  }, []);

  // Al abrir, el logo: que haya algo en pantalla desde el primer momento.
  useEffect(() => {
    if (urls && !poniendoRef.current && urls[VIDEO_REPOSO]) poner(VIDEO_REPOSO);
  }, [urls, poner]);

  // Lo que se ve y lo que hay cargado, para el mando.
  const estado = () => ({
    poniendo: poniendoRef.current,
    hay: Object.fromEntries(VIDEOS.map(({ clave }) => [clave, Boolean(urlsRef.current[clave])])),
  });
  const { enviarEstado } = useMandoMusica({
    canal: CANAL_VIDEO,
    rol: "pantalla",
    onOrden: ({ accion, valor } = {}) => {
      if (accion === "poner") poner(valor);
      else if (accion === "recargar") cargar();
      else if (accion === "pedirEstado") enviarEstado(estado());
    },
  });
  useEffect(() => {
    enviarEstado(estado());
    const latido = setInterval(() => enviarEstado(estado()), LATIDO_ESTADO);
    return () => clearInterval(latido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poniendo, urls, enviarEstado]);

  // Pantalla completa, y que el Mac no se duerma mientras está abierta.
  useEffect(() => {
    const alCambiar = () => setCompleta(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", alCambiar);
    document.addEventListener("webkitfullscreenchange", alCambiar);
    let cerrojo = null;
    const pedirDespierto = () => {
      if (document.visibilityState === "visible") navigator.wakeLock?.request("screen").then((c) => (cerrojo = c)).catch(() => {});
    };
    pedirDespierto();
    document.addEventListener("visibilitychange", pedirDespierto);
    return () => {
      document.removeEventListener("fullscreenchange", alCambiar);
      document.removeEventListener("webkitfullscreenchange", alCambiar);
      document.removeEventListener("visibilitychange", pedirDespierto);
      cerrojo?.release?.().catch?.(() => {});
    };
  }, []);
  const ponerCompleta = () => {
    const raiz = document.documentElement;
    (raiz.requestFullscreen || raiz.webkitRequestFullscreen)?.call(raiz)?.catch?.(() => {});
  };

  return (
    <div className="absolute inset-0" style={{ cursor: completa ? "none" : undefined }}>
      {[0, 1].map((i) => (
        <video
          key={i}
          ref={(nodo) => (videos.current[i] = nodo)}
          playsInline
          muted
          onEnded={() => {
            if (visibleRef.current !== i) return;
            const siguiente = despuesDe(poniendoRef.current);
            if (siguiente) poner(siguiente);
          }}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "contain", opacity: visible === i && poniendo ? 1 : 0, transition: `opacity ${FUNDIDO}ms ease` }}
        />
      ))}
      {urls && !urls[VIDEO_REPOSO] && (
        <Aviso titulo="Falta el vídeo del logo" texto="Cárgalo en Multimedia → Vídeo, en este mismo ordenador." />
      )}
      {!completa && (
        <div className="absolute left-0 right-0 bottom-0 flex justify-center pb-6">
          {/* Sobre un fondo oscuro: el logo es claro, y el texto claro
              encima no se leía (él, captura de v58). */}
          <div className="flex flex-col items-center gap-2 px-5 py-3" style={{ background: "rgba(0, 0, 0, 0.62)", borderRadius: R.caja, color: C.paper }}>
            <p style={{ fontSize: T.normal }}>Arrastra esta ventana a la tele y pulsa:</p>
            <Boton variante="principal" oscuro onClick={ponerCompleta}>
              Pantalla completa
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
