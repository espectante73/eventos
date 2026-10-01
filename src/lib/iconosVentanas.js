// Un icono por sección, para ubicarla de un vistazo: en el menú "Abrir
// sección…" (DesplegableSecciones.jsx) y en la barra de ventanas del
// móvil (BarraVentanas.jsx). Una sola pieza: si cambia aquí, cambia en
// los dos sitios.
import { Heart, Users, Settings, Wallet, Mail, List, Utensils, Music, Megaphone, KeyRound, ClipboardList } from "lucide-react";

export const ICONOS_VENTANAS = {
  aniversarios: Heart,
  colaboradores: Users,
  configuracion: Settings,
  cuentas: Wallet,
  formulario: ClipboardList,
  invitaciones: Mail,
  invitados: List,
  mesas: Utensils,
  musicaEvento: Music,
  novedades: Megaphone,
  permisos: KeyRound,
};
