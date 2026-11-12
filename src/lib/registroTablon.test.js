import { describe, it, expect } from "vitest";
import { registroDelTablon } from "./registroTablon";

const evento = { fecha: "2026-12-11" };
const yo = { nombre: "Pacheco, Ana", alergias: "Gluten", cancion: "Volare — Gipsy Kings\nDespacito", sinCancion: false, conservarDatos: true, anioBoda: "1990" };

describe("registroDelTablon", () => {
  it("lo que le apuntó su colaborador, en una línea cada cosa", () => {
    expect(registroDelTablon(yo, evento)).toEqual({
      alergias: "Gluten",
      canciones: ["Volare — Gipsy Kings", "Despacito"],
      boda: "1990 · 36º aniversario en 2026",
      conservar: "Sí",
    });
  });

  it("sin el SQL de la v85.1 la base no manda nada de esto: no se enseña", () => {
    expect(registroDelTablon({ nombre: "Pacheco, Ana", colaborador: "Barrios, Jacob" }, evento)).toBeNull();
    expect(registroDelTablon(null, evento)).toBeNull();
  });

  it("la boda: nada si no es matrimonio; «Sin año» si lo es y falta", () => {
    expect(registroDelTablon({ ...yo, anioBoda: null }, evento).boda).toBeNull();
    expect(registroDelTablon({ ...yo, anioBoda: "" }, evento).boda).toBe("Sin año");
  });

  it("sin canción: si dijo que no quería, o si aún falta; alergias sin contestar, se dice", () => {
    expect(registroDelTablon({ ...yo, cancion: "", sinCancion: true }, evento).canciones).toEqual(["Prefieres no pedir ninguna"]);
    expect(registroDelTablon({ ...yo, cancion: "" }, evento).canciones).toEqual(["Ninguna todavía"]);
    expect(registroDelTablon({ ...yo, alergias: "" }, evento).alergias).toBe("Sin contestar");
    expect(registroDelTablon({ ...yo, conservarDatos: false }, evento).conservar).toBe("No");
  });
});
