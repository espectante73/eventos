// El evento se lee SIEMPRE a través del servidor (él, v63): la tabla está
// cerrada para que nadie saque el enlace del grupo de WhatsApp (el primer
// filtro para llegar al tablón) ni el email del anfitrión sin pasar por la
// app. Cada uno recibe lo suyo:
//   evento_publico()            todos (portada, login, tablón), sin eso
//   anfitrion_evento(p_token)   el anfitrión, entero
// y el colaborador de Novedades pide aparte el enlace
// (colaborador_enlace_whatsapp, en useLedgerData).
export async function leerEvento(supabase, funcion = "evento_publico", parametros = {}) {
  const { data, error } = await supabase.rpc(funcion, parametros);
  return error ? null : data || null;
}
