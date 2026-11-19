// La ruta de «Añadir a mi calendario» (v92.6): /api/calendario. Ver _calendario.js.
import { crearManejador } from "./_calendario.js";

export default crearManejador({ fetch: globalThis.fetch, env: process.env });
