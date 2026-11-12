// «Comprueba tus datos» en el tablón (v85.1-85.2), DIBUJADO de verdad.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { RegistroTablon } from "./RegistroTablon";

const evento = { fecha: "2026-12-11" };
const yo = { nombre: "Pacheco, Ana", anio: "1985", tieneEmail: false, colaborador: "Barrios, Jacob", alergias: "Gluten", cancion: "Volare — Gipsy Kings", sinCancion: false, conservarDatos: false, anioBoda: "1990" };

it("abierto: su frase, su nombre, alergias, canciones, boda, email y si guarda sus datos", () => {
  const vista = montar(<RegistroTablon yo={yo} evento={evento} abierta onAlternar={() => {}} />);
  const texto = vista.contenedor.textContent;
  expect(texto).toContain("Comprueba tus datos");
  expect(texto).toContain("Comprueba que estos datos que nos has dado están bien registrados; si ves algún error, dile a tu colaborador que los corrija.");
  expect(texto).toContain("Nombre: Pacheco, Ana");
  expect(texto).toContain("Alergias: Gluten");
  expect(texto).toContain("Email para la invitación: No");
  expect(texto).toContain("Volare — Gipsy Kings");
  expect(texto).toContain("Boda: 1990 · 36º aniversario en 2026");
  expect(texto).toContain("Guardar tus datos tras el evento: No");
  // Nunca el año de nacimiento: es la llave de la puerta.
  expect(texto).not.toMatch(/nacimiento/i);
  vista.desmontar();
});

it("si es su propio colaborador, lo corrige él; sin boda si no es matrimonio", () => {
  const vista = montar(<RegistroTablon yo={{ ...yo, colaboradorEsYo: true, anioBoda: null }} evento={evento} abierta onAlternar={() => {}} />);
  const texto = vista.contenedor.textContent;
  expect(texto).toContain("corrígelo en tu formulario");
  expect(texto).not.toContain("dile a tu colaborador");
  expect(texto).not.toContain("Boda");
  vista.desmontar();
});

it("sin el SQL de la v85.1 (la base no lo manda), no sale nada", () => {
  const vista = montar(<RegistroTablon yo={{ nombre: "Pacheco, Ana", colaborador: "Barrios, Jacob" }} evento={evento} />);
  expect(vista.contenedor.textContent).toBe("");
  vista.desmontar();
});
