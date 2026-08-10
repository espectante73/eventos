// Sub-ventana de Configuración: precios de adulto/niño y el rango de edad
// que decide cuál se aplica. Extraída de VistaAnfitrion.jsx en el reparto
// del 2026-08-08 (Fase 4, Ronda 1). Rediseñada el 2026-08-09 (a petición
// del usuario, con boceto propio) como dos grupos compactos, con el
// mismo relleno verde oscuro / letra clara que el resto de la app
// (botones, menús) en vez del fondo claro habitual de los formularios.
// Icono € y números más grandes añadidos el mismo día, a petición del
// usuario.
import { Euro } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";

function GrupoPrecio({ icono: Icono, titulo, etiquetaA, valorA, onCambiarA, etiquetaB, valorB, onCambiarB }) {
  return (
    <div className="rounded-lg p-3" style={{ background: C.ink }}>
      {(Icono || titulo) && (
        <div
          className="flex items-center justify-center gap-1 text-sm mb-1"
          style={{ color: C.paper, textDecoration: titulo ? "underline" : "none", textUnderlineOffset: 3 }}
        >
          {Icono && <Icono size={15} style={{ opacity: 0.85 }} />}
          {titulo}
        </div>
      )}
      <div
        className="flex items-center justify-center gap-4 text-xs uppercase mb-2"
        style={{ color: C.paper, opacity: 0.85, letterSpacing: "0.06em" }}
      >
        <span>{etiquetaA}</span>
        <span style={{ opacity: 0.5 }}>--</span>
        <span>{etiquetaB}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <input
          value={valorA}
          onChange={onCambiarA}
          style={{ ...inputStyle, width: 72, textAlign: "center", fontSize: 22, fontWeight: 700 }}
        />
        <input
          value={valorB}
          onChange={onCambiarB}
          style={{ ...inputStyle, width: 72, textAlign: "center", fontSize: 22, fontWeight: 700 }}
        />
      </div>
    </div>
  );
}

export function VentanaConfigPrecios({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  return (
    <VentanaFlotante
      clave="config-precios"
      titulo="Precios"
      onCerrar={onCerrar}
      ancho="min(300px, calc(100vw - 2rem))"
    >
      <div className="space-y-4">
        <GrupoPrecio
          icono={Euro}
          etiquetaA="Adulto"
          valorA={evento.precioAdulto}
          onCambiarA={(e) => persistEvento({ ...evento, precioAdulto: e.target.value })}
          etiquetaB="Niño"
          valorB={evento.precioNino}
          onCambiarB={(e) => persistEvento({ ...evento, precioNino: e.target.value })}
        />
        <GrupoPrecio
          titulo="Edad niño"
          etiquetaA="Desde"
          valorA={evento.edadNinoDesde}
          onCambiarA={(e) => persistEvento({ ...evento, edadNinoDesde: e.target.value })}
          etiquetaB="Hasta"
          valorB={evento.edadNinoHasta}
          onCambiarB={(e) => persistEvento({ ...evento, edadNinoHasta: e.target.value })}
        />
      </div>
    </VentanaFlotante>
  );
}
