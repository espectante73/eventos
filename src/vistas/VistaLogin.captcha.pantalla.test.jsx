// @vitest-environment jsdom
// v53.2: al volver de "Tu cuenta ya está creada" con "Ya la he confirmado
// — entrar", el formulario tiene que traer su captcha. Antes volvía sin él
// y "Entrar" se quedaba bloqueado sin decir nada (le pasaba a todo
// colaborador nuevo). El captcha y Supabase van simulados.
import { it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "clave-de-prueba");
vi.mock("../supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: async () => ({ data: { session: null, user: { identities: [{}] } }, error: null }),
      signInWithPassword: async () => ({ error: null }),
      resend: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
    },
  },
}));

const cajas = [];
window.turnstile = {
  render: (caja, opciones) => {
    cajas.push(caja);
    opciones.callback("token-de-prueba");
    return cajas.length;
  },
  reset: () => {},
  remove: () => {},
};

const { VistaLogin } = await import("./VistaLogin");

const escribir = (input, valor) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const boton = (vista, texto) => [...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.trim() === texto);

it("tras crear la cuenta, «Ya la he confirmado — entrar» trae el captcha y deja entrar", async () => {
  const vista = montar(<VistaLogin modoInicial="crear" />);
  expect(cajas).toHaveLength(1);
  escribir(vista.contenedor.querySelector('input[type="email"]'), "nuevo@correo.es");
  escribir(vista.contenedor.querySelector('input[type="password"]'), "contraseña-larga");
  await act(async () => vista.contenedor.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(vista.contenedor.textContent).toContain("Tu cuenta ya está creada");
  act(() => boton(vista, "Ya la he confirmado — entrar").click());
  // Un captcha nuevo, en la caja nueva del formulario que ha vuelto.
  expect(cajas).toHaveLength(2);
  expect(vista.contenedor.contains(cajas[1])).toBe(true);
  expect(boton(vista, "Entrar").disabled).toBe(false);
  vista.desmontar();
});
