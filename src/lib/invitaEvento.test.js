import { describe, it, expect } from "vitest";
import { marcarInvitaEvento, aQuienInvita, faltaSqlInvitaEvento, preguntaInvitaEvento } from "./invitaEvento";
import { importeEsperadoInvitado, previstoARecoger } from "./invitados";

const evento = { fecha: "2026-12-11", precioAdulto: "47", precioNino: "35", edadNinoDesde: "4", edadNinoHasta: "8" };
const pareja = [
  { id: "j", apellido: "Barrios", nombre: "Jacob", grupoFamiliar: "Barrios", confirmado: true, pagado: false, anioNacimiento: "1980", alergias: "Ninguna", invitaEvento: null },
  { id: "l", apellido: "Barrios", nombre: "Lucía", grupoFamiliar: "Barrios", confirmado: true, pagado: false, anioNacimiento: "1982", alergias: "Ninguna", invitaEvento: null },
];
const otro = { id: "o", apellido: "Gatell", nombre: "Juan", confirmado: true, pagado: false, anioNacimiento: "1970", alergias: "Ninguna", invitaEvento: null };
const dj = { id: "d", apellido: "Brown", nombre: "DJ", zona: "DJ", confirmado: true, pagado: false, anioNacimiento: "1985" };

// v103 (él: «su importe lo invita el evento… debe de salir el sello pagado
// porque sí está pagado pero no por ellos»).
describe("Lo invita el evento", () => {
  it("marcarlo deja pagado (sello, invitación, QR) y sin plazo pendiente", () => {
    const { invitados, aviso } = marcarInvitaEvento([{ ...pareja[0], pagoPendienteHasta: "2026-12-01", plazosPago: 2 }], "j", true);
    expect(aviso).toBe("");
    expect(invitados[0]).toMatchObject({ invitaEvento: true, pagado: true, pagoPendienteHasta: null, plazosPago: 0 });
  });

  it("solo a esa persona, o a toda su familia (norma 11)", () => {
    const lista = [...pareja, otro];
    const sola = marcarInvitaEvento(lista, "j", true).invitados;
    expect(sola.map((g) => Boolean(g.invitaEvento))).toEqual([true, false, false]);
    const familia = marcarInvitaEvento(lista, "j", true, { familia: true }).invitados;
    expect(familia.map((g) => Boolean(g.invitaEvento))).toEqual([true, true, false]);
    expect(aQuienInvita(lista, "j", true).map((g) => g.id)).toEqual(["j", "l"]);
  });

  it("como al cobrar, antes sus datos obligatorios: si a alguno le faltan, no se marca a nadie (norma 11)", () => {
    const lista = [pareja[0], { ...pareja[1], alergias: "" }];
    const { invitados, aviso } = marcarInvitaEvento(lista, "j", true, { familia: true, evento });
    expect(invitados).toBe(lista);
    expect(aviso).toBe(
      "No se ha marcado a nadie: a Barrios, Lucía le faltan los datos obligatorios (año de nacimiento y alergias). Primero, que los rellene su colaborador (o tú en la Lista): al marcarlos cuentan como pagados y sus fichas se le cierran al colaborador."
    );
    expect(marcarInvitaEvento(lista, "l", true, { evento }).aviso).toMatch(/^No se ha marcado: a Barrios, Lucía le faltan/);
    // Solo a Jacob, que los tiene, sí.
    expect(marcarInvitaEvento(lista, "j", true, { evento }).invitados[0].invitaEvento).toBe(true);
    // En Modo Pruebas no se exige.
    expect(marcarInvitaEvento(lista, "l", true, { evento: { ...evento, modoPruebasActivo: true } }).aviso).toBe("");
  });

  it("la familia son sus confirmados, como el pago", () => {
    const lista = [...pareja, { ...pareja[1], id: "n", nombre: "No viene", confirmado: false, noAsiste: true }];
    expect(aQuienInvita(lista, "j", true).map((g) => g.id)).toEqual(["j", "l"]);
  });

  it("quitarlo la deja sin pagar: lo suyo no lo cobró nadie", () => {
    const marcados = marcarInvitaEvento(pareja, "j", true, { familia: true }).invitados;
    const { invitados } = marcarInvitaEvento(marcados, "l", false, { familia: true });
    expect(invitados.map((g) => [g.invitaEvento, g.pagado])).toEqual([
      [false, false],
      [false, false],
    ]);
  });

  it("si alguien ya figuraba como pagado, se marca igual pero se avisa: ese dinero deja de contar", () => {
    const lista = [{ ...pareja[0], pagado: true }, pareja[1]];
    const { invitados, aviso } = marcarInvitaEvento(lista, "j", true, { familia: true });
    expect(invitados.every((g) => g.invitaEvento && g.pagado)).toBe(true);
    expect(aviso).toBe("Barrios, Jacob ya figuraba como pagado: si se cobró, ese dinero ya no cuenta en «Entra».");
  });

  it("al DJ no: ya lo invita el evento por ser el DJ, con su propio apunte", () => {
    const { invitados, aviso } = marcarInvitaEvento([dj], "d", true);
    expect(invitados[0].invitaEvento).toBeUndefined();
    expect(aviso).toContain("DJ");
    // Ni de rebote, marcando a toda su familia.
    expect(aQuienInvita([dj, { ...dj, id: "d2", zona: "" }], "d2", true).map((g) => g.id)).toEqual(["d2"]);
  });

  it("su entrada vale 0 €: ni se le cobra, ni cuenta en lo previsto ni en lo recaudado", () => {
    const invitado = { ...pareja[0], invitaEvento: true, pagado: true };
    expect(importeEsperadoInvitado(invitado, evento)).toBe(0);
    expect(previstoARecoger([invitado, { ...pareja[1], confirmado: false, invitaEvento: true }], evento).total).toBe(0);
  });

  it("pregunta si es para toda la familia solo si hay alguien más a quien le afecte (norma 11)", () => {
    const p = preguntaInvitaEvento([...pareja, otro], "j");
    expect(p).toMatchObject({ marcar: true, familia: true, titulo: "¿Lo invita el evento a toda la familia?" });
    expect(p.texto).toContain("Barrios, Jacob y Barrios, Lucía");
    expect(p.texto).toContain("Con «No», solo Barrios, Jacob.");
    expect(preguntaInvitaEvento([otro], "o")).toMatchObject({ marcar: true, familia: false, titulo: "¿Lo invita el evento?" });
    // Quitar: solo pregunta por la familia si alguien más lo tiene marcado.
    const uno = marcarInvitaEvento(pareja, "j", true).invitados;
    expect(preguntaInvitaEvento(uno, "j")).toMatchObject({ marcar: false, familia: false, titulo: "¿Quitar «Lo invita el evento»?" });
    const dos = marcarInvitaEvento(pareja, "j", true, { familia: true }).invitados;
    expect(preguntaInvitaEvento(dos, "l")).toMatchObject({ marcar: false, familia: true, titulo: "¿Quitarlo a toda la familia?" });
  });

  it("sin el SQL de la v103 las filas no traen la marca", () => {
    expect(faltaSqlInvitaEvento([{ id: "a" }])).toBe(true);
    expect(faltaSqlInvitaEvento(pareja)).toBe(false);
    expect(faltaSqlInvitaEvento([])).toBe(false);
  });
});
