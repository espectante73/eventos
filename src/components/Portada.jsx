// Cabecera de la app: imagen de portada, datos del evento, y (para el
// anfitrión) el desplegable "Abrir sección…" que da acceso a todas las
// ventanas flotantes. Movida fuera de App.jsx en el reparto del 2026-08-08
// (ver CLAUDE.md).
//
// Rediseño 2026-08-12 ("toque más moderno", a petición del usuario,
// primer paso de un repaso visual más amplio). Dos rondas:
//
// 1ª ronda: la imagen pasaba a ocupar todo el ancho de la pantalla con
// una altura fija (420px) y los datos del evento se superponían encima
// en un panel de cristal difuminado. Con una foto panorámica normal,
// esa altura fija forzaba demasiado zoom en "cover" y recortaba el
// texto de la propia imagen en los lados (muy visible en móvil,
// confirmado con capturas reales del usuario).
//
// 2ª ronda (esta): la foto y los datos se separan en dos bloques. La
// foto usa `aspect-ratio` (proporcional al ancho, nunca una altura fija
// desconectada de su propia forma) y ya no lleva nada de texto encima
// -- se ve entera, sin recortes forzados. Justo debajo, sin hueco, una
// franja con los datos del evento, en verde tinta de la propia paleta
// (no un negro genérico) en vez de superpuesta a la imagen.
import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Image as ImageIcon, LogOut } from "lucide-react";
import { C } from "../theme";
import { VERSION_APP } from "../constants";
import { formatearFecha, formatearDiaSemana } from "../lib/formato";
import { DesplegableSecciones } from "./DesplegableSecciones";

// Trasladar la cabecera fuera del ancho de columna habitual (max-w-4xl)
// sin tocar la estructura de App.jsx/VistaAnfitrion: este truco de CSS
// hace que SOLO este bloque escape al ancho completo de la ventana,
// independientemente del padding/max-width de sus contenedores. El
// marginTop negativo cancela el padding superior del contenedor de más
// arriba (py-6 = 24px) para que llegue de verdad hasta arriba del todo,
// no solo hasta ancho completo. Se aplica UNA vez al envoltorio que
// contiene tanto la foto como la franja de datos -- ambas heredan el
// ancho completo por estar dentro, sin tener que repetir el truco.
const ESTILO_ANCHO_COMPLETO = {
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  marginTop: -24,
};

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

  return (
    <div className="relative mb-8">
      <div style={ESTILO_ANCHO_COMPLETO}>
        {/* Foto: proporción panorámica fija (16:7, no una altura en px
            desconectada de su forma) -- se ve entera en cualquier ancho
            de pantalla, sin el zoom/recorte forzado de la ronda anterior. */}
        <div
          className="relative"
          style={{
            aspectRatio: "16 / 7",
            background: form.imagen
              ? `center/cover no-repeat url(${form.imagen})`
              : `linear-gradient(135deg, #24402F 0%, #5C6B3F 45%, #B08D57 100%)`,
          }}
        >
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
              style={{ background: "rgba(31,58,46,0.45)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          )}

          {!form.imagen && (
            <ImageIcon
              color={C.paper}
              size={30}
              strokeWidth={1.3}
              className="absolute top-1/2 left-1/2"
              style={{ transform: "translate(-50%, -50%)" }}
            />
          )}
        </div>

        {/* Franja de datos: pegada justo debajo de la foto, sin hueco.
            Verde tinta de la propia paleta (C.ink) en vez del negro
            genérico de la ronda anterior -- y ya no necesita
            backdrop-filter (no hay imagen detrás que difuminar, es su
            propio fondo). El panel SIEMPRE se ve (antes vivía en una
            sección aparte que nunca dependía de nada) -- solo el <h1> de
            dentro se oculta con "ocultar título en imagen", para cuando
            la propia foto ya trae el nombre del evento escrito. */}
        <div
          className="relative px-4 py-5 md:px-6"
          style={{
            background: "linear-gradient(180deg, #1F3A2E 0%, #24402F 100%)",
            borderTop: "1px solid rgba(176,141,87,0.4)",
          }}
        >
          {!form.ocultarTituloEnImagen && (
            <h1
              className="text-2xl md:text-3xl mb-2"
              style={{ fontFamily: "'Fraunces', serif", color: "#fff", fontWeight: 700 }}
            >
              {form.nombre || (editable ? "Nombre del evento" : "Evento sin nombre")}
            </h1>
          )}
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2" style={{ paddingRight: 110 }}>
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

          {editable && toggle && (
            <DesplegableSecciones
              abierto={abierto}
              toggle={toggle}
              colaboradores={colaboradores || []}
              onCambiarRol={onCambiarRol}
              anfitrionToken={anfitrionToken}
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
// foto) -- el valor pasa a texto claro; la etiqueta ya usaba dorado, que
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
