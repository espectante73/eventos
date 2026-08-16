// Cabecera de la app: imagen de portada, datos del evento, y (para el
// anfitrión) el desplegable "Abrir sección…" que da acceso a todas las
// ventanas flotantes. Movida fuera de App.jsx en el reparto del 2026-08-08
// (ver CLAUDE.md).
//
// Rediseño 2026-08-12 ("toque más moderno", a petición del usuario,
// primer paso de un repaso visual más amplio): la imagen pasa a ocupar
// todo el ancho de la pantalla y a llegar hasta arriba del todo (antes
// quedaba dentro de una tarjeta con margen y esquinas redondeadas, con un
// hueco por encima). El botón "Cerrar sesión" (antes en una fila suelta
// por encima de todo, ver App.jsx) se traslada dentro de la propia
// imagen, arriba a la derecha. Los datos del evento (nombre, fecha, hora,
// lugar) se mueven de la tarjeta separada de debajo a un panel de cristal
// esmerilado (`backdrop-filter: blur`) sobre la propia imagen -- de ahí
// que la imagen se vea difuminada justo donde están esos datos.
import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Image as ImageIcon, LogOut } from "lucide-react";
import { C } from "../theme";
import { VERSION_APP } from "../constants";
import { formatearFecha, formatearDiaSemana } from "../lib/formato";
import { DesplegableSecciones } from "./DesplegableSecciones";

// Trasladar la imagen fuera del ancho de columna habitual (max-w-4xl) sin
// tocar la estructura de App.jsx/VistaAnfitrion: este truco de CSS hace
// que SOLO este bloque escape al ancho completo de la ventana,
// independientemente del padding/max-width de sus contenedores. El
// marginTop negativo cancela el padding superior del contenedor de más
// arriba (py-6 = 24px) para que la imagen llegue de verdad hasta arriba
// del todo, no solo hasta ancho completo.
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
      <div
        className="flex flex-col justify-end relative"
        style={{
          minHeight: 420,
          ...ESTILO_ANCHO_COMPLETO,
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
            style={{ background: "rgba(31,25,15,0.35)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
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

        {/* El panel de datos SIEMPRE se ve (antes vivía en una sección
            aparte, debajo de la imagen, sin depender de nada) -- solo el
            <h1> de dentro se oculta con "ocultar título en imagen", para
            cuando la propia foto ya trae el nombre del evento escrito
            (como aquí: "Las Bodas de Todos" viene en la imagen). Fusionar
            los dos en la misma condición fue un fallo real de la primera
            versión de este rediseño: ocultaba fecha/hora/lugar sin querer
            en cualquier evento con esa opción activada. */}
        <div
          // pb-14 (no pb-5): dentro de esta misma imagen, abajo a la
          // derecha, flota el botón "Abrir sección…" (editable && toggle,
          // más abajo) -- hueco de sobra para que no tape la última línea
          // de texto (normalmente "Dirección", la que más se acerca a esa
          // esquina al envolver en pantallas estrechas).
          className="cristal-difuminado px-4 pt-8 pb-14 md:px-6"
          style={{
            background:
              "linear-gradient(to top, rgba(20,17,10,0.82), rgba(20,17,10,0.55) 65%, rgba(20,17,10,0))",
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

        {/* Dentro del propio bloque a ancho completo (no del wrapper
            exterior, que sigue acotado a max-w-4xl) -- si no, "right: 8"
            se mide desde el borde del contenedor estrecho, no desde el
            de la imagen, y el botón queda descolocado en pantallas anchas. */}
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
  );
}

// `value` admite un string (una línea, como antes) o un array de hasta 2
// líneas — p.ej. Fecha (día de la semana / fecha) y Dirección (calle /
// resto), a petición del usuario (2026-08-10).
// `claro`: variante para fondos oscuros (el panel de cristal sobre la
// imagen) -- el valor pasa a texto claro; la etiqueta ya usaba dorado,
// que funciona igual de bien sobre claro que sobre oscuro.
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
