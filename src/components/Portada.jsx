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
import { Calendar, Clock, MapPin, Image as ImageIcon, LogOut } from "lucide-react";
import { C } from "../theme";
import { VERSION_APP } from "../constants";
import { formatearFecha, formatearDiaSemana } from "../lib/formato";
import { DesplegableSecciones } from "./DesplegableSecciones";

// Ancho máximo de la tarjeta de portada -- generoso para que el póster se
// lea bien, pero sin llegar a ocupar el ancho completo de una pantalla de
// escritorio (con una imagen vertical, eso la haría desproporcionadamente
// alta). En móvil, al ser más ancho que la pantalla, no limita nada real.
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
    <div className="mx-auto mb-8" style={{ maxWidth: ANCHO_MAXIMO_PORTADA }}>
      <div className="relative rounded-t-lg overflow-hidden">
        {imagenPortada ? (
          <img src={imagenPortada} alt="" className="w-full block" />
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

        {onCerrarSesion && (
          <button
            onClick={onCerrarSesion}
            className="boton-3d cristal-difuminado absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium"
            style={{ background: "rgba(31,58,46,0.45)", color: C.gold, border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
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
            posicion={{ bottom: "9%", right: 16 }}
          />
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
