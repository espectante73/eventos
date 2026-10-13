import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigurado) {
  // Aviso claro en la consola, pero sin romper el arranque de la app: si
  // dejáramos que createClient reciba valores vacíos, lanza un error al
  // cargar el módulo y toda la web se queda en blanco. Usamos un valor de
  // relleno para que la app cargue igual; las llamadas reales a Supabase
  // fallarán más tarde (ya con un aviso legible) hasta que rellenes .env.
  console.error(
    "Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y rellena los valores de tu proyecto de Supabase."
  );
}

// `worker`: el latido que mantiene viva la conexión en vivo (el mando, las
// llegadas) sale de un hilo aparte, que el navegador no frena aunque la
// página no se vea (v64.6: el reproductor del Mac, por detrás de otras
// ventanas, se desconectaba y volvía). Donde no hay hilos (las pruebas), el
// latido de siempre.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "clave-de-relleno",
  { realtime: { worker: typeof Worker !== "undefined" } }
);
