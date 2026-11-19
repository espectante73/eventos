// A quién llega la invitación (v83.2): a todos los de la familia con email.
import { describe, it, expect } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { useMotorInvitaciones } from "./useMotorInvitaciones";

function motorCon(extra = {}) {
  const visto = {};
  const data = { evento: { nombre: "La boda", acomodacionTerminada: true }, colaboradores: [], invitados: [], ordenFamiliares: {}, persistOrdenFamiliares: () => {}, enviarInvitacionFamilia: async () => true, ...extra };
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

describe("«Acomodación terminada» (v90.7): hasta marcarla, no sale ninguna", () => {
  it("sin marcar, no se envía nada aunque algo llegue a pedirlo", async () => {
    const pedidos = [];
    const { visto, vista } = motorCon({
      evento: { nombre: "La boda" },
      enviarInvitacionFamilia: async (c) => (pedidos.push(c), true),
    });
    expect(visto.envioBloqueado).toBe(true);
    let r;
    await act(async () => {
      r = await visto.enviarATodos(["a@a.com"], "<p>x</p>", "QUJD");
    });
    expect(r).toEqual({ enviados: [], fallidos: ["a@a.com"] });
    expect(pedidos).toEqual([]);
    vista.desmontar();
  });

  it("marcada, o en Modo Pruebas (los correos van al anfitrión), se puede", () => {
    let m = motorCon();
    expect(m.visto.envioBloqueado).toBe(false);
    m.vista.desmontar();
    m = motorCon({ evento: { modoPruebasActivo: true } });
    expect(m.visto.envioBloqueado).toBe(false);
    m.vista.desmontar();
  });
});
