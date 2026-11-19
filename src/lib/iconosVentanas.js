// Un icono por sección, para ubicarla de un vistazo: en el menú "Abrir
// sección…" (DesplegableSecciones.jsx) y en la barra de ventanas del
// móvil (BarraVentanas.jsx). Una sola pieza: si cambia aquí, cambia en
// los dos sitios.
import {
  Heart,
  Users,
  Settings,
  Wallet,
  Mail,
  List,
  Utensils,
  MonitorPlay,
  Megaphone,
  KeyRound,
  ClipboardList,
  CalendarHeart,
  UserCheck,
  ClipboardPen,
  Gauge,
  History,
  UserCog,
  Calendar,
  FlaskConical,
  RotateCcw,
  Trash2,
  Clock3,
  Send,
} from "lucide-react";

// «Formulario» (él, v87.4; antes «Añadir»): «ahora no solo añade, sino que
// busca o confirma o hace cambios». Su nombre y su icono, una sola pieza
// para la cabecera de la Lista y el menú «Invitados» de la Portada.
export const FORMULARIO_INVITADO = { etiqueta: "Formulario", icono: ClipboardPen };

export const ICONOS_VENTANAS = {
  aniversarios: Heart,
  colaboradores: Users,
  configuracion: Settings,
  cuentas: Wallet,
  diaEvento: CalendarHeart,
  // El equipo de colaboradores del panel de cada uno (v73.1): el mismo grupo de personas.
  equipo: Users,
  marcador: UserCheck,
  formulario: ClipboardList,
  invitaciones: Mail,
  invitados: List,
  mesas: Utensils,
  // Multimedia: una pantalla con su botón de reproducir, sonido e imagen.
  musicaEvento: MonitorPlay,
  novedades: Megaphone,
  permisos: KeyRound,
  // Las de los submenús (Colaboradores, Configuración, Invitados): también
  // van a la barra del móvil (v90.4).
  "avisar-equipo": Send,
  "colaboradores-datos": UserCog,
  "nuevo-invitado": FORMULARIO_INVITADO.icono,
  progreso: Gauge,
  versiones: History,
  "config-cronograma": Clock3,
  "config-datos-evento": Calendar,
  "config-modo-pruebas": FlaskConical,
  "config-zona-reinicio": RotateCcw,
  "config-zona-peligro": Trash2,
};
