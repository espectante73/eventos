// «Repartir familias» (v74), DIBUJADA de verdad: mover tocando, el tope de
// la mesa, y nada guardado hasta «Aplicar a la Lista».
import { it, expect } from "vitest";
import { useState } from "react";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaRepartoMesas } from "./VentanaRepartoMesas";
import { ROL_FAMILIAR } from "../../lib/rolFamiliar";

const g = (id, apellido, nombre, rol, extra = {}) => ({ id, apellido, nombre, grupoFamiliar: `${apellido}01`, rolFamiliar: rol, confirmado: true, mesa: null, ...extra });
const invitados = [
  g("1", "García", "Isaias", ROL_FAMILIAR.ESPOSO),
  g("2", "García", "Ana", ROL_FAMILIAR.ESPOSA),
  g("3", "Expósito", "Rosi", ROL_FAMILIAR.SUELTO, { mesa: 6 }),
];
const mesas = [
  { numero: 6, capacidad: 2 },
  { numero: 7, capacidad: 9 },
];

function dibujar() {
  const guardados = [];
  function Prueba() {
    const [borrador, setBorrador] = useState({});
    return (
      <VentanaRepartoMesas
        data={{ invitados, mesas, persistInvitados: (l) => guardados.push(l) }}
        borrador={borrador}
        setBorrador={setBorrador}
        onCerrar={() => {}}
      />
    );
  }
  const vista = montar(<Prueba />);
  const familia = (n) => vista.contenedor.querySelector(`[data-familia="${n}"]`);
  const columna = (t) => vista.contenedor.querySelector(`[data-columna="${t}"]`);
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t);
  return { vista, guardados, familia, columna, boton };
}

it("cada familia con su «O» y cuántos son; cada mesa con sus ocupados de los que caben", () => {
  const { vista, familia, columna } = dibujar();
  expect(familia("García, Isaias").textContent).toBe("García, Isaias2");
  expect(columna("Sin mesa").contains(familia("García, Isaias"))).toBe(true);
  expect(columna("Mesa 6").textContent).toContain("1/2");
  expect(columna("Mesa 7").textContent).toContain("0/9");
  vista.desmontar();
});

it("tocar la familia y luego la mesa la mueve, solo en la prueba; «Aplicar» la guarda", () => {
  const { vista, guardados, familia, columna, boton } = dibujar();
  vista.pulsar(familia("García, Isaias"));
  vista.pulsar(columna("Mesa 7"));
  expect(columna("Mesa 7").contains(familia("García, Isaias"))).toBe(true);
  expect(columna("Mesa 7").textContent).toContain("2/9");
  expect(document.body.textContent).toContain("PRUEBA · 1 familia cambia de mesa");
  expect(guardados).toEqual([]);
  vista.pulsar(boton("Aplicar a la Lista"));
  expect(guardados[0].filter((x) => x.mesa === 7).map((x) => x.id)).toEqual(["1", "2"]);
  vista.desmontar();
});

it("no deja sentar a más de los que caben: se queda donde estaba y dice cuántos sitios quedan", () => {
  const { vista, familia, columna } = dibujar();
  vista.pulsar(familia("García, Isaias"));
  vista.pulsar(columna("Mesa 6"));
  expect(columna("Sin mesa").contains(familia("García, Isaias"))).toBe(true);
  expect(document.body.textContent).toContain("solo queda 1 sitio");
  vista.desmontar();
});

it("«Descartar» pregunta antes y, con «Sí, descartar», vuelve todo como estaba", async () => {
  const { vista, familia, columna, boton } = dibujar();
  vista.pulsar(familia("Expósito, Rosi"));
  vista.pulsar(columna("Mesa 7"));
  vista.pulsar(boton("Descartar"));
  expect(document.body.textContent).toContain("¿Descartar los cambios?");
  await act(async () => boton("Sí, descartar").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(columna("Mesa 6").contains(familia("Expósito, Rosi"))).toBe(true);
  vista.desmontar();
});

it("al aplicar, dice que está guardado: los botones se apagan y no debe parecer que no hizo nada", () => {
  const { vista, familia, columna, boton } = dibujar();
  vista.pulsar(familia("García, Isaias"));
  vista.pulsar(columna("Mesa 7"));
  vista.pulsar(boton("Aplicar a la Lista"));
  expect(document.body.textContent).toContain("Guardado en la Lista: 1 familia cambia de mesa.");
  vista.desmontar();
});

// v74.2 (él): «que los muestre siempre sombreados hasta confirmar».
it("los no confirmados salen siempre, sombreados, y se sientan como los demás", () => {
  const guardados = [];
  function Prueba() {
    const [borrador, setBorrador] = useState({});
    const conTentativa = [...invitados, g("4", "Luis", "Dani", ROL_FAMILIAR.ESPOSO, { confirmado: false })];
    return (
      <VentanaRepartoMesas
        data={{ invitados: conTentativa, mesas, persistInvitados: (l) => guardados.push(l) }}
        borrador={borrador}
        setBorrador={setBorrador}
        onCerrar={() => {}}
      />
    );
  }
  const vista = montar(<Prueba />);
  const luis = () => vista.contenedor.querySelector('[data-familia="Luis, Dani"]');
  expect(luis()).toBeTruthy();
  expect(Number(luis().style.opacity)).toBeLessThan(1);
  vista.pulsar(luis());
  vista.pulsar(vista.contenedor.querySelector('[data-columna="Mesa 7"]'));
  expect(vista.contenedor.querySelector('[data-columna="Mesa 7"]').contains(luis())).toBe(true);
  expect(vista.contenedor.querySelector('[data-columna="Mesa 7"]').textContent).toContain("1/9");
  vista.desmontar();
});

// v74.3 (él): arriba, confirmados y sin confirmar, con la cuenta de la Lista.
it("la cabecera cuenta confirmados y sin confirmar", () => {
  function Prueba() {
    const [borrador, setBorrador] = useState({});
    const lista = [...invitados, g("4", "Luis", "Dani", ROL_FAMILIAR.ESPOSO, { confirmado: false }), g("5", "Sierra", "Raul", ROL_FAMILIAR.SUELTO, { confirmado: false, noAsiste: true })];
    return <VentanaRepartoMesas data={{ invitados: lista, mesas, persistInvitados: () => {} }} borrador={borrador} setBorrador={setBorrador} onCerrar={() => {}} />;
  }
  const vista = montar(<Prueba />);
  expect(document.body.textContent).toMatch(/Confirmados\s*3/);
  expect(document.body.textContent).toMatch(/Sin confirmar\s*1/);
  vista.desmontar();
});
