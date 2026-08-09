import React, { useState, useEffect } from "react";
import { useLedgerData } from "./useLedgerData";
import { supabase } from "./supabaseClient";
import { getRolFromUrl } from "./lib/url";
import { datosCompletos, resolverColaborador } from "./lib/invitados";
import { C } from "./theme";
import { VistaAnfitrion } from "./vistas/VistaAnfitrion";
import { VistaColaborador } from "./vistas/VistaColaborador";

// ---------- Red de seguridad ante errores inesperados ----------

// Un Error Boundary tiene que ser una clase (React todavía no ofrece el
// equivalente con hooks) — es el único mecanismo que puede capturar un
// error de renderizado en cualquier parte del árbol y mostrar algo en vez
// de dejar la pantalla completamente en blanco sin explicación.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Error inesperado capturado por ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Inter', sans-serif" }}
      >
        <div
          className="max-w-md w-full p-6 rounded-lg text-center"
          style={{ background: "#fff", border: `1px solid ${C.line}` }}
        >
          <h1
            className="text-xl mb-2"
            style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700 }}
          >
            Algo ha fallado
          </h1>
          <p className="text-sm mb-4" style={{ color: C.charcoal, opacity: 0.8 }}>
            Ha ocurrido un error inesperado y esta pantalla no se puede seguir mostrando.
            Tus datos están a salvo en la base de datos — nada de esto los afecta. Prueba a
            recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: C.ink, color: C.paper }}
          >
            Recargar la página
          </button>
        </div>
      </div>
    );
  }
}

// ---------- App ----------

export default function App() {
  const urlRol = getRolFromUrl();
  // Se comprueba UNA sola vez si el código del enlace original de la URL
  // es el secreto del anfitrión — independiente de lo que `rol` valga
  // después (que cambia sin tocar la URL cuando el anfitrión previsualiza
  // la vista de un colaborador desde las pestañas de abajo).
  const [esAnfitrionOriginal, setEsAnfitrionOriginal] = useState(null);
  const [rol, setRol] = useState(urlRol || null);
  const data = useLedgerData(rol);

  // Aviso de nueva versión desplegada: al ser una web de una sola página,
  // el navegador se queda con el JS ya cargado aunque Vercel despliegue
  // código nuevo — sin esto, hay que acordarse de recargar a mano cada vez.
  // Se compara el archivo .js que carga esta pestaña con el que carga
  // /index.html ahora mismo (sin caché); si difieren, hay una versión nueva.
  const [hayNuevaVersion, setHayNuevaVersion] = useState(false);
  useEffect(() => {
    const scriptActual = document.querySelector("script[type='module']")?.getAttribute("src");
    if (!scriptActual) return;
    const comprobar = async () => {
      try {
        const res = await fetch("/", { cache: "no-store" });
        const html = await res.text();
        const match = html.match(/<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/);
        if (match && match[1] !== scriptActual) setHayNuevaVersion(true);
      } catch (_) {
        // Sin conexión o fallo de red: no pasa nada, se reintenta luego.
      }
    };
    // Antes solo se comprobaba cada 3 minutos, así que nada más publicar un
    // cambio en Vercel tocaba esperar sin saber si ya había llegado. Ahora
    // se comprueba también nada más cargar la página, y cada minuto.
    comprobar();
    const intervalo = setInterval(comprobar, 60 * 1000);
    const alVolverVisible = () => {
      if (document.visibilityState === "visible") comprobar();
    };
    document.addEventListener("visibilitychange", alVolverVisible);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolverVisible);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!urlRol) {
        setEsAnfitrionOriginal(false);
        return;
      }
      const { data: esValido } = await supabase.rpc("anfitrion_verificar_token", {
        p_token: urlRol,
      });
      if (!cancelado) setEsAnfitrionOriginal(esValido === true);
    })();
    return () => {
      cancelado = true;
    };
  }, [urlRol]);

  if (!data.loaded || esAnfitrionOriginal === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Fraunces', serif" }}
      >
        Abriendo el libro de invitados…
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: C.paper,
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(31,58,46,0.05) 28px)",
        paddingTop: hayNuevaVersion ? 44 : 0,
      }}
    >
      {hayNuevaVersion && (
        <div
          className="fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 py-2 text-sm"
          style={{ background: C.wax, color: "#fff", zIndex: 60, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
        >
          <span className="font-medium">Hay una versión nueva de la app — recarga para actualizar.</span>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 rounded font-medium whitespace-nowrap"
            style={{ background: "#fff", color: C.wax }}
          >
            Actualizar
          </button>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {esAnfitrionOriginal ? (
          (() => {
            const pendientesPorColaborador = (id) =>
              data.invitados.filter(
                (g) =>
                  resolverColaborador(g, data.colaboradores)?.id === id &&
                  g.confirmado &&
                  !datosCompletos(g)
              ).length;
            const totalPendientes = data.colaboradores.reduce(
              (s, c) => s + pendientesPorColaborador(c.id),
              0
            );
            // Barra única (no una fila de botones): pensada para el pulgar en
            // móvil grande (iPhone 14 Pro Max de referencia) — bastante alta
            // para tocar bien, y un <select> nativo abre el selector grande
            // del sistema en vez de un menú propio que hay que construir.
            return (
              <select
                value={rol || ""}
                onChange={(e) => setRol(e.target.value)}
                className="w-full mb-6 px-4 rounded font-medium"
                style={{
                  height: 48,
                  fontSize: 16,
                  background: C.ink,
                  color: C.paper,
                  border: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value={urlRol}>
                  Anfitrión{totalPendientes > 0 ? ` (${totalPendientes} pendientes)` : ""}
                </option>
                {data.colaboradores.map((c) => {
                  const pendientes = pendientesPorColaborador(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                      {pendientes > 0 ? ` (${pendientes} pendientes)` : ""}
                    </option>
                  );
                })}
              </select>
            );
          })()
        ) : urlRol ? (
          <div
            className="text-xs uppercase mb-6 inline-block px-2 py-1 rounded"
            style={{
              color: C.gold,
              border: `1px solid ${C.line}`,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: "0.06em",
            }}
          >
            Vista fija de enlace ·{" "}
            {data.colaboradores.find((c) => c.id === rol)?.nombre || "rol no encontrado"}
          </div>
        ) : null}

        {data.esAnfitrion ? (
          <VistaAnfitrion data={data} />
        ) : data.colaboradores.some((c) => c.id === rol) ? (
          <VistaColaborador data={data} colaboradorId={rol} />
        ) : (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.7 }}>
            Este enlace no es válido o ha caducado. Pide al anfitrión un enlace actualizado.
          </p>
        )}
      </div>
    </div>
  );
}
