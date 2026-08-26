// Cabecera de la app: imagen de portada, datos del evento, y (para el
// anfitrión) el desplegable "Abrir sección…" que da acceso a todas las
// ventanas flotantes. Movida fuera de App.jsx en el reparto del 2026-08-08
// (ver CLAUDE.md).
//
// Rediseño 2026-08-12 ("toque más moderno", a petición del usuario,
// primer paso de un repaso visual más amplio). Tres rondas:
//
// 1ª ronda: imagen a todo el ancho de pantalla con altura fija (420px) y
// los datos superpuestos encima en un panel de cristal difuminado. Con
// una foto panorámica normal, esa altura fija forzaba demasiado zoom en
// "cover" y recortaba el texto de la propia imagen en los lados (visible
// en móvil y escritorio, confirmado con capturas reales del usuario).
//
// 2ª ronda: foto y datos separados en dos bloques, la foto con
// `aspect-ratio` panorámico en vez de una altura fija -- arregló el
// recorte, pero seguía pensada para una foto ancha genérica.
//
// 3ª ronda: el usuario quiere un póster VERTICAL (retrato) tipo
// invitación, no una foto panorámica. Ya no tiene sentido forzar ningún
// aspect-ratio ancho: se muestra con un <img> normal (alto automático
// según su proporción real, nunca recortada) dentro de una tarjeta
// centrada con ancho máximo (para que en una pantalla ancha de escritorio
// no acabe siendo absurdamente alta) en vez de a todo el ancho de
// ventana. Fecha/hora/lugar se mantienen en vivo, en su propia franja
// debajo de la imagen (no "quemados" en el diseño, a petición del
// usuario) -- si el póster ya trae esos datos dibujados a mano, la
// franja de abajo simplemente los repite con los datos reales de la app.
//
// 4ª ronda (esta): esa 3ª ronda usaba evento.imagenInvitacion como
// fuente de la imagen, asumiendo que era el mismo diseño que quería
// para la portada -- error real: son dos imágenes DISTINTAS.
// imagenInvitacion es la plantilla para generar la invitación de cada
// familia (lleva recuadros reservados para "Familia"/"Mesa" que se
// rellenan al generar cada una); la portada necesita su propia imagen,
// sin esos recuadros. Vuelve a usar evento.imagen (el campo de siempre,
// se sube en Configuración → Datos del evento), separado por completo
// de Invitaciones.
import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Image as ImageIcon, LogOut, Megaphone } from "lucide-react";
import { C } from "../theme";
import { VERSION_APP } from "../constants";
import { formatearFecha, formatearDiaSemana } from "../lib/formato";
import { DesplegableSecciones } from "./DesplegableSecciones";
import { MiCuenta } from "./MiCuenta";

// Ancho máximo de la tarjeta de portada -- generoso para que el póster se
// lea bien, pero sin llegar a ocupar el ancho completo de una pantalla de
// escritorio (con una imagen vertical, eso la haría desproporcionadamente
// alta). En móvil, al ser más ancho que la pantalla, no limita nada real.
// Sin "export": nadie más lo usa (comprobado en un examen honesto del
// código, 2026-08-24) -- si algún día otro componente necesita este
// mismo ancho, vuelve a exportarse entonces.
const ANCHO_MAXIMO_PORTADA = 480;

