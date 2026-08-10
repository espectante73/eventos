// Cabecera de la app: imagen de portada, datos del evento, y (para el
// anfitrión) el desplegable "Abrir sección…" que da acceso a todas las
// ventanas flotantes. Movida fuera de App.jsx en el reparto del 2026-08-08
// (ver CLAUDE.md).
import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Image as ImageIcon } from "lucide-react";
import { C } from "../theme";
import { VERSION_APP } from "../constants";
import { formatearFecha } from "../lib/formato";
import { DesplegableSecciones } from "./DesplegableSecciones";

export function Portada({ evento, editable, abierto, toggle, colaboradores, onCambiarRol }) {
  const [form, setForm] = useState(evento);
  useEffect(() => setForm(evento), [evento]);

  return (
    <div
      className="rounded-lg overflow-hidden mb-8"
      style={{ border: `1px solid ${C.line}`, background: "#FBF7EC", position: "relative" }}
    >
      <div
        className="h-40 flex items-center justify-center relative"
        style={{
          background: form.imagen
            ? `center/cover no-repeat url(${form.imagen})`
            : `linear-gradient(135deg, #24402F 0%, #5C6B3F 45%, #B08D57 100%)`,
        }}
      >
        <span
          className="absolute top-2 left-2 text-xs px-2 py-1 rounded"
          style={{ background: "rgba(255,255,255,0.7)", color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          v{VERSION_APP}
        </span>
        {!form.imagen && (
          <ImageIcon color={C.paper} size={30} strokeWidth={1.3} />
        )}
        {!form.ocultarTituloEnImagen && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(31,25,15,0.55), rgba(31,25,15,0))",
                pointerEvents: "none",
              }}
            />
            <h1
              className="absolute bottom-3 left-4 right-4 text-2xl md:text-3xl"
              style={{
                fontFamily: "'Fraunces', serif",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {form.nombre || (editable ? "Nombre del evento" : "Evento sin nombre")}
            </h1>
          </>
        )}
      </div>

      <div className="p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <InfoItem icon={Calendar} label="Fecha" value={formatearFecha(form.fecha) || "—"} />
          <InfoItem icon={Clock} label="Hora" value={form.hora || "—"} />
          <InfoItem icon={MapPin} label="Lugar" value={form.lugar || "—"} />
        </div>
        <div>
          <InfoItem icon={MapPin} label="Dirección" value={form.direccion || "—"} />
        </div>
      </div>

      {editable && toggle && (
        <DesplegableSecciones
          abierto={abierto}
          toggle={toggle}
          colaboradores={colaboradores || []}
          onCambiarRol={onCambiarRol}
        />
      )}
    </div>
  );
}

export function InfoItem({ icon: Icon, label, value }) {
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
        <div style={{ color: C.charcoal, fontFamily: "'Inter', sans-serif" }}>
          {value}
        </div>
      </div>
    </div>
  );
}
