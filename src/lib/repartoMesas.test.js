// v74 (él): probar el reparto moviendo familias enteras; que no deje sentar
// a más de los que caben; y nada se guarda hasta «Aplicar a la Lista».
import { describe, it, expect } from "vitest";
import { conBorrador, familiasParaRepartir, moverFamilia, aplicarBorrador, familiasQueCambian, ocupacion, memoriaDesde, conMemoria, cargarMemoria, vaciarTodasEnBorrador, autoAsignarEnBorrador, moverMesa } from "./repartoMesas";
import { ROL_FAMILIAR } from "./rolFamiliar";

const g = (id, apellido, nombre, rol, extra = {}) => ({ id, apellido, nombre, grupoFamiliar: `${apellido}01`, rolFamiliar: rol, confirmado: true, mesa: null, ...extra });
const invitados = [
  g("1", "García", "Isaias", ROL_FAMILIAR.ESPOSO),
  g("2", "García", "Ana", ROL_FAMILIAR.ESPOSA),
  g("3", "García", "Leo", ROL_FAMILIAR.HIJO),
  g("4", "Expósito", "Rosi", ROL_FAMILIAR.SUELTO, { mesa: 6 }),
  g("5", "Pérez", "Loli", ROL_FAMILIAR.ESPOSA),
  g("6", "Pérez", "Pablo", ROL_FAMILIAR.ESPOSO, { confirmado: false }),
];
const mesas = [
  { numero: 6, capacidad: 3 },
  { numero: 7, capacidad: 10 },
];

describe("familiasParaRepartir", () => {
  it("cada familia con su «O» (o su primer adulto) y cuántos confirmados son", () => {
    const familias = familiasParaRepartir(invitados);
    const garcia = familias.find((f) => f.clave === "garcía01");
    expect(garcia).toMatchObject({ nombre: "García, Isaias", cuantos: 3, mesa: null });
    expect(familias.find((f) => f.clave === "expósito01")).toMatchObject({ nombre: "Expósito, Rosi", cuantos: 1, mesa: 6 });
    // Pablo sin confirmar no cuenta ni da nombre.
    expect(familias.find((f) => f.clave === "pérez01")).toMatchObject({ nombre: "Pérez, Loli", cuantos: 1 });
  });

  // v74.9 (él): el aviso de alergias, en la familia que las tiene.
  it("dice quién de la familia tiene alergias o intolerancias («No» no cuenta)", () => {
    const conAlergias = invitados.map((x) => (x.id === "2" ? { ...x, alergias: "Gluten" } : x.id === "3" ? { ...x, alergias: "No" } : x));
    const familias = familiasParaRepartir(conAlergias);
    expect(familias.find((f) => f.clave === "garcía01").conAlergia.map((x) => x.id)).toEqual(["2"]);
    expect(familias.find((f) => f.clave === "expósito01").conAlergia).toEqual([]);
  });
});

describe("moverFamilia", () => {
  it("la familia entera, solo en el borrador: la Lista no se toca", () => {
    const { borrador, aviso } = moverFamilia(invitados, {}, "1", 7, mesas);
    expect(aviso).toBe("");
    expect(borrador).toEqual({ 1: 7, 2: 7, 3: 7 });
    expect(invitados[0].mesa).toBeNull();
    expect(conBorrador(invitados, borrador).filter((x) => x.mesa === 7)).toHaveLength(3);
  });

  it("no deja sentar a más de los que caben, y dice cuántos sitios quedan", () => {
    const { borrador, aviso } = moverFamilia(invitados, {}, "1", 6, mesas);
    expect(borrador).toEqual({});
    expect(aviso).toContain("son 3");
    expect(aviso).toContain("solo quedan 2 sitios");
  });

  it("volver a su mesa de antes la quita del borrador", () => {
    const { borrador } = moverFamilia(invitados, {}, "4", 7, mesas);
    expect(borrador).toEqual({ 4: 7 });
    expect(moverFamilia(invitados, borrador, "4", 6, mesas).borrador).toEqual({});
  });
});

describe("aplicar", () => {
  it("solo cambian las mesas del borrador; cuenta las familias que cambian", () => {
    const borrador = { 1: 7, 2: 7, 3: 7 };
    const aplicada = aplicarBorrador(invitados, borrador);
    expect(aplicada.filter((x) => x.mesa === 7).map((x) => x.id)).toEqual(["1", "2", "3"]);
    expect(aplicada.find((x) => x.id === "4").mesa).toBe(6);
    expect(familiasQueCambian(invitados, borrador)).toBe(1);
  });
});

