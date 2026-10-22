// «De dónde venimos» en el tablón (v73), DIBUJADA de verdad.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { ZonasTablon } from "./ZonasTablon";

it("las zonas en orden alfabético, la suya marcada, y el total", () => {
  const vista = montar(
    <ZonasTablon
      datos={{
        miZona: "Icod",
        zonas: [
          { zona: "Puerto", confirmados: 8 },
          { zona: "Icod", confirmados: 34 },
          { zona: "F. España", confirmados: 3 },
        ],
      }}
    />
  );
  const zonas = [...vista.contenedor.querySelectorAll("[data-zona]")];
  expect(zonas.map((z) => z.dataset.zona)).toEqual(["F. España", "Icod", "Puerto"]);
  expect(zonas[1].style.background).not.toBe(zonas[0].style.background);
  expect(vista.html).toContain("45 confirmados · 3 zonas");
  vista.desmontar();
});

it("mientras llega, «Cargando…»; sin confirmados, lo dice", () => {
  const cargando = montar(<ZonasTablon datos={null} />);
  expect(cargando.html).toContain("Cargando…");
  cargando.desmontar();
  const vacia = montar(<ZonasTablon datos={{ miZona: "", zonas: [] }} />);
  expect(vacia.html).toContain("Todavía no hay ningún confirmado.");
  vacia.desmontar();
});
