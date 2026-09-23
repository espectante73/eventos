// Se muestra en vez de la app normal cuando Supabase detecta que la sesión
// viene de un enlace de "recuperar contraseña" (evento PASSWORD_RECOVERY de
// onAuthStateChange, ver App.jsx) — sin esto, tras pulsar el enlace del
// email la persona entraría directa a sus datos sin poder fijar aún la
// contraseña nueva que pidió.
import { useState } from "react";
import { Boton } from "../components/Boton";
import { CampoContrasena } from "../components/CampoContrasena";
import { C, S } from "../theme";
import { supabase } from "../supabaseClient";

export function VistaNuevaContrasena({ onListo }) {
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    const { error: errUpdate } = await supabase.auth.updateUser({ password });
    setCargando(false);
    if (errUpdate) {
      setError("No se pudo guardar la contraseña nueva. Prueba a pedir el enlace de recuperación otra vez.");
      return;
    }
    onListo();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: C.paper, fontFamily: "'Inter', sans-serif" }}
    >
      <form
        onSubmit={guardar}
        className="w-full max-w-sm p-6 rounded-lg"
        style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: S.flotante }}
      >
        <h1
          className="text-xl mb-4 text-center"
          style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700 }}
        >
          Elige tu contraseña nueva
        </h1>
        <CampoContrasena
          etiqueta="Contraseña nueva"
          className="mb-3"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <CampoContrasena
          etiqueta="Repite la contraseña"
          className="mb-3"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          required
        />
        {error && (
          <p className="text-sm mb-3" style={{ color: C.wax }}>
            {error}
          </p>
        )}
        <Boton type="submit" variante="principal" disabled={cargando} className="w-full" style={{ height: 44 }}>
          {cargando ? "Guardando…" : "Guardar contraseña"}
        </Boton>
      </form>
    </div>
  );
}
