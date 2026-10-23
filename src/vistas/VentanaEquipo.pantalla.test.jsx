// La ventana «Equipo» del colaborador (v73.1), DIBUJADA de verdad.
import { it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { ROL_FAMILIAR } from "../lib/rolFamiliar";

const respuestas = [];
vi.mock("../supabaseClient", () => ({ supabase: { rpc: async () => respuestas.shift() } }));
const { VentanaEquipo } = await import("./VentanaEquipo");

const filas = (vista) => [...vista.contenedor.querySelectorAll("[data-equipo]")].map((f) => f.dataset.equipo);

it("el colaborador lo pide al servidor: alfabético, el esposo arriba, y el suyo con «(tú)»", async () => {
  respuestas.push({
    data: [
      { id: "c3", apellido: "Sierra", nombre: "Raul", grupoFamiliar: "Sierra01", rolFamiliar: "", zona: "Puerto", esYo: false },
      { id: "c1", apellido: "Álvarez", nombre: "Noelia", grupoFamiliar: "Álvarez01", rolFamiliar: ROL_FAMILIAR.ESPOSA, zona: "Icod", esYo: true },
      { id: "c2", apellido: "Álvarez", nombre: "Rodrigo", grupoFamiliar: "Álvarez01", rolFamiliar: ROL_FAMILIAR.ESPOSO, zona: "Icod", esYo: false },
    ],
    error: null,
  });
  const vista = montar(<VentanaEquipo data={{ esAnfitrion: false }} colaboradorId="c1" onCerrar={() => {}} />);
  await act(async () => {});
  expect(filas(vista)).toEqual(["Álvarez, Rodrigo", "Álvarez, Noelia", "Sierra, Raul"]);
  expect(vista.html).toContain("(tú)");
  expect(vista.html).toContain("3 colaboradores");
  vista.desmontar();
});

it("si el servidor no contesta, lo dice en vez de quedarse cargando", async () => {
  respuestas.push({ data: null, error: { message: "fallo" } });
  const vista = montar(<VentanaEquipo data={{ esAnfitrion: false }} colaboradorId="c1" onCerrar={() => {}} />);
  await act(async () => {});
  expect(vista.html).toContain("No se ha podido cargar el equipo");
  vista.desmontar();
});

it("el anfitrión, viendo el panel de un colaborador, lo saca de sus datos", () => {
  const data = {
    esAnfitrion: true,
    colaboradores: [{ id: "c1", nombre: "Pacheco, Scarly", invitadoId: "g1" }],
    invitados: [{ id: "g1", apellido: "Pacheco", nombre: "Scarly", zona: "Icod", grupoFamiliar: "Pacheco01" }],
  };
  const vista = montar(<VentanaEquipo data={data} colaboradorId="c1" onCerrar={() => {}} />);
  expect(filas(vista)).toEqual(["Pacheco, Scarly"]);
  expect(vista.html).toContain("Icod");
  vista.desmontar();
});
