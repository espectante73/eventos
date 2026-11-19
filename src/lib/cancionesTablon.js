// Sus canciones para bailar, desde el tablón (él, v92.1): cada invitado
// las cambia con su enlace personal hasta que el anfitrión marca
// «Canciones cerradas». Quien decide es la base (tablon_guardar_canciones):
// esto le manda lo escrito, limpio como lo guarda el colaborador, y dice en
// sencillo por qué no se guardó (norma 13).
import { textoLimpioDeHuecos } from "./canciones";

export const MOTIVOS_CANCIONES_TABLON = {
  cerradas: "Ya están cerradas. Si necesitas cambiar algo, díselo a tu colaborador.",
  llave: "No se han podido guardar: vuelve a entrar con tu enlace personal.",
  red: "No se han podido guardar. Prueba otra vez en un momento.",
};

// Devuelve { cancion: lo guardado, aviso: "" }, o { cancion: null, aviso }.
export async function guardarCancionesTablon(supabase, { token, clave, respuesta, huecos }) {
  const cancion = textoLimpioDeHuecos(huecos);
  try {
    const { data, error } = await supabase.rpc("tablon_guardar_canciones", { p_token: token, p_clave: clave || "", p_respuesta: respuesta, p_cancion: cancion });
    if (error || !data) return { cancion: null, aviso: MOTIVOS_CANCIONES_TABLON.red };
    if (data.error) return { cancion: null, aviso: MOTIVOS_CANCIONES_TABLON[data.error] || MOTIVOS_CANCIONES_TABLON.red };
    return { cancion, aviso: "" };
  } catch {
    return { cancion: null, aviso: MOTIVOS_CANCIONES_TABLON.red };
  }
}
