// Botón "Mi cuenta" + modal para cambiar la propia contraseña o el propio
// email de acceso, sin tener que cerrar sesión y pasar por el flujo de
// "he olvidado mi contraseña" -- Fase C de
// .claude/plans/mejoras-pendientes-login-y-solidez.md, a petición del
// usuario, 2026-08-21. Vive en Portada.jsx (junto a "Cerrar sesión"),
// así que sirve igual para el anfitrión que para cualquier colaborador
// logueado -- los dos usan la misma sesión de Supabase Auth.
//
// El cambio de contraseña no toca ninguna tabla propia (solo
// supabase.auth.updateUser) -- el de email SÍ merece un aviso aparte:
// esto cambia el email de ACCESO (para iniciar sesión), no el que usa
// la app para mandar avisos automáticos a un colaborador
// (`colaboradores.email`, que sigue editándose solo desde la ventana
// Colaboradores del anfitrión) -- mezclarlos sin que el anfitrión se
// entere dejaría los avisos yendo a una dirección que esa persona ya no
// mira. Se deja dicho en pantalla en vez de intentar sincronizarlos
// solos con una función nueva sin que el usuario la revise primero.
import { useState } from "react";
import { UserCog } from "lucide-react";
import { C, inputStyle } from "../theme";
import { supabase } from "../supabaseClient";
import { emailValido } from "../lib/validacion";
import { ModalFlotante } from "./VentanaFlotante";

export function MiCuenta() {
  const [abierta, setAbierta] = useState(false);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [guardandoContrasena, setGuardandoContrasena] = useState(false);
  const [guardandoEmail, setGuardandoEmail] = useState(false);
  // { tipo: "ok" | "error", texto } | null
  const [avisoContrasena, setAvisoContrasena] = useState(null);
  const [avisoEmail, setAvisoEmail] = useState(null);

  const cerrar = () => {
    setAbierta(false);
    setNuevaContrasena("");
    setNuevoEmail("");
    setAvisoContrasena(null);
    setAvisoEmail(null);
  };

  const cambiarContrasena = async (e) => {
    e.preventDefault();
    if (nuevaContrasena.length < 8) {
      setAvisoContrasena({ tipo: "error", texto: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    setGuardandoContrasena(true);
    setAvisoContrasena(null);
    const { error } = await supabase.auth.updateUser({ password: nuevaContrasena });
    setGuardandoContrasena(false);
    if (error) {
      setAvisoContrasena({ tipo: "error", texto: "No se pudo cambiar la contraseña." });
    } else {
      setAvisoContrasena({ tipo: "ok", texto: "Contraseña actualizada." });
      setNuevaContrasena("");
    }
  };

  const cambiarEmail = async (e) => {
    e.preventDefault();
    if (!emailValido(nuevoEmail)) {
      setAvisoEmail({ tipo: "error", texto: "No parece un email válido." });
      return;
    }
    setGuardandoEmail(true);
    setAvisoEmail(null);
    const { error } = await supabase.auth.updateUser({ email: nuevoEmail });
    setGuardandoEmail(false);
    if (error) {
      setAvisoEmail({ tipo: "error", texto: "No se pudo cambiar el email." });
    } else {
      setAvisoEmail({
        tipo: "ok",
        texto: "Revisa tu bandeja (la antigua y la nueva dirección) para confirmar el cambio.",
      });
      setNuevoEmail("");
    }
  };

  return (
    <>
      <button
        onClick={() => setAbierta(true)}
        className="boton-3d boton-flotante-imagen cristal-difuminado flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
        title="Cambiar mi contraseña o mi email de acceso"
      >
        <UserCog size={16} /> Mi cuenta
      </button>

      {abierta && (
        <ModalFlotante titulo="Mi cuenta" onCerrar={cerrar}>
          <form onSubmit={cambiarContrasena} className="mb-6">
            <p className="text-sm font-medium mb-2" style={{ color: C.ink, fontFamily: "'Fraunces', serif" }}>
              Cambiar mi contraseña
            </p>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Nueva contraseña (mín. 8 caracteres)"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              className="w-full mb-2"
              style={{ ...inputStyle, width: "100%" }}
              required
            />
            {avisoContrasena && (
              <p className="text-xs mb-2" style={{ color: avisoContrasena.tipo === "ok" ? C.ink : C.wax }}>
                {avisoContrasena.tipo === "ok" ? "✓ " : "⚠ "}
                {avisoContrasena.texto}
              </p>
            )}
            <button
              type="submit"
              disabled={guardandoContrasena}
              className="px-3 py-1.5 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {guardandoContrasena ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>

          <form onSubmit={cambiarEmail} className="pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
            <p className="text-sm font-medium mb-2" style={{ color: C.ink, fontFamily: "'Fraunces', serif" }}>
              Cambiar mi email de acceso
            </p>
            <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
              Esto es solo el email con el que INICIAS SESIÓN. Si recibes avisos automáticos
              como colaborador, esa dirección se edita aparte (pídeselo al anfitrión) — cambiar
              aquí tu email de acceso no la modifica.
            </p>
            <input
              type="email"
              autoComplete="username"
              placeholder="Nuevo email"
              value={nuevoEmail}
              onChange={(e) => setNuevoEmail(e.target.value)}
              className="w-full mb-2"
              style={{ ...inputStyle, width: "100%" }}
              required
            />
            {avisoEmail && (
              <p className="text-xs mb-2" style={{ color: avisoEmail.tipo === "ok" ? C.ink : C.wax }}>
                {avisoEmail.tipo === "ok" ? "✓ " : "⚠ "}
                {avisoEmail.texto}
              </p>
            )}
            <button
              type="submit"
              disabled={guardandoEmail}
              className="px-3 py-1.5 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {guardandoEmail ? "Guardando…" : "Cambiar email"}
            </button>
          </form>
        </ModalFlotante>
      )}
    </>
  );
}
