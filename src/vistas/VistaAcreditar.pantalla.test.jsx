// Lo que se abre al leer el QR de una invitación (v83.2), DIBUJADO de verdad.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

const llamadas = [];
let respuesta;
vi.mock("../supabaseClient", () => ({
  supabase: {
    rpc: async (nombre, args) => {
      llamadas.push([nombre, args]);
      return respuesta(nombre, args);
    },
  },
}));
const avisos = [];
vi.mock("../lib/useCanalAsistencia", () => ({
  useCanalAsistencia: () => ({ avisarLlegada: (id, presente) => avisos.push([id, presente]) }),
}));
const { VistaAcreditar, AcreditarSinSesion } = await import("./VistaAcreditar");

const m = (id, nombre, extra = {}) => ({ id, nombre, apellido: "Pacheco", presente: false, mesa: 5, enRegla: true, ...extra });
const familia = (miembros, extra = {}) => ({ familia: "Pacheco", abierta: true, exigir: true, miembros, ...extra });
const tres = [m("a", "Lucía"), m("b", "Míriam"), m("c", "Omar")];
const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t);
const pulsar = (el) => act(async () => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const abrir = async () => {
  const vista = montar(<VistaAcreditar codigo="abc123" />);
  await act(async () => {});
  return vista;
};

beforeEach(() => {
  llamadas.length = 0;
  avisos.length = 0;
  respuesta = () => ({ data: familia(tres), error: null });
});

describe("al leer el QR", () => {
  it("«¿Vienen todos?» con la familia, cuántos y su mesa; «Sí» acredita a todos", async () => {
    const vista = await abrir();
    expect(document.body.textContent).toContain("3 invitados · Mesa 5");
    expect(document.body.textContent).toContain("¿Vienen todos?");
    respuesta = () => ({ data: familia(tres.map((x) => ({ ...x, presente: true }))), error: null });
    await pulsar(boton("Sí"));
    expect(llamadas.at(-1)).toEqual(["acreditar_marcar", { p_codigo: "abc123", p_ids: ["a", "b", "c"] }]);
    expect(document.body.textContent).toContain("Ya acreditados");
    expect(document.body.textContent).toContain("3 de 3 · Mesa 5");
    vista.desmontar();
  });

  it("«No»: se desmarca a quien no viene y «Guardar» acredita a los elegidos", async () => {
    const vista = await abrir();
    await pulsar(boton("No"));
    await pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Lucía")));
    expect(document.body.textContent).toContain("2 de 3");
    respuesta = () => ({ data: familia([{ ...tres[0] }, { ...tres[1], presente: true }, { ...tres[2], presente: true }]), error: null });
    await pulsar(boton("Guardar"));
    expect(llamadas.at(-1)[1].p_ids).toEqual(["b", "c"]);
    expect(document.body.textContent).toContain("Acreditados");
    expect(document.body.textContent).toContain("2 de 3 · Mesa 5");
    vista.desmontar();
  });

  it("al acreditar avisa al marcador al momento, con lo que dice la base (v83.5)", async () => {
    const vista = await abrir();
    expect(avisos).toEqual([]);
    respuesta = () => ({ data: familia([{ ...tres[0] }, { ...tres[1], presente: true }, { ...tres[2], presente: true }]), error: null });
    await pulsar(boton("Sí"));
    expect(avisos).toEqual([["a", false], ["b", true], ["c", true]]);
    vista.desmontar();
  });

  it("si la base no lo guarda, no avisa de nada al marcador", async () => {
    const vista = await abrir();
    respuesta = () => ({ data: { error: "regla" }, error: null });
    await pulsar(boton("Sí"));
    expect(avisos).toEqual([]);
    vista.desmontar();
  });

  it("si otro móvil ya la leyó: «Ya acreditados», y se puede corregir", async () => {
    respuesta = () => ({ data: familia(tres.map((x) => ({ ...x, presente: true }))), error: null });
    const vista = await abrir();
    expect(document.body.textContent).toContain("Ya acreditados");
    await pulsar(boton("Corregir"));
    expect(boton("Guardar")).toBeTruthy();
    vista.desmontar();
  });

  it("con las llegadas cerradas, lo dice y no deja acreditar", async () => {
    respuesta = () => ({ data: familia(tres, { abierta: false }), error: null });
    const vista = await abrir();
    expect(document.body.textContent).toContain("todavía no están abiertas");
    expect(boton("Sí")).toBeUndefined();
    vista.desmontar();
  });

  it("quien no está en regla no se puede marcar, y lo dice", async () => {
    respuesta = () => ({ data: familia([m("a", "Lucía", { enRegla: false }), m("c", "Omar")]), error: null });
    const vista = await abrir();
    expect(document.body.textContent).toContain("falta el pago o sus datos");
    expect([...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Lucía")).disabled).toBe(true);
    vista.desmontar();
  });

  it("sin permiso, o con un código que no existe, lo dice", async () => {
    respuesta = () => ({ data: { error: "permiso" }, error: null });
    let vista = await abrir();
    expect(document.body.textContent).toContain("no tiene permiso");
    vista.desmontar();
    respuesta = () => ({ data: { error: "codigo" }, error: null });
    vista = await abrir();
    expect(document.body.textContent).toContain("no es de ninguna familia");
    vista.desmontar();
  });

  it("si la base rechaza al guardar, se queda en la pantalla y dice por qué", async () => {
    const vista = await abrir();
    respuesta = () => ({ data: { error: "regla" }, error: null });
    await pulsar(boton("Sí"));
    expect(document.body.textContent).toContain("Avisa a su colaborador");
    expect(boton("Sí")).toBeTruthy();
    vista.desmontar();
  });
});

it("sin sesión: se enseña en la entrada, y el equipo puede entrar", () => {
  let entra = false;
  const vista = montar(<AcreditarSinSesion onEntrar={() => (entra = true)} />);
  expect(document.body.textContent).toContain("se enseña en la entrada");
  vista.pulsar(boton("Soy del equipo: entrar"));
  expect(entra).toBe(true);
  vista.desmontar();
});
