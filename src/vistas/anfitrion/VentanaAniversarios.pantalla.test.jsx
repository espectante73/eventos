// Aniversarios (v71.1, él): dos botones para bajar las originales, «Todas»
// y «Nuevas», que cuenta solo las que aún no tienen foto en Aniversario.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { ROL_FAMILIAR } from "../../lib/rolFamiliar";

// Sin almacén de verdad: los enlaces temporales no hacen falta aquí.
vi.mock("../../lib/fotosAlmacen", async (original) => ({ ...(await original()), enlacesTemporales: async () => ({}) }));
const { VentanaAniversarios } = await import("./VentanaAniversarios");

const g = (id, nombre, familia, rol) => ({ id, nombre, apellido: familia, grupoFamiliar: `${familia}01`, rolFamiliar: rol, anioBoda: "2010", confirmado: true });
const invitados = [
  g("1", "Adriano", "Martíni", ROL_FAMILIAR.ESPOSO),
  g("2", "Rosi", "Martíni", ROL_FAMILIAR.ESPOSA),
  g("3", "Emiliano", "Medina", ROL_FAMILIAR.ESPOSO),
  g("4", "Ana", "Medina", ROL_FAMILIAR.ESPOSA),
];

it("«Todas» y «Nuevas (1)»: la que ya tiene su foto en Aniversario no cuenta", () => {
  const vista = montar(
    <VentanaAniversarios
      data={{
        invitados,
        evento: { fecha: "2026-12-11" },
        fotosFamiliares: { Martíni01: "boda/martini01.jpg", Medina01: "boda/medina01.jpg" },
        fotosAniversario: { Medina01: "aniversario/medina01.jpg" },
        fotosBodaFinal: {},
        fotosSinBoda: {},
        persistFotosAniversario: () => {},
        persistFotosBodaFinal: () => {},
      }}
      onCerrar={() => {}}
    />
  );
  const textos = [...document.body.querySelectorAll("button")].map((b) => b.textContent.trim());
  expect(textos).toContain("Todas");
  expect(textos).toContain("Nuevas (1)");
  // Las cuentas (v71.4): matrimonios, con foto en Aniversario y las que faltan.
  expect(document.body.textContent).toMatch(/Matrimonios\s*2/);
  expect(document.body.textContent).toMatch(/Aniversario\s*1/);
  expect(document.body.textContent).toMatch(/Faltan\s*1/);
  vista.desmontar();
});

