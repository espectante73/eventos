// La puerta del tablón, DIBUJADA (v88.6, él): con «Solo con enlace
// personal», el enlace general solo dice que se pida el acceso al
// colaborador; el personal sigue pidiendo solo el año.
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { SOLO_PERSONAL, AVISO_ENLACE_PERSONAL, AVISO_ENLACE_GENERAL } from "../lib/tablonEntrada";

const CLAVE = "0123456789abcdef";
const llamadas = [];
let soloPersonal = false;
let valen = [];
let quien = null;
let cerradas = false;
const servidor = {
  tablon_verificar_token: () => true,
  evento_publico: () => ({ nombre: "Las Bodas de todos", tablonSoloPersonal: soloPersonal, cancionesCerradas: cerradas }),
  tablon_obtener_pregunta: () => "Apellido familiar y nombre",
  tablon_anios: () => ({ desde: 1950, hasta: 2000 }),
  tablon_por_clave: (a) => (a.p_clave === CLAVE ? { nombre: "Pacheco, Ana", respuesta: CLAVE } : null),
  tablon_verificar_respuesta: (a) => valen.includes(a.p_respuesta),
  tablon_falta_anio: () => false,
  tablon_quien_soy: () => quien,
};
vi.mock("../supabaseClient", () => ({
  supabase: {
    rpc: async (nombre, args) => {
      llamadas.push({ nombre, args });
      return { data: servidor[nombre] ? servidor[nombre](args) : null, error: null };
    },
    // La música de fondo: ninguna.
    storage: { from: () => ({ list: async () => ({ data: [] }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
  },
}));
const { VistaTablon } = await import("./VistaTablon");

const enlace = (consulta) => window.history.replaceState(null, "", `/?tablon=t1${consulta}`);
const abrir = async () => {
  const vista = montar(<VistaTablon token="t1" />);
  for (let i = 0; i < 5; i++) await act(async () => {});
  return vista;
};
const texto = () => document.body.textContent;

beforeEach(() => {
  llamadas.length = 0;
  soloPersonal = false;
  valen = [];
  quien = null;
  cerradas = false;
  enlace("");
  try {
    localStorage.clear();
  } catch {
    /* sin memoria */
  }
});
afterEach(() => enlace(""));

it("con la casilla, el enlace general solo dice que se pida el acceso al colaborador", async () => {
  soloPersonal = true;
  const vista = await abrir();
  expect(texto()).toContain(SOLO_PERSONAL);
  expect(document.body.querySelector("form")).toBeNull();
  expect(document.body.querySelector("input")).toBeNull();
  vista.desmontar();
});

it("sin la casilla, la puerta de siempre: apellido, nombre y año", async () => {
  const vista = await abrir();
  expect(texto()).not.toContain(SOLO_PERSONAL);
  expect(document.body.querySelector('input[placeholder="Ej.: Apellido Nombre"]')).not.toBeNull();
  expect(texto()).toContain(AVISO_ENLACE_GENERAL);
  vista.desmontar();
});

it("con la casilla, el enlace personal pide solo el año, y «¿No eres tú?» lleva al mensaje", async () => {
  soloPersonal = true;
  enlace(`&yo=${CLAVE}`);
  const vista = await abrir();
  expect(texto()).toContain("Hola, Pacheco, Ana");
  // El aviso rojo: lo manda su colaborador, no el grupo de WhatsApp (v91.6).
  expect(texto()).toContain(AVISO_ENLACE_PERSONAL);
  expect(texto()).not.toContain("WhatsApp");
  expect(document.body.querySelector('input[placeholder="Ej.: Apellido Nombre"]')).toBeNull();
  const noSoyYo = [...document.body.querySelectorAll("button")].find((b) => b.textContent === "¿No eres tú?");
  expect(noSoyYo).toBeTruthy();
  await act(async () => noSoyYo.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(texto()).toContain(SOLO_PERSONAL);
  vista.desmontar();
});

it("lo guardado de antes con su nombre entra con su enlace, ya con su clave, y se recuerda así", async () => {
  soloPersonal = true;
  valen = [`${CLAVE} 1975`];
  enlace(`&yo=${CLAVE}`);
  localStorage.setItem("tablon-respuesta-t1", "Pacheco Ana 1975");
  const vista = await abrir();
  expect(llamadas.find((l) => l.nombre === "tablon_verificar_respuesta").args.p_respuesta).toBe(`${CLAVE} 1975`);
  expect(localStorage.getItem("tablon-respuesta-t1")).toBe(`${CLAVE} 1975`);
  vista.desmontar();
});

it("con la casilla, lo guardado con el nombre por el enlace general ya no entra: el mensaje", async () => {
  soloPersonal = true;
  localStorage.setItem("tablon-respuesta-t1", "Pacheco Ana 1975");
  const vista = await abrir();
  expect(texto()).toContain(SOLO_PERSONAL);
  expect(localStorage.getItem("tablon-respuesta-t1")).toBeNull();
  vista.desmontar();
});

// v92.1 (él): sus canciones, desde el tablón, solo con su enlace personal;
// v92.3: dentro de «Comprueba tus datos», con «Cambiar».
const ANA = { nombre: "Pacheco, Ana", cancion: "Titanium — David Guetta", alergias: "", datosCompletos: true };
const abrirDatos = async () => {
  const titulo = [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Comprueba tus datos"));
  await act(async () => titulo.dispatchEvent(new MouseEvent("click", { bubbles: true })));
};

it("dentro con su enlace personal, «Cambiar» junto a sus canciones; por la puerta general, solo se ven", async () => {
  valen = [`${CLAVE} 1975`, "Pacheco Ana 1975"];
  quien = ANA;
  enlace(`&yo=${CLAVE}`);
  localStorage.setItem("tablon-respuesta-t1", `${CLAVE} 1975`);
  let vista = await abrir();
  expect(texto()).toContain("Has entrado como Pacheco, Ana");
  await abrirDatos();
  expect(texto()).toContain("Titanium — David Guetta");
  expect(document.body.querySelector('button[title="Cambiar tus canciones"]')).toBeTruthy();
  // La tarjeta aparte de la v92.1 ya no está.
  expect(texto()).not.toContain("Tus canciones para bailar");
  vista.desmontar();

  enlace("");
  localStorage.setItem("tablon-respuesta-t1", "Pacheco Ana 1975");
  vista = await abrir();
  expect(texto()).toContain("Has entrado como Pacheco, Ana");
  await abrirDatos();
  expect(texto()).toContain("Titanium — David Guetta");
  expect(document.body.querySelector('button[title="Cambiar tus canciones"]')).toBeNull();
  vista.desmontar();
});

// v92.2 (él: «no veo dónde editar las canciones»): abrió el tablón sin su
// clave en la dirección (enlace general, icono, marcador), pero este móvil
// recuerda que entró con su enlace personal.
it("sin la clave en la dirección, pero recordando su enlace personal: puede cambiarlas, y su email se pide con su clave", async () => {
  valen = [`${CLAVE} 1975`];
  quien = ANA;
  localStorage.setItem("tablon-respuesta-t1", `${CLAVE} 1975`);
  const vista = await abrir();
  await abrirDatos();
  expect(document.body.querySelector('button[title="Cambiar tus canciones"]')).toBeTruthy();
  expect(texto()).toContain(AVISO_ENLACE_PERSONAL);
  const email = llamadas.find((l) => l.nombre === "tablon_mi_email");
  expect(email.args.p_clave).toBe(CLAVE);
  vista.desmontar();
});

// v92.4 (él): con el tablón ya abierto, el anfitrión abrió las canciones y
// «Cambiar» no salía hasta el minuto. Ahora se vuelve a leer al abrir
// «Comprueba tus datos» y al volver a su ventana.
it("si el anfitrión abre las canciones con el tablón abierto, «Cambiar» sale al abrir «Comprueba tus datos»", async () => {
  valen = [`${CLAVE} 1975`];
  quien = ANA;
  cerradas = true;
  localStorage.setItem("tablon-respuesta-t1", `${CLAVE} 1975`);
  const vista = await abrir();
  const cambiar = () => document.body.querySelector('button[title="Cambiar tus canciones"]');
  await abrirDatos();
  expect(cambiar()).toBeNull();
  await abrirDatos(); // plegarlo
  cerradas = false;
  await abrirDatos();
  for (let i = 0; i < 3; i++) await act(async () => {});
  expect(cambiar()).toBeTruthy();
  vista.desmontar();
});

it("al volver a la ventana del tablón, lo vuelve a leer", async () => {
  valen = [`${CLAVE} 1975`];
  quien = ANA;
  localStorage.setItem("tablon-respuesta-t1", `${CLAVE} 1975`);
  const vista = await abrir();
  const lecturas = () => llamadas.filter((l) => l.nombre === "evento_publico").length;
  const antes = lecturas();
  await act(async () => window.dispatchEvent(new Event("focus")));
  expect(lecturas()).toBe(antes + 1);
  vista.desmontar();
});
