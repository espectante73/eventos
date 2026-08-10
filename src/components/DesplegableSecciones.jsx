// Botón "Abrir sección…" de la Portada — usa el menú propio compartido
// (MenuFlotante.jsx) en vez de un <select> nativo, para que se vea igual
// en cualquier navegador (ver comentario en MenuFlotante.jsx).
import { Bell, Users, Settings, Save, Wallet, Mail, List, Utensils, Map, Gauge, History } from "lucide-react";
import { C } from "../theme";
import { ORDEN_VENTANAS, ETIQUETAS_VENTANAS } from "./VentanaFlotante";
import { MenuFlotante } from "./MenuFlotante";

// Un icono por sección, para ubicarla de un vistazo en la lista.
const ICONOS_VENTANAS = {
  avisos: Bell,
  colaboradores: Users,
  configuracion: Settings,
  copiaSeguridad: Save,
  cuentas: Wallet,
  invitaciones: Mail,
  invitados: List,
  mesas: Utensils,
  plano: Map,
  progreso: Gauge,
  versiones: History,
};

export function DesplegableSecciones({ abierto, toggle }) {
  const opciones = ORDEN_VENTANAS.map((clave) => ({
    id: clave,
    etiqueta: (abierto[clave] ? "✓ " : "") + ETIQUETAS_VENTANAS[clave],
    icono: ICONOS_VENTANAS[clave],
    onClick: () => toggle(clave),
  }));

  return (
    <MenuFlotante
      anchor="right"
      opciones={opciones}
      render={({ ref, toggle: abrirCerrar }) => (
        <button
          ref={ref}
          onClick={abrirCerrar}
          className="absolute px-3 py-1.5 rounded text-sm font-medium"
          style={{ bottom: 8, right: 8, background: C.ink, color: C.paper, border: `1px solid ${C.ink}` }}
          title="Abre la sección elegida en una ventana flotante; puedes tener varias abiertas a la vez"
        >
          Abrir sección…
        </button>
      )}
    />
  );
}
