// El buscador de canciones (él, v80): pregunta a Deezer (gratis, sin cuenta
// ni clave) por cada canción que le manda el anfitrión, y devuelve cómo se
// llama, quién la canta y cuánto dura. Hace de intermediario porque Deezer
// no deja que el navegador le pregunte directamente. Solo con la llave del
// anfitrión, comprobada en la base. Lo que se hace con ello, en
// src/lib/repasoCanciones.js.
//
// Y la escucha previa (v81.1, `escuchar`): hasta 3 canciones de Deezer con
// su muestra de 30 s, para el anfitrión, un colaborador (con su sesión) o
// el DJ (con su enlace y su clave). Tolera lo mal escrito: Deezer ya
// perdona letras de más o de menos; si con el cantante no sale nada (un
// cantante equivocado), se busca solo por el título. La muestra caduca en
// unas horas: se pide al pulsar ▶, nunca se guarda.
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

  const pista = (p) => ({
    titulo: p.title_short || p.title || "",
    artista: p.artist?.name || "",
    duracion: Number(p.duration) || 0,
    deezer: p.id || null,
    muestra: p.preview || "",
  });
  // Hasta 3 que se puedan escuchar.
  const varias = async (q) => {
    const r = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(String(q).slice(0, 200))}&limit=6`);
    const d = await r.json();
    if (!r.ok || d.error) throw new Error("Deezer no respondió");
    return (d.data || []).filter((p) => p.preview).slice(0, 3).map(pista);
  };
  const escuchar = async ({ titulo = "", artista = "", deezer = null }) => {
    if (deezer) {
      const r = await fetch(`https://api.deezer.com/track/${encodeURIComponent(deezer)}`);
      const p = await r.json().catch(() => null);
      if (r.ok && p?.preview) return { candidatos: [pista(p)], soloTitulo: false };
    }
    const t = String(titulo).trim();
    const a = String(artista).trim();
    const juntos = [t, a].filter(Boolean).join(" ");
    if (!juntos) return { candidatos: [], soloTitulo: false };
    const primero = await varias(juntos);
    if (primero.length || !t || !a) return { candidatos: primero, soloTitulo: false };
    return { candidatos: await varias(t), soloTitulo: true };
  };
  // ¿Puede escuchar? El anfitrión (su llave), el DJ (enlace y clave) o un
  // colaborador (su sesión, en la cabecera).
  const autorizado = async (req, { token, dj }) => {
    if (token) return Boolean(await rpc("anfitrion_verificar_token", { p_token: token }));
    if (dj?.token) return Boolean(await rpc("dj_puede", { p_token: dj.token, p_clave: dj.clave || "" }));
    const sesion = String(req.headers?.authorization || "").replace(/^Bearer\s+/i, "");
    return Boolean(sesion) && Boolean(await rpc("es_colaborador", {}, sesion));
  };

  return async function manejador(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Solo POST." });
    const { token, consultas, escuchar: consulta, dj } = req.body || {};
    if (consulta) {
      try {
        if (!(await autorizado(req, { token, dj }))) return res.status(403).json({ error: "No autorizado." });
      } catch (e) {
        return res.status(403).json({ error: `No autorizado (${e.message}).` });
      }
      try {
        return res.status(200).json(await escuchar(consulta));
      } catch (e) {
        return res.status(502).json({ error: e.message });
      }
    }
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