export function Portada({
  evento,
  editable,
  abierto,
  toggle,
  colaboradores,
  onCambiarRol,
  anfitrionToken,
  onCerrarSesion,
  // Enlace COMPLETO al tablón público (?tablon=...), ya calculado por
  // quien monta Portada (VistaAnfitrion.jsx / VistaColaborador.jsx) a
  // partir de data.tokenTablon -- Portada no sabe nada de cómo se
  // construye, solo lo enlaza si existe. undefined/"" = todavía no
  // disponible (token sin cargar, o falta la URL pública en
  // Configuración) -- el botón simplemente no aparece.
  enlaceTablon,
  // Abre la ventana Novedades (ventana de verdad del sistema operativo,
  // no una VentanaFlotante -- ver lib/usePopupWindow.js). Solo lo usa
  // DesplegableSecciones (menú del anfitrión); VistaColaborador.jsx no
  // lo pasa, así que ese menú nunca llega a montarse ahí.
  abrirNovedades,
  // Igual que abrirNovedades pero para la ventana Logística -- también
  // ventana de verdad del sistema operativo (ver comentario en
  // VentanaLogistica.jsx), y también exclusiva del menú del anfitrión.
  abrirLogistica,
  // `botonExtra`: para cuando esta Portada la usa alguien que NO es el
  // anfitrión editando (p.ej. VistaColaborador.jsx) -- en vez del
  // desplegable "Abrir sección…" (editable+toggle), se puede pasar aquí
  // cualquier botón/menú propio, que ocupa el mismo sitio ("a los pies
  // de la pareja"). Los dos son mutuamente excluyentes: si hay
  // editable+toggle, botonExtra no se usa.
  botonExtra,
}) {
  const [form, setForm] = useState(evento);
  useEffect(() => setForm(evento), [evento]);

  // NO usar evento.imagenInvitacion aquí -- esa es la plantilla para
  // generar la invitación de cada familia (lleva recuadros reservados
  // para "Familia"/"Mesa" que se rellenan al generar cada una), una
  // imagen DISTINTA de la de portada aunque el usuario suba un diseño
  // parecido para las dos. La portada usa su propio campo de siempre,
  // evento.imagen (se sube en Configuración → Datos del evento) -- un
  // primer intento de este mismo rediseño usó imagenInvitacion por
  // error, mezclando las dos.
  const imagenPortada = form.imagen;

  return (
    // Sin mb-8: el margen hacia lo que viene después (la franja de
    // estadísticas en VistaAnfitrion.jsx) se controla ahí, con un
    // marginTop propio -- con mb-8 aquí, el colapso de márgenes entre
    // hermanos hacía que "ganara" el mayor de los dos (32px) sin importar
    // lo bajo que se pusiera el marginTop de la franja de abajo.
    <div className="mx-auto" style={{ maxWidth: ANCHO_MAXIMO_PORTADA }}>
      <div className="relative rounded-t-lg overflow-hidden">
        {imagenPortada ? (
          // userSelect/WebkitUserSelect + WebkitTouchCallout: la imagen es
          // decorativa (una foto con el diseño de la invitación ya
          // dibujado encima) -- sin esto, un arrastre accidental del ratón
          // o el reconocimiento de texto en imágenes de Safari/iOS (Live
          // Text) puede "seleccionar" el texto que ya trae la propia
          // foto, mostrando recuadros azules de selección encima (lo que
          // reportó el usuario, 2026-08-18) — nada roto en el código, es
          // comportamiento del navegador sobre cualquier imagen con texto
          // legible.
          <img
            src={imagenPortada}
            alt=""
            className="w-full block"
            style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
          />
        ) : (
          <div
            className="w-full flex items-center justify-center"
            style={{
              aspectRatio: "3 / 4",
              background: `linear-gradient(135deg, #24402F 0%, #5C6B3F 45%, #B08D57 100%)`,
            }}
          >
            <ImageIcon color={C.paper} size={30} strokeWidth={1.3} />
          </div>
        )}

        <span
          className="absolute top-4 left-4 text-xs px-2 py-1 rounded"
          style={{ background: "rgba(255,255,255,0.7)", color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          v{VERSION_APP}
        </span>

        {/* "Mi cuenta" (cambiar contraseña/email de acceso sin cerrar
            sesión) vive junto a "Cerrar sesión" -- las dos comparten la
            misma condición (solo tiene sentido con una sesión real de
            Supabase Auth, no con el enlace-token del anfitrión) y así
            sirve igual para el anfitrión que para cualquier
            colaborador logueado, sin tocar nada en VistaColaborador.jsx
            -- a petición del usuario, 2026-08-21 (Fase C). */}
        {onCerrarSesion && (
          // Orden de arriba a abajo a petición del usuario, 2026-08-25:
          // Cerrar sesión, Novedades, Mi cuenta.
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <button
              onClick={onCerrarSesion}
              className="boton-3d boton-flotante-imagen cristal-difuminado flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
            {enlaceTablon && (
              <a
                href={enlaceTablon}
                className="boton-3d boton-flotante-imagen cristal-difuminado flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
                title="Abre el tablón público de novedades que ven los confirmados"
              >
                <Megaphone size={16} /> Novedades
              </a>
            )}
            <MiCuenta />
          </div>
        )}

        {/* "A los pies de la pareja": sobre la propia foto, no en la
            franja de datos de abajo -- a la derecha a propósito (alcance
            del pulgar derecho en móvil). El % en vez de un valor fijo en
            px sigue funcionando igual de bien pase lo que pase con el
            alto real de la imagen (varía según su proporción). */}
        {editable && toggle && (
          <DesplegableSecciones
            abierto={abierto}
            toggle={toggle}
            colaboradores={colaboradores || []}
            onCambiarRol={onCambiarRol}
            anfitrionToken={anfitrionToken}
            abrirNovedades={abrirNovedades}
            abrirLogistica={abrirLogistica}
            posicion={{ bottom: "9%", right: 16 }}
          />
        )}
        {!(editable && toggle) && botonExtra && (
          <div className="absolute flex flex-col items-end gap-2" style={{ bottom: "9%", right: 16 }}>
            {botonExtra}
          </div>
        )}
      </div>

      {/* Franja de datos EN VIVO, aparte de la imagen (a petición
          expresa del usuario: si el póster ya trae fecha/hora/lugar
          dibujados a mano, esto no depende de tener que regenerar la
          imagen cada vez que cambie algo en Configuración). Verde tinta
          de la propia paleta (C.ink), pegada justo debajo sin hueco. */}
      <div
        className="relative rounded-b-lg px-4 py-5"
        style={{
          background: "linear-gradient(180deg, #1F3A2E 0%, #24402F 100%)",
          borderTop: "1px solid rgba(176,141,87,0.4)",
        }}
      >
        {!form.ocultarTituloEnImagen && (
          <h1
            className="text-2xl mb-2"
            style={{ fontFamily: "'Fraunces', serif", color: "#fff", fontWeight: 700 }}
          >
            {form.nombre || (editable ? "Nombre del evento" : "Evento sin nombre")}
          </h1>
        )}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
          <InfoItem
            claro
            icon={Calendar}
            label="Fecha"
            value={form.fecha ? [formatearDiaSemana(form.fecha), formatearFecha(form.fecha)] : "—"}
          />
          <InfoItem claro icon={Clock} label="Hora" value={form.hora || "—"} />
          <InfoItem claro icon={MapPin} label="Lugar" value={form.lugar || "—"} />
          {form.direccion && (
            <InfoItem
              claro
              icon={MapPin}
              label="Dirección"
              value={(() => {
                // Se divide en la primera coma (p.ej. "calle" / "ciudad,
                // provincia") -- si no hay coma, se queda en una sola línea.
                const i = form.direccion.indexOf(",");
                return i === -1
                  ? form.direccion
                  : [form.direccion.slice(0, i).trim(), form.direccion.slice(i + 1).trim()];
              })()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// `value` admite un string (una línea, como antes) o un array de hasta 2
// líneas — p.ej. Fecha (día de la semana / fecha) y Dirección (calle /
// resto), a petición del usuario (2026-08-10).
// `claro`: variante para fondos oscuros (la franja de datos bajo la
// imagen) -- el valor pasa a texto claro; la etiqueta ya usaba dorado, que
// funciona igual de bien sobre claro que sobre oscuro.
export function InfoItem({ icon: Icon, label, value, claro }) {
  const lineas = (Array.isArray(value) ? value : [value]).filter(Boolean);
  const colorValor = claro ? "rgba(255,255,255,0.92)" : C.charcoal;
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} style={{ color: C.gold }} className="mt-0.5" />
      <div>
        <div
          className="text-xs uppercase"
          style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {label}
        </div>
        {lineas.length === 0 ? (
          <div style={{ color: colorValor, fontFamily: "'Inter', sans-serif" }}>—</div>
        ) : (
          lineas.map((linea, i) => (
            <div key={i} style={{ color: colorValor, fontFamily: "'Inter', sans-serif" }}>
              {linea}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
