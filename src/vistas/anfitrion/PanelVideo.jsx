// Multimedia → Vídeo (v58): el mando de la pantalla de la tele. Tres
// botones (Logo, Fotos 1, Fotos 2) y, en el ordenador, cargar los tres
// vídeos y abrir la pantalla (PaginaPantalla.jsx). Mismo lenguaje que el
// mando de la música, ya aprobado: recibe sus materiales (paleta, tecla,
// tarjeta y medidas) de VentanaMusicaEvento en vez de copiarlos.
import { useEffect, useState } from "react";
import { Monitor, MonitorOff, Upload } from "lucide-react";
import { useMandoMusica, CANAL_VIDEO } from "../../lib/useMandoMusica";
import { guardarVideo, leerTodosLosVideos } from "../../lib/almacenPistas";
import { VIDEOS, abrirVentanaPantalla } from "../../lib/ventanaMusica";

export function PanelVideo({ P, tecla, tarjeta, M, SUAVE, esTactil, preguntar }) {
  const [estado, setEstado] = useState({ poniendo: null, hay: {} });
  const { hayPantalla, enviarOrden } = useMandoMusica({
    canal: CANAL_VIDEO,
    rol: "mando",
    onEstado: (e) => e && setEstado({ poniendo: e.poniendo ?? null, hay: e.hay || {} }),
  });
  // Recién conectado, el mando no sabe nada: se lo pide a la pantalla.
  useEffect(() => {
    if (hayPantalla) enviarOrden("pedirEstado");
  }, [hayPantalla, enviarOrden]);

  // Los vídeos guardados en ESTE ordenador (solo sus nombres).
  const [guardados, setGuardados] = useState({});
  const leerGuardados = () =>
    leerTodosLosVideos()
      .then((t) => setGuardados(Object.fromEntries(Object.entries(t).map(([c, v]) => [c, v.nombre]))))
      .catch(() => setGuardados({}));
  useEffect(() => {
    if (!esTactil) leerGuardados();
  }, [esTactil]);

  const aviso = (titulo, texto) => preguntar({ titulo, texto, soloAviso: true });

  const poner = (clave, titulo) => {
    if (!hayPantalla) {
      aviso("La pantalla no está abierta", "Ábrela en el ordenador de la tele: Multimedia → Vídeo → «Abrir la pantalla».");
      return;
    }
    if (estado.hay[clave] === false) {
      aviso(`Falta «${titulo}»`, "Cárgalo en Multimedia → Vídeo, en el ordenador de la tele.");
      return;
    }
    enviarOrden("poner", clave);
  };

  const cargar = async (clave, archivo) => {
    if (!archivo) return;
    try {
      await guardarVideo(clave, archivo);
      await leerGuardados();
      // La pantalla de este mismo ordenador lo lee al momento.
      enviarOrden("recargar");
    } catch (error) {
      preguntar({ titulo: "No se pudo guardar el vídeo", texto: "Puede que el navegador no tenga sitio para un archivo tan grande.", detalle: error?.message, soloAviso: true });
    }
  };

  return (
    <div className="flex flex-col gap-3" style={{ maxWidth: M.ancho, margin: "0 auto" }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ ...tarjeta, color: hayPantalla ? P.texto : P.tenue, fontSize: M.texto }}>
        {hayPantalla ? <Monitor size={18} /> : <MonitorOff size={18} />}
        {hayPantalla
          ? `En pantalla: ${VIDEOS.find((v) => v.clave === estado.poniendo)?.titulo || "nada todavía"}`
          : "La pantalla no está abierta"}
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {VIDEOS.map(({ clave, titulo }) => {
          const enPantalla = estado.poniendo === clave;
          const falta = estado.hay[clave] === false;
          return (
            <button
              key={clave}
              onClick={() => poner(clave, titulo)}
              className="relative flex flex-col items-center justify-center gap-1 p-2"
              style={{
                minHeight: M.bloque + 14,
                borderRadius: 14,
                transition: SUAVE,
                ...tecla(enPantalla),
                opacity: falta ? 0.45 : 1,
              }}
              aria-pressed={enPantalla}
            >
              <span style={{ fontSize: M.nombre, fontWeight: 600, color: enPantalla ? P.texto : P.tenue }}>{titulo}</span>
              {enPantalla && <span className="rounded-full" style={{ width: 8, height: 8, background: P.oro }} />}
            </button>
          );
        })}
      </div>

      {!esTactil && (
        <div className="flex flex-col gap-2 px-4 py-3" style={tarjeta}>
          <span style={{ fontSize: M.etiqueta, letterSpacing: "0.12em", textTransform: "uppercase", color: P.tenue, fontWeight: 600 }}>
            Vídeos de este ordenador
          </span>
          {VIDEOS.map(({ clave, titulo }) => (
            <label key={clave} className="flex items-center gap-3" style={{ fontSize: M.texto, color: P.texto, cursor: "pointer" }}>
              <span style={{ width: 70, flexShrink: 0, fontWeight: 600 }}>{titulo}</span>
              <span className="truncate flex-1" style={{ color: guardados[clave] ? P.texto : P.tenue }}>
                {guardados[clave] || "Sin cargar"}
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5" style={{ borderRadius: 10, ...tecla(false), color: P.texto }}>
                <Upload size={14} /> Elegir
              </span>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => cargar(clave, e.target.files?.[0])} />
            </label>
          ))}
          <button
            onClick={() => {
              if (!abrirVentanaPantalla()) aviso("El navegador no deja abrir la pantalla", "Permite las ventanas emergentes para esta web y vuelve a pulsar.");
            }}
            className="flex items-center justify-center gap-2 mt-1"
            style={{ minHeight: 44, borderRadius: 12, ...tecla(true), color: P.texto, fontWeight: 600, fontSize: M.texto }}
          >
            <Monitor size={16} /> Abrir la pantalla
          </button>
        </div>
      )}
    </div>
  );
}
