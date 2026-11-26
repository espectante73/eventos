// Quién más hay en el canal del mando (v102.2): «los otros» son los otros,
// no este aparato. Sin la clave de presencia propia, Supabase daba a cada
// conexión una suya y cada aparato se contaba a sí mismo entre los otros:
// un Mac que suena habría visto «otro reproductor» siendo él solo.
import { it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

const canal = vi.hoisted(() => ({ config: null, alSincronizar: null, presentes: {} }));
vi.mock("../supabaseClient", () => ({
  supabase: {
    channel: (_nombre, opciones) => {
      canal.config = opciones.config;
      return {
        on(tipo, _filtro, fn) {
          if (tipo === "presence") canal.alSincronizar = fn;
          return this;
        },
        subscribe() {
          return this;
        },
        presenceState: () => canal.presentes,
        track() {},
        send() {},
        state: "joined",
      };
    },
    removeChannel: () => {},
  },
}));
const { useMandoMusica } = await import("./useMandoMusica");

function Sonda() {
  const { reproductoresOtros, hayReproductor, hayMando } = useMandoMusica({ rol: "reproductor" });
  return <span data-sonda>{`${reproductoresOtros}|${hayReproductor}|${hayMando}`}</span>;
}

it("se presenta con su propia clave y no se cuenta entre los otros; dos que suenan se cuentan", async () => {
  const vista = montar(<Sonda />);
  const yo = canal.config.presence.key;
  expect(yo).toMatch(/\S/);
  const texto = () => document.body.querySelector("[data-sonda]").textContent;
  // Solo él: ningún otro reproductor.
  canal.presentes = { [yo]: [{ rol: "reproductor" }], movil: [{ rol: "mando" }] };
  await act(async () => canal.alSincronizar());
  expect(texto()).toBe("0|false|true");
  // Otro Mac que también suena.
  canal.presentes = { ...canal.presentes, otroMac: [{ rol: "reproductor" }] };
  await act(async () => canal.alSincronizar());
  expect(texto()).toBe("1|true|true");
  vista.desmontar();
});
