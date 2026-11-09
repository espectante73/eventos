// A quién llega la invitación (v83.2): a todos los de la familia con email.
import { describe, it, expect } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { useMotorInvitaciones } from "./useMotorInvitaciones";

function motorCon(extra = {}) {
  const visto = {};
  const data = { evento: { nombre: "La boda" }, colaboradores: [], invitados: [], ordenFamiliares: {}, persistOrdenFamiliares: () => {}, enviarInvitacionFamilia: async () => true, ...extra };
  function Prueba() {
    Object.assign(visto, useMotorInvitaciones(data));
    return null;
  }
  return { visto, vista: montar(<Prueba />) };
}
const familia = (...correos) => ({ confirmados: correos.map((email, i) => ({ id: String(i), nombre: "X", email })) });

describe("a quién llega la invitación", () => {
  it("a todos con email, sin repetir", () => {
    const { visto, vista } = motorCon();
    expect(visto.destinatariosConEmail(familia("a@a.com", "", "b@b.com", "a@a.com"))).toEqual(["a@a.com", "b@b.com"]);
    vista.desmontar();
  });

  it("sin ningún email, a nadie; en Modo Pruebas se prueba igual (va al anfitrión)", () => {
    let m = motorCon();
    expect(m.visto.destinatariosConEmail(familia(""))).toEqual([]);
    m.vista.desmontar();
    m = motorCon({ evento: { modoPruebasActivo: true } });
    expect(m.visto.destinatariosConEmail(familia(""))).toEqual([""]);
    m.vista.desmontar();
  });

  it("dice a quién ha llegado y a quién no", async () => {
    const { visto, vista } = motorCon({ enviarInvitacionFamilia: async (c) => c !== "mal@a.com" });
    let r;
    await act(async () => {
      r = await visto.enviarATodos(["a@a.com", "mal@a.com"], "<p>x</p>", "QUJD");
    });
    expect(r).toEqual({ enviados: ["a@a.com"], fallidos: ["mal@a.com"] });
    vista.desmontar();
  });
});
