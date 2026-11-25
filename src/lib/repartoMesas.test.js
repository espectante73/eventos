// v74 (él): probar el reparto moviendo familias enteras; que no deje sentar
// a más de los que caben; y nada se guarda hasta «Aplicar a la Lista».
import { describe, it, expect } from "vitest";
import { conBorrador, familiasParaRepartir, moverFamilia, aplicarBorrador, familiasQueCambian, ocupacion, memoriaDesde, conMemoria, cargarMemoria, vaciarTodasEnBorrador, autoAsignarEnBorrador, moverMesa, vaciarMesaEnBorrador, fijosEnMesa, quitarMesaRenumerando, cifraFamilia, anchoColumnas, mesaBloqueada, conBloqueo, gruposJuntos, juntarFamilias, separarJuntos, grupoJuntos } from "./repartoMesas";
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
    expect(moverMesa(lista, borrador, cuatro, 2, 2)).toEqual({ borrador, mesas: cuatro, aviso: "" });
    expect(moverMesa(lista, borrador, cuatro, 2, 2).mesas).toBe(cuatro);
    expect(moverMesa(lista, borrador, cuatro, 99, 2).mesas).toBe(cuatro);
  });
});

describe("con la invitación enviada, la mesa queda fija (v83.1)", () => {
  const persona = (id, familia, mesa) => g(id, familia, "X", ROL_FAMILIAR.SUELTO, { mesa });
  const lista = [persona("a", "Fija", 1), persona("b", "Libre", 1), persona("c", "Otra", 2), persona("d", "Sentar", null)];
  const orden = { Fija01: { invitacionEnviada: true } };
  const dos = [{ numero: 1, capacidad: 10 }, { numero: 2, capacidad: 10 }, { numero: 3, capacidad: 10 }];

  it("no se mueve, y lo dice", () => {
    const { borrador, aviso } = moverFamilia(lista, {}, "a", 2, dos, { ordenFamiliares: orden });
    expect(borrador).toEqual({});
    expect(aviso).toContain("ya tiene su invitación con la mesa 1");
  });

  it("las demás se mueven como siempre", () => {
    expect(moverFamilia(lista, {}, "b", 2, dos, { ordenFamiliares: orden }).borrador).toEqual({ b: 2 });
  });

  it("«Vaciar» y «Vaciar mesas» la dejan donde está", () => {
    expect(vaciarMesaEnBorrador(lista, {}, 1, orden)).toEqual({ b: null });
    expect(vaciarTodasEnBorrador(lista, {}, orden)).toEqual({ b: null, c: null });
    expect(fijosEnMesa(lista, 1, orden)).toBe(1);
  });

  it("una mesa con invitaciones enviadas no cambia de número: no se mueve nada y dice cuál", () => {
    const r = moverMesa(lista, {}, dos, 3, 1, orden);
    expect(r.mesas).toBe(dos);
    expect(r.aviso).toContain("la mesa 1 tiene invitaciones enviadas");
  });

  it("las que no cambian de número se pueden reordenar", () => {
    const r = moverMesa(lista, {}, dos, 3, 2, orden);
    expect(r.aviso).toBe("");
    expect(r.borrador).toEqual({ c: 3 });
  });

  it("si recibió la invitación con una prueba a medias, «Aplicar» no la mueve", () => {
    const final = aplicarBorrador(lista, { a: 2, b: 2 }, orden);
    expect(final.find((x) => x.id === "a").mesa).toBe(1);
    expect(final.find((x) => x.id === "b").mesa).toBe(2);
  });

  it("una memoria no la mueve, aunque diga otra cosa o no tenga su mesa", () => {
    const memoria = { numero: 1, mesas: [{ numero: 2, capacidad: 8 }], asientos: { a: 2, b: 2, c: 2, d: null } };
    const { mesas, borrador } = cargarMemoria(lista, memoria, { ordenFamiliares: orden, mesasReales: dos });
    expect(borrador.a).toBeUndefined();
    expect(mesas.map((m) => m.numero).sort()).toEqual([1, 2]);
  });

  it("una familia sin invitación enviada o sin mesa no está fija", () => {
    expect(moverFamilia(lista, {}, "d", 2, dos, { ordenFamiliares: { Sentar01: { invitacionEnviada: true } } }).aviso).toBe("");
  });
});

