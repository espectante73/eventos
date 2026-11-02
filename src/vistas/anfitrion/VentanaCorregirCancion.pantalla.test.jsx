// «Corregir canción» (v79.6), DIBUJADA: quién la pidió, sus dos huecos y Guardar.
import { it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaCorregirCancion } from "./VentanaCorregirCancion";

const invitados = [{ id: "g1", nombre: "Rubén", apellido: "Pacheco", anioNacimiento: "1964", cancion: "Bailando\n\nUna Chica YE-YE - Concha Velasco" }];

function abrir(persistInvitados = vi.fn(), onCerrar = vi.fn()) {
  const vista = montar(
    <VentanaCorregirCancion data={{ invitados, evento: { fecha: "2026-11-13" }, persistInvitados }} peticion={{ invitadoId: "g1", hueco: 2 }} onCerrar={onCerrar} />
  );
  return { vista, persistInvitados, onCerrar };
}
const escribir = async (etiqueta, valor) => {
  const campo = document.body.querySelector(`input[aria-label="${etiqueta}"]`);
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(campo, valor);
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const pulsar = (rotulo) =>
  act(async () => [...document.body.querySelectorAll("button")].find((b) => b.textContent === rotulo).dispatchEvent(new MouseEvent("click", { bubbles: true })));

it("enseña quién la pidió y cómo la escribió; al guardar, la corrige en su ficha y se cierra", async () => {
  const { vista, persistInvitados, onCerrar } = abrir();
  expect(document.body.textContent).toContain("Pedida por Pacheco, Rubén (62)");
  expect(document.body.querySelector('input[aria-label="Canción"]').value).toBe("Una Chica YE-YE - Concha Velasco");
  await escribir("Canción", "Chica yeye");
  await escribir("Artista", "Conchita Velasco");
  await pulsar("Guardar");
  expect(persistInvitados.mock.calls[0][0][0].cancion).toBe("Bailando\n\nChica yeye — Conchita Velasco");
  expect(onCerrar).toHaveBeenCalled();
  vista.desmontar();
});

it("vacía no se guarda: dice qué falta", async () => {
  const { vista, persistInvitados, onCerrar } = abrir();
  await escribir("Canción", " ");
  await pulsar("Guardar");
  expect(document.body.textContent).toContain("Escribe la canción o el artista.");
  expect(persistInvitados).not.toHaveBeenCalled();
  expect(onCerrar).not.toHaveBeenCalled();
  vista.desmontar();
});
