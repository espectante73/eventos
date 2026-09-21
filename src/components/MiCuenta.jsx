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
import { UserCog, LogOut, Megaphone, Map, Bug, KeyRound, Mail, Hand } from "lucide-react";
import { C, inputStyle, R, OP } from "../theme";
import { supabase } from "../supabaseClient";
import { emailValido } from "../lib/validacion";
import { ModalFlotante } from "./VentanaFlotante";
import { ANCHO_FILA_MENU } from "./MenuFlotante";
import { ModalMapaSitio } from "./MapaSitio";
import { URL_REGISTRO_ERRORES } from "../constants";
import { useMano, MANO } from "../lib/mano";

// `onCerrarSesion`/`enlaceTablon`: antes eran botones sueltos junto a
// este en la cabecera de Portada.jsx -- a petición del usuario,
// 2026-08-29, se "esconden" aquí dentro para dejar un único botón
// visible arriba. Mismas acciones de siempre, solo cambia dónde viven.
// `mostrarMapaSitio`: solo lo pasa VistaAnfitrion.jsx. El mapa dibuja el
// menú del anfitrión, así que a un colaborador no le dice nada -- mismo
// criterio que `abrirNovedades` en Portada.jsx.
// TODOS los botones de Mi cuenta son una copia EXACTA de las filas del menú
// "Abrir sección…" (FilaMenu en MenuFlotante.jsx), que el usuario llama "el
// modelo de inicio": misma clase, mismo relleno, icono de 19 a la izquierda,
// pastilla redondeada, letra dorada.
//
// Y la MISMA medida que allí (ANCHO_FILA_MENU, importada, no copiada): el
// usuario pidió que ningún texto pase de "Mapa del sitio" y que el margen
// derecho quede igual de justo que el izquierdo, así que los rótulos van
// abreviados ("Código app", "Errores app", "Cambiar clave") para caber.
// ⚠️ Si se añade un botón, su rótulo tiene que caber en esa medida: se
// abrevia el rótulo, no se ensancha el botón.
//
// Van a la derecha de la ventana: la app se maneja con el pulgar derecho.
//
// ⚠️ Historia, para no repetirla (2026-09-18): la v34.5 los pasó a la
// variante secundaria cuadrada, la v34.6 a todo lo ancho y la v34.7 a un
// ancho de 240px con el texto centrado -- las tres por decisión propia. El
// usuario había pedido desde el principio el modelo de inicio.
const CLASE_BOTON_INICIO =
  "boton-3d boton-flotante-imagen flex items-center gap-2 text-left px-3 py-2 text-sm whitespace-nowrap";
const ESTILO_BOTON_INICIO = { color: C.goldClaro, borderRadius: R.redondo, width: ANCHO_FILA_MENU };
const ICONO = { size: 19, style: { flexShrink: 0, opacity: OP.secundario } };

// Pulgar derecho o izquierdo (lib/mano.js), a petición del usuario
// (2026-09-19). Él eligió el aspecto: UNA pastilla del modelo de inicio,
// del mismo ancho que las demás, partida en dos; la mitad elegida va
// rellena de dorado. Solo se puede elegir una.
// `preguntando`: en la ventanita de la primera vez no sale ninguna marcada.
function SelectorMano({ preguntando = false }) {
  const { mano, elegir } = useMano();
  const marcada = mano || (preguntando ? null : MANO.DERECHA);
  const mitad = (valor, rotulo, titulo) => {
    const elegida = marcada === valor;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={elegida}
        title={titulo}
        onClick={() => elegir(valor)}
        className="flex-1 rounded-full py-1"
        style={elegida ? { background: C.goldClaro, color: C.ink, fontWeight: 600 } : { color: C.goldClaro }}
      >
        {rotulo}
      </button>
    );
  };
  return (
    <div
      role="radiogroup"
      aria-label="Mano con la que usas el móvil"
      className="boton-3d boton-flotante-imagen flex items-center gap-1 text-sm whitespace-nowrap"
      style={{ ...ESTILO_BOTON_INICIO, padding: "4px 4px 4px 12px" }}
    >
      <Hand {...ICONO} />
      {mitad(MANO.IZQUIERDA, "Izda.", "Botones a la izquierda, para el pulgar izquierdo")}
      {mitad(MANO.DERECHA, "Dcha.", "Botones a la derecha, para el pulgar derecho")}
    </div>
  );
}

// La primera vez que se entra desde un móvil, una ventanita pregunta la
// mano. Solo a quien entra con sesión (anfitrión y colaboradores): el
// usuario decidió no preguntárselo a los invitados del tablón. Se recuerda
// en el móvil y no vuelve a salir; cerrarla sin elegir cuenta como
// "derecha", que es como estaba la app.
function PreguntaMano() {
  const { mano, tactil, elegir } = useMano();
  if (!tactil || mano) return null;
  return (
    <ModalFlotante
      titulo="¿Qué mano usas?"
      onCerrar={() => elegir(MANO.DERECHA)}
      ancho={260}
      acciones={
        <p className="text-xs w-full text-center" style={{ color: C.charcoal, opacity: OP.secundario }}>
          Se puede cambiar en Mi cuenta.
        </p>
      }
    >
      <div className="flex justify-center">
        <SelectorMano preguntando />
      </div>
    </ModalFlotante>
  );
}

