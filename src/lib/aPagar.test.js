import { describe, it, expect } from "vitest";
import { aPagarDe, faltaSqlAPagar, personasDelLocal, precioPorPersona, costeLocal, cuentaDelLocal, resumenAPagar, limpiarLocal, conDj } from "./aPagar";
import { importeEsperadoInvitado, tramoDeEdad, calcularEdad } from "./invitados";

// Las edades de la app: 0-3 gratis, 4-7 niño, 8 en adelante adulto.
const evento = { fecha: "2026-12-11", precioAdulto: "47", precioNino: "35", edadNinoDesde: "4", edadNinoHasta: "8" };

describe("tramoDeEdad (la misma para la entrada y para el local)", () => {
  it("0-3 bebé, 4-7 niño, 8 en adelante adulto; sin año, adulto", () => {
    expect(tramoDeEdad("2026", evento)).toBe("bebe");
    expect(tramoDeEdad("2023", evento)).toBe("bebe");
    expect(tramoDeEdad("2022", evento)).toBe("nino");
    expect(tramoDeEdad("2019", evento)).toBe("nino");
    expect(tramoDeEdad("2018", evento)).toBe("adulto");
    expect(tramoDeEdad("", evento)).toBe("adulto");
  });
  it("un bebé nacido el año del evento tiene 0 años y no paga entrada", () => {
    expect(calcularEdad("2026", evento)).toBe(0);
    expect(importeEsperadoInvitado({ anioNacimiento: "2026" }, evento)).toBe(0);
  });
  it("la entrada sigue igual: 47 adulto, 35 niño, 0 bebé y DJ", () => {
    expect(importeEsperadoInvitado({ anioNacimiento: "1980" }, evento)).toBe(47);
    expect(importeEsperadoInvitado({ anioNacimiento: "2020" }, evento)).toBe(35);
    expect(importeEsperadoInvitado({ anioNacimiento: "2024" }, evento)).toBe(0);
    expect(importeEsperadoInvitado({ anioNacimiento: "1980", zona: "DJ" }, evento)).toBe(0);
  });
});

describe("aPagarDe", () => {
  it("sin nada guardado, vacío y con su forma", () => {
    expect(aPagarDe({})).toEqual({ partidas: [], otros: [], dj: "" });
    expect(aPagarDe({ aPagar: null })).toEqual({ partidas: [], otros: [], dj: "" });
  });
  it("sin el SQL de la v88 no hay dónde guardar", () => {
    expect(faltaSqlAPagar({ fecha: "2026-12-11" })).toBe(true);
    expect(faltaSqlAPagar({ aPagar: null })).toBe(false);
  });
});

describe("personasDelLocal", () => {
  it("solo los confirmados, el DJ también; los sin año, como adultos y contados aparte", () => {
    const invitados = [
      { confirmado: true, anioNacimiento: "1980" },
      { confirmado: true, anioNacimiento: "1985", zona: "DJ" },
      { confirmado: true, anioNacimiento: "" },
      { confirmado: true, anioNacimiento: "2020" },
      { confirmado: true, anioNacimiento: "2025" },
      { confirmado: false, anioNacimiento: "1990" },
      { noAsiste: true, anioNacimiento: "1990" },
    ];
    expect(personasDelLocal(invitados, evento)).toEqual({ adulto: 3, nino: 1, bebe: 1, sinAnio: 1 });
  });
});

describe("costeLocal", () => {
  const aPagar = {
    partidas: [
      { id: "1", concepto: "Menú principal", adulto: "65", nino: "30" },
      { id: "2", concepto: "Cóctel", adulto: "15", nino: "5" },
      { id: "3", concepto: "Tarta", adulto: "6,50", nino: "" },
    ],
    otros: [{ id: "4", concepto: "Montaje de sala", importe: "200" }],
    dj: "",
  };
  it("por persona, la suma de las partidas", () => {
    expect(precioPorPersona(aPagar.partidas)).toEqual({ adulto: 86.5, nino: 35 });
  });
  it("adultos × su precio + niños × el suyo + los otros; los bebés, gratis", () => {
    expect(costeLocal(aPagar, { adulto: 100, nino: 10, bebe: 3 })).toEqual({
      porPersona: { adulto: 86.5, nino: 35 },
      adultos: 8650,
      ninos: 350,
      otros: 200,
      total: 9200,
    });
  });
});

