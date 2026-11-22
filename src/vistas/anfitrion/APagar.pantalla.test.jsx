// «A pagar» en Contabilidad (v88), DIBUJADO de verdad: lo que entra, lo que
// sale a cada acreedor (local, DJ, sus gastos) y lo que sobra; la ventanita
// de lo que cobra el local y la línea del DJ.
import { it, expect } from "vitest";
import { useState } from "react";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { euros, fechaCorta } from "../../lib/formato";
import { resumenAPagar } from "../../lib/aPagar";
import { APagarHoja, VentanaLocal, CuentaLocalHoja } from "./APagar";

const escribir = (input, valor) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

// 0-3 gratis, 4-7 niño, 8 en adelante adulto (las de la app).
const EVENTO = { fecha: "2026-12-11", precioAdulto: "47", precioNino: "35", edadNinoDesde: "4", edadNinoHasta: "8", aPagar: null };
const INVITADOS = [
  { id: "a", confirmado: true, pagado: true, anioNacimiento: "1980" },
  { id: "b", confirmado: true, pagado: true, anioNacimiento: "1982" },
  { id: "dj", confirmado: true, pagado: false, anioNacimiento: "1975", zona: "DJ" },
  { id: "n", confirmado: true, pagado: true, anioNacimiento: "2020" },
  { id: "bebe", confirmado: true, pagado: false, anioNacimiento: "2025" },
  { id: "x", confirmado: false, anioNacimiento: "1990" },
];
const GASTOS = [{ id: "g", concepto: "Imprenta", importe: "30" }];

function dibujar({ evento = EVENTO, ventana = false, colaboradores = [] } = {}) {
  const eventos = [];
  function Prueba() {
    const [ev, setEv] = useState(evento);
    const data = {
      evento: ev,
      invitados: INVITADOS,
      gastos: GASTOS,
      colaboradores,
      persistEvento: (e) => {
        eventos.push(e);
        setEv(e);
      },
    };
    const recaudado = 47 + 47 + 35;
    const resumen = resumenAPagar({ evento: ev, invitados: INVITADOS, gastos: GASTOS, recaudado, propinas: 10 });
    return ventana ? <VentanaLocal data={data} onCerrar={() => {}} /> : <APagarHoja data={data} resumen={resumen} recaudado={recaudado} propinas={10} onLocal={() => {}} />;
  }
  const vista = montar(<Prueba />);
  const todos = (sel) => [...document.body.querySelectorAll(sel)];
  const boton = (texto) => todos("button").find((b) => b.textContent.trim() === texto);
  return { vista, eventos, todos, boton };
}

it("sin precios todavía: lo dice, y sale solo lo de los gastos", () => {
  const { vista } = dibujar();
  const texto = document.body.textContent;
  expect(texto).toContain("Sin precios del local todavía");
  // Sin precios, el local no desglosa a nadie (los bebés de «Entra» son otra cosa).
  expect(texto.slice(texto.indexOf("Sale"))).not.toContain("gratis");
  // Entra 129 + 10; sale 30 de gastos.
  expect(texto).toContain(`Total bruto que entra${euros(139)}`);
  expect(texto).toContain(`Total que sale${euros(30)}`);
  expect(texto).toContain(`Sobran${euros(109)}`);
  vista.desmontar();
});

it("con los precios del local: adultos (el DJ también), niños y bebés gratis; y lo que falta", () => {
  const aPagar = { partidas: [{ id: "1", concepto: "Menú", adulto: "60", nino: "30" }, { id: "2", concepto: "Tarta", adulto: "5", nino: "5" }], otros: [{ id: "3", concepto: "Montaje", importe: "100" }], dj: "200" };
  const { vista } = dibujar({ evento: { ...EVENTO, aPagar } });
  const texto = document.body.textContent;
  expect(texto).toContain(`3 adultos × ${euros(65)}${euros(195)}`);
  expect(texto).toContain(`1 niño × ${euros(35)}${euros(35)}`);
  expect(texto).toContain("1 bebégratis");
  expect(texto).toContain(`Otros del local${euros(100)}`);
  // Local 330 + DJ 200 + gastos 30 = 560; entran 139: faltan 421.
  expect(texto).toContain(`Local${euros(330)}`);
  expect(texto).toContain(`Total que sale${euros(560)}`);
  expect(texto).toContain(`Faltan${euros(421)}`);
  vista.desmontar();
});

