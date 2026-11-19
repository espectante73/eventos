import { it, expect } from "vitest";
import { guardarCancionesTablon, MOTIVOS_CANCIONES_TABLON } from "./cancionesTablon";

const conBase = (respuesta) => {
  const llamadas = [];
  return {
    llamadas,
    rpc: async (nombre, args) => {
      llamadas.push({ nombre, args });
      if (respuesta instanceof Error) throw respuesta;
      return respuesta;
    },
  };
};
const HUECOS = [
  { titulo: " Titanium ", artista: "David Guetta " },
  { titulo: "", artista: "" },
  { titulo: "Bamboleo", artista: "" },
];

it("manda lo escrito limpio, con su llave del enlace personal, y devuelve lo guardado", async () => {
  const base = conBase({ data: { ok: true }, error: null });
  const r = await guardarCancionesTablon(base, { token: "t1", clave: "0123456789abcdef", respuesta: "0123456789abcdef 1975", huecos: HUECOS });
  expect(r).toEqual({ cancion: "Titanium — David Guetta\n\nBamboleo", aviso: "" });
  expect(base.llamadas[0]).toEqual({
    nombre: "tablon_guardar_canciones",
    args: { p_token: "t1", p_clave: "0123456789abcdef", p_respuesta: "0123456789abcdef 1975", p_cancion: "Titanium — David Guetta\n\nBamboleo" },
  });
});

it("cerradas, sin llave o sin conexión: no se guarda y lo dice en sencillo", async () => {
  const args = { token: "t1", clave: "x", respuesta: "x 1975", huecos: HUECOS };
  expect(await guardarCancionesTablon(conBase({ data: { error: "cerradas" }, error: null }), args)).toEqual({ cancion: null, aviso: MOTIVOS_CANCIONES_TABLON.cerradas });
  expect(await guardarCancionesTablon(conBase({ data: { error: "llave" }, error: null }), args)).toEqual({ cancion: null, aviso: MOTIVOS_CANCIONES_TABLON.llave });
  expect(await guardarCancionesTablon(conBase({ data: null, error: { code: "PGRST202" } }), args)).toEqual({ cancion: null, aviso: MOTIVOS_CANCIONES_TABLON.red });
  expect(await guardarCancionesTablon(conBase(new Error("sin red")), args)).toEqual({ cancion: null, aviso: MOTIVOS_CANCIONES_TABLON.red });
});
