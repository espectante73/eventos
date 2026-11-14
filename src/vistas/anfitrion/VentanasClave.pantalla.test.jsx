// Cronograma y Contabilidad, DIBUJADAS de verdad.
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
import { euros } from "../../lib/formato";

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
  confirmarEntregaColaborador: () => {},
  reenviarAcuseColaborador: () => {},
  deshacerEntregaColaborador: () => {},
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
  // salía dos veces (norma 16).
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

describe("Contabilidad se puede dibujar", () => {
  const dibujar = (extra = {}) =>
    dibujarYSoltar(<VentanaCuentas data={{ ...data, ...extra }} onCerrar={() => {}} />);

  it("con sus tres partes plegadas", () => {
    expect(dibujar()).toContain("Contabilidad");
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
  // v84.8 (él): la cantidad final, con los sin confirmar como adultos; y sin
  // el texto de explicación al pie, que quitó por lioso.
  it("el Resumen dice lo previsto a recoger: confirmados con su edad y sin confirmar como adultos", () => {
    const conPendiente = [...invitados, { id: "g4", nombre: "Ana", apellido: "Sierra", grupoFamiliar: "Sierra01", confirmado: false, anioNacimiento: "2018" }];
    const vista = montar(<VentanaCuentas data={{ ...data, invitados: conPendiente }} onCerrar={() => {}} />);
    vista.pulsar([...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Resumen")));
    const texto = vista.contenedor.textContent;
    // 45 + 45 + 20 (la niña, con su edad) + 45 (sin confirmar, como adulta).
    expect(texto).toContain(`${euros(155)}Previsto a recoger`);
    expect(texto).not.toContain("Lo que entra");
    // Arriba, antes que las otras cuatro (v84.9).
    expect(texto.indexOf("Previsto a recoger")).toBeLessThan(texto.indexOf("Recaudado"));
    vista.desmontar();
  });
  // v85.9 (él): la propina «es parte de la contabilidad». La escribe él al
  // confirmar la recogida, sale en «Recogido» y suma al balance.
  it("las propinas de las entregas suman al balance, y cada entrega con la suya", () => {
    const conPropina = [{ ...colaboradores[0], entregas: [{ id: "e1", fecha: "2026-11-14T10:00:00Z", importe: 45, propina: 20, invitados: ["g1"] }] }];
    const vista = montar(<VentanaCuentas data={{ ...data, colaboradores: conPropina }} onCerrar={() => {}} />);
    vista.pulsar([...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Resumen")));
    let texto = vista.contenedor.textContent;
    expect(texto).toContain(`${euros(20)}Propinas`);
    // 45 recaudado + 20 de propina − 120 de gastos.
    expect(texto).toContain(`${euros(45 + 20 - 120)}Balance (recaudado + propinas − gastos)`);
    vista.pulsar([...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Recaudado por colaborador")));
    vista.pulsar([...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Entregas (1)")));
    texto = vista.contenedor.textContent;
    expect(texto).toContain(`${euros(45)} + ${euros(20)} propina`);
    vista.desmontar();
  });
  // v86.1, v87 (él): arriba los que tienen algo por entregar; abajo, los
  // que lo han entregado todo.
  it("los que tienen algo por entregar, arriba; los que lo entregaron todo, abajo", () => {
    const tres = [
      { id: "c1", nombre: "Ana", email: "a@a.com", permisos: [], entregas: [{ id: "e1", fecha: "2026-11-14T10:00:00Z", importe: 45, invitados: ["g1"] }] },
      { id: "c2", nombre: "Bea", email: "b@b.com", permisos: [] },
      { id: "c3", nombre: "Ciro", email: "c@c.com", permisos: [] },
    ];
    const conPagado = [...invitados, { id: "g9", nombre: "Pepe", apellido: "Sosa", grupoFamiliar: "Sosa01", colaboradorId: "c3", confirmado: true, pagado: true, anioNacimiento: "1980" }];
    const vista = montar(<VentanaCuentas data={{ ...data, invitados: conPagado, colaboradores: tres }} onCerrar={() => {}} />);
    vista.pulsar([...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Recaudado por colaborador")));
    const orden = [...vista.contenedor.textContent.matchAll(/Recaudado por (Ana|Bea|Ciro)/g)].map((m) => m[1]);
    // Ciro tiene a Pepe por entregar; Bea, nada; Ana lo entregó todo.
    expect(orden).toEqual(["Ciro", "Bea", "Ana"]);
    vista.desmontar();
  });
  // v87 (él): una entrega nueva solo con lo cobrado desde la anterior.
  it("tras una entrega, lo que paga después sale «Por entregar» aparte", () => {
    const yeray = [{ ...colaboradores[0], entregas: [{ id: "e1", fecha: "2026-11-14T10:00:00Z", importe: 45, invitados: ["g1"] }] }];
    const pagaOmar = invitados.map((g) => (g.id === "g2" ? { ...g, pagado: true } : g));
    const vista = montar(<VentanaCuentas data={{ ...data, invitados: pagaOmar, colaboradores: yeray }} onCerrar={() => {}} />);
    vista.pulsar([...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Recaudado por colaborador")));
    expect(vista.contenedor.textContent).toContain(`Por entregar: ${euros(45)} (1 invitado)`);
    vista.desmontar();
  });
  it("al confirmar la entrega, la propina va junto al importe", () => {
    const vista = montar(<VentanaCuentas data={data} onCerrar={() => {}} />);
    vista.pulsar([...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Recaudado por colaborador")));
    vista.pulsar([...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Confirmar entrega")));
    const propina = vista.contenedor.querySelector('input[aria-label="Propina"]');
    expect(propina).not.toBeNull();
    expect(propina.value).toBe("");
    // En la misma pieza que su rótulo y su «€» (norma 6).
    expect(propina.parentElement.textContent).toContain("+ propina");
    vista.desmontar();
  });
});