// v98.4 (él): «al ordenar o mover las mesas se renumeran»; al quitar la 1
// quedaban empezando por la 2.
describe("quitarMesaRenumerando", () => {
  const persona = (id, familia, mesa) => g(id, familia, "X", ROL_FAMILIAR.SUELTO, { mesa });
  const tres = [
    { numero: 1, capacidad: 10, posX: 1, posY: 1 },
    { numero: 2, capacidad: 8, posX: 2, posY: 2 },
    { numero: 3, capacidad: 6, posX: 3, posY: 3 },
  ];
  const lista = [persona("a", "Uno", 1), persona("b", "Dos", 2), persona("c", "Tres", 3), persona("d", "Nadie", null)];

  it("quitar la 1: las demás bajan un número con su gente, sus sitios y su lugar en el plano; los de la 1, sin mesa", () => {
    const { invitados, mesas, aviso } = quitarMesaRenumerando(lista, tres, 1);
    expect(aviso).toBe("");
    expect(mesas).toEqual([
      { numero: 1, capacidad: 8, posX: 2, posY: 2 },
      { numero: 2, capacidad: 6, posX: 3, posY: 3 },
    ]);
    expect(invitados.map((x) => x.mesa)).toEqual([null, 1, 2, null]);
    expect(invitados[3], "quien no cambia, el mismo objeto").toBe(lista[3]);
  });
  it("con huecos de antes, también los cierra", () => {
    const conHuecos = [{ numero: 2, capacidad: 5 }, { numero: 5, capacidad: 6 }, { numero: 9, capacidad: 7 }];
    const { invitados, mesas } = quitarMesaRenumerando([persona("a", "A", 5), persona("b", "B", 9)], conHuecos, 2);
    expect(mesas.map((m) => m.numero)).toEqual([1, 2]);
    expect(invitados.map((x) => x.mesa)).toEqual([1, 2]);
  });
  it("una mesa que no existe: nada cambia", () => {
    expect(quitarMesaRenumerando(lista, tres, 9)).toEqual({ invitados: lista, mesas: tres, aviso: "" });
  });
  it("con invitaciones enviadas: ni la suya se quita, ni se quita otra que le cambie el número", () => {
    const orden = { Dos01: { invitacionEnviada: true } };
    expect(quitarMesaRenumerando(lista, tres, 2, orden)).toMatchObject({ invitados: lista, mesas: tres, aviso: "No se puede: la mesa 2 tiene invitaciones enviadas." });
    expect(quitarMesaRenumerando(lista, tres, 1, orden).aviso).toBe("No se puede: la mesa 2 tiene invitaciones enviadas y cambiaría de número.");
    // La última sí: no cambia el número de nadie.
    expect(quitarMesaRenumerando(lista, tres, 3, orden).mesas.map((m) => m.numero)).toEqual([1, 2]);
  });
});

// v98.7 (él): «que el ancho del recuadro de las mesas corresponda al largo
// del nombre más largo».
describe("anchoColumnas", () => {
  const f = (nombre, extra = {}) => ({ nombre, cuantos: 2, sinConfirmar: 0, conAlergia: [], representante: { zona: "" }, ...extra });
  const medidas = { medirNombre: (t, negrita) => t.length * (negrita ? 8 : 7), medirCifra: (t) => t.length * 9, icono: 20, fijo: 60, minimo: 212 };
  it("el del nombre más largo, con su cifra, sus iconos y los márgenes", () => {
    const largo = "Hernández Gonçalves, María del Carmen";
    expect(anchoColumnas([f("Sosa, Ana"), f(largo, { fija: true, conAlergia: [{}] })], medidas)).toBe(largo.length * 7 + 9 + 20 + 20 + 60);
  });
  it("nunca menos que la cabecera de la mesa; sin familias, ese mínimo", () => {
    expect(anchoColumnas([f("Sosa, Ana")], medidas)).toBe(212);
    expect(anchoColumnas([], medidas)).toBe(212);
  });
  it("la cifra, como en la pastilla: con parte sin confirmar, «2+1»", () => {
    expect(cifraFamilia(f("A", { cuantos: 3, sinConfirmar: 1 }))).toBe("2+1");
    expect(cifraFamilia(f("A", { cuantos: 3, sinConfirmar: 3 }))).toBe("3");
    expect(cifraFamilia(f("A"))).toBe("2");
  });
});

