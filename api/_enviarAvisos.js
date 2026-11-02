// El «cartero» de los avisos al móvil (él, v79): manda un aviso a los
// móviles de los colaboradores que lo han activado o, con `para:
// "anfitrion"` (v79.3, lo pide la propia base: avisar_anfitrion), a los del
// anfitrión. Vive en Vercel, junto a
// la web (plan gratuito). Solo el anfitrión puede pedirlo: se comprueba su
// llave contra la base, como en el resto de la app. La clave secreta de los
// avisos (VAPID_PRIVATE_KEY) la pega él en Vercel; nunca está en el código.
//
// Separado de api/avisos.js (la ruta) para poder probarlo sin red: recibe
// `webpush`, `fetch` y las variables.
import { CLAVE_PUBLICA_AVISOS } from "../src/lib/clavePublicaAvisos.js";

const LARGO_MAXIMO = 180;

export function crearManejador({ webpush, fetch, env }) {
  const rpc = async (nombre, cuerpo) => {
    const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
      method: "POST",
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    if (!r.ok) throw new Error(`${nombre}: ${r.status}`);
    return r.status === 204 ? null : r.json();
  };

  return async function manejador(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Solo POST." });
    if (!env.VAPID_PRIVATE_KEY) return res.status(503).json({ error: "Falta la clave de los avisos en Vercel (VAPID_PRIVATE_KEY)." });
    const { token, para = "equipo", colaboradores = null, titulo = "", texto = "", url = "/", etiqueta = "" } = req.body || {};
    if (!token || !String(texto).trim()) return res.status(400).json({ error: "Falta la llave o el texto." });

    let suscripciones;
    try {
      if (!(await rpc("anfitrion_verificar_token", { p_token: token }))) return res.status(403).json({ error: "No autorizado." });
      suscripciones =
        (para === "anfitrion"
          ? await rpc("anfitrion_suscripciones_anfitrion", { p_token: token })
          : await rpc("anfitrion_suscripciones_avisos", { p_token: token, p_colaboradores: colaboradores })) || [];
    } catch (e) {
      return res.status(502).json({ error: `No se pudo hablar con la base (${e.message}).` });
    }

    webpush.setVapidDetails("https://nexuspoint.rsvp", CLAVE_PUBLICA_AVISOS, env.VAPID_PRIVATE_KEY);
    const carga = JSON.stringify({
      titulo: String(titulo || "Las Bodas").slice(0, 60),
      texto: String(texto).slice(0, LARGO_MAXIMO),
      // Siempre dentro de la app: «/algo», nunca «//otra.web» ni «https://…».
      url: /^\/(?!\/)/.test(String(url || "")) ? url : "/",
      // Agrupa en el móvil: el aviso nuevo sustituye al anterior del mismo tipo.
      ...(/^[a-z]{1,20}$/.test(String(etiqueta)) ? { etiqueta } : {}),
    });
    let enviados = 0;
    let fallidos = 0;
    for (const s of suscripciones) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, { TTL: 60 * 60 * 24 });
        enviados += 1;
      } catch (e) {
        fallidos += 1;
        // El móvil ya no la quiere (desinstalada, permiso quitado): fuera.
        if (e.statusCode === 404 || e.statusCode === 410) await rpc("anfitrion_borrar_suscripcion", { p_token: token, p_id: s.id }).catch(() => {});
      }
    }
    return res.status(200).json({ enviados, fallidos });
  };
}
