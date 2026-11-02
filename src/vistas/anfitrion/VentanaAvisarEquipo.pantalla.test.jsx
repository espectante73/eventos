// «Avisar al equipo» (v79), DIBUJADA: cuántos tienen avisos, escribir y enviar (pregunta antes).
import { it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaAvisarEquipo } from "./VentanaAvisarEquipo";

const escribir = (campo, valor) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(campo, valor);
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  });

function dibujar(conAvisos) {
  const avisarAlEquipo = vi.fn(async () => ({ enviados: 2, fallidos: 0 }));
  const data = {
    colaboradores: [{ id: "c1", nombre: "Sierra, Raul" }, { id: "c2", nombre: "Barrios, Jacob" }, { id: "c3", nombre: "Abrante, Loly" }],
    colaboradoresConAvisos: conAvisos,
    avisarAlEquipo,
    esAnfitrion: false,
  };
  const vista = montar(<VentanaAvisarEquipo data={data} onCerrar={() => {}} />);
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t);
  return { vista, avisarAlEquipo, boton };
}

it("dice cuántos tienen avisos; escribir, «Enviar», confirmar, y dice a cuántos llegó", async () => {
  const { vista, avisarAlEquipo, boton } = dibujar([{ colaboradorId: "c1", moviles: 1 }, { colaboradorId: "c2", moviles: 2 }]);
  expect(document.body.textContent).toContain("2 de 3 colaboradores tienen los avisos activos.");
  escribir(document.body.querySelector('textarea[aria-label="Texto del aviso"]'), "Nueva función: llamar desde la ficha.");
  vista.pulsar(boton("Enviar"));
  expect(document.body.textContent).toContain("¿Enviar el aviso?");
  await act(async () => boton("Sí").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(avisarAlEquipo).toHaveBeenCalledWith({ titulo: "Novedad", texto: "Nueva función: llamar desde la ficha." });
  expect(document.body.textContent).toContain("Enviado a 2 móviles.");
  vista.desmontar();
});

it("si nadie los tiene activos, lo dice y no deja enviar", () => {
  const { vista, boton } = dibujar([]);
  expect(document.body.textContent).toContain("Ningún colaborador tiene todavía los avisos activos");
  expect(boton("Enviar").disabled).toBe(true);
  vista.desmontar();
});

// v79.2 (él): «¿puedo ver quién tiene activados los avisos?».
it("«Quién los tiene»: primero los que sí, luego los que no, por orden alfabético", () => {
  const { vista } = dibujar([{ colaboradorId: "c1", moviles: 2 }, { colaboradorId: "c2", moviles: 1 }]);
  vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Quién los tiene")));
  const filas = [...document.body.querySelectorAll("[data-con-avisos]")].map((f) => [f.textContent.trim(), f.dataset.conAvisos]);
  expect(filas).toEqual([
    ["Barrios, Jacob", "true"],
    ["Sierra, Raul2 móviles", "true"],
    ["Abrante, Loly", "false"],
  ]);
  vista.desmontar();
});
