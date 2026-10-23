// El sello de los días que faltan en el panel del colaborador (v73.1).
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { SelloCuentaAtras } from "./SelloCuentaAtras";

const sello = (vista) => vista.contenedor.querySelector("[data-sello-cuenta-atras]");

it("los días que faltan, latiendo y del lado contrario al pulgar", () => {
  const vista = montar(<SelloCuentaAtras evento={{ fecha: "2026-12-11" }} hoy={new Date("2026-10-23T10:00:00")} />);
  expect(sello(vista).textContent).toBe("Faltan49días");
  expect(sello(vista).className).toContain("sello-cuenta-atras");
  expect(sello(vista).className).toContain("zurdo:right-4");
  vista.desmontar();
});

it("el día del evento, «¡Es hoy!»; con la fecha sin confirmar, no sale", () => {
  const hoy = montar(<SelloCuentaAtras evento={{ fecha: "2026-12-11" }} hoy={new Date("2026-12-11T10:00:00")} />);
  expect(sello(hoy).textContent).toBe("¡Es hoy!");
  hoy.desmontar();
  const sinFecha = montar(<SelloCuentaAtras evento={{ fecha: "2026-12-11", fechaSinConfirmar: true }} hoy={new Date("2026-10-23T10:00:00")} />);
  expect(sello(sinFecha)).toBeNull();
  sinFecha.desmontar();
});
