// El evento se lee SIEMPRE a través del servidor (él, v63): la tabla está
// cerrada para que nadie saque el enlace del grupo de WhatsApp (el primer
// filtro para llegar al tablón) ni el email del anfitrión sin pasar por la
// app. Cada uno recibe lo suyo:
//   evento_publico()            todos (portada, login, tablón), sin eso
//   anfitrion_evento(p_token)   el anfitrión, entero
// y el colaborador de Novedades pide aparte el enlace
// (colaborador_enlace_whatsapp, en useLedgerData).
//
// Mientras el SQL de la v63 no esté subido, la función no existe
// (PGRST202) y se lee como antes, para no dejar la app en blanco.
export async function leerEvento(supabase, funcion = "evento_publico", parametros = {}) {
  const { data, error } = await supabase.rpc(funcion, parametros);
  if (!error) return data || null;
  if (error.code === "PGRST202") {
    const { data: filas } = await supabase.from("evento").select("*").limit(1);
    return filas?.[0] || null;
  }
  return null;
}
