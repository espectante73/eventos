// El buscador de canciones (él, v80): pregunta a Deezer (gratis, sin cuenta
// ni clave) por cada canción que le manda el anfitrión, y devuelve cómo se
// llama, quién la canta y cuánto dura. Hace de intermediario porque Deezer
// no deja que el navegador le pregunte directamente. Solo con la llave del
// anfitrión, comprobada en la base. Lo que se hace con ello, en
// src/lib/repasoCanciones.js.
//
// Separado de api/canciones.js (la ruta) para poder probarlo sin red.
import { crearRpc } from "./_rpc.js";

export const MAXIMO_CONSULTAS = 10;

export function crearManejador({ fetch, env }) {
  const rpc = crearRpc({ fetch, env });

  // La primera que da Deezer, o null si no hay ninguna. `fallo`: no
  // respondió (o dijo que esperemos): se vuelve a buscar más tarde.
  const buscar = async (consulta) => {
    try {
      const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(String(consulta).slice(0, 200))}&limit=1`);
      const d = await r.json();
      if (!r.ok || d.error) return { fallo: true };
      const p = d.data?.[0];
      return { pista: p ? { titulo: p.title_short || p.title || "", artista: p.artist?.name || "", duracion: Number(p.duration) || 0, deezer: p.id || null } : null };
    } catch {
      return { fallo: true };
    }
  };

  return async function manejador(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Solo POST." });
    const { token, consultas } = req.body || {};
    if (!token || !Array.isArray(consultas) || !consultas.length || consultas.length > MAXIMO_CONSULTAS) {
      return res.status(400).json({ error: `Falta la llave, o las canciones (de 1 a ${MAXIMO_CONSULTAS}).` });
    }
    try {
      if (!(await rpc("anfitrion_verificar_token", { p_token: token }))) return res.status(403).json({ error: "No autorizado." });
    } catch (e) {
      return res.status(502).json({ error: `No se pudo hablar con la base (${e.message}).` });
    }
    return res.status(200).json({ resultados: await Promise.all(consultas.map(buscar)) });
  };
}
