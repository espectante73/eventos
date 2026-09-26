// @vitest-environment jsdom
// Configuración → Modo Pruebas es SOLO la pregunta (v49.1): sin la
// ventana de antes, que repetía lo mismo.
import { it, expect } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { VentanaConfigModoPruebas } from "./VentanaConfigModoPruebas";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const boton = (t) => [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t));

async function abrir(evento) {
  const llamadas = [];
  document.body.innerHTML = "";
  const div = document.body.appendChild(document.createElement("div"));
  const data = {
    evento,
    activarModoPruebas: async () => (llamadas.push("activar"), true),
    desactivarModoPruebas: async () => (llamadas.push("desactivar"), true),
    guardarFotoDeshacer: async () => true,
  };
  await act(async () =>
    createRoot(div).render(<VentanaConfigModoPruebas data={data} onCerrar={() => llamadas.push("cerrar")} />)
  );
  return llamadas;
}

it("apagado: sale directamente la pregunta de activar, y Cancelar cierra", async () => {
  const llamadas = await abrir({ modoPruebasActivo: false });
  expect(document.body.textContent).toContain("¿Activar Modo Pruebas?");
  expect(document.body.textContent).not.toContain("Guarda una foto de todo ahora mismo");
  await act(async () => boton("Cancelar").click());
  expect(llamadas).toEqual(["cerrar"]);
});

it("apagado: «Sí, activar» lo activa", async () => {
  const llamadas = await abrir({ modoPruebasActivo: false });
  await act(async () => boton("Sí, activar").click());
  expect(llamadas).toEqual(["activar"]);
});

it("activo: sale directamente la pregunta de desactivar", async () => {
  const llamadas = await abrir({ modoPruebasActivo: true });
  expect(document.body.textContent).toContain("¿Desactivar y restaurar todo?");
  await act(async () => boton("Sí, restaurar").click());
  expect(llamadas).toEqual(["desactivar"]);
});
