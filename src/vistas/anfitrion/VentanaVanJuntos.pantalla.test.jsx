// «Van juntos» (v101.1), DIBUJADA de verdad: los grupos en una línea, con
// su X; «Juntar» apagado hasta elegir las dos; el aviso, si no se pudo.
import { it, expect } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { VentanaVanJuntos } from "./VentanaVanJuntos";

const familia = (id, nombre) => ({ clave: nombre.toLowerCase(), nombre, representante: { id } });
const familias = [familia("1", "Pérez, Tomás"), familia("2", "Abreu, Luis"), familia("3", "Díaz, Inés")];
const grupos = [{ id: "g", numero: 1, familias: [familias[1], familias[0]] }];

it("los grupos, una línea cada uno; sin grupos, lo dice", () => {
  const vacia = montar(<VentanaVanJuntos familias={familias} grupos={[]} onJuntar={() => ""} onSeparar={() => {}} onCerrar={() => {}} />);
  expect(document.body.textContent).toContain("Todavía no hay familias que vayan juntas.");
  vacia.desmontar();
  const vista = montar(<VentanaVanJuntos familias={familias} grupos={grupos} onJuntar={() => ""} onSeparar={() => {}} onCerrar={() => {}} />);
  expect(document.body.querySelector('[data-grupo="1"]').textContent).toContain("Abreu, Luis · Pérez, Tomás");
  vista.desmontar();
});

it("«Juntar», solo con las dos elegidas; en la otra lista no sale la ya elegida; el aviso, si no se pudo", () => {
  const llamadas = [];
  const vista = montar(
    <VentanaVanJuntos
      familias={familias}
      grupos={[]}
      onJuntar={(a, b) => {
        llamadas.push([a, b]);
        return "No caben.";
      }}
      onSeparar={() => {}}
      onCerrar={() => {}}
    />
  );
  const juntar = [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Juntar");
  expect(juntar.disabled).toBe(true);
  vista.elegir(document.body.querySelector('[aria-label="La familia que va"]'), "3");
  const otra = document.body.querySelector('[aria-label="Con qué familia va"]');
  expect([...otra.options].map((o) => o.textContent)).toEqual(["Familia…", "Abreu, Luis", "Pérez, Tomás"]);
  vista.elegir(otra, "2");
  vista.pulsar(juntar);
  expect(llamadas).toEqual([["3", "2"]]);
  expect(document.body.textContent).toContain("No caben.");
  vista.desmontar();
});
