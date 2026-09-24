// Cronograma y Estado de cuentas, DIBUJADAS de verdad.
//
// Las otras dos que faltaban tras la Lista de invitados y la pantalla del
// colaborador: el Cronograma porque es la que más se toca, y Cuentas
// porque ahí hay dinero.
//
// ⚠️ El Cronograma dibuja su imagen en un `<canvas>`, que en estas
// pruebas no existe de verdad. Se sustituye el dibujo por un hueco: lo
// que pinta la imagen ya tiene sus propias pruebas en
// `lib/cronograma.test.js` (el reparto proporcional), y aquí lo que se
// comprueba es que la VENTANA se puede abrir.
import { describe, it, expect, vi } from "vitest";
import { dibujarYSoltar, montar } from "../../pruebas/dibujar";
import { ROL_FAMILIAR } from "../../lib/rolFamiliar";

vi.mock("../../lib/cronograma", async (original) => ({
  ...(await original()),
  generarImagenCronograma: () => "",
}));

const { VentanaConfigCronograma } = await import("./VentanaConfigCronograma");
const { VentanaCuentas } = await import("./VentanaCuentas");

const evento = {
  fecha: "2026-11-13",
  precioAdulto: "45",
  precioNino: "20",
  edadNinoDesde: "3",
  edadNinoHasta: "12",
  cronogramaHoraInicio: "18:00",
  cronogramaBloques: [
    { texto: "Recepción", duracionMin: 15 },
    { texto: "Cóctel", duracionMin: 30 },
    { texto: "Cena", duracionMin: 90 },
    { texto: "Baile", duracionMin: 140 },
    { texto: "Final", duracionMin: 10 },
  ],
  rolesTrabajoResponsables: { Acomodador: "g2" },
};

const invitados = [
  { id: "g1", nombre: "Jacob", apellido: "Barrios", grupoFamiliar: "Barrios01", rolFamiliar: ROL_FAMILIAR.SUELTO, colaboradorId: "c1", confirmado: true, pagado: true, anioNacimiento: "1990", rolesTrabajo: ["Acomodador"] },
  { id: "g2", nombre: "Omar", apellido: "Pacheco", grupoFamiliar: "Pacheco01", rolFamiliar: ROL_FAMILIAR.ESPOSO, colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "1985", rolesTrabajo: ["Acomodador"] },
  { id: "g3", nombre: "Lucía", apellido: "Pacheco", grupoFamiliar: "Pacheco01", rolFamiliar: ROL_FAMILIAR.HIJO, colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "2018", rolesTrabajo: [] },
];

const colaboradores = [{ id: "c1", nombre: "Barrios, Jacob", invitadoId: "g1", email: "j@j.com", permisos: [] }];

const data = {
  evento,
  persistEvento: () => {},
  colaboradores,
  invitados,
  gastos: [{ id: "x1", concepto: "Flores", categoria: "Decoración", importe: "120", pagado: false }],
  persistGastos: () => {},
  confirmarRecogidaColaborador: () => {},
  reenviarAcuseColaborador: () => {},
  deshacerRecogidaColaborador: () => {},
};

describe("el Cronograma se puede dibujar", () => {
  const dibujar = (extra = {}) =>
    dibujarYSoltar(<VentanaConfigCronograma data={{ ...data, ...extra }} ventana={null} />);

  it("con sus bloques", () => {
    expect(dibujar()).toContain("Inicio del cronograma");
  });

  it("recién estrenado, sin ningún bloque guardado", () => {
    expect(() => dibujar({ evento: { ...evento, cronogramaBloques: [] } })).not.toThrow();
  });

  // Aquí vivía el fallo de los nombres duplicados: la lista se armaba
  // pegando colaboradores e invitados con rol, y quien era las dos cosas
  // salía dos veces (norma 22).
  it("al desplegar «¿Quién lo atiende?», cada persona sale UNA vez", () => {
    const vista = montar(<VentanaConfigCronograma data={data} ventana={null} />);
    // El primer bloque (Recepción) lo atienden los colaboradores solos,
    // sin lista que elegir: hay que pasar al siguiente.
    // ⚠️ El primer <select> de la ventana es la hora de inicio, no el
    // bloque: se busca por lo que lleva dentro.
    const elegirBloque = [...vista.contenedor.querySelectorAll("select")].find((sel) =>
      sel.textContent.includes("Cóctel")
    );
    vista.elegir(elegirBloque, "1");
    const desplegar = [...vista.contenedor.querySelectorAll("button")].find((b) =>
      b.textContent.includes("¿Quién lo atiende?")
    );
    expect(desplegar).toBeTruthy();
    vista.pulsar(desplegar);
    const html = vista.html;
    vista.desmontar();
    const veces = (html.match(/Barrios, Jacob/g) || []).length;
    expect(veces).toBe(1);
    // Y con su papel al lado, no en una fila aparte.
    expect(html).toContain("Acomodador");
  });
});

describe("Estado de cuentas se puede dibujar", () => {
  const dibujar = (extra = {}) =>
    dibujarYSoltar(<VentanaCuentas data={{ ...data, ...extra }} onCerrar={() => {}} />);

  it("con sus tres partes plegadas", () => {
    expect(dibujar()).toContain("Estado de cuentas");
  });

  it("sin gastos y sin colaboradores tampoco se cae", () => {
    expect(() => dibujar({ gastos: [], colaboradores: [] })).not.toThrow();
  });

  it("al abrir cada parte", () => {
    for (const titulo of ["Resumen", "Colaboradores", "Gastos"]) {
      const vista = montar(<VentanaCuentas data={data} onCerrar={() => {}} />);
      const boton = [...vista.contenedor.querySelectorAll("button")].find((b) =>
        b.textContent.includes(titulo)
      );
      if (boton) expect(() => vista.pulsar(boton)).not.toThrow();
      vista.desmontar();
    }
  });
});
