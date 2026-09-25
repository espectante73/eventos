// Sella el CLAUDE.md: guarda su huella y la hora del cambio en
// src/lib/manual-sello.json, que la ventana "Diseño app" enseña en su
// cabecera. Se ejecuta tras cada cambio del documento:
//
//   node scripts/sellar-manual.mjs
//
// Si se olvida, lo avisa manual.test.js (la huella no coincide). Y si el
// documento no ha cambiado, no toca nada: volver a ejecutarlo no mueve
// la hora.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { huellaDe } from "./huellaManual.mjs";

const RUTA_SELLO = "src/lib/manual-sello.json";

const huella = huellaDe(readFileSync("CLAUDE.md", "utf-8"));
const anterior = existsSync(RUTA_SELLO) ? JSON.parse(readFileSync(RUTA_SELLO, "utf-8")) : {};
if (anterior.huella === huella) {
  console.log(`sin cambios: ${anterior.cambiado}`);
} else {
  const sello = { huella, cambiado: new Date().toISOString() };
  writeFileSync(RUTA_SELLO, JSON.stringify(sello, null, 2) + "\n");
  console.log(`sellado: ${sello.cambiado}`);
}
