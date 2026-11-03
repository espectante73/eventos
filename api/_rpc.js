// Llamar a una función de la base desde Vercel, con la clave pública (como
// la app). La comparten el «cartero» de los avisos y el buscador de
// canciones: la llave del anfitrión se comprueba siempre en la base.
export function crearRpc({ fetch, env }) {
  return async (nombre, cuerpo) => {
    const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
      method: "POST",
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    if (!r.ok) throw new Error(`${nombre}: ${r.status}`);
    return r.status === 204 ? null : r.json();
  };
}
