// La ficha de instalación del tablón (v85.2, él): «crea un acceso directo
// en el escritorio de tu móvil». La de la app (public/manifest.webmanifest)
// empieza en la portada, así que un acceso directo creado desde el tablón
// abría la pantalla de entrada. Esta empieza en ESE tablón, con su enlace
// personal si lo trae. No guarda ni consulta nada: devuelve lo que le
// llega, y solo si tiene la forma de un enlace del tablón (quien la pide ya
// tiene ese enlace).
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLAVE = /^[0-9a-z]{6,40}$/i;

export function manifestDelTablon({ t, yo } = {}) {
  if (!TOKEN.test(String(t || ""))) return null;
  const clave = CLAVE.test(String(yo || "")) ? String(yo) : "";
  const inicio = `/?tablon=${t}${clave ? `&yo=${clave}` : ""}`;
  return {
    // Otro `id` que el de la app: se pueden tener las dos en el móvil.
    id: inicio,
    name: "Tablón · Las Bodas de todos",
    short_name: "Tablón",
    description: "Toda la información del evento.",
    lang: "es",
    start_url: inicio,
    scope: "/",
    display: "standalone",
    background_color: "#1F3A2E",
    theme_color: "#1F3A2E",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

export function manejadorManifest(req, res) {
  const ficha = manifestDelTablon(req.query || {});
  if (!ficha) return res.status(400).json({ error: "Enlace del tablón no válido" });
  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.status(200).send(JSON.stringify(ficha));
}
