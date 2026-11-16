// «Te falta» en el tablón (v87.2), DIBUJADO de verdad.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { TeFaltaTablon } from "./TeFaltaTablon";
import { euros } from "../lib/formato";

const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t);

it("el importe, lo primero y resaltado; la foto y las alergias, apagadas; «Entendido» la cierra", () => {
  let cerrada = false;
  const vista = montar(
    <TeFaltaTablon pendientes={{ importe: 47, fotoBoda: true, alergias: true }} colaborador="Bravo, Yeray" onCerrar={() => (cerrada = true)} />
  );
  const texto = document.body.textContent;
  expect(texto).toContain("Te falta");
  expect(texto).toContain(`El importe del evento: ${euros(47)}`);
  expect(texto).toContain("Es muy importante poder recoger el dinero de tu entrada.");
  expect(texto).toContain("Tu foto de boda");
  expect(texto).toContain("Tus alergias");
  expect(texto).toContain("Habla con tu colaborador: Bravo, Yeray.");
  // Lo primero, el importe; lo demás, apagado.
  const importe = document.body.querySelector("[data-importe]");
  const resto = document.body.querySelector("[data-resto]");
  expect(importe.compareDocumentPosition(resto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(Number(resto.style.opacity)).toBeLessThan(1);
  vista.pulsar(boton("Entendido"));
  expect(cerrada).toBe(true);
  vista.desmontar();
});

it("ya pagado: sin importe, y lo que falta se lee normal; siendo su propio colaborador, sin «Habla con»", () => {
  const vista = montar(<TeFaltaTablon pendientes={{ importe: 0, fotoBoda: true, alergias: false }} colaborador="Bravo, Yeray" colaboradorEsYo onCerrar={() => {}} />);
  const texto = document.body.textContent;
  expect(texto).not.toContain("El importe del evento");
  expect(texto).not.toContain("Tus alergias");
  expect(texto).not.toContain("Habla con tu colaborador");
  expect(document.body.querySelector("[data-resto]").style.opacity).toBe("");
  vista.desmontar();
});
