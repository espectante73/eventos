// Las piezas de una noticia del tablón (v84), DIBUJADAS de verdad.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { TarjetaNoticia, CabeceraNoticia, CuerpoZonas } from "./NoticiaTablon";

it("una novedad lleva su etiqueta en verde; una pregunta, «FAQ» sin relleno", () => {
  const novedad = montar(<CabeceraNoticia titulo="De dónde venimos" esNovedad abierta />);
  expect(novedad.contenedor.textContent).toContain("De dónde venimos");
  expect(novedad.contenedor.textContent).toContain("NOVEDADES");
  novedad.desmontar();
  const faq = montar(<CabeceraNoticia titulo="" esNovedad={false} abierta={false} />);
  expect(faq.contenedor.textContent).toContain("(sin título)");
  expect(faq.contenedor.textContent).toContain("FAQ");
  faq.desmontar();
});

it("la tarjeta envuelve lo suyo y el cuerpo enseña las zonas", () => {
  const vista = montar(
    <TarjetaNoticia>
      <CuerpoZonas datos={{ miZona: "Icod", zonas: [{ zona: "Icod", confirmados: 34 }] }} />
    </TarjetaNoticia>
  );
  expect(vista.contenedor.querySelector('[data-zona="Icod"]')).toBeTruthy();
  vista.desmontar();
});