it("lo del DJ se escribe en su línea y se guarda", () => {
  const { vista, eventos, todos } = dibujar();
  const dj = todos('input[aria-label="Lo que cobra el DJ"]')[0];
  act(() => dj.dispatchEvent(new FocusEvent("focus", { bubbles: true })));
  escribir(dj, "600");
  act(() => dj.dispatchEvent(new FocusEvent("blur", { bubbles: true })));
  act(() => dj.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
  expect(eventos.at(-1).aPagar).toEqual({ partidas: [], otros: [], dj: "600" });
  expect(document.body.textContent).toContain(`Total que sale${euros(630)}`);
  vista.desmontar();
});

it("la ventanita: partidas con adulto y niño, el total por persona, y Guardar", () => {
  const { vista, eventos, todos, boton } = dibujar({ ventana: true });
  // Empieza con una partida vacía, lista para escribir.
  escribir(todos('input[aria-label="Partida"]')[0], "Menú principal");
  escribir(todos('input[aria-label="Precio adulto"]')[0], "65");
  escribir(todos('input[aria-label="Precio niño"]')[0], "30");
  act(() => boton("Partida").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  escribir(todos('input[aria-label="Partida"]')[1], "Tarta");
  escribir(todos('input[aria-label="Precio adulto"]')[1], "6,50");
  escribir(todos('input[aria-label="Precio niño"]')[1], "6,50");
  act(() => boton("Otro").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  escribir(todos('input[aria-label="Otro del local"]')[0], "Montaje");
  escribir(todos('input[aria-label="Importe"]')[0], "200");
  const texto = document.body.textContent;
  expect(texto).toContain(`Total${euros(71.5)}${euros(36.5)}`);
  expect(texto).toContain("Niño, de 4 a 7 años; hasta los 3, gratis.");
  act(() => boton("Guardar").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  const guardado = eventos.at(-1).aPagar;
  expect(guardado.partidas.map(({ concepto, adulto, nino }) => [concepto, adulto, nino])).toEqual([
    ["Menú principal", "65", "30"],
    ["Tarta", "6,50", "6,50"],
  ]);
  expect(guardado.otros.map(({ concepto, importe }) => [concepto, importe])).toEqual([["Montaje", "200"]]);
  vista.desmontar();
});

it("la ventanita: con un precio que no es un número, no guarda y dice por qué", () => {
  const { vista, eventos, todos, boton } = dibujar({ ventana: true });
  escribir(todos('input[aria-label="Partida"]')[0], "Cóctel");
  escribir(todos('input[aria-label="Precio adulto"]')[0], "quince");
  act(() => boton("Guardar").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(eventos).toHaveLength(0);
  expect(document.body.textContent).toContain("«Cóctel»: escribe solo el número");
  vista.desmontar();
});

it("la ventanita: Cancelar con algo escrito pregunta antes de descartar", () => {
  const { vista, eventos, todos, boton } = dibujar({ ventana: true });
  escribir(todos('input[aria-label="Partida"]')[0], "Menú");
  act(() => boton("Cancelar").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(document.body.textContent).toContain("¿Descartar los cambios?");
  expect(eventos).toHaveLength(0);
  vista.desmontar();
});

// v93.1 (él): la cuenta del local, para enseñársela al pagarle, sin lo
// recaudado; v93.3: su propia sección, con los precios en su ruedita.
it("la cuenta del local: las personas, cada servicio con su desglose y el total; nada de lo recaudado", () => {
  const aPagar = {
    partidas: [
      { id: "1", concepto: "Cóctel", adulto: "15", nino: "8" },
      { id: "2", concepto: "Cena", adulto: "55", nino: "25" },
    ],
    otros: [{ id: "3", concepto: "Montaje", importe: "100" }],
    dj: "200",
  };
  const vista = montar(<CuentaLocalHoja data={{ evento: { ...EVENTO, aPagar }, invitados: INVITADOS }} onPrecios={() => {}} />);
  const texto = document.body.textContent;
  // 3 adultos (el DJ también), 1 niño, 1 bebé gratis.
  expect(texto).toContain("Adultos3");
  expect(texto).toContain("Niños (de 4 a 7 años)1");
  expect(texto).toContain("Bebés (hasta 3 años)1 · gratis");
  expect(texto).toContain(`Cóctel${euros(53)}`);
  expect(texto).toContain(`3 adultos × ${euros(15)}${euros(45)}`);
  expect(texto).toContain(`1 niño × ${euros(8)}${euros(8)}`);
  expect(texto).toContain(`Cena${euros(190)}`);
  expect(texto).toContain(`Montaje${euros(100)}`);
  expect(texto).toContain(`Total a pagar al local${euros(343)}`);
  for (const ajeno of ["Recaudado", "Propinas", "DJ", "Sobran", "Faltan"]) expect(texto).not.toContain(ajeno);
  vista.desmontar();
});

it("la cuenta del local: la ruedita abre los precios del local; sin precios, lo dice", () => {
  const abiertas = [];
  const vista = montar(<CuentaLocalHoja data={{ evento: EVENTO, invitados: INVITADOS }} onPrecios={() => abiertas.push(1)} />);
  expect(document.body.textContent).toContain("Sin precios todavía: ponlos en la ruedita.");
  const ruedita = document.body.querySelector('button[aria-label="Precios del local"], button[title="Precios del local"]');
  act(() => ruedita.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(abiertas).toHaveLength(1);
  vista.desmontar();
});

// v94.5 (él: «cuántos de más de 8 años pagaron los 47 €, cuántos como niños,
// cuánta propina»): lo recaudado por edades, y el cuadre con los acuses.
it("«Entra» desglosado por edades, y comprobado con los acuses", () => {
  const { vista } = dibujar();
  const texto = document.body.textContent;
  expect(texto).toContain(`2 adultos (8 años o más) × ${euros(47)}${euros(94)}`);
  expect(texto).toContain(`1 niño (de 4 a 7 años) × ${euros(35)}${euros(35)}`);
  expect(texto).toContain("1 bebé (hasta 3 años)gratis");
  // Sin colaboradores en la prueba: nada entregado, y los 3 pagados no los
  // lleva nadie.
  expect(texto).toContain(`Ya entregado (acuses, con propinas)${euros(0)}`);
  expect(texto).toContain(`No cuadra: diferencia${euros(139)}`);
  expect(texto).toContain("Pagados sin colaborador3 personas");
  vista.desmontar();
});

// v94.6 (él: «tengo 66 € y el programa me marca 77 €, desglosa las
// propinas»): bajo «Propinas», cada una con su colaborador y su día.
it("bajo «Propinas», cada propina con su colaborador y su día", () => {
  const colaboradores = [
    { id: "c1", nombre: "Sierra, Raúl", entregas: [{ id: "e1", fecha: "2026-11-20", importe: 94, propina: 6, invitados: [] }, { id: "e2", fecha: "2026-11-21", importe: 35, propina: 0, invitados: [] }] },
    { id: "c2", nombre: "Abreu, Ana", entregas: [{ id: "e3", fecha: "2026-11-02", importe: 0, propina: 4, invitados: [] }] },
  ];
  const { vista, todos } = dibujar({ colaboradores });
  const texto = document.body.textContent;
  expect(texto).toContain(`Abreu, Ana · ${fechaCorta("2026-11-02")}${euros(4)}`);
  expect(texto).toContain(`Sierra, Raúl · ${fechaCorta("2026-11-20")}${euros(6)}`);
  // La entrega sin propina no sale.
  expect(texto).not.toContain(fechaCorta("2026-11-21"));
  // Y van justo debajo de «Propinas», antes del total.
  const lineas = todos("span").map((s) => s.textContent);
  const i = lineas.indexOf("Propinas");
  expect(lineas[i + 2]).toBe(`Abreu, Ana · ${fechaCorta("2026-11-02")}`);
  vista.desmontar();
});
