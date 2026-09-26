// El portero de las pantallas (hook de Claude Code, .claude/settings.json).
//
// La PRIMERA vez en cada sesión que Claude va a modificar una pantalla
// (src/vistas, src/components, src/index.css), no le deja: le enseña las
// normas de estándar (1.2 del CLAUDE.md, leídas en ese momento, nunca una
// copia) y le pide comprobarlas y repetir. Después le deja trabajar.
//
// Por qué: una norma escrita no protege si no se mira al decidir. Pasó
// con el pulgar y con los botones de la pregunta de la familia (v47).
//
// Con --olvidar (tras resumir la conversación) vuelve a pararle la
// siguiente vez: al resumir es cuando más fácil se olvidan las normas.
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const entrada = JSON.parse(readFileSync(0, "utf-8") || "{}");
const marca = join(tmpdir(), `claude-portero-${String(entrada.session_id || "sin-sesion").replace(/\W/g, "")}`);

if (process.argv.includes("--olvidar")) {
  rmSync(marca, { force: true });
  process.exit(0);
}

const ruta = String(entrada.tool_input?.file_path || "");
const esPantalla = /\/src\/(vistas|components)\/|\/src\/index\.css$/.test(ruta) && !/\.test\.[jt]sx?$/.test(ruta);
if (!esPantalla || existsSync(marca)) process.exit(0);

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const manual = readFileSync(join(raiz, "CLAUDE.md"), "utf-8");
const normas = manual.slice(manual.indexOf("## 1.2 "), manual.indexOf("## 1.3 ")).trim();

writeFileSync(marca, new Date().toISOString());
console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "PORTERO DE PANTALLAS: antes de tocar una pantalla, relee estas normas (1.2 del CLAUDE.md), " +
        "comprueba cuáles afectan a este cambio y cómo se cumplen, y dilo en tu propuesta al usuario. " +
        "Después repite la edición: esta sesión ya no te volveré a parar.\n\n" +
        normas,
    },
  })
);
