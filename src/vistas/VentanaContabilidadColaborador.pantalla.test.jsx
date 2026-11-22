// v95 (él: «la contabilidad es para repasar lo que se me escape a mí, no
// necesita nombres de personas»): la Contabilidad del colaborador con el
// permiso, con lo que da la base (colaborador_contabilidad).
import { it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { euros } from "../lib/formato";

const respuestas = [];
const pedidas = [];
vi.mock("../supabaseClient", () => ({
  supabase: {
    rpc: async (nombre) => {
      pedidas.push(nombre);
      return respuestas.shift() ?? { data: null, error: { message: "sin respuesta" } };
    },
  },
}));
const { VentanaContabilidadColaborador } = await import("./VentanaContabilidadColaborador");

// Lo que da la base: invitados sin nombre.
const DE_LA_BASE = {
  evento: { fecha: "2026-12-11", precioAdulto: "47", precioNino: "35", edadNinoDesde: "4", edadNinoHasta: "8", aPagar: null, conceptosGastos: [] },
  invitados: [
    { id: "a", colaboradorId: "c1", confirmado: true, pagado: true, anioNacimiento: "1980", zona: "" },
    { id: "b", colaboradorId: "c1", confirmado: true, pagado: true, anioNacimiento: "1982", zona: "" },
  ],
  colaboradores: [{ id: "c1", nombre: "Sierra, Raúl", invitadoId: null, entregas: [{ id: "e1", fecha: "2026-11-14", importe: 47, propina: 3, invitados: ["a"] }] }],
  gastos: [{ id: "x", concepto: "Flores", importe: "120", fecha: "2026-11-10" }],
};
const boton = (texto) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes(texto));

it("pide sus cifras a la base y las enseña, con lo que falta por entregar", async () => {
  respuestas.push({ data: DE_LA_BASE, error: null });
  const vista = montar(<VentanaContabilidadColaborador data={{ esAnfitrion: false }} onCerrar={() => {}} />);
  await act(async () => {});
  expect(pedidas).toContain("colaborador_contabilidad");
  expect(document.body.textContent).toContain(`Balance ${euros(47 + 47 + 3 - 120)}`);
  vista.pulsar(boton("Recaudado por colaborador"));
  expect(document.body.textContent).toContain(`Por entregar: ${euros(47)} (1 invitado)`);
  expect(boton("Confirmar entrega")).toBeUndefined();
  vista.desmontar();
});

it("sin permiso, lo dice en vez de enseñar cifras vacías", async () => {
  respuestas.push({ data: { error: "permiso" }, error: null });
  const vista = montar(<VentanaContabilidadColaborador data={{ esAnfitrion: false }} onCerrar={() => {}} />);
  await act(async () => {});
  expect(document.body.textContent).toContain("pide al anfitrión que revise tu permiso «Ver la contabilidad»");
  expect(document.body.textContent).not.toContain("Resumen");
  vista.desmontar();
});