describe("una mesa bloqueada (v101)", () => {
  const conLa6 = conBloqueo(mesas, 6, true);

  it("se marca y se desmarca, sin tocar las demás", () => {
    expect(conLa6).toEqual([{ numero: 6, capacidad: 3, bloqueada: true }, { numero: 7, capacidad: 10 }]);
    expect(mesaBloqueada(conLa6, 6)).toBe(true);
    expect(mesaBloqueada(conLa6, 7)).toBe(false);
    expect(mesaBloqueada(conLa6, null)).toBe(false);
    expect(mesaBloqueada(conBloqueo(conLa6, 6, false), 6)).toBe(false);
  });

  it("nadie sale de ella, y lo dice", () => {
    const { borrador, aviso } = moverFamilia(invitados, {}, "4", 7, conLa6);
    expect(borrador).toEqual({});
    expect(aviso).toBe("La mesa 6 está bloqueada: nadie sale de ella. Desmarca «Bloqueada» para cambiarla.");
    expect(moverFamilia(invitados, {}, "4", null, conLa6).aviso).toContain("bloqueada");
  });

  it("sus huecos libres sí se llenan, a mano y con Auto-asignar", () => {
    const pareja = [...invitados.filter((x) => x.id === "4"), g("8", "Luz", "Mar", ROL_FAMILIAR.ESPOSA), g("9", "Luz", "Sol", ROL_FAMILIAR.ESPOSO)];
    expect(moverFamilia(pareja, {}, "8", 6, conLa6)).toEqual({ borrador: { 8: 6, 9: 6 }, aviso: "" });
    expect(autoAsignarEnBorrador(pareja, {}, [conLa6[0]]).borrador).toEqual({ 8: 6, 9: 6 });
  });

  it("«Vaciar» no la vacía, y «Vaciar mesas» se la salta", () => {
    const sentados = { 1: 7, 2: 7, 3: 7 };
    expect(vaciarMesaEnBorrador(invitados, sentados, 6, undefined, conLa6)).toBe(sentados);
    const borrador = vaciarTodasEnBorrador(invitados, sentados, undefined, conLa6);
    expect(borrador).toEqual({});
    expect(conBorrador(invitados, borrador).find((x) => x.id === "4").mesa).toBe(6);
  });

  it("no se puede quitar", () => {
    expect(quitarMesaRenumerando(invitados, conLa6, 6)).toEqual({ invitados, mesas: conLa6, aviso: "No se puede: la mesa 6 está bloqueada." });
  });

  it("cambia de orden con su gente y su marca", () => {
    const { mesas: nuevas } = moverMesa(invitados, {}, conLa6, 6, 7);
    expect(nuevas).toEqual([{ numero: 1, capacidad: 10 }, { numero: 2, capacidad: 3, bloqueada: true }]);
  });
});