// v71.2: la hoja de encargo de «Nuevas» es solo de las que se descargan; las
// que aún esperan su foto de boda no la impiden.
it("«Nuevas» trae su hoja de encargo aunque otros matrimonios esperen su foto", async () => {
  const { act } = await import("react");
  const descargas = [];
  const espera = [g("5", "Jesús", "Ramírez", ROL_FAMILIAR.ESPOSO), g("6", "Paulina", "Ramírez", ROL_FAMILIAR.ESPOSA)];
  const vista = montar(
    <VentanaAniversarios
      data={{
        invitados: [...invitados, ...espera],
        evento: { fecha: "2026-12-11" },
        fotosFamiliares: { Martíni01: "data:image/jpeg;base64,eA==", Medina01: "boda/medina01.jpg" },
        fotosAniversario: { Medina01: "aniversario/medina01.jpg" },
        fotosBodaFinal: {},
        fotosSinBoda: {},
        persistFotosAniversario: () => {},
        persistFotosBodaFinal: () => {},
      }}
      onCerrar={() => {}}
    />
  );
  const original = URL.createObjectURL;
  const fetchOriginal = globalThis.fetch;
  URL.createObjectURL = (blob) => (descargas.push(blob), "blob:prueba");
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
  const nuevas = [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Nuevas (1)");
  await act(async () => nuevas.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await act(async () => {});
  expect(document.body.textContent).not.toContain("Faltan datos por recoger");
  expect(descargas).toHaveLength(1);
  const texto = new TextDecoder().decode(new Uint8Array(await descargas[0].arrayBuffer()));
  expect(texto).toContain("Hoja de encargo.txt");
  expect(texto).toContain("Martíni01 - Adriano y Rosi - 2010.jpg");
  URL.createObjectURL = original;
  globalThis.fetch = fetchOriginal;
  vista.desmontar();
});

it("solo los confirmados (v71.3): una pareja sin confirmar no sale", () => {
  const sinConfirmar = [
    { ...g("7", "Luis", "Gil", ROL_FAMILIAR.ESPOSO), confirmado: false },
    { ...g("8", "Eva", "Gil", ROL_FAMILIAR.ESPOSA), confirmado: false },
  ];
  const vista = montar(
    <VentanaAniversarios
      data={{
        invitados: [...invitados, ...sinConfirmar],
        evento: { fecha: "2026-12-11" },
        fotosFamiliares: {},
        fotosAniversario: {},
        fotosBodaFinal: {},
        fotosSinBoda: {},
        persistFotosAniversario: () => {},
        persistFotosBodaFinal: () => {},
      }}
      onCerrar={() => {}}
    />
  );
  expect(document.body.textContent).toContain("Adriano y Rosi");
  expect(document.body.textContent).not.toContain("Luis y Eva");
  vista.desmontar();
});

// v71.5 (él): un filtro debajo de Boda y otro debajo de Aniv., con la cifra
// en cada opción, como en la Lista. «Faltan» cuenta lo mismo que el recuadro.
it("los filtros: Boda «Con» + Aniv. «Faltan» deja las que se pueden montar ya", () => {
  const espera = [g("5", "Jesús", "Ramírez", ROL_FAMILIAR.ESPOSO), g("6", "Paulina", "Ramírez", ROL_FAMILIAR.ESPOSA)];
  const vista = montar(
    <VentanaAniversarios
      data={{
        invitados: [...invitados, ...espera],
        evento: { fecha: "2026-12-11" },
        fotosFamiliares: { Martíni01: "boda/martini01.jpg", Medina01: "boda/medina01.jpg" },
        fotosAniversario: { Medina01: "aniversario/medina01.jpg" },
        fotosBodaFinal: {},
        fotosSinBoda: {},
        persistFotosAniversario: () => {},
        persistFotosBodaFinal: () => {},
      }}
      onCerrar={() => {}}
    />
  );
  const [boda, aniv] = document.body.querySelectorAll("select");
  const opciones = (s) => [...s.options].map((o) => o.textContent);
  expect(opciones(boda)).toEqual(["Todas", "Con (2)", "Sin (1)"]);
  expect(opciones(aniv)).toEqual(["Todas", "Hechas (1)", "Faltan (2)"]);
  const salen = () => ["Adriano y Rosi", "Emiliano y Ana", "Jesús y Paulina"].filter((n) => document.body.textContent.includes(n));

  vista.elegir(aniv, "faltan");
  expect(salen()).toEqual(["Adriano y Rosi", "Jesús y Paulina"]);
  vista.elegir(boda, "con");
  expect(salen()).toEqual(["Adriano y Rosi"]);
  vista.elegir(boda, "sin");
  expect(salen()).toEqual(["Jesús y Paulina"]);
  vista.elegir(aniv, "hechas");
  expect(salen()).toEqual([]);
  expect(document.body.textContent).toContain("Ningún matrimonio con estos filtros.");
  vista.desmontar();
});

// v82.1 (él): las de Aniversario, todas en un ZIP desde su columna y una desde
// su vista en grande; las dos solo en el ordenador.
describe("descargar las fotos de Aniversario", () => {
  const foto = "data:image/jpeg;base64,eA==";
  const datos = {
    invitados,
    evento: { fecha: "2026-12-11" },
    fotosFamiliares: {},
    fotosAniversario: { Martíni01: foto, Medina01: foto },
    fotosBodaFinal: {},
    fotosSinBoda: {},
    persistFotosAniversario: () => {},
    persistFotosBodaFinal: () => {},
  };
  const botones = () => [...document.body.querySelectorAll("button")];
  const todas = () => botones().find((b) => (b.title || "").startsWith("Descargar en un solo archivo las 2 fotos de aniversario"));
  const clic = async (b) => {
    const { act } = await import("react");
    await act(async () => b.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    await act(async () => {});
  };
  let descargas, original, fetchOriginal, matchOriginal;
  beforeEach(() => {
    descargas = [];
    original = URL.createObjectURL;
    fetchOriginal = globalThis.fetch;
    matchOriginal = window.matchMedia;
    URL.createObjectURL = (blob) => (descargas.push(blob), "blob:prueba");
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
  });
  afterEach(() => {
    URL.createObjectURL = original;
    globalThis.fetch = fetchOriginal;
    window.matchMedia = matchOriginal;
  });

  it("en el ordenador: ⬇ en «Aniv.» baja todas en un ZIP con su nombre y avisa dónde está", async () => {
    const vista = montar(<VentanaAniversarios data={datos} onCerrar={() => {}} />);
    await clic(todas());
    expect(descargas).toHaveLength(1);
    const zip = new TextDecoder().decode(new Uint8Array(await descargas[0].arrayBuffer()));
    expect(zip).toContain("Martíni01 - Adriano y Rosi - 2010.jpg");
    expect(zip).toContain("Medina01 - Emiliano y Ana - 2010.jpg");
    expect(document.body.textContent).toContain("Fotos de aniversario.zip (2 fotos)");
    expect(document.body.textContent).toContain("carpeta de Descargas");
    vista.desmontar();
  });

  it("en el ordenador: en grande, «Descargar» baja esa foto sola", async () => {
    const vista = montar(<VentanaAniversarios data={datos} onCerrar={() => {}} />);
    await clic(botones().find((b) => b.title === "Aniversario — ver en grande"));
    await clic(botones().find((b) => b.textContent.trim() === "Descargar"));
    expect(descargas).toHaveLength(1);
    expect(descargas[0].type).toBe("image/jpeg");
    expect(document.body.textContent).toMatch(/- Adriano y Rosi - 2010\.jpg|- Emiliano y Ana - 2010\.jpg/);
    vista.desmontar();
  });

  it("en el ordenador: en grande, Boda también tiene «Descargar», y la de plantilla lo dice en el nombre (v82.3)", async () => {
    const conBoda = { ...datos, fotosFamiliares: { Martíni01: foto }, fotosBodaFinal: { Martíni01: foto } };
    const vista = montar(<VentanaAniversarios data={conBoda} onCerrar={() => {}} />);
    await clic(botones().find((b) => b.title === "Boda — ver en grande"));
    await clic(botones().find((b) => b.textContent.trim() === "Descargar"));
    expect(descargas).toHaveLength(1);
    expect(document.body.textContent, "abre con la de plantilla").toContain("Martíni01 - Adriano y Rosi - 2010 - con plantilla.jpg");
    await clic(botones().find((b) => b.textContent.trim() === "Entendido"));
    await clic(botones().find((b) => b.textContent.trim() === "Ver original"));
    await clic(botones().find((b) => b.textContent.trim() === "Descargar"));
    expect(descargas).toHaveLength(2);
    expect(document.body.textContent).toContain("Martíni01 - Adriano y Rosi - 2010.jpg");
    vista.desmontar();
  });

  it("en el móvil no salen: ni ⬇ ni «Descargar»", async () => {
    window.matchMedia = (q) => ({ matches: q.includes("pointer: coarse"), addEventListener() {}, removeEventListener() {} });
    const vista = montar(<VentanaAniversarios data={datos} onCerrar={() => {}} />);
    expect(todas()).toBeUndefined();
    await clic(botones().find((b) => b.title === "Aniversario — ver en grande"));
    expect(botones().map((b) => b.textContent.trim())).not.toContain("Descargar");
    vista.desmontar();
  });
});

// v82.2 (él): «es un lío abrir y cerrar»: ← → o ‹ › sin cerrar la foto.
describe("pasar por las fotos en grande", () => {
  const foto = "data:image/jpeg;base64,eA==";
  const datos = {
    invitados,
    evento: { fecha: "2026-12-11" },
    fotosFamiliares: { Martíni01: foto },
    fotosAniversario: { Martíni01: foto, Medina01: foto },
    fotosBodaFinal: {},
    fotosSinBoda: {},
    persistFotosAniversario: () => {},
    persistFotosBodaFinal: () => {},
  };
  const botones = () => [...document.body.querySelectorAll("button")];
  const tecla = async (key) => {
    const { act } = await import("react");
    await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })));
  };
  const clic = async (b) => {
    const { act } = await import("react");
    await act(async () => b.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  };
  const titulo = () => document.body.textContent.match(/Aniversario — \S+ — (Adriano y Rosi|Emiliano y Ana)/)?.[1];

  it("la cabecera lleva los datos del panel dorado, para cotejarlos con el sello (v84.4)", async () => {
    const vista = montar(<VentanaAniversarios data={datos} onCerrar={() => {}} />);
    await clic(botones().find((b) => b.title === "Aniversario — ver en grande"));
    expect([...document.body.querySelectorAll("h3")].some((h) => /^Aniversario — Martíni01 — Adriano y Rosi$|^Aniversario — Medina01 — Emiliano y Ana$/.test(h.textContent.trim()))).toBe(true);
    expect([...document.body.querySelectorAll("[data-extra-ventana]")].at(-1).textContent).toContain("2010 · 16 años");
    // Sobre negro y sin marco, como en la pantalla del local (v84.5).
    const visor = document.body.querySelector("[data-visor-foto]");
    expect(visor.style.background).toBe("rgb(0, 0, 0)");
    expect(visor.style.padding).toBe("");
    vista.desmontar();
  });

  it("Aniversario: → pasa a la siguiente, ‹ vuelve, y al final da la vuelta; dice «N de M»", async () => {
    const vista = montar(<VentanaAniversarios data={datos} onCerrar={() => {}} />);
    await clic(botones().find((b) => b.title === "Aniversario — ver en grande"));
    const primera = titulo();
    expect(document.body.textContent).toContain("1 de 2");
    await tecla("ArrowRight");
    expect(titulo()).not.toBe(primera);
    expect(document.body.textContent).toContain("2 de 2");
    await tecla("ArrowRight");
    expect(titulo(), "da la vuelta").toBe(primera);
    await clic(botones().find((b) => b.title === "Anterior (←)"));
    expect(document.body.textContent).toContain("2 de 2");
    vista.desmontar();
  });

  it("Boda: solo pasa por las que tienen foto de boda (aquí, una: sin flechas)", async () => {
    const vista = montar(<VentanaAniversarios data={datos} onCerrar={() => {}} />);
    await clic(botones().find((b) => b.title === "Boda — ver en grande"));
    expect(document.body.textContent).toContain("1 de 1");
    expect(botones().find((b) => b.title === "Siguiente (→)")).toBeUndefined();
    vista.desmontar();
  });
});
