// Sella el CLAUDE.md: guarda su huella, la hora del cambio y sus palabras
// en src/lib/manual-sello.json, que la ventana "Diseño app" enseña en su
// cabecera. Se ejecuta tras cada cambio del documento:
//
//   node scripts/sellar-manual.mjs
//
// Si se olvida, lo avisa manual.test.js (la huella no coincide). Y si el
// documento no ha cambiado, no toca nada: volver a ejecutarlo no mueve
// la hora.
//
// Cuenta por DÍAS (hora de Canarias): `palabrasInicioDia` son las que
// tenía al empezar el día del último cambio, y la ventana enseña lo que
// subió o bajó ese día ("hoy +24", "hoy −18"). Es la señal de que el
// documento engorda. El primer sello de un día nuevo arranca de las
// palabras con que acabó el anterior.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { huellaDe } from "./huellaManual.mjs";
import { partirManual } from "../src/lib/manual.js";

const RUTA_SELLO = "src/lib/manual-sello.json";

const texto = readFileSync("CLAUDE.md", "utf-8");
const huella = huellaDe(texto);
const palabras = partirManual(texto).palabras;
const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Atlantic/Canary" });
const anterior = existsSync(RUTA_SELLO) ? JSON.parse(readFileSync(RUTA_SELLO, "utf-8")) : {};
if (anterior.huella === huella) {
  console.log(`sin cambios: ${anterior.cambiado}`);
} else {
  const sello = {
    huella,
    cambiado: new Date().toISOString(),
    palabras,
    dia: hoy,
    palabrasInicioDia:
      anterior.dia === hoy ? anterior.palabrasInicioDia : (anterior.palabras ?? palabras),
  };
  writeFileSync(RUTA_SELLO, JSON.stringify(sello, null, 2) + "\n");
  console.log(`sellado: ${sello.cambiado} · ${palabras} palabras (hoy ${palabras - sello.palabrasInicioDia})`);
}
