import { describe, it, expect } from "vitest";
import { leerEvento } from "./leerEvento";

// Un supabase de mentira: lo que responde la función y lo que respondería
// la tabla (la forma antigua, mientras el SQL no esté subido).
const falso = ({ rpc, tabla = [] }) => {
  const llamadas = [];
  return {
    llamadas,
    rpc: async (funcion, parametros) => {
      llamadas.push(["rpc", funcion, parametros]);
      return rpc;
    },
    from: (t) => ({
      select: () => ({
        limit: async () => {
          llamadas.push(["tabla", t]);
          return { data: tabla };
        },
      }),
    }),
  };
};

describe("leerEvento (v63): el evento, a través del servidor", () => {
  it("por defecto, la versión pública", async () => {
    const s = falso({ rpc: { data: { nombre: "Boda" }, error: null } });
    expect(await leerEvento(s)).toEqual({ nombre: "Boda" });
    expect(s.llamadas).toEqual([["rpc", "evento_publico", {}]]);
  });

  it("el anfitrión, con su llave", async () => {
    const s = falso({ rpc: { data: { nombre: "Boda", emailAnfitrion: "a@a.es" }, error: null } });
    expect(await leerEvento(s, "anfitrion_evento", { p_token: "x" })).toMatchObject({ emailAnfitrion: "a@a.es" });
  });

  it("sin el SQL subido (PGRST202), como antes; con otro error, nada", async () => {
    const sinSubir = falso({ rpc: { data: null, error: { code: "PGRST202" } }, tabla: [{ nombre: "Boda" }] });
    expect(await leerEvento(sinSubir)).toEqual({ nombre: "Boda" });
    const otro = falso({ rpc: { data: null, error: { code: "42501" } }, tabla: [{ nombre: "Boda" }] });
    expect(await leerEvento(otro)).toBe(null);
    expect(otro.llamadas.some(([q]) => q === "tabla")).toBe(false);
  });
});
