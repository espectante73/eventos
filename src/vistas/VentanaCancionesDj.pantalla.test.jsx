// «Canciones para bailar» en la cuenta del DJ (v91.5), DIBUJADA: la pide a la
// base sin enlace ni clave; si no tiene el permiso, lo dice; el anfitrión,
// con «Cambiar vista», la ve con sus propios datos. v92: lo nuevo desde la
// última vez que la vio un día anterior, en rojo y con «Ver solo esas».
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
const { useCancionesDj } = await import("../lib/useCancionesDj");
const { clavesDelDj, diaDe } = await import("../lib/dj");

// Como en su pantalla: el motor (useCancionesDj) y la ventana abierta.
function Prueba({ data }) {
  const canciones = useCancionesDj({ activo: true, esAnfitrion: data.esAnfitrion, invitados: data.invitados, evento: data.evento, quien: "dj1", mirando: true });
  return <VentanaCancionesDj canciones={canciones} esAnfitrion={data.esAnfitrion} escuchar={async () => ({})} onCerrar={() => {}} />;
}

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
  localStorage.clear();
});

const abrir = async (data) => {
  let vista;
  await act(async () => {
    vista = montar(<Prueba data={data} />);
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

it("la primera vez de todas, nada sale como nuevo", async () => {
  const vista = await abrir({ esAnfitrion: false });
  expect(document.body.textContent).not.toContain("nueva");
  expect(document.body.textContent).not.toContain("NUEVA");
  vista.desmontar();
});

it("lo que no estaba ayer sale en rojo, con su título en rojo, y «Ver solo esas» deja solo esa (y lo que se exporta)", async () => {
  const ayer = clavesDelDj({ peticiones: [DATOS.peticiones[1]] });
  localStorage.setItem("canciones-dj-vistas-dj1", JSON.stringify({ dia: "2026-11-18", desde: "2026-11-18", referencia: ayer, ultima: ayer }));
  const vista = await abrir({ esAnfitrion: false });
  const texto = () => document.body.textContent;
  expect(texto()).toContain("1 canción nueva o cambiada desde el 18 nov");
  const marcadas = [...document.body.querySelectorAll(".sr-only")].filter((e) => e.textContent.includes("nueva o cambiada"));
  expect(marcadas.length).toBe(1);
  expect(marcadas[0].parentElement.textContent).toContain("Tu Cariñito");
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes(t));
  vista.pulsar(boton("Ver solo esas"));
  expect(texto()).toContain("Tu Cariñito");
  expect(texto()).not.toContain("Bailando");
  vista.pulsar(boton("Ver todas"));
  expect(texto()).toContain("Bailando");
  // Hoy ya la ha visto: se recuerda, y con qué se compara sigue siendo lo de ayer.
  const memoria = JSON.parse(localStorage.getItem("canciones-dj-vistas-dj1"));
  expect(memoria.dia).toBe(diaDe());
  expect(memoria.referencia).toEqual(ayer);
  expect(memoria.ultima).toEqual(clavesDelDj(DATOS));
  vista.desmontar();
});
