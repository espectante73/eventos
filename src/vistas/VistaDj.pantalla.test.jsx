// La página del DJ (v81), DIBUJADA: pide la clave, luego enseña la lista
// sin nombres, filtra por edad y lleva cada canción a Deezer.
import { it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

const llamadas = [];
let respuesta = null;
vi.mock("../supabaseClient", () => ({
  supabase: {
    rpc: async (nombre, args) => {
      llamadas.push({ nombre, args });
      return respuesta(args);
    },
  },
}));
const { VistaDj } = await import("./VistaDj");

const DATOS = {
  nombre: "DJ Brown",
  evento: "Las Bodas de todos.",
  catalogo: { tucarinito: { titulo: "Tu Cariñito", artista: "Edwin Rivera", duracion: 241, deezer: 3221906111, consulta: "Tu Cariñito Edwin Rivera" } },
  peticiones: [
    { cancion: "Tu Cariñito — Edwin Rivera", edad: 31 },
    { cancion: "Bailando — Enrique Iglesias", edad: 62 },
  ],
};

beforeEach(() => {
  llamadas.length = 0;
  try {
    localStorage.clear();
  } catch {
    /* sin memoria */
  }
  respuesta = (args) => ({ data: args.p_clave === "K7M4R" ? DATOS : { error: "clave" }, error: null });
});

const escribir = async (etiqueta, valor) => {
  const campo = document.body.querySelector(`input[aria-label="${etiqueta}"]`);
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(campo, valor);
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const entrar = () => act(async () => document.body.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

it("con la clave equivocada lo dice; con la buena (da igual en minúsculas), la lista sin nombres y con su enlace a Deezer", async () => {
  const vista = montar(<VistaDj token="t1" />);
  await escribir("Clave", "XXXXX");
  await entrar();
  expect(document.body.textContent).toContain("Esa clave no es. Son 5 letras y números; dan igual las mayúsculas.");
  await escribir("Clave", "k7m4r");
  await entrar();
  expect(llamadas.at(-1)).toEqual({ nombre: "dj_canciones", args: { p_token: "t1", p_clave: "K7M4R" } });
  expect(document.body.textContent).toContain("Las Bodas de todos. · DJ Brown");
  expect(document.body.textContent).toContain("Tu Cariñito — Edwin Rivera");
  const enlace = [...document.body.querySelectorAll("a")].find((a) => a.textContent.includes("Tu Cariñito"));
  expect(enlace.href).toBe("https://www.deezer.com/track/3221906111");
  // Este aparato la recuerda.
  expect(localStorage.getItem("dj-clave:t1")).toBe("K7M4R");
  vista.desmontar();
});

it("filtra por un tramo de edad", async () => {
  localStorage.setItem("dj-clave:t2", "K7M4R");
  let vista;
  await act(async () => {
    vista = montar(<VistaDj token="t2" />);
  });
  expect(document.body.textContent).toContain("Bailando — Enrique Iglesias");
  await escribir("Edad desde", "50");
  expect(document.body.textContent).toContain("Bailando — Enrique Iglesias");
  expect(document.body.textContent).not.toContain("Tu Cariñito — Edwin Rivera");
  vista.desmontar();
});

it("si el enlace ya no vale, lo dice y pide la clave otra vez", async () => {
  localStorage.setItem("dj-clave:t3", "K7M4R");
  respuesta = () => ({ data: { error: "enlace" }, error: null });
  let vista;
  await act(async () => {
    vista = montar(<VistaDj token="t3" />);
  });
  expect(document.body.textContent).toContain("Este enlace ya no vale. Pide al anfitrión uno nuevo.");
  expect(localStorage.getItem("dj-clave:t3")).toBe(null);
  vista.desmontar();
});
