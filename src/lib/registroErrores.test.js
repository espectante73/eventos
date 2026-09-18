import { describe, it, expect } from "vitest";
import { sinConsulta, limpiarEvento } from "./registroErrores";

// Lo que se prueba aquí es la promesa de privacidad: que ningún informe de
// error saque de la app la llave del tablón ni datos de nadie.
describe("sinConsulta", () => {
  it("quita la llave del tablón de la dirección", () => {
    expect(sinConsulta("https://nexuspoint.rsvp/?tablon=8d2d-secreto")).toBe("https://nexuspoint.rsvp/");
  });
  it("quita también lo que va tras #", () => {
    expect(sinConsulta("https://x.y/a#token=1")).toBe("https://x.y/a");
  });
  it("deja pasar lo que no es texto", () => {
    expect(sinConsulta(undefined)).toBe(undefined);
  });
});

describe("limpiarEvento", () => {
  const evento = {
    user: { id: "u1", email: "alguien@ejemplo.com", ip_address: "1.2.3.4" },
    request: {
      url: "https://nexuspoint.rsvp/?tablon=secreto",
      query_string: "tablon=secreto",
      headers: { Cookie: "x" },
      cookies: { a: "b" },
      data: { nombre: "Míriam" },
    },
    breadcrumbs: [
      { category: "navigation", data: { from: "/?tablon=secreto", to: "/?rol=abc" } },
      { category: "fetch", data: { url: "https://x.supabase.co/rest/v1/rpc/f?select=*" } },
      { category: "ui.click" },
    ],
    exception: { values: [{ type: "TypeError" }] },
  };
  const limpio = limpiarEvento(evento);

  it("no lleva usuario", () => {
    expect(limpio.user).toBeUndefined();
  });

  it("no lleva la consulta, las cabeceras, las cookies ni el cuerpo de la petición", () => {
    expect(limpio.request.url).toBe("https://nexuspoint.rsvp/");
    expect(limpio.request.query_string).toBeUndefined();
    expect(limpio.request.headers).toBeUndefined();
    expect(limpio.request.cookies).toBeUndefined();
    expect(limpio.request.data).toBeUndefined();
  });

  it("limpia las direcciones del rastro de pasos previos", () => {
    expect(limpio.breadcrumbs[0].data).toEqual({ from: "/", to: "/" });
    expect(limpio.breadcrumbs[1].data.url).toBe("https://x.supabase.co/rest/v1/rpc/f");
  });

  it("conserva el error en sí, que es lo que importa", () => {
    expect(limpio.exception).toEqual(evento.exception);
  });

  it("no toca el evento original", () => {
    expect(evento.user.email).toBe("alguien@ejemplo.com");
  });
});
