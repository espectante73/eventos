// «Mesas y acomodación» (v74.6; antes «Repartir familias», v74), DIBUJADA
// de verdad: mover tocando, el tope de la mesa, nada guardado hasta
// «Aplicar a la Lista»; y las mesas y sus sitios, al momento.
import { it, expect } from "vitest";
import { useState } from "react";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaMesas } from "./VentanaMesas";
import { ROL_FAMILIAR } from "../../lib/rolFamiliar";
import { PRUEBA_VACIA } from "../../lib/repartoMesas";

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

function dibujar({ conMesas = mesas } = {}) {
  const guardados = [];
  const mesasGuardadas = [];
  function Prueba() {
    const [prueba, setPrueba] = useState(PRUEBA_VACIA);
    return (
      <VentanaMesas
        data={{ invitados, mesas: conMesas, persistInvitados: (l) => guardados.push(l), persistMesas: (l) => mesasGuardadas.push(l) }}
        prueba={prueba}
        setPrueba={setPrueba}
        onCerrar={() => {}}
      />
    );
  }
  const vista = montar(<Prueba />);
  const familia = (n) => vista.contenedor.querySelector(`[data-familia="${n}"]`);
  const columna = (t) => vista.contenedor.querySelector(`[data-columna="${t}"]`);
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.title === t);
  const enMesa = (n, t) => [...columna(`Mesa ${n}`).querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.title === t);
  return { vista, guardados, mesasGuardadas, familia, columna, boton, enMesa };
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
    const [prueba, setPrueba] = useState(PRUEBA_VACIA);
    const conTentativa = [...invitados, g("4", "Luis", "Dani", ROL_FAMILIAR.ESPOSO, { confirmado: false })];
    return (
      <VentanaMesas
        data={{ invitados: conTentativa, mesas, persistInvitados: (l) => guardados.push(l), persistMesas: () => {} }}
        prueba={prueba}
        setPrueba={setPrueba}
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
    const [prueba, setPrueba] = useState(PRUEBA_VACIA);
    const lista = [...invitados, g("4", "Luis", "Dani", ROL_FAMILIAR.ESPOSO, { confirmado: false }), g("5", "Sierra", "Raul", ROL_FAMILIAR.SUELTO, { confirmado: false, noAsiste: true })];
    return <VentanaMesas data={{ invitados: lista, mesas, persistInvitados: () => {}, persistMesas: () => {} }} prueba={prueba} setPrueba={setPrueba} onCerrar={() => {}} />;
  }
  const vista = montar(<Prueba />);
  expect(document.body.textContent).toMatch(/Confirmados\s*3/);
  expect(document.body.textContent).toMatch(/Sin confirmar\s*1/);
  vista.desmontar();
});

// v74.6 (él): las dos ventanas, en una. Las mesas y sus sitios se guardan
// al momento; Vaciar y Auto-asignar van a la prueba.
const mesa6Llena = [{ numero: 6, capacidad: 1 }, mesas[1]];

it("− / + cambia los sitios de la mesa al momento, y no baja de los que ya se sientan", () => {
  const { vista, mesasGuardadas, enMesa } = dibujar({ conMesas: mesa6Llena });
  vista.pulsar(enMesa(7, "Un sitio más"));
  expect(mesasGuardadas.at(-1).find((m) => m.numero === 7).capacidad).toBe(10);
  vista.pulsar(enMesa(7, "Un sitio menos"));
  expect(mesasGuardadas.at(-1).find((m) => m.numero === 7).capacidad).toBe(8);
  expect(enMesa(6, "Está llena: saca antes a alguien").disabled).toBe(true);
  vista.desmontar();
});

it("llena, la mesa lleva un recuadro grueso y relleno del mismo color; con sitio, no", () => {
  const { vista, columna } = dibujar({ conMesas: mesa6Llena });
  const recuadro = (n) => columna(`Mesa ${n}`).style.border;
  expect(recuadro(6)).not.toContain("transparent");
  expect(recuadro(6)).toContain(columna("Mesa 6").style.background);
  expect(recuadro(7)).toContain("transparent");
  expect(columna("Mesa 7").style.background).toBe("transparent");
  vista.desmontar();
});

