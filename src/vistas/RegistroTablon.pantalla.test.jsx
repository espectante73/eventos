// «Lo que te ha apuntado» en el tablón (v85.1), DIBUJADO de verdad.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { RegistroTablon } from "./RegistroTablon";

const evento = { fecha: "2026-12-11" };
const yo = { nombre: "Pacheco, Ana", colaborador: "Barrios, Jacob", alergias: "Gluten", cancion: "Volare — Gipsy Kings", sinCancion: false, conservarDatos: false, anioBoda: "1990" };

it("abierto: alergias, canciones, boda en una línea y si guarda sus datos; y a quién avisar", () => {
  const vista = montar(<RegistroTablon yo={yo} evento={evento} abierta onAlternar={() => {}} />);
  const texto = vista.contenedor.textContent;
  expect(texto).toContain("Lo que te ha apuntado");
  expect(texto).toContain("Alergias: Gluten");
  expect(texto).toContain("Volare — Gipsy Kings");
  expect(texto).toContain("Boda: 1990 · 36º aniversario en 2026");
  expect(texto).toContain("Guardar tus datos tras el evento: No");
  expect(texto).toContain("Díselo a tu colaborador");
  // Nunca el año de nacimiento: es la llave de la puerta.
  expect(texto).not.toMatch(/nacimiento/i);
  vista.desmontar();
});

it("si es su propio colaborador, «Lo que has apuntado» y sin el aviso; sin boda si no es matrimonio", () => {
  const vista = montar(<RegistroTablon yo={{ ...yo, colaboradorEsYo: true, anioBoda: null }} evento={evento} abierta onAlternar={() => {}} />);
  const texto = vista.contenedor.textContent;
  expect(texto).toContain("Lo que has apuntado");
  expect(texto).not.toContain("Díselo a tu colaborador");
  expect(texto).not.toContain("Boda");
  vista.desmontar();
});

it("sin el SQL de la v85.1 (la base no lo manda), no sale nada", () => {
  const vista = montar(<RegistroTablon yo={{ nombre: "Pacheco, Ana", colaborador: "Barrios, Jacob" }} evento={evento} />);
  expect(vista.contenedor.textContent).toBe("");
  vista.desmontar();
});
