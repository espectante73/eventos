// La ruta del «cartero» de los avisos (v79): /api/avisos. Ver _enviarAvisos.js.
import webpush from "web-push";
import { crearManejador } from "./_enviarAvisos.js";

export default crearManejador({ webpush, fetch: globalThis.fetch, env: process.env });
