// Las horas del calendario (v92.6): de las Canarias, en verano y en
// invierno; el fin de madrugada, al día siguiente; sin hora, todo el día.
import { it, expect } from "vitest";
import { utcDeHoraLocal, eventoDelCalendario, icsDelEvento } from "./calendario";

it("la hora de Canarias, en UTC: igual en invierno, una menos en verano", () => {
  expect(new Date(utcDeHoraLocal("2026-12-11", "19:00")).toISOString()).toBe("2026-12-11T19:00:00.000Z");
  expect(new Date(utcDeHoraLocal("2026-07-11", "19:00")).toISOString()).toBe("2026-07-11T18:00:00.000Z");
});

it("un fin de madrugada es del día siguiente; sin fin, 5 horas", () => {
  const base = { fecha: "2026-12-11", hora: "19:00" };
  expect(new Date(eventoDelCalendario({ ...base, cronogramaHoraFin: "02:00" }).fin).toISOString()).toBe("2026-12-12T02:00:00.000Z");
  expect(new Date(eventoDelCalendario(base).fin).toISOString()).toBe("2026-12-12T00:00:00.000Z");
});

it("sin hora, el día entero", () => {
  const cal = eventoDelCalendario({ nombre: "Boda", fecha: "2026-12-11" });
  expect(cal.todoElDia).toBe(true);
  const ics = icsDelEvento(cal, 0);
  expect(ics).toContain("DTSTART;VALUE=DATE:20261211");
  expect(ics).toContain("DTEND;VALUE=DATE:20261212");
});
