import { describe, it, expect } from "vitest";
import { entrarTablon, respuestaTablon, anioDeRespuesta, NO_ENCONTRADO, SIN_ANIO } from "./tablonEntrada";

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