it("«Vaciar» deja sus familias sin mesa, solo en la prueba", () => {
  const { vista, guardados, familia, columna, enMesa } = dibujar();
  vista.pulsar(enMesa(6, "Vaciar"));
  expect(columna("Sin mesa").contains(familia("Expósito, Rosi"))).toBe(true);
  expect(document.body.textContent).toContain("PRUEBA · 1 familia cambia de mesa");
  expect(guardados).toEqual([]);
  vista.desmontar();
});

it("«Auto-asignar» propone el reparto en la prueba, sin tocar la Lista", () => {
  const { vista, guardados, familia, columna, boton } = dibujar();
  vista.pulsar(boton("Auto-asignar"));
  expect(columna("Mesa 7").contains(familia("García, Isaias"))).toBe(true);
  expect(guardados).toEqual([]);
  vista.desmontar();
});

it("«Añadir mesa» la crea al momento, con el número siguiente", () => {
  const { vista, mesasGuardadas, boton } = dibujar();
  vista.pulsar(boton("Añadir mesa"));
  expect(mesasGuardadas.at(-1).at(-1)).toEqual({ numero: 8, capacidad: 10 });
  vista.desmontar();
});

it("quitar una mesa pregunta antes; con «Sí», quien estaba en ella se queda sin mesa", async () => {
  const { vista, guardados, mesasGuardadas, enMesa, boton } = dibujar();
  vista.pulsar(enMesa(6, "Quitar esta mesa"));
  expect(document.body.textContent).toContain("¿Quitar la mesa 6?");
  expect(mesasGuardadas).toEqual([]);
  await act(async () => boton("Sí").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(mesasGuardadas.at(-1).map((m) => m.numero)).toEqual([7]);
  expect(guardados.at(-1).find((x) => x.id === "3").mesa).toBe(null);
  vista.desmontar();
});

it("«Plano de mesas» se abre aquí mismo", () => {
  const { vista, boton } = dibujar();
  vista.pulsar(boton("Plano de mesas"));
  expect(boton("Ver las mesas")).toBeTruthy();
  vista.desmontar();
});

// v74.9 (él): «el icono de alergias debe verse solo donde aplique».
it("el aviso de alergias o intolerancias sale en la familia que las tiene, no en la mesa", () => {
  const conAlergia = invitados.map((x) => (x.id === "3" ? { ...x, alergias: "Gluten" } : x));
  function Prueba() {
    const [prueba, setPrueba] = useState(PRUEBA_VACIA);
    return <VentanaMesas data={{ invitados: conAlergia, mesas, persistInvitados: () => {}, persistMesas: () => {} }} prueba={prueba} setPrueba={setPrueba} onCerrar={() => {}} />;
  }
  const vista = montar(<Prueba />);
  const avisos = [...vista.contenedor.querySelectorAll('[aria-label="Alergias o intolerancias"]')];
  expect(avisos).toHaveLength(1);
  expect(vista.contenedor.querySelector('[data-familia="Expósito, Rosi"]').contains(avisos[0])).toBe(true);
  expect(avisos[0].title).toBe("Alergias o intolerancias: Expósito, Rosi (Gluten)");
  vista.desmontar();
});

// v75 (él): «Memorias», Acomodación 1, 2 y 3, en el desplegable de la app.
function dibujarConMemorias(acomodaciones) {
  const guardados = [];
  const mesasGuardadas = [];
  const eventos = [];
  function Prueba() {
    const [prueba, setPrueba] = useState(PRUEBA_VACIA);
    const [evento, setEvento] = useState(acomodaciones === undefined ? {} : { acomodaciones });
    return (
      <VentanaMesas
        data={{
          invitados,
          mesas,
          evento,
          persistInvitados: (l) => guardados.push(l),
          persistMesas: (l) => mesasGuardadas.push(l),
          persistEvento: (e) => {
            eventos.push(e);
            setEvento(e);
          },
        }}
        prueba={prueba}
        setPrueba={setPrueba}
        onCerrar={() => {}}
      />
    );
  }
  const vista = montar(<Prueba />);
  const botones = (t) => [...document.body.querySelectorAll("button")].filter((b) => b.textContent.trim() === t);
  const memorias = () => botones("Memorias")[0];
  return { vista, guardados, mesasGuardadas, eventos, botones, memorias };
}

const MEMORIA_2 = {
  numero: 2,
  guardadaEl: "2026-10-27T17:40:00Z",
  mesas: [{ numero: 9, capacidad: 4 }],
  asientos: { 1: 9, 2: 9, 3: null },
};

it("sin el SQL de la v75 en la base, «Memorias» sale apagado y dice por qué", () => {
  const { vista, memorias } = dibujarConMemorias(undefined);
  expect(memorias().disabled).toBe(true);
  expect(memorias().title).toContain("SQL");
  vista.desmontar();
});

it("«Guardar» en una vacía la guarda sin preguntar, con todo lo que se ve", () => {
  const { vista, eventos, botones, memorias } = dibujarConMemorias([]);
  vista.pulsar(memorias());
  expect(document.body.textContent).toContain("Ninguna guardada");
  vista.pulsar(botones("Guardar")[0]);
  vista.pulsar(botones("Acomodación 1").at(-1));
  const [memoria] = eventos.at(-1).acomodaciones;
  expect(memoria).toMatchObject({ numero: 1, mesas, asientos: { 1: null, 3: 6 } });
  expect(document.body.textContent).toContain("Guardada en Acomodación 1.");
  vista.desmontar();
});

it("«Guardar» en una que ya tiene algo pregunta antes de sustituirla", () => {
  const { vista, eventos, botones, memorias } = dibujarConMemorias([MEMORIA_2]);
  vista.pulsar(memorias());
  vista.pulsar(botones("Guardar")[0]);
  vista.pulsar(botones("Acomodación 2").at(-1));
  expect(document.body.textContent).toContain("¿Sustituir la Acomodación 2?");
  expect(eventos).toEqual([]);
  vista.desmontar();
});

it("cargar una la pone como prueba, mesas incluidas; «Aplicar» guarda las dos cosas", async () => {
  const { vista, guardados, mesasGuardadas, botones, memorias } = dibujarConMemorias([MEMORIA_2]);
  vista.pulsar(memorias());
  vista.pulsar(botones("Acomodación 2")[0]);
  const columna = (t) => vista.contenedor.querySelector(`[data-columna="${t}"]`);
  expect(columna("Mesa 6")).toBeNull();
  expect(columna("Mesa 9").querySelector('[data-familia="García, Isaias"]')).toBeTruthy();
  expect(document.body.textContent).toContain("PRUEBA · Acomodación 2, aún sin aplicar");
  expect(mesasGuardadas).toEqual([]);
  vista.pulsar(botones("Aplicar a la Lista")[0]);
  expect(mesasGuardadas.at(-1)).toEqual(MEMORIA_2.mesas);
  const final = Object.fromEntries(guardados.at(-1).map((x) => [x.id, x.mesa]));
  expect(final).toEqual({ 1: 9, 2: 9, 3: null });
  expect(document.body.textContent).toContain("Guardado en la Lista: Acomodación 2.");
  vista.desmontar();
});

// v75.1 (él): «vaciar todas las mesas», desde la cabecera de «Sin mesa».
it("«Vaciar mesas» pregunta antes y deja todas vacías, solo en la prueba", async () => {
  const { vista, guardados, mesasGuardadas, familia, columna, boton } = dibujar();
  vista.pulsar(boton("Vaciar mesas"));
  expect(document.body.textContent).toContain("¿Vaciar todas las mesas?");
  expect(document.body.textContent).toContain("1 invitado pasa a «Sin mesa»");
  await act(async () => boton("Sí").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(columna("Sin mesa").contains(familia("Expósito, Rosi"))).toBe(true);
  expect(guardados).toEqual([]);
  expect(mesasGuardadas).toEqual([]);
  vista.desmontar();
});
