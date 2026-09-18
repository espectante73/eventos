// Botón "Mi cuenta" + modal para cambiar la propia contraseña o el propio
// email de acceso, sin tener que cerrar sesión y pasar por el flujo de
// "he olvidado mi contraseña" -- Fase C de
// .claude/plans/mejoras-pendientes-login-y-solidez.md, a petición del
// usuario, 2026-08-21. Vive en Portada.jsx (junto a "Cerrar sesión"),
// así que sirve igual para el anfitrión que para cualquier colaborador
// logueado -- los dos usan la misma sesión de Supabase Auth.
//
// El cambio de contraseña no toca ninguna tabla propia (solo
// supabase.auth.updateUser). El de email SÍ toca algo más si quien lo
// cambia es un colaborador: un trigger en la base de datos
// (sincronizar_email_colaborador, ver schema.sql) actualiza también
// `colaboradores.email` -- el que usa la app para mandarle avisos
// automáticos -- en cuanto Supabase confirma el cambio de verdad (no en
// el momento de pedirlo). Decisión explícita del usuario, 2026-08-24:
// dejarlos separados resultaba confuso (alguien cambia "su email" y
// sigue sin recibir avisos importantes). Para que el anfitrión no
// pierda visibilidad de este cambio, queda constancia visible en la
// ventana Colaboradores hasta que la confirme.
import { useState } from "react";
import { UserCog, LogOut, Megaphone, Map, Code2, Bug } from "lucide-react";
import { C, inputStyle } from "../theme";
import { supabase } from "../supabaseClient";
import { emailValido } from "../lib/validacion";
import { ModalFlotante } from "./VentanaFlotante";
import { ModalMapaSitio } from "./MapaSitio";
import { URL_REPOSITORIO, URL_REGISTRO_ERRORES } from "../constants";

// `onCerrarSesion`/`enlaceTablon`: antes eran botones sueltos junto a
// este en la cabecera de Portada.jsx -- a petición del usuario,
// 2026-08-29, se "esconden" aquí dentro para dejar un único botón
// visible arriba. Mismas acciones de siempre, solo cambia dónde viven.
// `mostrarMapaSitio`: solo lo pasa VistaAnfitrion.jsx. El mapa dibuja el
// menú del anfitrión, así que a un colaborador no le dice nada -- mismo
// criterio que `abrirNovedades` en Portada.jsx.
// TODOS los botones de Mi cuenta con el estilo de INICIO -- la pastilla
// verde con letra y contorno dorados de "Abrir sección…" y "Mi cuenta" en
// la portada -- y el MISMO ancho, a lo ancho de la ventana.
//
// ⚠️ Corrección del 2026-09-18: en la v34.5 se pasaron a la variante
// secundaria (cuadrada, solo contorno) por decisión propia, y los dos
// botones de los formularios se quedaron a la medida de su texto. El
// usuario lo había pedido con el estilo de inicio y todos iguales. Esta es
// la versión que pidió.
const CLASE_BOTON_INICIO =
  "boton-3d boton-flotante-imagen w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium";

