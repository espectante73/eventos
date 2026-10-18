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