export function MiCuenta({ onCerrarSesion, enlaceTablon, mostrarMapaSitio, mostrarErrores }) {
  const [abierta, setAbierta] = useState(false);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [guardandoContrasena, setGuardandoContrasena] = useState(false);
  const [guardandoEmail, setGuardandoEmail] = useState(false);
  // { tipo: "ok" | "error", texto } | null
  const [avisoContrasena, setAvisoContrasena] = useState(null);
  const [avisoEmail, setAvisoEmail] = useState(null);
  // El selector de mano solo sale en el móvil: en el ordenador no cambia nada.
  const { tactil } = useMano();

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

      <PreguntaMano />

      {abierta && (
        <ModalFlotante
          titulo="Mi cuenta"
          onCerrar={cerrar}
          // 300 (antes 400): en el móvil la ventana ocupaba casi toda la
          // pantalla y lo de dentro -- una contraseña, un email y unos
          // botones de 146px -- cabe de sobra en menos (usuario, captura
          // del 2026-09-18).
          ancho={300}
          // La explicación del email de acceso va en el PIE y plegada, a
          // petición del usuario (2026-09-18): en medio del formulario
          // rompía la línea de los botones, y solo le interesa a quien vaya
          // a cambiarlo. <details> nativo: se abre y se cierra sin estado.
          acciones={
            <details className="text-xs w-full" style={{ color: C.charcoal }}>
              <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
                Sobre el email de acceso
              </summary>
              <p className="mt-2" style={{ opacity: OP.secundario }}>
                Este es tu email de INICIO DE SESIÓN. Si tienes invitados asignados como
                colaborador, en cuanto confirmes el cambio también pasará a ser el email al
                que te lleguen los avisos automáticos — el anfitrión verá un aviso de que
                ha cambiado.
              </p>
            </details>
          }
        >
          {/* ancho={400}: el de un móvil en vertical, también en el
              ordenador. Aquí solo hay una contraseña, un email y unos pocos
              accesos. Regla de la app pedida por el usuario (2026-09-18):
              las ventanas, lo más pequeñas posible para lo que contienen. */}
          {/* Antes eran botones sueltos en la cabecera de Portada.jsx --
              ahora viven aquí dentro, a petición del usuario.
              ⚠️ Cambio de criterio el 2026-09-18: antes cada acceso medía
              lo que su texto ("a su ancho justo"). Con cinco accesos eso
              dejaba una escalera de anchos distintos, y el usuario pidió
              que fueran iguales y con el modelo de inicio: ver
              CLASE_BOTON_INICIO y ANCHO_BOTON arriba. */}
          {/* `zurdo:`: con la mano izquierda elegida en el móvil, todo lo de
              aquí se alinea a la izquierda (lib/mano.js). */}
          {(onCerrarSesion || enlaceTablon || mostrarMapaSitio || mostrarErrores || tactil) && (
            <div className="flex flex-col items-end zurdo:items-start gap-2.5 mb-5 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
              {onCerrarSesion && (
                <button
                  onClick={onCerrarSesion}
                  className={CLASE_BOTON_INICIO}
                  style={ESTILO_BOTON_INICIO}
                >
                  <LogOut {...ICONO} /> Cerrar sesión
                </button>
              )}
              {enlaceTablon && (
                <a
                  href={enlaceTablon}
                  className={CLASE_BOTON_INICIO}
                  style={ESTILO_BOTON_INICIO}
                  title="Abre el tablón público de novedades que ven los confirmados"
                >
                  <Megaphone {...ICONO} /> Novedades
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
                  style={ESTILO_BOTON_INICIO}
                  title="Ver el mapa de las secciones de la aplicación"
                >
                  <Map {...ICONO} /> Mapa del sitio
                </button>
              )}
              {/* ⚠️ Aquí había un botón "Código app" y se quitó el
                  2026-09-21, a petición del usuario: estaba ESCONDIDO.
                  Al colaborador se le decía "tienes este permiso" en un
                  sitio y el acceso vivía en otro, dentro de "Mi cuenta",
                  así que había que buscarlo. Ahora el link vive en el
                  propio aviso que anuncia el permiso, en
                  VistaColaborador.jsx: donde se anuncia es donde se
                  entra. */}
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
                  style={ESTILO_BOTON_INICIO}
                  title="Ver los errores que ha tenido la app (Sentry)"
                >
                  <Bug {...ICONO} /> Errores app
                </a>
              )}
              {tactil && <SelectorMano />}
            </div>
          )}

          <form onSubmit={cambiarContrasena} className="mb-6">
            <p className="text-sm font-medium mb-2" style={{ color: C.ink, fontFamily: "'Fraunces', serif" }}>
              Cambiar mi contraseña
            </p>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
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
            <div className="flex justify-end zurdo:justify-start">
            <button type="submit" disabled={guardandoContrasena} className={CLASE_BOTON_INICIO} style={{ ...ESTILO_BOTON_INICIO, opacity: guardandoContrasena ? OP.secundario : 1 }}>
              <KeyRound {...ICONO} /> {guardandoContrasena ? "Guardando…" : "Cambiar clave"}
            </button>
            </div>
          </form>

          <form onSubmit={cambiarEmail} className="pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
            <p className="text-sm font-medium mb-2" style={{ color: C.ink, fontFamily: "'Fraunces', serif" }}>
              Cambiar mi email de acceso
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
            <div className="flex justify-end zurdo:justify-start">
            <button type="submit" disabled={guardandoEmail} className={CLASE_BOTON_INICIO} style={{ ...ESTILO_BOTON_INICIO, opacity: guardandoEmail ? OP.secundario : 1 }}>
              <Mail {...ICONO} /> {guardandoEmail ? "Guardando…" : "Cambiar email"}
            </button>
            </div>
          </form>
        </ModalFlotante>
      )}

      {mapaAbierto && <ModalMapaSitio onCerrar={() => setMapaAbierto(false)} />}
    </>
  );
}
