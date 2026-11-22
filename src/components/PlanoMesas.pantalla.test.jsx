// v94 (él: «ordenarla en el plano teniendo en cuenta cómo estarán las mesas
// en el local»): el dibujo del local va de fondo, y la mesa mide un tanto
// por ciento del plano, no unos píxeles fijos: si no, al agrandar la ventana
// el local crecía y la mesa no, y el plano engañaba.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { PlanoMesas } from "./PlanoMesas";
import { ANCHO_MESA_PLANO } from "./Mesas";

const datos = (evento) => ({
  mesas: [{ numero: 1, capacidad: 10, posX: 50, posY: 50 }],
  persistMesas: () => {},
  evento,
  persistEvento: () => {},
});
const QUITAR = '[title="Quitar el plano del local"]';

it("con el dibujo del local, sale de fondo y se puede quitar", () => {
  const vista = montar(<PlanoMesas data={datos({ planoLocal: "https://x/plano-local.jpg?v=1" })} ocupacionMesa={() => 4} />);
  const img = vista.contenedor.querySelector('#zona-imprimible-plano img[alt="Plano del local"]');
  expect(img?.getAttribute("src")).toBe("https://x/plano-local.jpg?v=1");
  expect(vista.contenedor.querySelector(QUITAR)).not.toBeNull();
  vista.desmontar();
});

it("sin dibujo, ni fondo ni botón de quitar", () => {
  const vista = montar(<PlanoMesas data={datos({})} ocupacionMesa={() => 0} />);
  expect(vista.contenedor.querySelector("#zona-imprimible-plano img")).toBeNull();
  expect(vista.contenedor.querySelector(QUITAR)).toBeNull();
  vista.desmontar();
});

it("la mesa mide un tanto por ciento del plano: crece y encoge con él", () => {
  const vista = montar(<PlanoMesas data={datos({})} ocupacionMesa={() => 4} />);
  const mesa = vista.contenedor.querySelector('[title^="Mesa 1"]');
  expect(mesa.style.width).toBe(`${ANCHO_MESA_PLANO}%`);
  expect(mesa.querySelector("svg").getAttribute("viewBox")).toBe("0 0 60 60");
  vista.desmontar();
});
