// @vitest-environment jsdom
// El inicio de sesión cuando el correo está sin confirmar o el enlace ha
// caducado (él, v53). Supabase va simulado: nada sale de aquí.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

const llamadas = { resend: [] };
let respuestaLogin = { error: null };
vi.mock("../supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: async () => respuestaLogin,
      resend: async (datos) => {
        llamadas.resend.push(datos);
        return { error: null };
      },
      signUp: async () => ({ data: {}, error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
    },
  },
}));
let enlace = "";
vi.mock("../lib/enlaceAuth", async (original) => ({
  ...(await original()),
  get errorDelEnlace() {
    return enlace;
  },
  limpiarErrorDelEnlace: () => {},
}));

const { VistaLogin } = await import("./VistaLogin");

const escribir = (input, valor) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

async function entrarCon(respuesta) {
  respuestaLogin = respuesta;
  const vista = montar(<VistaLogin />);
  escribir(vista.contenedor.querySelector('input[type="email"]'), "ana@correo.es");
  escribir(vista.contenedor.querySelector('input[type="password"]'), "contraseña-buena");
  await act(async () => vista.contenedor.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  return vista;
}
const boton = (vista, texto) => [...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.trim() === texto);

describe("entrar con el correo sin confirmar", () => {
  beforeEach(() => {
    llamadas.resend = [];
    enlace = "";
  });

  it("dice que falta confirmar (no «contraseña incorrecta») y ofrece reenviar el correo", async () => {
    const vista = await entrarCon({ error: { code: "email_not_confirmed", message: "Email not confirmed" } });
    expect(vista.contenedor.textContent).toContain("Todavía no has confirmado tu correo");
    expect(vista.contenedor.textContent).not.toContain("Email o contraseña incorrectos");
    await act(async () => boton(vista, "Reenviar correo de confirmación").click());
    expect(llamadas.resend).toEqual([{ type: "signup", email: "ana@correo.es" }]);
    expect(vista.contenedor.textContent).toContain("Te hemos enviado otro correo de confirmación a ana@correo.es");
    vista.desmontar();
  });

  it("con la contraseña mal, sigue diciendo «Email o contraseña incorrectos», sin botón de reenviar", async () => {
    const vista = await entrarCon({ error: { code: "invalid_credentials", message: "Invalid login credentials" } });
    expect(vista.contenedor.textContent).toContain("Email o contraseña incorrectos");
    expect(boton(vista, "Reenviar correo de confirmación")).toBeFalsy();
    vista.desmontar();
  });

  it("al llegar con un enlace caducado, lo dice nada más entrar", () => {
    enlace = "otp_expired";
    const vista = montar(<VistaLogin />);
    expect(vista.contenedor.textContent).toContain("El enlace ha caducado o ya se usó");
    vista.desmontar();
  });
});
