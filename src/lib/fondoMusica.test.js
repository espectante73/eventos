import { describe, it, expect } from "vitest";
import { nombreParaMostrar } from "./fondoMusica";

// El nombre viaja saneado a Storage (sin espacios ni tildes), así que
// al mostrarlo hay que deshacer ese saneado: el usuario tiene que ver
// el nombre que él le puso, no el del archivo interno.
describe("nombreParaMostrar", () => {
  it("quita la extensión", () => {
    expect(nombreParaMostrar("fondo.jpg")).toBe("fondo");
  });

  it("devuelve los espacios a un nombre saneado", () => {
    expect(nombreParaMostrar("Acero-pulido.jpg")).toBe("Acero pulido");
    expect(nombreParaMostrar("marmol_blanco.png")).toBe("marmol blanco");
  });

  it("aguanta un nombre sin extensión", () => {
    expect(nombreParaMostrar("fondo")).toBe("fondo");
  });
});
