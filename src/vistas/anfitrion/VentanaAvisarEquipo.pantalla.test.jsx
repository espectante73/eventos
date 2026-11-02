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
    colaboradores: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
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