export function MiCuenta({ onCerrarSesion, enlaceTablon, mostrarMapaSitio, mostrarRepositorio, mostrarErrores }) {
  const [abierta, setAbierta] = useState(false);
  const [mapaAbierto, setMapaAbierto] = useState(false);
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
        <ModalFlotante titulo="Mi cuenta" onCerrar={cerrar} ancho={400}>
          {/* ancho={400}: el de un móvil en vertical, también en el
              ordenador. Aquí solo hay una contraseña, un email y unos pocos
              accesos. Regla de la app pedida por el usuario (2026-09-18):
              las ventanas, lo más pequeñas posible para lo que contienen. */}
          {/* Antes eran botones sueltos en la cabecera de Portada.jsx --
              ahora viven aquí dentro, a petición del usuario.
              ⚠️ Cambio de criterio el 2026-09-18: antes cada acceso medía
              lo que su texto ("a su ancho justo"). Con cinco accesos eso
              dejaba una escalera de anchos distintos, y el usuario pidió
              que fueran iguales y con el estilo de inicio: todos van con
              CLASE_BOTON_INICIO, a lo ancho de la ventana -- y como la
              ventana ya es estrecha, del ancho de un móvil, siguen siendo
              compactos. */}
          {(onCerrarSesion || enlaceTablon || mostrarMapaSitio || mostrarRepositorio || mostrarErrores) && (
            <div className="flex flex-col gap-2 mb-5 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
              {onCerrarSesion && (
                <button
                  onClick={onCerrarSesion}
                  className={CLASE_BOTON_INICIO}
                >
                  <LogOut size={15} /> Cerrar sesión
                </button>
              )}
              {enlaceTablon && (
                <a
                  href={enlaceTablon}
                  className={CLASE_BOTON_INICIO}
                  title="Abre el tablón público de novedades que ven los confirmados"
                >
                  <Megaphone size={15} /> Novedades
                </a>
              )}
              {/* El mapa del sitio: la imagen de las secciones de la app,
                  para saber dónde está cada cosa. Aquí dentro y no en
                  "Abrir sección…" a petición del usuario, 2026-09-16: no
                  es algo del evento, es para moverse por la app.
                  Se abre en su propio modal (MapaSitio.jsx) encima de
                  este, no en una pestaña del navegador -- una pestaña no
                  tiene botón de volver en el móvil. */}
              {mostrarMapaSitio && (
                <button
                  onClick={() => setMapaAbierto(true)}
                  className={CLASE_BOTON_INICIO}
                  title="Ver el mapa de las secciones de la aplicación"
                >
                  <Map size={15} /> Mapa del sitio
                </button>
              )}
              {/* Enlace al código, para el desarrollador que revisa la app
                  (permiso "Ver el código de la app"). En pestaña nueva a
                  propósito: es una web externa, no una parte de esta. */}
              {mostrarRepositorio && (
                <a
                  href={URL_REPOSITORIO}
                  target="_blank"
                  rel="noreferrer"
                  className={CLASE_BOTON_INICIO}
                  title="Abre el código de la aplicación en GitHub"
                >
                  <Code2 size={15} /> Código de la app
                </a>
              )}
              {/* Los fallos que ha tenido la app, en Sentry. Solo para el
                  anfitrión (2026-09-18): el usuario pidió verlos "desde la
                  app". Dentro de la app no se pueden pintar -- haría falta
                  una clave secreta de Sentry en el navegador --, así que es
                  un enlace directo al panel. */}
              {mostrarErrores && (
                <a
                  href={URL_REGISTRO_ERRORES}
                  target="_blank"
                  rel="noreferrer"
                  className={CLASE_BOTON_INICIO}
                  title="Ver los errores que ha tenido la app (Sentry)"
                >
                  <Bug size={15} /> Errores de la app
                </a>
              )}
            </div>
          )}

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
            <button type="submit" disabled={guardandoContrasena} className={CLASE_BOTON_INICIO} style={{ opacity: guardandoContrasena ? 0.6 : 1 }}>
              {guardandoContrasena ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>

          <form onSubmit={cambiarEmail} className="pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
            <p className="text-sm font-medium mb-2" style={{ color: C.ink, fontFamily: "'Fraunces', serif" }}>
              Cambiar mi email de acceso
            </p>
            <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
              Este es tu email de INICIO DE SESIÓN. Si tienes invitados asignados como
              colaborador, en cuanto confirmes el cambio también pasará a ser el email al
              que te lleguen los avisos automáticos — el anfitrión verá un aviso de que
              ha cambiado.
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
            <button type="submit" disabled={guardandoEmail} className={CLASE_BOTON_INICIO} style={{ opacity: guardandoEmail ? 0.6 : 1 }}>
              {guardandoEmail ? "Guardando…" : "Cambiar email"}
            </button>
          </form>
        </ModalFlotante>
      )}

      {mapaAbierto && <ModalMapaSitio onCerrar={() => setMapaAbierto(false)} />}
    </>
  );
}
