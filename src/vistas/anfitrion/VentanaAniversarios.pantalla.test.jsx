// Aniversarios (v71.1, él): dos botones para bajar las originales, «Todas»
// y «Nuevas», que cuenta solo las que aún no tienen foto en Aniversario.
import { it, expect, vi } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { ROL_FAMILIAR } from "../../lib/rolFamiliar";

// Sin almacén de verdad: los enlaces temporales no hacen falta aquí.
vi.mock("../../lib/fotosAlmacen", async (original) => ({ ...(await original()), enlacesTemporales: async () => ({}) }));
const { VentanaAniversarios } = await import("./VentanaAniversarios");

const g = (id, nombre, familia, rol) => ({ id, nombre, apellido: familia, grupoFamiliar: `${familia}01`, rolFamiliar: rol, anioBoda: "2010", confirmado: true });
const invitados = [
  g("1", "Adriano", "Martíni", ROL_FAMILIAR.ESPOSO),
  g("2", "Rosi", "Martíni", ROL_FAMILIAR.ESPOSA),
  g("3", "Emiliano", "Medina", ROL_FAMILIAR.ESPOSO),
  g("4", "Ana", "Medina", ROL_FAMILIAR.ESPOSA),
];

it("«Todas» y «Nuevas (1)»: la que ya tiene su foto en Aniversario no cuenta", () => {
  const vista = montar(
    <VentanaAniversarios
      data={{
        invitados,
        evento: { fecha: "2026-12-11" },
        fotosFamiliares: { Martíni01: "boda/martini01.jpg", Medina01: "boda/medina01.jpg" },
        fotosAniversario: { Medina01: "aniversario/medina01.jpg" },
        fotosBodaFinal: {},
        fotosSinBoda: {},
        persistFotosAniversario: () => {},
        persistFotosBodaFinal: () => {},
      }}
      onCerrar={() => {}}
    />
  );
  const textos = [...document.body.querySelectorAll("button")].map((b) => b.textContent.trim());
  expect(textos).toContain("Todas");
  expect(textos).toContain("Nuevas (1)");
  vista.desmontar();
});

// v71.2: la hoja de encargo de «Nuevas» es solo de las que se descargan; las
// que aún esperan su foto de boda no la impiden.
it("«Nuevas» trae su hoja de encargo aunque otros matrimonios esperen su foto", async () => {
  const { act } = await import("react");
  const descargas = [];
  const espera = [g("5", "Jesús", "Ramírez", ROL_FAMILIAR.ESPOSO), g("6", "Paulina", "Ramírez", ROL_FAMILIAR.ESPOSA)];
  const vista = montar(
    <VentanaAniversarios
      data={{
        invitados: [...invitados, ...espera],
        evento: { fecha: "2026-12-11" },
        fotosFamiliares: { Martíni01: "data:image/jpeg;base64,eA==", Medina01: "boda/medina01.jpg" },
        fotosAniversario: { Medina01: "aniversario/medina01.jpg" },
        fotosBodaFinal: {},
        fotosSinBoda: {},
        persistFotosAniversario: () => {},
        persistFotosBodaFinal: () => {},
      }}
      onCerrar={() => {}}
    />
  );
  const original = URL.createObjectURL;
  const fetchOriginal = globalThis.fetch;
  URL.createObjectURL = (blob) => (descargas.push(blob), "blob:prueba");
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
  const nuevas = [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Nuevas (1)");
  await act(async () => nuevas.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await act(async () => {});
  expect(document.body.textContent).not.toContain("Faltan datos por recoger");
  expect(descargas).toHaveLength(1);
  const texto = new TextDecoder().decode(new Uint8Array(await descargas[0].arrayBuffer()));
  expect(texto).toContain("Hoja de encargo.txt");
  expect(texto).toContain("Martíni01 - Adriano y Rosi - 2010.jpg");
  URL.createObjectURL = original;
  globalThis.fetch = fetchOriginal;
  vista.desmontar();
});

it("solo los confirmados (v71.3): una pareja sin confirmar no sale", () => {
  const sinConfirmar = [
    { ...g("7", "Luis", "Gil", ROL_FAMILIAR.ESPOSO), confirmado: false },
    { ...g("8", "Eva", "Gil", ROL_FAMILIAR.ESPOSA), confirmado: false },
  ];
  const vista = montar(
    <VentanaAniversarios
      data={{
        invitados: [...invitados, ...sinConfirmar],
        evento: { fecha: "2026-12-11" },
        fotosFamiliares: {},
        fotosAniversario: {},
        fotosBodaFinal: {},
        fotosSinBoda: {},
        persistFotosAniversario: () => {},
        persistFotosBodaFinal: () => {},
      }}
      onCerrar={() => {}}
    />
  );
  expect(document.body.textContent).toContain("Adriano y Rosi");
  expect(document.body.textContent).not.toContain("Luis y Eva");
  vista.desmontar();
});
