// @vitest-environment jsdom
// Una pregunta que abre una ventana (usePreguntaSeguridad) tiene que
// seguir delante al apretarla. Antes la ventana "oía" ese toque, se ponía
// delante y la tapaba: sus botones no hacían nada (Invitaciones, 47.4).
import { it, expect } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { VentanaFlotante } from "./VentanaFlotante";
import { usePreguntaSeguridad } from "./PreguntaSeguridad";
import { Boton } from "./Boton";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Prueba({ alConfirmar }) {
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  return (
    <VentanaFlotante titulo="Ventana" onCerrar={() => {}}>
      <Boton onClick={() => preguntar({ titulo: "¿Seguro?", rotulo: "Sí, hazlo", alConfirmar })}>Abrir</Boton>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}

const boton = (t) => [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t));
const capa = (el) => {
  while (el && !el.style?.zIndex) el = el.parentElement;
  return Number(el.style.zIndex);
};

it("la pregunta sigue delante de su ventana al apretarla, y su botón funciona", async () => {
  let confirmado = false;
  const div = document.body.appendChild(document.createElement("div"));
  await act(async () => createRoot(div).render(<Prueba alConfirmar={() => (confirmado = true)} />));
  await act(async () => boton("Abrir").click());
  await act(async () => boton("Sí, hazlo").dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
  expect(capa(boton("Sí, hazlo"))).toBeGreaterThan(capa(boton("Abrir")));
  await act(async () => boton("Sí, hazlo").click());
  expect(confirmado).toBe(true);
});
