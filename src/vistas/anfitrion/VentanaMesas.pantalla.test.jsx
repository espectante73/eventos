// «Mesas y acomodación» (v74.6; antes «Repartir familias», v74), DIBUJADA
// de verdad: mover tocando, el tope de la mesa, nada guardado hasta
// «Aplicar a la Lista»; y las mesas y sus sitios, al momento.
import { describe, it, expect } from "vitest";
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

function dibujar({ conMesas = mesas, lista = invitados, evento = {}, orden } = {}) {
  const guardados = [];
  const mesasGuardadas = [];
  const eventos = [];
  const ordenes = [];
  function Prueba() {
    const [prueba, setPrueba] = useState(PRUEBA_VACIA);
    const [ev, setEv] = useState(evento);
    const [ord, setOrd] = useState(orden);
    const persistEvento = (e) => {
      eventos.push(e);
      setEv(e);
    };
    const persistOrdenFamiliares = (o) => {
      ordenes.push(o);
      setOrd(o);
    };
    return (
      <VentanaMesas
        data={{ invitados: lista, mesas: conMesas, evento: ev, persistEvento, persistInvitados: (l) => guardados.push(l), persistMesas: (l) => void mesasGuardadas.push(l), ordenFamiliares: ord, persistOrdenFamiliares }}
        prueba={prueba}
        setPrueba={setPrueba}
        onCerrar={() => {}}
      />
    );
  }
  const vista = montar(<Prueba />);
  const familia = (n) => vista.contenedor.querySelector(`[data-familia="${n}"]`);
  const columna = (t) => vista.contenedor.querySelector(`[data-columna="${t}"]`);
  // Sin las mitades del Sí/No de «Acomodación terminada»: el «Sí» que se
  // busca es el de la pregunta.
  const boton = (t) => [...document.body.querySelectorAll('button:not([role="radio"])')].find((b) => b.textContent.trim() === t || b.title === t);
  const enMesa = (n, t) => [...columna(`Mesa ${n}`).querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.title === t);
  return { vista, guardados, mesasGuardadas, eventos, ordenes, familia, columna, boton, enMesa };
}

describe("«Acomodación terminada», el candado de las invitaciones (v90.7)", () => {
  const mitad = (vista, t) => [...vista.contenedor.querySelectorAll('[aria-label="Acomodación terminada"] button')].find((b) => b.textContent === t);

  it("sin marcar dice que no se envía ninguna; «Sí» pregunta antes, con los confirmados sin mesa", () => {
    const { vista, eventos, boton } = dibujar();
    // En una sola línea (v101.3): lo que pasa ahora, al pasar por encima.
    expect(vista.contenedor.querySelector('[title="Mientras diga «No», no se envía ninguna invitación."]')).toBeTruthy();
    expect(mitad(vista, "No").getAttribute("aria-checked")).toBe("true");
    vista.pulsar(mitad(vista, "Sí"));
    expect(document.body.textContent).toContain("¿Acomodación terminada?");
    expect(document.body.textContent).toContain("Quedan 2 confirmados sin mesa");
    expect(eventos).toEqual([]);
    vista.pulsar(boton("Sí"));
    expect(eventos.at(-1).acomodacionTerminada).toBe(true);
    expect(vista.contenedor.querySelector('[title="Ya se pueden enviar las invitaciones."]')).toBeTruthy();
    vista.desmontar();
  });

  it("volver a «No» cierra el envío sin preguntar", () => {
    const { vista, eventos } = dibujar({ evento: { acomodacionTerminada: true } });
    vista.pulsar(mitad(vista, "No"));
    expect(document.body.textContent).not.toContain("¿Acomodación terminada?");
    expect(eventos.at(-1).acomodacionTerminada).toBe(false);
    vista.desmontar();
  });
});

it("el DJ contratado se distingue: blanco, en negrita y con sus auriculares (v84.2)", () => {
  const { vista, familia } = dibujar({ lista: [...invitados, g("9", "Brown", "Julien", ROL_FAMILIAR.SUELTO, { zona: "DJ" })] });
  const dj = familia("Brown, Julien");
  expect(dj.style.background).toBe("rgb(255, 255, 255)");
  expect(dj.querySelector('svg[aria-label="DJ"]')).toBeTruthy();
  expect(familia("García, Isaias").style.background).not.toBe("rgb(255, 255, 255)");
  expect(familia("García, Isaias").querySelector('svg[aria-label="DJ"]')).toBeNull();
  vista.desmontar();
});

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