describe("«Van juntos» (v101.1)", () => {
  // García (3), Expósito (1, mesa 6), Pérez (Loli; Pablo sin confirmar).
  const tres = [
    { numero: 6, capacidad: 3 },
    { numero: 7, capacidad: 10 },
    { numero: 8, capacidad: 4 },
  ];
  const ids = () => "g1";

  it("juntar marca las dos familias con el mismo código, sin tocar lo demás de cada una", () => {
    const orden = { García01: { orden: ["2", "1"], invitacionEnviada: false, invitacionEnviadaEn: null } };
    const { ordenFamiliares, borrador, aviso } = juntarFamilias(invitados, {}, "1", "5", tres, { ordenFamiliares: orden, nuevoId: ids });
    expect(aviso).toBe("");
    expect(borrador).toEqual({});
    expect(ordenFamiliares.García01).toEqual({ orden: ["2", "1"], invitacionEnviada: false, invitacionEnviadaEn: null, vanJuntos: "g1" });
    expect(ordenFamiliares.Pérez01).toEqual({ orden: [], invitacionEnviada: false, invitacionEnviadaEn: null, vanJuntos: "g1" });
    expect(grupoJuntos(invitados[0], ordenFamiliares)).toBe("g1");
  });

  it("si la segunda tiene mesa, la primera se sienta con ella, en la prueba", () => {
    const { borrador, aviso } = juntarFamilias(invitados, {}, "5", "4", tres, { nuevoId: ids });
    expect(aviso).toBe("");
    expect(borrador).toEqual({ 5: 6 });
  });

  it("si no caben juntas, no se junta nada y se dice con la cifra", () => {
    const { ordenFamiliares, borrador, aviso } = juntarFamilias(invitados, {}, "1", "4", tres, { nuevoId: ids });
    expect(ordenFamiliares).toEqual({});
    expect(borrador).toEqual({});
    expect(aviso).toBe("García, Isaias y Expósito, Rosi van juntos: son 4 y en la mesa 6 solo quedan 2 sitios. Sube la capacidad de la mesa o elige otra.");
  });

  it("la misma familia, o dos que ya van juntas: lo dice", () => {
    expect(juntarFamilias(invitados, {}, "1", "2", tres).aviso).toBe("Es la misma familia: ya se sientan juntos.");
    const orden = { García01: { vanJuntos: "g1" }, Pérez01: { vanJuntos: "g1" } };
    expect(juntarFamilias(invitados, {}, "1", "5", tres, { ordenFamiliares: orden }).aviso).toBe("Ya van juntos.");
  });

  it("juntar con una que ya iba con otra: un solo grupo", () => {
    const orden = { García01: { vanJuntos: "a" }, Pérez01: { vanJuntos: "a" } };
    // Expósito tiene mesa (la 6) y la otra no: el grupo entero se sienta en la suya.
    const { ordenFamiliares, borrador, aviso } = juntarFamilias(invitados, {}, "4", "5", [{ numero: 6, capacidad: 10 }], { ordenFamiliares: orden, nuevoId: ids });
    expect(aviso).toBe("");
    expect([ordenFamiliares.García01.vanJuntos, ordenFamiliares.Pérez01.vanJuntos, ordenFamiliares.Expósito01.vanJuntos]).toEqual(["a", "a", "a"]);
    expect(borrador).toEqual({ 1: 6, 2: 6, 3: 6, 5: 6 });
  });

  it("mover una mueve el grupo entero; si no caben, nada", () => {
    const orden = { García01: { vanJuntos: "g1" }, Pérez01: { vanJuntos: "g1" } };
    // Como en la ventana: también los que aún no han confirmado (Pablo).
    const opciones = { ordenFamiliares: orden, conSinConfirmar: true };
    expect(moverFamilia(invitados, {}, "5", 7, tres, opciones)).toEqual({ borrador: { 1: 7, 2: 7, 3: 7, 5: 7, 6: 7 }, aviso: "" });
    const { borrador, aviso } = moverFamilia(invitados, {}, "1", 8, tres, opciones);
    expect(borrador).toEqual({});
    expect(aviso).toBe("García, Isaias y Pérez, Pablo van juntos: son 5 y en la mesa 8 solo quedan 4 sitios. Sube la capacidad de la mesa o elige otra.");
    // A «Sin mesa», también juntas.
    expect(moverFamilia(invitados, { 1: 7, 2: 7, 3: 7, 5: 7, 6: 7 }, "1", null, tres, opciones).borrador).toEqual({});
  });

  it("de una mesa bloqueada no sale nadie del grupo", () => {
    const orden = { Expósito01: { vanJuntos: "g1" }, Pérez01: { vanJuntos: "g1" } };
    const { aviso } = moverFamilia(invitados, {}, "5", 7, conBloqueo(tres, 6, true), { ordenFamiliares: orden });
    expect(aviso).toContain("La mesa 6 está bloqueada");
  });

  it("Auto-asignar las sienta juntas", () => {
    const orden = { García01: { vanJuntos: "g1" }, Pérez01: { vanJuntos: "g1" } };
    const { borrador } = autoAsignarEnBorrador(invitados, {}, [{ numero: 6, capacidad: 2 }, { numero: 7, capacidad: 10 }], orden);
    expect(new Set(["1", "2", "3", "5", "6"].map((id) => borrador[id]))).toEqual(new Set([7]));
  });

  it("los grupos, numerados por su primera familia; uno que se quedó solo no cuenta", () => {
    const orden = { Pérez01: { vanJuntos: "b" }, García01: { vanJuntos: "b" }, Expósito01: { vanJuntos: "c" } };
    const grupos = gruposJuntos(familiasParaRepartir(invitados, { ordenFamiliares: orden }), orden);
    expect(grupos.map((gr) => [gr.numero, gr.id, gr.familias.map((f) => f.nombre)])).toEqual([[1, "b", ["García, Isaias", "Pérez, Loli"]]]);
  });

  it("separar deja a cada una por su cuenta, sin tocar lo demás", () => {
    const orden = { García01: { orden: ["1"], vanJuntos: "b" }, Pérez01: { vanJuntos: "b" }, Otra01: { vanJuntos: "c" } };
    expect(separarJuntos(orden, "b")).toEqual({ García01: { orden: ["1"], vanJuntos: null }, Pérez01: { vanJuntos: null }, Otra01: { vanJuntos: "c" } });
  });
});
