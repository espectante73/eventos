// La huella del CLAUDE.md: una sola definición para quien sella
// (sellar-manual.mjs) y quien comprueba (lib/manual.test.js).
import { createHash } from "node:crypto";

export const huellaDe = (texto) => createHash("sha256").update(texto).digest("hex").slice(0, 16);
