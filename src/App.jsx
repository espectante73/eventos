import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useLedgerData } from "./useLedgerData";
import { supabase } from "./supabaseClient";
import { getRolFromUrl, getEmailCrearCuentaFromUrl } from "./lib/url";
import { C } from "./theme";
import { VistaAnfitrion } from "./vistas/VistaAnfitrion";
import { VistaColaborador } from "./vistas/VistaColaborador";
import { VistaLogin } from "./vistas/VistaLogin";
import { VistaNuevaContrasena } from "./vistas/VistaNuevaContrasena";

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
  // ?crear=<email> -- enlace enviado por email a un colaborador para que
  // abra el login directo en modo "Crear cuenta" con su email ya relleno
  // (ver ColaboradorCard.jsx / anfitrion_enviar_invitacion_login).
  const emailCrearCuenta = getEmailCrearCuentaFromUrl();
  // Se comprueba UNA sola vez si el código del enlace original de la URL
  // es el secreto del anfitrión — independiente de lo que `rol` valga
  // después (que cambia sin tocar la URL cuando el anfitrión previsualiza
  // la vista de un colaborador desde las pestañas de abajo).
  const [esAnfitrionOriginal, setEsAnfitrionOriginal] = useState(null);
  const [rol, setRol] = useState(urlRol || null);
  const data = useLedgerData(rol);
  // Previsualización "Formularios" (anfitrión viendo la pantalla de un
  // colaborador): id del colaborador previsualizado, o null si se está
  // viendo la propia vista de anfitrión. A propósito NO reutiliza `rol` --
  // antes SÍ lo hacía (`setRol(c.id)`), lo que disparaba una recarga real
  // de datos vía colaborador_mi_perfil/colaborador_mis_invitados exigiendo
  // "authUserId = auth.uid()". Como el anfitrión sigue autenticado con SU
  // propia sesión al previsualizar (nunca inicia sesión como ese
  // colaborador), esa condición nunca se cumplía -- la previsualización
  // llevaba rota desde el 2026-08-12 (retirada del enlace-token de
  // colaborador), detectado el mismo día que Modo Pruebas se probó en
  // vivo por primera vez. Con `vistaPrevia`, `rol` ya no cambia nunca al
  // previsualizar: sigue siendo el del propio anfitrión, así que `data`
  // conserva TODOS los colaboradores/invitados ya cargados, y
  // VistaColaborador simplemente filtra esos mismos datos por
  // `colaboradorId` (ya lo hacía así) en vez de pedir un juego de datos
  // nuevo y más estrecho.
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const cambiarVistaPrevia = (destino) => {
    setVistaPrevia(destino === anfitrionToken ? null : destino);
  };
  // El token del anfitrión, estable aunque `rol` cambie al previsualizar un
  // colaborador desde el selector de abajo — con el enlace-token viejo es
  // simplemente `urlRol` (nunca cambia), pero con login no hay ningún
  // `?rol=...` en la URL, así que hace falta guardarlo aparte la primera
  // vez que mi_rol() lo resuelve (ver el efecto más abajo). Sin esto, volver
  // a elegir "Anfitrión" tras previsualizar a un colaborador dejaría `rol`
  // en null para cualquiera que haya entrado por login.
  const [anfitrionToken, setAnfitrionToken] = useState(urlRol || null);

  // ---------- Login real (Supabase Auth) ----------
  // Capa añadida SOBRE el modelo de enlace-token existente, sin tocar
  // ninguna de las RPC de anfitrión/colaborador ya probadas: en vez de
  // reescribirlas todas para leer auth.uid(), se añade una única función
  // nueva, mi_rol(), que traduce "quién ha iniciado sesión" al mismo
  // token/id que ya usaba el enlace mágico — el resto de la app sigue
  // funcionando exactamente igual por dentro. El enlace-token se mantiene
  // en paralelo mientras se reparten las cuentas nuevas (ver
  // .claude/plans/login-supabase-auth.md): si NO hay sesión pero SÍ hay
  // ?rol=... en la URL, se seguye usando el flujo de siempre.
  // undefined = comprobando todavía; null = confirmado que no hay sesión.
  const [session, setSession] = useState(undefined);
  // Evento más reciente de Supabase Auth — se usa solo para detectar
  // PASSWORD_RECOVERY (clic en el enlace de "olvidé mi contraseña").
  const [authEvent, setAuthEvent] = useState(null);
  // true si hay sesión real pero mi_rol() no encuentra ninguna fila
  // enlazada (cuenta creada pero todavía no vinculada a un colaborador ni
  // al anfitrión).
  const [sinAccesoAsignado, setSinAccesoAsignado] = useState(false);
  // Guarda el error real de mi_rol() (si lo hay) para mostrarlo en pantalla
  // tal cual — así se puede diagnosticar un fallo de login sin depender de
  // que quien lo prueba sepa abrir las herramientas de desarrollador.
  const [errorMiRol, setErrorMiRol] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setAuthEvent(event);
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelado = false;
    if (!session) return; // Sin sesión: manda el enlace-token de siempre.
    (async () => {
      const { data: filas, error } = await supabase.rpc("mi_rol");
      if (cancelado) return;
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error al resolver mi_rol():", error);
        setErrorMiRol(error.message || JSON.stringify(error));
        setSinAccesoAsignado(true);
        return;
      }
      setErrorMiRol(null);
      if (!filas || filas.length === 0) {
        setSinAccesoAsignado(true);
        return;
      }
      setSinAccesoAsignado(false);
      const { rol: rolResuelto, token } = filas[0];
      setEsAnfitrionOriginal(rolResuelto === "anfitrion");
      if (rolResuelto === "anfitrion") setAnfitrionToken(token);
      setRol(token);
    })();
    return () => {
      cancelado = true;
    };
  }, [session]);

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
    // Esperando a saber si hay sesión, o ya hay una sesión real de verdad:
    // en ambos casos manda el efecto de mi_rol() de arriba, no este.
    if (session === undefined || session) return;
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
  }, [urlRol, session]);

  if (authEvent === "PASSWORD_RECOVERY") {
    return <VistaNuevaContrasena onListo={() => setAuthEvent(null)} />;
  }

  if (session === undefined) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Fraunces', serif" }}
      >
        Abriendo el libro de invitados…
      </div>
    );
  }

  if (session === null && !urlRol) {
    return (
      <VistaLogin
        modoInicial={emailCrearCuenta ? "crear" : "entrar"}
        emailInicial={emailCrearCuenta || ""}
      />
    );
  }

  if (sinAccesoAsignado) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Inter', sans-serif" }}
      >
        <div className="max-w-md w-full p-6 rounded-lg text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <p className="text-sm mb-4" style={{ color: C.charcoal, opacity: 0.8 }}>
            Tu cuenta ha iniciado sesión correctamente, pero todavía no está
            vinculada a ningún acceso (ni anfitrión ni colaborador). Pide al
            anfitrión que la vincule.
          </p>
          {errorMiRol && (
            <p
              className="text-xs mb-4 p-2 rounded text-left"
              style={{ color: C.wax, background: C.paperDark, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {errorMiRol}
            </p>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            className="boton-3d boton-verde-solido flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium mx-auto"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

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

  // Enlace antiguo de colaborador (?rol=...) sin sesión real: desde que se
  // retiró el enlace-token de colaborador (Fase B, 2026-08-12), este caso
  // YA NUNCA resuelve a datos de verdad -- antes se colaba hasta el hueco
  // de "Este enlace no es válido..." al final del render, con una franja
  // técnica ("Vista fija de enlace · rol no encontrado") por encima. Un
  // colaborador probando ese enlace viejo lo describió como "una vista de
  // colaborador sin datos", no como un aviso de acceso denegado -- podía
  // confundirse con un fallo de la app en vez de con un bloqueo de
  // seguridad correcto. Pantalla dedicada y clara en su lugar, ANTES de
  // llegar al resto del render. `session === null` (no solo `!esAnfitrionOriginal`)
  // para no afectar a un colaborador con sesión real que además tenga un
  // `?rol=...` suelto en la URL (mi_rol() ya resuelve su acceso aparte).
  if (session === null && !esAnfitrionOriginal && urlRol) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Inter', sans-serif" }}
      >
        <div className="max-w-md w-full p-6 rounded-lg text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <h1
            className="text-xl mb-2"
            style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700 }}
          >
            No tienes acceso
          </h1>
          <p className="text-sm mb-4" style={{ color: C.charcoal, opacity: 0.8 }}>
            Este enlace ya no funciona — los enlaces directos de colaborador se retiraron a favor
            del login real. Inicia sesión con tu cuenta para entrar, o pide al anfitrión que te
            vincule una si todavía no tienes.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 rounded text-sm font-medium"
            style={{ background: C.ink, color: C.paper }}
          >
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  // Visible para CUALQUIER rol (evento es de acceso abierto) — no solo el
  // anfitrión: si un colaborador entra mientras está activo, también debe
  // saber que todo lo que haga puede deshacerse al desactivarlo (ver
  // VentanaConfigModoPruebas.jsx).
  const modoPruebas = Boolean(data.evento?.modoPruebasActivo);
  const alturaBanners = (modoPruebas ? 40 : 0) + (hayNuevaVersion ? 44 : 0);

  return (
    <div
      className="min-h-screen"
      style={{
        background: C.paper,
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(31,58,46,0.05) 28px)",
        paddingTop: alturaBanners,
        border: modoPruebas ? "6px solid #B00020" : "none",
        boxSizing: "border-box",
      }}
    >
      {modoPruebas && (
        <div
          className="fixed left-0 right-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
          style={{ top: 0, background: "#B00020", color: "#fff", zIndex: 61, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
        >
          🧪 MODO PRUEBAS ACTIVO — todo lo que se haga se restaurará al desactivarlo
        </div>
      )}
      {hayNuevaVersion && (
        <div
          className="fixed left-0 right-0 flex items-center justify-between gap-3 px-4 py-2 text-sm"
          style={{
            top: modoPruebas ? 40 : 0,
            background: C.wax,
            color: "#fff",
            zIndex: 60,
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
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
        {/* Para el anfitrión, "Cerrar sesión" vive DENTRO de la cabecera
            (Portada); para un colaborador (real o previsualizado), dentro
            de su propio recuadro de datos (VistaColaborador) -- se pasa
            como prop en los dos casos, más abajo. Aquí solo hace falta
            este botón suelto para el caso residual: sesión real pero el
            rol no resuelve a ninguno de los dos (enlace/estado
            inconsistente, ver el párrafo "Este enlace no es válido..."
            más abajo) -- ni Portada ni VistaColaborador llegan a montarse
            para alojarlo ahí. */}
        {session && !data.esAnfitrion && !data.colaboradores.some((c) => c.id === rol) && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => supabase.auth.signOut()}
              className="boton-3d boton-verde-solido flex items-center gap-1.5 px-4 rounded-full text-sm font-medium"
              style={{ height: 40 }}
            >
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>
        )}
        {/* El cambio de vista Anfitrión/colaborador vivía aquí como barra
            ancha aparte; se movió (2026-08-09, a petición del usuario)
            dentro de "Abrir sección… → Colaboradores → Formularios", ver
            DesplegableSecciones.jsx. Volver a Anfitrión mientras se
            previsualiza a un colaborador se hace desde el botón "Cambiar
            vista" de VistaColaborador.jsx.
            La franja "Vista fija de enlace" que iba aquí (para el enlace
            ?rol=... sin login) se retiró el 2026-08-12: desde que ese
            enlace dejó de funcionar de verdad (Fase B), lo único que
            podía mostrar era "rol no encontrado" -- caso ahora cubierto
            arriba con la pantalla dedicada "No tienes acceso", antes de
            llegar siquiera a este punto del render. */}
        {data.esAnfitrion && !vistaPrevia ? (
          <VistaAnfitrion
            data={data}
            setRol={cambiarVistaPrevia}
            anfitrionToken={anfitrionToken}
            onCerrarSesion={session ? () => supabase.auth.signOut() : null}
          />
        ) : data.esAnfitrion && vistaPrevia ? (
          <VistaColaborador
            data={data}
            colaboradorId={vistaPrevia}
            esAnfitrionOriginal={esAnfitrionOriginal}
            setRol={cambiarVistaPrevia}
            anfitrionToken={anfitrionToken}
            onCerrarSesion={session ? () => supabase.auth.signOut() : null}
          />
        ) : data.colaboradores.some((c) => c.id === rol) ? (
          <VistaColaborador
            data={data}
            colaboradorId={rol}
            esAnfitrionOriginal={esAnfitrionOriginal}
            setRol={setRol}
            anfitrionToken={anfitrionToken}
            onCerrarSesion={session ? () => supabase.auth.signOut() : null}
          />
        ) : (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.7 }}>
            Este enlace no es válido, ha caducado, o ya no funciona porque los enlaces de
            colaborador se retiraron a favor del login.{" "}
            <a href="/" style={{ color: C.ink, textDecoration: "underline" }}>
              Inicia sesión con tu cuenta
            </a>
            , o pide al anfitrión que te vincule una si aún no tienes.
          </p>
        )}
      </div>
    </div>
  );
}