describe("cuentaDelLocal (v93.1): la cuenta para pagarle, partida a partida", () => {
  it("cada partida con sus adultos y sus niños; lo demás del local; el total, el mismo de «A pagar»", () => {
    const aPagar = {
      partidas: [
        { id: "1", concepto: "Cóctel", adulto: "15", nino: "8" },
        { id: "2", concepto: "Cena", adulto: "55", nino: "25" },
        { id: "3", concepto: "Tarta de boda", adulto: "6,50", nino: "" },
      ],
      otros: [{ id: "4", concepto: "Montaje", importe: "200" }],
      dj: "600",
    };
    const personas = { adulto: 98, nino: 14, bebe: 3, sinAnio: 0 };
    const cuenta = cuentaDelLocal(aPagar, personas);
    expect(cuenta.partidas).toEqual([
      { id: "1", concepto: "Cóctel", adulto: 15, nino: 8, adultos: 1470, ninos: 112, total: 1582 },
      { id: "2", concepto: "Cena", adulto: 55, nino: 25, adultos: 5390, ninos: 350, total: 5740 },
      { id: "3", concepto: "Tarta de boda", adulto: 6.5, nino: 0, adultos: 637, ninos: 0, total: 637 },
    ]);
    expect(cuenta.otros).toEqual([{ id: "4", concepto: "Montaje", importe: 200 }]);
    // Sin el DJ (eso no es del local): 1582 + 5740 + 637 + 200.
    expect(cuenta.total).toBe(8159);
    expect(cuenta.total).toBe(costeLocal(aPagar, personas).total);
  });
});

describe("resumenAPagar", () => {
  it("entra = recaudado + propinas; sale = local + DJ + tus gastos; y lo que sobra", () => {
    const ev = { ...evento, aPagar: { partidas: [{ id: "1", concepto: "Menú", adulto: "80", nino: "40" }], otros: [], dj: "600" } };
    const invitados = [
      { confirmado: true, anioNacimiento: "1980" },
      { confirmado: true, anioNacimiento: "1982" },
      { confirmado: true, anioNacimiento: "2020" },
    ];
    const r = resumenAPagar({ evento: ev, invitados, gastos: [{ importe: "100" }, { importe: "80,50" }], recaudado: 1000, propinas: 20 });
    expect(r.local.total).toBe(200);
    expect(r.dj).toBe(600);
    expect(r.tusGastos).toBe(180.5);
    expect(r.entra).toBe(1020);
    expect(r.sale).toBe(980.5);
    expect(r.diferencia).toBe(39.5);
  });
  it("sin nada apuntado, sale solo lo de tus gastos (como el balance de antes)", () => {
    const r = resumenAPagar({ evento, invitados: [], gastos: [{ importe: "50" }], recaudado: 100, propinas: 0 });
    expect(r.sale).toBe(50);
    expect(r.diferencia).toBe(50);
  });
});

describe("limpiarLocal", () => {
  it("quita las filas vacías y limpia los textos", () => {
    const { valor, aviso } = limpiarLocal(
      {
        partidas: [
          { id: "1", concepto: " Menú ", adulto: "65 ", nino: "30" },
          { id: "2", concepto: "", adulto: "", nino: "" },
        ],
        otros: [{ id: "3", concepto: "Montaje", importe: "200 €" }, { id: "4", concepto: " ", importe: "" }],
      },
      { dj: "600" }
    );
    expect(aviso).toBe("");
    expect(valor).toEqual({ partidas: [{ id: "1", concepto: "Menú", adulto: "65", nino: "30" }], otros: [{ id: "3", concepto: "Montaje", importe: "200" }], dj: "600" });
  });
  it("una partida sin nombre o con un precio que no es un número no se guarda", () => {
    const actual = { partidas: [], otros: [], dj: "" };
    expect(limpiarLocal({ partidas: [{ id: "1", concepto: "", adulto: "65", nino: "" }], otros: [] }, actual)).toEqual({ valor: actual, aviso: expect.stringContaining("falta el nombre") });
    expect(limpiarLocal({ partidas: [{ id: "1", concepto: "Tarta", adulto: "seis", nino: "" }], otros: [] }, actual).aviso).toContain("«Tarta»");
    // «1.250» sería 1,25 € al sumar: se pide sin puntos.
    expect(limpiarLocal({ partidas: [], otros: [{ id: "2", concepto: "Sala", importe: "1.250" }] }, actual).aviso).toContain("«Sala»");
  });
});

describe("conDj", () => {
  it("guarda el número y deja lo demás", () => {
    const actual = { partidas: [{ id: "1", concepto: "Menú", adulto: "65", nino: "" }], otros: [], dj: "" };
    expect(conDj(actual, " 600 ")).toEqual({ valor: { ...actual, dj: "600" }, aviso: "" });
    expect(conDj(actual, "")).toEqual({ valor: { ...actual, dj: "" }, aviso: "" });
    expect(conDj(actual, "seiscientos")).toEqual({ valor: actual, aviso: expect.stringContaining("DJ") });
  });
});
