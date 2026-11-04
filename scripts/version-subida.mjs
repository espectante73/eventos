// Freno de .githooks/pre-push (él, v81.6): toda subida que cambie lo que se
// publica lleva número de versión nuevo y su aviso (src/constants.js), para
// que el aviso rojo de «Actualizar» diga siempre a qué versión lleva y qué
// cambia. Una actualización sin número nuevo le hizo temer algo de fuera.
// git le pasa por la entrada una línea por rama: <local> <sha> <remota> <sha>.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Lo que acaba dentro de lo publicado (las pruebas y el SQL, no).
export const CAMBIA_LO_PUBLICADO = /^(src\/(?!.*\.test\.jsx?$)|public\/|index\.html$|CLAUDE\.md$|vite\.config\.js$|package(-lock)?\.json$)/;

// El motivo para no subir, o "" si se puede.
export function motivoSinVersion({ archivos, antes, ahora }) {
  if (!archivos.some((f) => CAMBIA_LO_PUBLICADO.test(f))) return "";
  if (antes.version === ahora.version) return `cambia lo publicado y sigue la versión ${ahora.version}: sube VERSION_APP y escribe su AVISO_VERSION`;
  if (!ahora.aviso || antes.aviso === ahora.aviso) return `la ${ahora.version} no trae su AVISO_VERSION: escribe qué cambia, se corrige o se añade`;
  return "";
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

function leerConstantes(sha) {
  const texto = git("show", `${sha}:src/constants.js`);
  const campo = (nombre) => texto.match(new RegExp(`${nombre} = "([^"]*)"`))?.[1] ?? "";
  return { version: campo("VERSION_APP"), aviso: campo("AVISO_VERSION") };
}

function revisar(entrada) {
  const motivos = [];
  for (const linea of entrada.split("\n").filter(Boolean)) {
    const [, local, , remota] = linea.split(" ");
    // Rama que se borra o rama nueva: no hay con qué comparar.
    if (/^0+$/.test(local) || /^0+$/.test(remota)) continue;
    let archivos;
    try {
      archivos = git("diff", "--name-only", remota, local).split("\n").filter(Boolean);
    } catch {
      continue; // lo de GitHub no está en este Mac: lo dirá el propio git
    }
    const motivo = motivoSinVersion({ archivos, antes: leerConstantes(remota), ahora: leerConstantes(local) });
    if (motivo) motivos.push(motivo);
  }
  return motivos;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const motivos = revisar(readFileSync(0, "utf8"));
  if (motivos.length) {
    console.error(`✋ No se sube: ${motivos.join("; ")}.`);
    process.exit(1);
  }
}
