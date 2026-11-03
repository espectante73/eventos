// La página del DJ (?dj=<token>, él, v81): «Canciones para bailar» para
// DJ Brown, solo para mirar. Entra con el enlace y la clave que el
// anfitrión le da por teléfono; este aparato la recuerda. Ve lo mismo que el
// anfitrión, sin nombres: una línea por petición, con las estrellas y la
// edad de quien la pidió. Puede buscar, quedarse con un tramo de edad,
// ordenar, exportar a CSV e imprimir o guardar en PDF; cada canción se abre
// en Deezer. Se actualiza sola cada minuto. La base: dj_canciones.
import { useCallback, useEffect, useState } from "react";
import { Copy, Printer, ExternalLink } from "lucide-react";
import { supabase } from "../supabaseClient";
import { C, OP, T, FONDO_VERDE, inputStyle } from "../theme";
import { Boton } from "../components/Boton";
import { TextInput } from "../components/Formulario";
import { LineaAviso } from "../components/LineaAviso";
import { RecuadroCifras, EncabezadoOrdenable } from "../components/Widgets";
import { estrellas, ordenarCanciones, tocarOrdenCanciones, ORDEN_CANCIONES_INICIAL } from "../lib/canciones";
import { cancionesDistintas, duracionTotal, textoDuracion, enlaceDeezer } from "../lib/repasoCanciones";
import { filasDelDj, filtrarPeticiones, MOTIVOS_DJ } from "../lib/dj";
import { descargarCSV } from "../lib/descargas";
import { EscucharCancion } from "../components/EscucharCancion";
import { pedirMuestras, consultaDeFila } from "../lib/escuchar";

// Mismas columnas que la ventana del anfitrión: estrellas · canción · edad · ▶.
const COLUMNAS = "4.5rem minmax(0, 1fr) 3.5rem 2.25rem";
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
  const [filtro, setFiltro] = useState({ texto: "", desde: "", hasta: "" });
  const [orden, setOrden] = useState(ORDEN_CANCIONES_INICIAL);
  const [hora, setHora] = useState(null);

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

  const catalogo = datos.catalogo || {};
  const todas = filasDelDj(datos);
  const distintas = cancionesDistintas(todas);
  const { segundos, estimadas } = duracionTotal(distintas, catalogo);
  const filas = ordenarCanciones(filtrarPeticiones(todas, filtro), orden);
  const poner = (campo) => (e) => setFiltro((f) => ({ ...f, [campo]: e.target.value }));
  const exportar = () =>
    descargarCSV(
      `canciones-${datos.evento || "evento"}.csv`,
      ["Veces", "Canción", "Edad"],
      filas.map((f) => [f.veces, f.cancion, f.edad ?? ""])
    );
  const edad = { ...inputStyle, width: 56, textAlign: "center", minWidth: 0 };
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
          <RecuadroCifras
            cifras={[
              { label: "Peticiones", value: todas.length },
              { label: "Distintas", value: distintas.length },
              { label: "Duración", value: `${estimadas ? "≈ " : ""}${textoDuracion(segundos)}` },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto p-4 space-y-3" style={{ maxWidth: 900 }}>
        {/* Los filtros, en una línea (norma 6). */}
        <div className="flex items-center gap-2 oculto-al-imprimir">
          <TextInput value={filtro.texto} onChange={poner("texto")} placeholder="Buscar canción o artista" aria-label="Buscar canción o artista" className="flex-1 min-w-0" />
          <span className="text-sm" style={{ color: C.charcoal }}>
            Edad
          </span>
          <input value={filtro.desde} onChange={poner("desde")} inputMode="numeric" placeholder="de" aria-label="Edad desde" style={edad} />
          <input value={filtro.hasta} onChange={poner("hasta")} inputMode="numeric" placeholder="a" aria-label="Edad hasta" style={edad} />
        </div>

        <div id="zona-imprimible">
          <div className="grid gap-1 text-xs uppercase px-2 py-2" style={{ gridTemplateColumns: COLUMNAS, fontFamily: "'IBM Plex Mono', monospace", borderBottom: `1px solid ${C.line}` }}>
            {[
              ["veces", "★"],
              ["cancion", "Canción"],
              ["edad", "Edad"],
            ].map(([columna, rotulo]) => (
              <EncabezadoOrdenable key={columna} sinDivisor columna={columna} orden={orden} onClick={(c) => setOrden((o) => tocarOrdenCanciones(o, c))}>
                {rotulo}
              </EncabezadoOrdenable>
            ))}
            <span />
          </div>
          {filas.map((f, i) => (
            <div key={`${f.invitadoId}-${f.hueco}`} className="grid gap-1 items-center px-2 py-1.5 text-sm" style={{ gridTemplateColumns: COLUMNAS, background: i % 2 ? C.paperDark : C.blanco, color: C.charcoal }}>
              <span className="text-center whitespace-nowrap" style={{ color: C.gold }}>
                {estrellas(f.veces)}
              </span>
              {/* Escucharla en Deezer, en otra pestaña. */}
              <a href={enlaceDeezer(f, catalogo)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 min-w-0" style={{ color: C.charcoal }} title="Escucharla en Deezer">
                <span className="truncate" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                  {f.cancion}
                </span>
                <ExternalLink size={12} className="flex-shrink-0 oculto-al-imprimir" style={{ opacity: OP.secundario }} aria-hidden />
              </a>
              <span className="text-center">{f.edad ?? "—"}</span>
              <span className="flex justify-center oculto-al-imprimir">
                <EscucharCancion consulta={consultaDeFila(f, catalogo)} buscar={escuchar} />
              </span>
            </div>
          ))}
          {!filas.length && (
            <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
              {todas.length ? "Ninguna canción con estos filtros." : "Todavía nadie ha pedido una canción."}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 oculto-al-imprimir" style={{ borderTop: `1px solid ${C.line}` }}>
          <Boton variante="principal" icono={Printer} onClick={() => window.print()}>
            Imprimir / PDF
          </Boton>
          <Boton variante="secundario" icono={Copy} onClick={exportar}>
            Exportar CSV
          </Boton>
          <span className="ml-auto" style={{ color: C.charcoal, opacity: OP.secundario, fontSize: T.pequeno }}>
            {hora && `Se actualiza sola · ${hora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        </div>
        {motivo && <LineaAviso className="text-sm">{motivo}</LineaAviso>}
      </main>
    </div>
  );
}