// v98.4 (él): al quitar una, las demás se renumeran; antes quedaba un hueco.
it("quitar una mesa pregunta antes; con «Sí», quien estaba en ella se queda sin mesa y las demás quedan 1, 2, 3…", async () => {
  const conGente = [...invitados, g("4", "Pérez", "Loli", ROL_FAMILIAR.SUELTO, { mesa: 7 })];
  const { vista, guardados, mesasGuardadas, enMesa, boton } = dibujar({ lista: conGente });
  vista.pulsar(enMesa(6, "Quitar esta mesa"));
  expect(document.body.textContent).toContain("¿Quitar la mesa 6?");
  expect(document.body.textContent).toContain("Las demás quedan 1, 2, 3…, cada una con su gente.");
  expect(mesasGuardadas).toEqual([]);
  await act(async () => boton("Sí").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(mesasGuardadas.at(-1)).toEqual([{ numero: 1, capacidad: 9 }]);
  expect(guardados.at(-1).find((x) => x.id === "3").mesa).toBe(null);
  expect(guardados.at(-1).find((x) => x.id === "4").mesa, "la de la 7 se va con su mesa, que ahora es la 1").toBe(1);
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
          persistMesas: (l) => void mesasGuardadas.push(l),
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
  await act(async () => botones("Aplicar a la Lista")[0].dispatchEvent(new MouseEvent("click", { bubbles: true })));
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

// v83 (él): «rodar las mesas con el ratón y al cambiarlas de orden se renumeren».
describe("arrastrar una mesa sobre otra", () => {
  const arrastrar = async (de, a) => {
    const dt = { datos: {}, setData(k, v) { this.datos[k] = v; }, getData(k) { return this.datos[k] || ""; } };
    const evento = (tipo) => Object.assign(new Event(tipo, { bubbles: true, cancelable: true }), { dataTransfer: dt });
    await act(async () => de.dispatchEvent(evento("dragstart")));
    await act(async () => a.dispatchEvent(evento("drop")));
  };
  const cabecera = (vista, n) => vista.contenedor.querySelector(`[data-cabecera-mesa="${n}"]`);

  it("la 7 sobre la 6: se renumeran y se llevan a su gente; nada se guarda hasta «Aplicar»", async () => {
    const { vista, guardados, mesasGuardadas, familia, columna, boton } = dibujar();
    await arrastrar(cabecera(vista, 7), columna("Mesa 6"));
    // Eran 6 y 7: quedan 1 (la de 9 sitios, antes 7) y 2 (la de 2, con Rosi).
    expect(columna("Mesa 1").textContent).toContain("0/9");
    expect(columna("Mesa 2").contains(familia("Expósito, Rosi"))).toBe(true);
    expect(columna("Mesa 6")).toBeNull();
    expect(mesasGuardadas).toEqual([]);
    expect(guardados).toEqual([]);
    await act(async () => boton("Aplicar a la Lista").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(mesasGuardadas[0]).toEqual([{ numero: 1, capacidad: 9 }, { numero: 2, capacidad: 2 }]);
    expect(guardados[0].find((x) => x.id === "3").mesa).toBe(2);
    vista.desmontar();
  });

  it("si las mesas no se pueden guardar, tampoco se toca a los invitados", async () => {
    const guardados = [];
    function Prueba() {
      const [prueba, setPrueba] = useState(PRUEBA_VACIA);
      return <VentanaMesas data={{ invitados, mesas, persistInvitados: (l) => guardados.push(l), persistMesas: async () => "fallo" }} prueba={prueba} setPrueba={setPrueba} onCerrar={() => {}} />;
    }
    const vista = montar(<Prueba />);
    await arrastrar(vista.contenedor.querySelector('[data-cabecera-mesa="7"]'), vista.contenedor.querySelector('[data-columna="Mesa 6"]'));
    const aplicar = [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Aplicar a la Lista");
    await act(async () => aplicar.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(guardados).toEqual([]);
    vista.desmontar();
  });

  it("una mesa soltada en «Sin mesa» no hace nada, y una familia sigue yendo a su mesa", async () => {
    const { vista, familia, columna } = dibujar();
    await arrastrar(cabecera(vista, 7), columna("Sin mesa"));
    expect(columna("Mesa 7")).not.toBeNull();
    await arrastrar(familia("García, Isaias"), columna("Mesa 7"));
    expect(columna("Mesa 7").contains(familia("García, Isaias"))).toBe(true);
    vista.desmontar();
  });

  it("en el móvil la mesa no se arrastra", () => {
    const original = window.matchMedia;
    window.matchMedia = (q) => ({ matches: q.includes("pointer: coarse"), addEventListener() {}, removeEventListener() {} });
    const { vista } = dibujar();
    expect(cabecera(vista, 7).getAttribute("draggable")).toBe("false");
    window.matchMedia = original;
    vista.desmontar();
  });
});

// v83.1 (él): con la invitación enviada, la mesa de esa familia queda fija.
describe("una familia con su invitación enviada", () => {
  const dibujarFija = () => {
    function Prueba() {
      const [prueba, setPrueba] = useState(PRUEBA_VACIA);
      return (
        <VentanaMesas
          data={{ invitados, mesas, evento: {}, colaboradores: [], ordenFamiliares: { Expósito01: { invitacionEnviada: true } }, persistInvitados: () => {}, persistMesas: () => {} }}
          prueba={prueba}
          setPrueba={setPrueba}
          onCerrar={() => {}}
        />
      );
    }
    const vista = montar(<Prueba />);
    const familia = (n) => vista.contenedor.querySelector(`[data-familia="${n}"]`);
    const columna = (t) => vista.contenedor.querySelector(`[data-columna="${t}"]`);
    return { vista, familia, columna };
  };

  it("lleva candado, no se arrastra y su mesa no se puede quitar ni vaciar", () => {
    const { vista, familia, columna } = dibujarFija();
    const f = familia("Expósito, Rosi");
    expect(f.querySelector('[aria-label="Mesa fija: invitación enviada"]')).toBeTruthy();
    expect(f.getAttribute("draggable")).toBe("false");
    expect([...columna("Mesa 6").querySelectorAll("button")].find((b) => b.textContent.trim() === "Vaciar").disabled).toBe(true);
    expect(columna("Mesa 6").querySelector('button[aria-label^="Tiene familias con su invitación"]').disabled).toBe(true);
    expect(familia("García, Isaias").getAttribute("draggable")).toBe("true");
    vista.desmontar();
  });

  it("tocarla abre «Cambiar mesa»; con una prueba a medias, pide cerrarla antes", () => {
    const { vista, familia, columna } = dibujarFija();
    vista.pulsar(familia("García, Isaias"));
    vista.pulsar(columna("Mesa 7"));
    vista.pulsar(familia("Expósito, Rosi"));
    expect(document.body.textContent).toContain("antes aplica o descarta la prueba");
    expect(document.body.textContent).not.toContain("Cambiar y enviar");
    vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Descartar"));
    vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Sí, descartar"));
    vista.pulsar(familia("Expósito, Rosi"));
    expect(document.body.textContent).toContain("Ya tiene su invitación con la mesa 6");
    expect(document.body.textContent).toContain("Cambiar y enviar");
    vista.desmontar();
  });
});

// v98.7 (él): «Sin mesa» se pliega; plegada, se sigue pudiendo dejar ahí una familia.
it("«Sin mesa» se pliega y se despliega; plegada, tocarla deja ahí a la familia cogida", () => {
  const { vista, columna, familia, boton } = dibujar();
  expect(columna("Sin mesa").contains(familia("García, Isaias"))).toBe(true);
  vista.pulsar(boton("Plegar «Sin mesa»"));
  expect(familia("García, Isaias")).toBeNull();
  expect(columna("Sin mesa").textContent).toContain("Sin mesa");
  vista.pulsar(familia("Expósito, Rosi"));
  vista.pulsar(columna("Sin mesa"));
  expect(columna("Mesa 6").contains(familia("Expósito, Rosi"))).toBe(false);
  vista.pulsar(boton("Desplegar «Sin mesa»"));
  expect(columna("Sin mesa").contains(familia("Expósito, Rosi"))).toBe(true);
  vista.desmontar();
});

describe("«Bloquear» una mesa (v101)", () => {
  const conMarca = [
    { numero: 6, capacidad: 2, bloqueada: true },
    { numero: 7, capacidad: 9, bloqueada: false },
  ];
  const casilla = (vista, n) => vista.contenedor.querySelector(`[aria-label="Bloquear la mesa ${n}"]`);

  it("sin el SQL subido (la mesa no trae la marca), no sale la casilla", () => {
    const { vista } = dibujar();
    expect(casilla(vista, 6)).toBeNull();
    vista.desmontar();
  });

  it("marcarla se guarda al momento; bloqueada, ni «Vaciar» ni quitarla", () => {
    const { vista, mesasGuardadas, enMesa } = dibujar({ conMesas: conMarca });
    expect(casilla(vista, 6).checked).toBe(true);
    expect(vista.contenedor.querySelector('[data-columna="Mesa 6"]').textContent).toContain("Bloqueada");
    expect(enMesa(6, "Vaciar").disabled).toBe(true);
    expect(enMesa(6, "Está bloqueada: no se puede quitar").disabled).toBe(true);
    vista.pulsar(casilla(vista, 7));
    expect(mesasGuardadas.at(-1)).toEqual([conMarca[0], { numero: 7, capacidad: 9, bloqueada: true }]);
    vista.desmontar();
  });

  it("nadie sale de ella: lo dice, y la prueba no cambia", () => {
    const { vista, familia, columna } = dibujar({ conMesas: conMarca });
    vista.pulsar(familia("Expósito, Rosi"));
    vista.pulsar(columna("Mesa 7"));
    expect(vista.contenedor.textContent).toContain("La mesa 6 está bloqueada: nadie sale de ella.");
    expect(columna("Mesa 6").textContent).toContain("Expósito, Rosi");
    vista.desmontar();
  });

  it("«Vaciar mesas» se la salta, y la pregunta lo dice", () => {
    const sentados = invitados.map((x) => (x.apellido === "García" ? { ...x, mesa: 7 } : x));
    const { vista, boton, columna } = dibujar({ conMesas: conMarca, lista: sentados });
    vista.pulsar(boton("Vaciar mesas"));
    expect(document.body.textContent).toContain("2 invitados pasan a «Sin mesa»");
    expect(document.body.textContent).toContain("La mesa 6, bloqueada, se queda como está.");
    vista.pulsar(boton("Sí"));
    expect(columna("Mesa 6").textContent).toContain("Expósito, Rosi");
    expect(columna("Mesa 7").textContent).not.toContain("García");
    vista.desmontar();
  });

  it("si la única gente sentada está en una bloqueada, «Vaciar mesas» se apaga", () => {
    const { vista, boton } = dibujar({ conMesas: conMarca });
    expect(boton("Vaciar mesas").disabled).toBe(true);
    vista.desmontar();
  });
});

describe("«Van juntos» (v101.1)", () => {
  // Con la columna en la base: las filas traen `vanJuntos`.
  const orden = { García01: { orden: [], invitacionEnviada: false, invitacionEnviadaEn: null, vanJuntos: null } };
  const elegir = (vista, etiqueta, valor) => vista.elegir(document.body.querySelector(`[aria-label="${etiqueta}"]`), valor);

  it("sin el SQL subido, el botón se apaga y dice por qué", () => {
    const { vista, boton } = dibujar();
    expect(boton("Van juntos").disabled).toBe(true);
    expect(boton("Van juntos").title).toBe("Falta subir el SQL de la versión 101.1");
    vista.desmontar();
  });

  it("juntar guarda la marca y, si la segunda tiene mesa, sienta a la primera con ella en la prueba", () => {
    const { vista, boton, ordenes, columna, familia } = dibujar({ orden, conMesas: [{ numero: 6, capacidad: 5 }, { numero: 7, capacidad: 9 }] });
    vista.pulsar(boton("Van juntos"));
    expect(document.body.textContent).toContain("Todavía no hay familias que vayan juntas.");
    elegir(vista, "La familia que va", "1");
    elegir(vista, "Con qué familia va", "3");
    vista.pulsar(boton("Juntar"));
    const ultima = ordenes.at(-1);
    expect(ultima.García01.vanJuntos).toBeTruthy();
    expect(ultima.Expósito01.vanJuntos).toBe(ultima.García01.vanJuntos);
    expect(document.body.textContent).toContain("Van juntos: García, Isaias y Expósito, Rosi.");
    // En la mesa 6 de Rosi, con la cadena y el número 1.
    expect(columna("Mesa 6").textContent).toContain("García, Isaias");
    expect(familia("García, Isaias").querySelector('[aria-label="Van juntos, grupo 1"]')).not.toBeNull();
    expect(familia("Expósito, Rosi").querySelector('[aria-label="Van juntos, grupo 1"]')).not.toBeNull();
    vista.desmontar();
  });

  it("si no caben juntas, no se juntan y lo dice", () => {
    const { vista, boton, ordenes } = dibujar({ orden });
    vista.pulsar(boton("Van juntos"));
    elegir(vista, "La familia que va", "1");
    elegir(vista, "Con qué familia va", "3");
    vista.pulsar(boton("Juntar"));
    expect(ordenes).toEqual([]);
    expect(document.body.textContent).toContain("van juntos: son 3 y en la mesa 6 solo quedan 1 sitio".replace("quedan 1 sitio", "queda 1 sitio"));
    vista.desmontar();
  });

  it("la X las separa, preguntando antes; nadie cambia de mesa", () => {
    const juntas = { García01: { vanJuntos: "g" }, Expósito01: { vanJuntos: "g" } };
    const { vista, boton, ordenes, guardados } = dibujar({ orden: juntas });
    vista.pulsar(boton("Van juntos"));
    expect(document.body.querySelector('[data-grupo="1"]').textContent).toContain("Expósito, Rosi · García, Isaias");
    vista.pulsar(boton("Separarlas"));
    expect(document.body.textContent).toContain("Expósito, Rosi y García, Isaias dejan de ir juntos. Nadie cambia de mesa.");
    vista.pulsar(boton("Sí"));
    expect(ordenes.at(-1)).toEqual({ García01: { vanJuntos: null }, Expósito01: { vanJuntos: null } });
    expect(guardados).toEqual([]);
    vista.desmontar();
  });
});

describe("«Mesas del local» (v101.2)", () => {
  const LOCAL = [{ sitios: 11, cuantas: 1 }, { sitios: 9, cuantas: 2 }];
  // En la cabecera, tras Confirmados y Sin confirmar (v101.3).
  const cabecera = () => document.body.querySelector("[data-extra-ventana]").textContent;

  it("sin el SQL subido, «Del local» se apaga y dice por qué; sin configurar, sin línea de libres", () => {
    const { vista, boton } = dibujar();
    expect(boton("Del local").disabled).toBe(true);
    expect(boton("Del local").title).toBe("Falta subir el SQL de la versión 101.2");
    expect(cabecera()).not.toContain("Libres");
    vista.desmontar();
  });

  it("abre su ventana; en la cabecera, cuántas quedan libres de cada tamaño", () => {
    const { vista, boton } = dibujar({ evento: { mesasLocal: LOCAL } });
    // La 6 (2 sitios) y la 7 (9) gastan las dos de 9; la de 11, libre.
    expect(cabecera()).toContain("Libres de 111 de 1" + "Libres de 90 de 2");
    vista.pulsar(boton("Del local"));
    expect(document.body.textContent).toContain("Mesas del local");
    vista.desmontar();
  });

  it("el «+» no pasa de lo que tiene el local, y lo dice; sin pasarse, sube", () => {
    const { vista, enMesa, mesasGuardadas } = dibujar({ evento: { mesasLocal: [{ sitios: 9, cuantas: 2 }] } });
    vista.pulsar(enMesa(7, "Un sitio más"));
    expect(document.body.textContent).toContain("La mesa 7 ya tiene 9 sitios: el local no tiene mesas más grandes.");
    expect(mesasGuardadas).toEqual([]);
    vista.pulsar(enMesa(6, "Un sitio más"));
    expect(mesasGuardadas.at(-1).find((m) => m.numero === 6).capacidad).toBe(3);
    vista.desmontar();
  });

  it("«Añadir mesa» la crea del tamaño más grande libre; sin ninguna libre, no, y lo dice", () => {
    const con = dibujar({ evento: { mesasLocal: LOCAL } });
    con.vista.pulsar(con.boton("Añadir mesa"));
    expect(con.mesasGuardadas.at(-1).at(-1)).toEqual({ numero: 8, capacidad: 11 });
    con.vista.desmontar();
    const llenas = dibujar({ evento: { mesasLocal: [{ sitios: 9, cuantas: 2 }] } });
    llenas.vista.pulsar(llenas.boton("Añadir mesa"));
    expect(llenas.mesasGuardadas).toEqual([]);
    expect(document.body.textContent).toContain("El local no tiene más mesas: las 2 ya están puestas.");
    llenas.vista.desmontar();
  });

  it("con más mesas de las que tiene el local, en rojo cuántas faltan", () => {
    const { vista } = dibujar({ evento: { mesasLocal: [{ sitios: 9, cuantas: 1 }] } });
    expect(cabecera()).toContain("Libres de 9falta 1");
    vista.desmontar();
  });
});
