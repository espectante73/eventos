import { describe, it, expect } from "vitest";
import { entrarTablon, respuestaTablon, anioDeRespuesta, mismaPersonaEnRespuesta, esRespuestaPersonal, respuestaGuardadaDelEnlace, NO_ENCONTRADO, SIN_ANIO } from "./tablonEntrada";

// Un servidor de mentira: qué respuestas valen y si a ese nombre le falta el año.
const servidor = ({ valen = [], faltaAnio = false }) => {
  const llamadas = [];
  return {
    llamadas,
    rpc: async (nombre, params) => {
      llamadas.push([nombre, params]);
      if (nombre === "tablon_verificar_respuesta") return { data: valen.includes(params.p_respuesta) };
      if (nombre === "tablon_falta_anio") return { data: faltaAnio };
      return { data: null };
    },
  };
};

describe("la entrada al tablón, con el año (v70)", () => {
  it("nombre y año viajan juntos, «Apellido Nombre 1975»", () => {
    expect(respuestaTablon("  Medina Ana ", "1975")).toBe("Medina Ana 1975");
    expect(anioDeRespuesta("Medina Ana 1975")).toBe("1975");
    expect(anioDeRespuesta("Medina Ana")).toBe("");
  });

  it("con nombre y año que casan, entra con los dos", async () => {
    const s = servidor({ valen: ["Medina Ana 1975"] });
    expect(await entrarTablon(s, "t", "Medina Ana", "1975")).toEqual({ respuesta: "Medina Ana 1975" });
  });

  it("si no casan, dice qué revisar", async () => {
    const s = servidor({});
    expect(await entrarTablon(s, "t", "Medina Ana", "1980")).toEqual({ aviso: NO_ENCONTRADO });
  });

  it("si su ficha no tiene el año, un mensaje breve", async () => {
    const s = servidor({ faltaAnio: true });
    expect(await entrarTablon(s, "t", "Medina Ana", "1975")).toEqual({ aviso: SIN_ANIO });
    expect(s.llamadas.at(-1)).toEqual(["tablon_falta_anio", { p_token: "t", p_nombre: "Medina Ana" }]);
  });

  it("mientras el servidor no exige el año, aún entra con el nombre", async () => {
    const s = servidor({ valen: ["Medina Ana"] });
    expect(await entrarTablon(s, "t", "Medina Ana", "1975")).toEqual({ respuesta: "Medina Ana" });
  });
});

// v85.2: el enlace personal y la respuesta guardada en el móvil.
describe("mismaPersonaEnRespuesta", () => {
  it("la misma persona aunque cambien mayúsculas, tildes, comas o el año guardado", () => {
    expect(mismaPersonaEnRespuesta("Pacheco Ana 1985", "Pacheco Ana")).toBe(true);
    expect(mismaPersonaEnRespuesta("pacheco, ána 1985", "Pacheco Ana")).toBe(true);
  });
  it("otra persona de la familia, no; y sin nombre en el enlace, nunca", () => {
    expect(mismaPersonaEnRespuesta("Pacheco Omar 1983", "Pacheco Ana")).toBe(false);
    expect(mismaPersonaEnRespuesta("", "")).toBe(false);
  });
});

// v88.6: «Solo con enlace personal». El enlace entra con la clave de la
// ficha y el año, y lo guardado de antes con su nombre se pasa a esa forma.
describe("la respuesta del enlace personal", () => {
  const ana = { nombre: "Pacheco, Ana", respuesta: "0123456789abcdef" };
  it("la clave de su ficha (16 cifras hexadecimales) y el año, nada más", () => {
    expect(esRespuestaPersonal("0123456789abcdef 1975")).toBe(true);
    expect(esRespuestaPersonal(" 0123456789abcdef 1975 ")).toBe(true);
    expect(esRespuestaPersonal("0123456789abcdef")).toBe(false);
    expect(esRespuestaPersonal("Pacheco Ana 1975")).toBe(false);
    expect(esRespuestaPersonal("0123456789ABCDEF 1975")).toBe(false);
    expect(esRespuestaPersonal("")).toBe(false);
  });
  it("la ya guardada con su clave, tal cual", () => {
    expect(respuestaGuardadaDelEnlace("0123456789abcdef 1975", ana)).toBe("0123456789abcdef 1975");
  });
  it("la guardada con su nombre, de antes, pasa a su clave con el mismo año", () => {
    expect(respuestaGuardadaDelEnlace("pacheco ana 1975", ana)).toBe("0123456789abcdef 1975");
    expect(respuestaGuardadaDelEnlace("Pacheco Ana", ana)).toBe("0123456789abcdef");
  });
  it("la de otro de la familia, u otra clave, ninguna", () => {
    expect(respuestaGuardadaDelEnlace("Pacheco Omar 1983", ana)).toBe("");
    expect(respuestaGuardadaDelEnlace("fedcba9876543210 1983", ana)).toBe("");
    expect(respuestaGuardadaDelEnlace("", ana)).toBe("");
  });
  it("con la base de antes (la respuesta era el nombre), como siempre", () => {
    expect(respuestaGuardadaDelEnlace("Pacheco Ana 1975", { nombre: "Pacheco, Ana", respuesta: "Pacheco Ana" })).toBe("Pacheco Ana 1975");
  });
});