// v74.2 (él): «sentar también a los no confirmados para cuadrar con tiempo;
// si desactivo el check, no quitarlos de su asignación: que se sombreen
// hasta confirmar».
describe("los no confirmados", () => {
  const conTentativa = [
    ...invitados,
    g("7", "Luis", "Dani", ROL_FAMILIAR.ESPOSO, { confirmado: false }),
    g("8", "Luis", "Míriam", ROL_FAMILIAR.ESPOSA, { confirmado: false }),
    g("9", "Bravo", "Yeray", ROL_FAMILIAR.SUELTO, { confirmado: false, mesa: 7 }),
    g("10", "Sierra", "Raul", ROL_FAMILIAR.SUELTO, { confirmado: false, noAsiste: true }),
  ];

  it("sin la casilla, solo salen los que ya tienen sitio; con ella, todos menos «No asiste»", () => {
    const sin = familiasParaRepartir(conTentativa).map((f) => f.nombre);
    expect(sin).toContain("Bravo, Yeray");
    expect(sin).not.toContain("Luis, Dani");
    const con = familiasParaRepartir(conTentativa, { conSinConfirmar: true }).map((f) => f.nombre);
    expect(con).toContain("Luis, Dani");
    expect(con).not.toContain("Sierra, Raul");
    expect(familiasParaRepartir(conTentativa, { conSinConfirmar: true }).find((f) => f.nombre === "Luis, Dani").sinConfirmar).toBe(2);
  });

  it("con la casilla se sientan; su sitio cuenta en la mesa", () => {
    const { borrador, aviso } = moverFamilia(conTentativa, {}, "7", 7, mesas, { conSinConfirmar: true });
    expect(aviso).toBe("");
    expect(borrador).toEqual({ 7: 7, 8: 7 });
    expect(ocupacion(conBorrador(conTentativa, borrador), 7)).toBe(3);
  });

  it("sin la casilla, a quien no tiene sitio no se le sienta", () => {
    expect(moverFamilia(conTentativa, {}, "7", 7, mesas).aviso).toContain("todavía no está confirmado");
  });
});

// v75 (él): «Acomodación 1, 2 y 3», una memoria de todo lo de la acomodación.
describe("las memorias", () => {
  const sentados = invitados.map((x) => (["1", "2", "3"].includes(x.id) ? { ...x, mesa: 7 } : x));
  const memoria = memoriaDesde(sentados, mesas, 1, "2026-10-28T10:00:00Z");

  it("guarda las mesas y la mesa de cada invitado, también la de quien no tiene", () => {
    expect(memoria.mesas).toEqual(mesas);
    expect(memoria.asientos).toMatchObject({ 1: 7, 2: 7, 3: 7, 4: 6, 5: null });
  });

  it("guardar en un número sustituye lo que había en él", () => {
    const otra = { ...memoria, guardadaEl: "otra" };
    expect(conMemoria([memoria, { ...memoria, numero: 3 }], otra).map((m) => [m.numero, m.guardadaEl])).toEqual([
      [1, "otra"],
      [3, "2026-10-28T10:00:00Z"],
    ]);
  });

  it("cargarla la deja como prueba: sus mesas y el borrador hasta sus asientos", () => {
    const { mesas: suyas, borrador, aviso } = cargarMemoria(invitados, memoria);
    expect(suyas).toEqual(mesas);
    expect(borrador).toEqual({ 1: 7, 2: 7, 3: 7 });
    expect(aviso).toBe("");
  });

  it("quien llegó después se sienta con su familia; quien se borró, ya no está", () => {
    const despues = [...invitados.filter((x) => x.id !== "5"), g("9", "García", "Nuevo", ROL_FAMILIAR.HIJO)];
    const { borrador, aviso } = cargarMemoria(despues, memoria);
    expect(borrador["9"]).toBe(7);
    expect(borrador).not.toHaveProperty("5");
    expect(aviso).toContain("Hay 1 invitado nuevo");
  });

  it("una mesa que la memoria no tiene se queda vacía al cargarla", () => {
    const sinLa6 = { ...memoria, mesas: mesas.filter((m) => m.numero !== 6), asientos: { ...memoria.asientos, 4: 6 } };
    expect(cargarMemoria(invitados, sinLa6).borrador["4"]).toBe(null);
  });
});

