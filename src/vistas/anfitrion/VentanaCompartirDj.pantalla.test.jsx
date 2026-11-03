// «Compartir con el DJ» (v81), DIBUJADA: crear el enlace, ver la clave y
// cuándo entró, y el aviso si se bloqueó.
import { it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaCompartirDj } from "./VentanaCompartirDj";

const DJ = { token: "abc", clave: "K7M4R", nombre: "DJ Brown", fallos: 0, ultimoAcceso: null };

async function abrir(dj, extra = {}) {
  const data = {
    evento: { nombre: "Las Bodas de todos.", urlPublica: "https://nexuspoint.rsvp" },
    leerDj: vi.fn(async () => ({ dj })),
    compartirDj: vi.fn(async (nombre) => ({ dj: { ...DJ, nombre } })),
    dejarDj: vi.fn(async () => ({ dj: null })),
    ...extra,
  };
  let vista;
  await act(async () => {
    vista = montar(<VentanaCompartirDj data={data} onCerrar={() => {}} />);
  });
  return { vista, data };
}

it("sin compartir: con su nombre, crea el enlace y enseña la clave para dársela por teléfono", async () => {
  const { vista, data } = await abrir(null);
  const crear = [...document.body.querySelectorAll("button")].find((b) => b.textContent === "Crear enlace");
  await act(async () => crear.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(data.compartirDj).toHaveBeenCalledWith("DJ Brown");
  expect(document.body.textContent).toContain("https://nexuspoint.rsvp?dj=abc");
  expect(document.body.textContent).toContain("K7M4R");
  expect(document.body.textContent).toContain("dísela por teléfono");
  expect(document.body.textContent).toContain("Todavía no ha entrado.");
  vista.desmontar();
});

it("bloqueado tras 10 claves equivocadas: lo dice", async () => {
  const { vista } = await abrir({ ...DJ, fallos: 10 });
  expect(document.body.textContent).toContain("Bloqueado tras 10 claves equivocadas");
  vista.desmontar();
});
