import { describe, it, expect } from "vitest";
import { construirAsuntoAcuse, construirHtmlAcuse, parrafosAcuse } from "./acuseRecogida";

// v86 (él): la vista previa enseña el texto del email. Una sola pieza: lo
// que se ve antes de enviar es exactamente lo que se envía.
describe("el email del acuse", () => {
  const colaborador = { nombre: "Rubén" };
  it("el asunto lleva el nombre del evento", () => {
    expect(construirAsuntoAcuse({ nombre: "Las Bodas de todos" })).toBe("Acuse de recogida — Las Bodas de todos");
  });
  it("el email son los mismos párrafos que la vista previa", () => {
    const parrafos = parrafosAcuse({ colaborador });
    expect(parrafos[0]).toBe("Hola Rubén,");
    expect(construirHtmlAcuse({ colaborador })).toBe(parrafos.join("<br><br>"));
  });
});
