// La página del DJ (?dj=<token>, él, v81): «Canciones para bailar» para
// DJ Brown, solo para mirar. Entra con el enlace y la clave que el
// anfitrión le da por teléfono; este aparato la recuerda. Ve lo mismo que el
// anfitrión, sin nombres: una línea por petición, con las estrellas y la
// edad de quien la pidió. Puede buscar, quedarse con un tramo de edad,
// ordenar, exportar a CSV e imprimir o guardar en PDF; cada canción se abre
// en Deezer. Se actualiza sola cada minuto. La base: dj_canciones.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { C, OP, FONDO_VERDE, inputStyle } from "../theme";
import { Boton } from "../components/Boton";
import { TextInput } from "../components/Formulario";
import { LineaAviso } from "../components/LineaAviso";
import { RecuadroCifras } from "../components/Widgets";
import { ListaCancionesDj } from "../components/ListaCancionesDj";
import { cifrasDelDj, MOTIVOS_DJ } from "../lib/dj";
import { useFichaInstalacion, fichaDelDj } from "../lib/fichaInstalacion";
import { pedirMuestras } from "../lib/escuchar";

const CADA = 60 * 1000;

// La clave, recordada en este aparato (si el navegador deja guardar).
const guardada = {
  leer: (token) => {
    try {
      return localStorage.getItem(`dj-clave:${token}`) || "";
    } catch {
      return "";
    }
  },
  poner: (token, clave) => {
    try {
      if (clave) localStorage.setItem(`dj-clave:${token}`, clave);
      else localStorage.removeItem(`dj-clave:${token}`);
    } catch {
      /* sin memoria: la pedirá otra vez */
    }
  },
};

export function VistaDj({ token }) {
  const [clave, setClave] = useState(() => guardada.leer(token));
  const [escrita, setEscrita] = useState("");
  const [datos, setDatos] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(Boolean(clave));
  const [hora, setHora] = useState(null);
  // Su propia ficha de instalación (v88.4, él): el acceso directo abre sus
  // canciones, no la entrada de la app.
  useFichaInstalacion(fichaDelDj(token), "Canciones");

  const cargar = useCallback(
    async (conClave) => {
      const { data, error } = await supabase.rpc("dj_canciones", { p_token: token, p_clave: conClave });
      setCargando(false);
      if (error) {
        setMotivo(`No se pudo cargar la lista (${error.message}). Prueba otra vez en un momento.`);
        return;
      }
      if (data?.error) {
        guardada.poner(token, "");
        setClave("");
        setDatos(null);
        setMotivo(MOTIVOS_DJ[data.error] || MOTIVOS_DJ.enlace);
        return;
      }
      guardada.poner(token, conClave);
      setMotivo("");
      setDatos(data);
      setHora(new Date());
    },
    [token]
  );

  // Con la clave, al entrar, cada minuto y al volver a la pestaña.
  useEffect(() => {
    if (!clave) return undefined;
    cargar(clave);
    const t = setInterval(() => cargar(clave), CADA);
    const alVolver = () => document.visibilityState === "visible" && cargar(clave);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [clave, cargar]);

  const entrar = (e) => {
    e.preventDefault();
    if (!escrita.trim()) return;
    setCargando(true);
    setClave(escrita.trim().toUpperCase());
  };

  if (!datos) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.paper }}>
        <form onSubmit={entrar} className="w-full space-y-3" style={{ maxWidth: 360 }}>
          <h1 className="text-xl" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700 }}>
            Canciones para bailar
          </h1>
          <p className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Escribe la clave que te han dado por teléfono.
          </p>
          <div className="flex items-center gap-2">
            <TextInput
              value={escrita}
              onChange={(e) => setEscrita(e.target.value)}
              placeholder="Clave"
              aria-label="Clave"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={5}
              className="flex-1 min-w-0"
              style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.2em" }}
            />
            <Boton variante="principal" type="submit" disabled={cargando}>
              {cargando ? "Entrando…" : "Entrar"}
            </Boton>
          </div>
          {motivo && <LineaAviso className="text-sm">{motivo}</LineaAviso>}
        </form>
      </div>
    );
  }

  // La escucha previa (v81.1), con su enlace y su clave.
  const escuchar = (consulta) => pedirMuestras({ consulta, dj: { token, clave } });

  return (
    <div className="min-h-screen" style={{ background: C.paper }}>
      <header className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap oculto-al-imprimir" style={{ background: FONDO_VERDE }}>
        <div className="min-w-0">
          <h1 className="text-lg truncate" style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700 }}>
            Canciones para bailar
          </h1>
          <p className="text-xs truncate" style={{ color: C.goldClaro, opacity: OP.secundario }}>
            {[datos.evento, datos.nombre].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="min-w-0 overflow-x-auto">
          <RecuadroCifras cifras={cifrasDelDj(datos)} />
        </div>
      </header>

      <main className="mx-auto p-4" style={{ width: "max-content", maxWidth: "100%", minWidth: "min(100%, 420px)" }}>
        <ListaCancionesDj datos={datos} escuchar={escuchar} hora={hora} motivo={motivo} />
      </main>
    </div>
  );
}
