// @vitest-environment jsdom
// El inicio de sesión cuando el correo está sin confirmar o el enlace ha
// caducado (él, v53). Supabase va simulado: nada sale de aquí.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

const llamadas = { resend: [] };
let respuestaLogin = { error: null };
let respuestaAlta = { data: {}, error: null };
vi.mock("../supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: async () => respuestaLogin,
      resend: async (datos) => {
        llamadas.resend.push(datos);
        return { error: null };
      },
      signUp: async () => respuestaAlta,
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

// v53.3: el email ya tenía cuenta. Supabase no envía nada y responde como
// si todo fuera bien; la app lo nota sola y lo dice.
describe("crear cuenta con un email que ya la tiene", () => {
  it("no dice «Tu cuenta ya está creada»: pasa a Entrar y avisa de que ya tiene cuenta", async () => {
    respuestaAlta = { data: { session: null, user: { identities: [] } }, error: null };
    const vista = montar(<VistaLogin modoInicial="crear" />);
    escribir(vista.contenedor.querySelector('input[type="email"]'), "ya@correo.es");
    escribir(vista.contenedor.querySelector('input[type="password"]'), "contraseña-larga");
    await act(async () => vista.contenedor.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(vista.contenedor.textContent).not.toContain("Tu cuenta ya está creada");
    expect(vista.contenedor.textContent).toContain("Ese email ya tiene cuenta");
    expect(vista.contenedor.querySelector("h1").textContent).toBe("Entrar");
    expect(vista.contenedor.querySelector('input[type="email"]').value).toBe("ya@correo.es");
    vista.desmontar();
  });

  it("con un email nuevo, sigue saliendo «Tu cuenta ya está creada»", async () => {
    respuestaAlta = { data: { session: null, user: { identities: [{ id: "1" }] } }, error: null };
    const vista = montar(<VistaLogin modoInicial="crear" />);
    escribir(vista.contenedor.querySelector('input[type="email"]'), "nuevo@correo.es");
    escribir(vista.contenedor.querySelector('input[type="password"]'), "contraseña-larga");
    await act(async () => vista.contenedor.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(vista.contenedor.textContent).toContain("Tu cuenta ya está creada");
    vista.desmontar();
  });
});

