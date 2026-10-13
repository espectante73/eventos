// @vitest-environment jsdom
// v64.6: en las páginas de Multimedia del ordenador, la sesión se renueva
// también con la página por detrás; dentro de la app, no hace falta.
import { it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

const llamadas = [];
vi.mock("../supabaseClient", () => ({ supabase: { auth: { startAutoRefresh: () => llamadas.push("start") } } }));
const { useSesionSiempreViva } = await import("./sesionViva");

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function Prueba({ activo }) {
  useSesionSiempreViva(activo);
  return null;
}

it("renueva la sesión en segundo plano solo cuando se le pide", async () => {
  const raiz = createRoot(document.createElement("div"));
  await act(async () => raiz.render(<Prueba activo={false} />));
  expect(llamadas).toEqual([]);
  await act(async () => raiz.render(<Prueba activo />));
  expect(llamadas).toEqual(["start"]);
  await act(async () => raiz.unmount());
});