// v75.1 (él): «autoasignar siempre todos» y «vaciar todas las mesas».
describe("Auto-asignar y Vaciar mesas, en la prueba", () => {
  it("Auto-asignar sienta también a los que aún no han confirmado, nunca a los «No asiste»", () => {
    const conDudas = [...invitados, g("7", "Luis", "Dani", ROL_FAMILIAR.SUELTO, { confirmado: false, noAsiste: true })];
    const { borrador } = autoAsignarEnBorrador(conDudas, {}, mesas);
    // Pablo (Pérez), sin confirmar: con su familia.
    expect(borrador["6"]).toBe(borrador["5"]);
    expect(borrador["6"]).not.toBe(undefined);
    expect(borrador).not.toHaveProperty("7");
  });

  it("Vaciar mesas deja a todos sin mesa, también lo que ya estaba en la prueba", () => {
    const borrador = vaciarTodasEnBorrador(invitados, { 1: 7 });
    expect(conBorrador(invitados, borrador).every((x) => x.mesa == null)).toBe(true);
    expect(borrador).toEqual({ 4: null });
  });
});

describe("cambiar una mesa de orden (v83)", () => {
  const persona = (id, mesa) => g(id, `Fam${id}`, "X", ROL_FAMILIAR.SUELTO, { mesa });
  const lista = [persona("a", 1), persona("b", 2), persona("c", 3), persona("d", 4), persona("e", null)];
  const cuatro = [
    { numero: 1, capacidad: 10, posX: 1, posY: 1 },
    { numero: 2, capacidad: 8, posX: 2, posY: 2 },
    { numero: 3, capacidad: 6, posX: 3, posY: 3 },
    { numero: 4, capacidad: 12, posX: 4, posY: 4 },
  ];

  it("la 4 sobre la 2: ocupa su lugar, las demás se corren y se llevan a su gente, sus sitios y su sitio en el plano", () => {
    const { mesas, borrador } = moverMesa(lista, {}, cuatro, 4, 2);
    expect(mesas).toEqual([
      { numero: 1, capacidad: 10, posX: 1, posY: 1 },
      { numero: 2, capacidad: 12, posX: 4, posY: 4 },
      { numero: 3, capacidad: 8, posX: 2, posY: 2 },
      { numero: 4, capacidad: 6, posX: 3, posY: 3 },
    ]);
    expect(borrador).toEqual({ d: 2, b: 3, c: 4 });
  });

  it("hacia atrás: la 1 sobre la 3", () => {
    const { mesas, borrador } = moverMesa(lista, {}, cuatro, 1, 3);
    expect(mesas.map((m) => m.capacidad)).toEqual([8, 6, 10, 12]);
    expect(borrador).toEqual({ b: 1, c: 2, a: 3 });
  });

  it("sobre lo que ya hay en la prueba, y sin dar por sentado a quien no tiene mesa", () => {
    const { borrador } = moverMesa(lista, { e: 1 }, cuatro, 1, 2);
    expect(borrador).toEqual({ e: 2, a: 2, b: 1 });
  });

  it("con huecos en la numeración, quedan 1, 2, 3", () => {
    const conHuecos = [{ numero: 2, capacidad: 5 }, { numero: 5, capacidad: 6 }, { numero: 9, capacidad: 7 }];
    const gente = [persona("a", 2), persona("b", 5), persona("c", 9)];
    const { mesas, borrador } = moverMesa(gente, {}, conHuecos, 9, 2);
    expect(mesas).toEqual([{ numero: 1, capacidad: 7 }, { numero: 2, capacidad: 5 }, { numero: 3, capacidad: 6 }]);
    expect(borrador, "la de la 2 sigue en la 2: no cambia").toEqual({ c: 1, b: 3 });
  });

  it("sobre sí misma, o una mesa que no existe: no cambia nada", () => {
    const borrador = { e: 1 };
    expect(moverMesa(lista, borrador, cuatro, 2, 2)).toEqual({ borrador, mesas: cuatro });
    expect(moverMesa(lista, borrador, cuatro, 2, 2).mesas).toBe(cuatro);
    expect(moverMesa(lista, borrador, cuatro, 99, 2).mesas).toBe(cuatro);
  });
});
