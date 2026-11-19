// «Canciones para bailar» en la cuenta del DJ (v91.5), DIBUJADA: la pide a la
// base sin enlace ni clave; si no tiene el permiso, lo dice; el anfitrión,
// con «Cambiar vista», la ve con sus propios datos.
import { it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

const llamadas = [];
let respuesta = null;
vi.mock("../supabaseClient", () => ({
  supabase: {
    rpc: async (nombre, args) => {
      llamadas.push({ nombre, args });
      return respuesta();
    },
  },
}));
const { VentanaCancionesDj } = await import("./VentanaCancionesDj");

const DATOS = {
  evento: "Las Bodas de todos.",
  catalogo: {},
  peticiones: [
    { cancion: "Tu Cariñito — Edwin Rivera", edad: 31 },
    { cancion: "Bailando — Enrique Iglesias", edad: 62 },
  ],
};

beforeEach(() => {
  llamadas.length = 0;
  respuesta = () => ({ data: DATOS, error: null });
});

const abrir = async (data) => {
  let vista;
  await act(async () => {
    vista = montar(<VentanaCancionesDj data={{ buscarParaEscuchar: async () => ({}), ...data }} onCerrar={() => {}} />);
  });
  return vista;
};

it("el DJ con su cuenta: la pide a la base, sin enlace ni clave, y enseña la lista sin nombres", async () => {
  const vista = await abrir({ esAnfitrion: false });
  expect(llamadas.map((l) => l.nombre)).toEqual(["colaborador_canciones_dj"]);
  const texto = document.body.textContent;
  expect(texto).toContain("Canciones para bailar");
  expect(texto).toContain("Tu Cariñito — Edwin Rivera");
  expect(texto).toContain("Peticiones");
  vista.desmontar();
});

it("sin el permiso, lo dice en sencillo", async () => {
  respuesta = () => ({ data: { error: "permiso" }, error: null });
  const vista = await abrir({ esAnfitrion: false });
  expect(document.body.textContent).toContain("pide al anfitrión que revise tu permiso «Canciones para bailar»");
  vista.desmontar();
});

it("el anfitrión, con «Cambiar vista», la ve con sus datos sin preguntar a la base", async () => {
  const vista = await abrir({
    esAnfitrion: true,
    evento: { nombre: "La boda", fecha: "2026-12-11" },
    invitados: [
      { id: "g1", cancion: "Bamboleo — Gipsy Kings", anioNacimiento: "1990" },
      { id: "g2", cancion: "" },
    ],
  });
  expect(llamadas).toEqual([]);
  expect(document.body.textContent).toContain("Bamboleo — Gipsy Kings");
  expect(document.body.textContent).toContain("36");
  vista.desmontar();
});
