// Pantalla de login (email + contraseña) vía Supabase Auth, con un modo
// "Crear cuenta" para autorregistro y otro de "recuperar contraseña". Se
// muestra cuando no hay sesión activa NI un enlace de token en la URL
// (?rol=...) — el modelo de enlaces se mantiene en paralelo durante la
// transición (ver plan de login en .claude/plans/login-supabase-auth.md),
// así que un enlace viejo sigue funcionando sin pasar por aquí.
//
// El modo "Crear cuenta" existe para no obligar al anfitrión a crear a
// mano, uno por uno, la cuenta de cada colaborador en el panel de
// Supabase: cada persona se registra ella misma con el email con el que
// YA está dada de alta (el mismo que se usa para los avisos), y un
// trigger en la base de datos (vincular_cuenta_nueva, ver schema.sql) la
// enlaza sola en cuanto termina de registrarse. Si el email no coincide
// con nadie conocido, la cuenta se crea igual pero sin ningún acceso
// (pantalla "cuenta sin vincular" de App.jsx) — autorregistrarse nunca
// concede acceso por sí solo.
//
// CAPTCHA (Cloudflare Turnstile, Fase D, 2026-08-24): Supabase Auth no
// trae de fábrica ningún bloqueo tras varios intentos fallidos de
// contraseña -- solo límites de tasa por IP en otros endpoints (emails,
// renovación de token). Turnstile añade una comprobación real contra
// scripts automatizados en los tres formularios de este archivo. El
// widget lo pinta su propio script (cargado en index.html, fuera de
// React) sobre el <div ref={cajaCaptchaRef}>; si VITE_TURNSTILE_SITE_KEY
// no está configurada (proyecto clonado en local sin Turnstile todavía),
// sencillamente no se pinta ni se exige -- no bloquea el login de nadie.
import { useState, useEffect, useRef } from "react";
import { C, inputStyle } from "../theme";
import { supabase } from "../supabaseClient";
import { emailValido } from "../lib/validacion";

