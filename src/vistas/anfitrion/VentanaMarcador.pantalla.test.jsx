// El marcador de llegadas (v69.2): dos números grandes, los que ya están y
// los que faltan, de los que han pagado.
import { it, expect } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { VentanaMarcador } from "./VentanaMarcador";

it("ya están, faltan y de cuántos que han pagado", () => {
  const invitados = [
    { id: "1", confirmado: true, pagado: true, presente: true },
    { id: "2", confirmado: true, pagado: true },
    { id: "3", confirmado: true, pagado: true },
    { id: "4", confirmado: true, pagado: false },
  ];
  const vista = montar(<VentanaMarcador data={{ invitados, evento: {} }} onCerrar={() => {}} />);
  const numero = (etiqueta) => document.body.querySelector(`[data-marcador="${etiqueta}"]`).textContent;
  expect(numero("Ya están")).toBe("1");
  expect(numero("Faltan")).toBe("2");
  expect(document.body.textContent).toContain("de 3 que han pagado");
  vista.desmontar();
});
