// La ruta del buscador de canciones (v80): /api/canciones. Ver _buscarCanciones.js.
import { crearManejador } from "./_buscarCanciones.js";

export default crearManejador({ fetch: globalThis.fetch, env: process.env });
