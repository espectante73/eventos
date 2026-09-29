import { it, expect } from "vitest";
import { leerErrorDelEnlace, esCorreoSinConfirmar } from "./enlaceAuth";

it("lee el error que trae un enlace de Supabase caducado", () => {
  expect(leerErrorDelEnlace("#error=access_denied&error_code=otp_expired&error_description=Email+link")).toBe("otp_expired");
  expect(leerErrorDelEnlace("#access_token=abc&type=signup")).toBe("");
  expect(leerErrorDelEnlace("")).toBe("");
});

it("reconoce el «correo sin confirmar», por código o por texto", () => {
  expect(esCorreoSinConfirmar({ code: "email_not_confirmed" })).toBe(true);
  expect(esCorreoSinConfirmar({ message: "Email not confirmed" })).toBe(true);
  expect(esCorreoSinConfirmar({ message: "Invalid login credentials" })).toBe(false);
});