const TITULOS = { entrar: "Entrar", crear: "Crear cuenta", recuperar: "Recuperar contraseña" };
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function VistaLogin({ modoInicial = "entrar", emailInicial = "" }) {
  const [modo, setModo] = useState(modoInicial); // "entrar" | "crear" | "recuperar"
  const [email, setEmail] = useState(emailInicial);
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const cajaCaptchaRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Monta el widget UNA sola vez (no depende de `modo`: el <div> vive
  // fuera de las tres ramas del formulario, así no hay que desmontar y
  // volver a montar Turnstile cada vez que se cambia de pestaña). El
  // script de index.html es async -- puede no estar listo todavía al
  // primer render, de ahí el sondeo corto.
  //
  // La limpieza llama a window.turnstile.remove(...) -- sin esto (fallo
  // real encontrado en un examen honesto del código, 2026-08-24), React
  // StrictMode (activo en main.jsx) monta-desmonta-remonta cada efecto a
  // propósito en `npm run dev`, y como Turnstile pinta su iframe fuera
  // del control de React, el segundo montaje dejaba DOS widgets
  // superpuestos sobre el mismo <div> en local. En el build de
  // producción real (sin StrictMode) esto nunca llegaba a notarse.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelado = false;
    const montar = () => {
      if (cancelado || !window.turnstile || !cajaCaptchaRef.current) return;
      widgetIdRef.current = window.turnstile.render(cajaCaptchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken(""),
      });
    };
    let espera;
    if (window.turnstile) {
      montar();
    } else {
      espera = setInterval(() => {
        if (window.turnstile) {
          clearInterval(espera);
          montar();
        }
      }, 100);
    }
    return () => {
      cancelado = true;
      if (espera) clearInterval(espera);
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  // El token de Turnstile es de un solo uso y caduca a los pocos
  // minutos -- se pide uno nuevo tras cada intento, con o sin éxito.
  const reiniciarCaptcha = () => {
    setCaptchaToken("");
    if (window.turnstile && widgetIdRef.current !== null) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  const cambiarModo = (siguiente) => {
    setModo(siguiente);
    setError("");
    setAviso("");
  };

  const entrar = async (e) => {
    e.preventDefault();
    setError("");
    setAviso("");
    setCargando(true);
    const { error: errLogin } = await supabase.auth.signInWithPassword({
      email,
      password,
      ...(TURNSTILE_SITE_KEY ? { options: { captchaToken } } : {}),
    });
    setCargando(false);
    reiniciarCaptcha();
    if (errLogin) setError("Email o contraseña incorrectos.");
  };

  const crearCuenta = async (e) => {
    e.preventDefault();
    setError("");
    setAviso("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setCargando(true);
    const { data, error: errSignUp } = await supabase.auth.signUp({
      email,
      password,
      ...(TURNSTILE_SITE_KEY ? { options: { captchaToken } } : {}),
    });
    setCargando(false);
    reiniciarCaptcha();
    if (errSignUp) {
      setError(
        errSignUp.message.includes("already registered")
          ? "Ya existe una cuenta con ese email — entra con tu contraseña o pulsa \"He olvidado mi contraseña\"."
          : "No se pudo crear la cuenta."
      );
      return;
    }
    // Si el proyecto tiene activada la confirmación por email, signUp NO
    // deja sesión abierta todavía — hay que avisar de que revise su
    // correo. Si no está activada, la sesión ya queda abierta sola y
    // App.jsx pasa a la app en cuanto detecte el cambio.
    if (!data.session) {
      setAviso("Cuenta creada. Revisa tu email para confirmarla antes de entrar.");
    }
  };

  const enviarRecuperacion = async (e) => {
    e.preventDefault();
    setError("");
    setAviso("");
    setCargando(true);
    const { error: errReset } = await supabase.auth.resetPasswordForEmail(
      email,
      TURNSTILE_SITE_KEY ? { captchaToken } : undefined
    );
    setCargando(false);
    reiniciarCaptcha();
    if (errReset) {
      setError("No se pudo enviar el email de recuperación.");
    } else {
      setAviso("Si ese email tiene una cuenta, te hemos enviado un enlace para crear una contraseña nueva.");
    }
  };

  const enviar = modo === "entrar" ? entrar : modo === "crear" ? crearCuenta : enviarRecuperacion;
  const captchaListo = !TURNSTILE_SITE_KEY || Boolean(captchaToken);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        // Verde de la propia paleta (mismo degradado que la franja de
        // datos de la Portada) en vez del fondo crema plano de antes --
        // el recuadro blanco del formulario queda "flotando" encima, a
        // petición del usuario.
        background: "linear-gradient(180deg, #1F3A2E 0%, #24402F 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <form
        onSubmit={enviar}
        className="w-full max-w-sm p-6 rounded-lg"
        style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
      >
        <h1
          className="text-xl mb-4 text-center"
          style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700 }}
        >
          {TITULOS[modo]}
        </h1>
        {modo === "crear" && (
          <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
            Usa el mismo email con el que ya estás dado de alta como
            colaborador (el de los avisos) — así se te reconoce solo.
          </p>
        )}
        {modo === "recuperar" && (
          <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
            Escribe tu email y te enviamos un enlace para crear una
            contraseña nueva.
          </p>
        )}
        <label className="block text-xs mb-1" style={{ color: C.charcoal, opacity: 0.7 }}>
          Email
        </label>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-1"
          style={{ ...inputStyle, width: "100%", height: 42 }}
          required
        />
        {/* Mismo criterio de "avisar en el momento" que ya usan
            Colaboradores y Email anfitrión -- a petición del usuario,
            2026-08-21 (Fase I). El botón ya bloquea el envío si el
            navegador considera el campo inválido (type="email"), esto
            es solo el aviso visible y consistente con el resto de la
            app, no una segunda validación. mb-2/mb-3 según si se
            muestra o no, para que el hueco antes del siguiente campo
            sea el mismo en los dos casos. */}
        {email && !emailValido(email) ? (
          <p className="text-xs mb-2" style={{ color: C.wax }}>
            ⚠ No parece un email válido.
          </p>
        ) : (
          <div className="mb-2" />
        )}
        {modo !== "recuperar" && (
          <>
            <label className="block text-xs mb-1" style={{ color: C.charcoal, opacity: 0.7 }}>
              Contraseña
            </label>
            <input
              type="password"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-3"
              style={{ ...inputStyle, width: "100%", height: 42 }}
              required
            />
          </>
        )}
        {error && (
          <p className="text-sm mb-3" style={{ color: C.wax }}>
            {error}
          </p>
        )}
        {aviso && (
          <p className="text-sm mb-3" style={{ color: C.ink }}>
            {aviso}
          </p>
        )}
        {/* Solo ocupa sitio si hay Site Key configurada -- ver el aviso
            largo arriba sobre por qué esto no bloquea un local sin
            Turnstile todavía. */}
        {TURNSTILE_SITE_KEY && <div ref={cajaCaptchaRef} className="mb-3 flex justify-center" />}
        <button
          type="submit"
          disabled={cargando || !captchaListo}
          title={captchaListo ? undefined : "Espera a que cargue la comprobación de seguridad"}
          className="boton-3d boton-verde-solido w-full py-2 rounded-full font-medium mb-2"
          style={{ height: 44 }}
        >
          {cargando ? "Un momento…" : modo === "recuperar" ? "Enviar enlace" : TITULOS[modo]}
        </button>

        {modo === "entrar" && (
          <>
            <button
              type="button"
              onClick={() => cambiarModo("recuperar")}
              disabled={cargando}
              className="w-full text-sm underline mb-1"
              style={{ color: C.charcoal, opacity: 0.7 }}
            >
              He olvidado mi contraseña
            </button>
            <button
              type="button"
              onClick={() => cambiarModo("crear")}
              disabled={cargando}
              className="w-full text-sm underline"
              style={{ color: C.charcoal, opacity: 0.7 }}
            >
              ¿No tienes cuenta todavía? Crear cuenta
            </button>
          </>
        )}
        {(modo === "crear" || modo === "recuperar") && (
          <button
            type="button"
            onClick={() => cambiarModo("entrar")}
            disabled={cargando}
            className="w-full text-sm underline"
            style={{ color: C.charcoal, opacity: 0.7 }}
          >
            Ya tengo cuenta — entrar
          </button>
        )}
      </form>
    </div>
  );
}
