// La sesión, renovada también con la página fuera de la vista (él, v64.6).
//
// El reproductor y la pantalla del ordenador suenan con otras ventanas
// delante. Supabase solo renueva la sesión con la página a la vista, y la
// llave caduca cada hora: con ella caducada, el canal privado del mando
// (puede_usar_canal) se cortaba y volvía, y el Mac «iba y venía» mientras
// el móvil, siempre delante, seguía fino. Solo en esas páginas propias:
// dentro de la app, la renovación normal basta.
import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useSesionSiempreViva(activo = true) {
  useEffect(() => {
    if (!activo) return;
    supabase.auth.startAutoRefresh();
  }, [activo]);
}
