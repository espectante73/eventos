// Pantalla de login (email + contraseña) vía Supabase Auth. Se muestra
// cuando no hay sesión activa NI un enlace de token en la URL (?rol=...) —
// el modelo de enlaces se mantiene en paralelo durante la transición (ver
// plan de login en .claude/plans/login-supabase-auth.md), así que un
// enlace viejo sigue funcionando sin pasar por aquí.
import { useState } from "react";
import { C, inputStyle } from "../theme";
import { supabase } from "../supabaseClient";

export function VistaLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [avisoRecuperacion, setAvisoRecuperacion] = useState("");

  const entrar = async (e) => {
    e.preventDefault();
    setError("");
    setAvisoRecuperacion("");
    setCargando(true);
    const { error: errLogin } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (errLogin) setError("Email o contraseña incorrectos.");
  };

  const recuperarContrasena = async () => {
    if (!email) {
      setError("Escribe primero tu email para poder enviarte el enlace de recuperación.");
      return;
    }
    setError("");
    setCargando(true);
    const { error: errReset } = await supabase.auth.resetPasswordForEmail(email);
    setCargando(false);
    if (errReset) {
      setError("No se pudo enviar el email de recuperación.");
    } else {
      setAvisoRecuperacion("Si ese email tiene una cuenta, te hemos enviado un enlace para crear una contraseña nueva.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: C.paper, fontFamily: "'Inter', sans-serif" }}
    >
      <form
        onSubmit={entrar}
        className="w-full max-w-sm p-6 rounded-lg"
        style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
      >
        <h1
          className="text-xl mb-4 text-center"
          style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700 }}
        >
          Entrar
        </h1>
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
        <label className="block text-xs mb-1" style={{ color: C.charcoal, opacity: 0.7 }}>
          Contraseña
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3"
          style={{ ...inputStyle, width: "100%", height: 42 }}
          required
        />
        {error && (
          <p className="text-sm mb-3" style={{ color: C.wax }}>
            {error}
          </p>
        )}
        {avisoRecuperacion && (
          <p className="text-sm mb-3" style={{ color: C.ink }}>
            {avisoRecuperacion}
          </p>
        )}
        <button
          type="submit"
          disabled={cargando}
          className="w-full py-2 rounded font-medium mb-2"
          style={{ background: C.ink, color: C.paper, height: 44 }}
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
        <button
          type="button"
          onClick={recuperarContrasena}
          disabled={cargando}
          className="w-full text-sm underline"
          style={{ color: C.charcoal, opacity: 0.7 }}
        >
          He olvidado mi contraseña
        </button>
      </form>
    </div>
  );
}
