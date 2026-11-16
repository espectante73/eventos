// Las fichas de instalación de los enlaces que NO pasan por la entrada de
// la app. La de la app (public/manifest.webmanifest) empieza en la portada,
// así que un acceso directo creado desde otro enlace abría la pantalla de
// entrada. Estas empiezan en ESE enlace:
// - el tablón (v85.2, él: «crea un acceso directo en el escritorio de tu
//   móvil»), con su enlace personal si lo trae: ?t=<token>&yo=<clave>;
// - las canciones del DJ (v88.4, él: «al crear acceso directo o instalar
//   te lleva a la ventana de login»): ?dj=<token>. Su clave no va: la pide
//   la página (en el iPhone, el acceso directo tiene su propia memoria).
// No guarda ni consulta nada: devuelve lo que le llega, y solo si tiene la
// forma de uno de esos enlaces (quien la pide ya tiene ese enlace).
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLAVE = /^[0-9a-z]{6,40}$/i;

function ficha({ inicio, nombre, corto }) {
  return {
    // Otro `id` que el de la app: se pueden tener las dos en el móvil.
    id: inicio,
    name: `${nombre} · Las Bodas de todos`,
    short_name: corto,
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

export function manifestDelTablon({ t, yo } = {}) {
  if (!TOKEN.test(String(t || ""))) return null;
  const clave = CLAVE.test(String(yo || "")) ? String(yo) : "";
  return ficha({ inicio: `/?tablon=${t}${clave ? `&yo=${clave}` : ""}`, nombre: "Tablón", corto: "Tablón" });
}

export function manifestDelDj({ dj } = {}) {
  if (!TOKEN.test(String(dj || ""))) return null;
  return ficha({ inicio: `/?dj=${dj}`, nombre: "Canciones", corto: "Canciones" });
}

export function manejadorManifest(req, res) {
  const consulta = req.query || {};
  const datos = consulta.dj ? manifestDelDj(consulta) : manifestDelTablon(consulta);
  if (!datos) return res.status(400).json({ error: "Enlace no válido" });
  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.status(200).send(JSON.stringify(datos));
}
