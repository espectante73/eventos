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
import { useState } from "react";
import { C, inputStyle } from "../theme";
import { supabase } from "../supabaseClient";

const TITULOS = { entrar: "Entrar", crear: "Crear cuenta", recuperar: "Recuperar contraseña" };

export function VistaLogin({ modoInicial = "entrar", emailInicial = "" }) {
  const [modo, setModo] = useState(modoInicial); // "entrar" | "crear" | "recuperar"
  const [email, setEmail] = useState(emailInicial);
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

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
    const { error: errLogin } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
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
    const { data, error: errSignUp } = await supabase.auth.signUp({ email, password });
    setCargando(false);
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
    const { error: errReset } = await supabase.auth.resetPasswordForEmail(email);
    setCargando(false);
    if (errReset) {
      setError("No se pudo enviar el email de recuperación.");
    } else {
      setAviso("Si ese email tiene una cuenta, te hemos enviado un enlace para crear una contraseña nueva.");
    }
  };

  const enviar = modo === "entrar" ? entrar : modo === "crear" ? crearCuenta : enviarRecuperacion;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: C.paper, fontFamily: "'Inter', sans-serif" }}
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
          className="w-full mb-3"
          style={{ ...inputStyle, width: "100%", height: 42 }}
          required
        />
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
        <button
          type="submit"
          disabled={cargando}
          className="w-full py-2 rounded font-medium mb-2"
          style={{ background: C.ink, color: C.paper, height: 44 }}
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
