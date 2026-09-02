import { describe, it, expect } from "vitest";
import { matrimoniosDeInvitados, contarMatrimonios, anioDelEvento } from "./matrimonios";
import { CONYUGE } from "./conyuge";

const persona = (extra) => ({
  nombre: "X",
  apellido: "Fariña",
  grupoFamiliar: "Fariña",
  zona: "Tenerife",
  anioBoda: "",
  confirmado: true,
  conyuge: "",
  ...extra,
});

describe("anioDelEvento", () => {
  it("saca el año de la fecha del evento", () => {
    expect(anioDelEvento("2026-11-13")).toBe(2026);
  });
  it("devuelve null si no hay fecha o no vale", () => {
    expect(anioDelEvento("")).toBe(null);
    expect(anioDelEvento("sin fecha")).toBe(null);
  });
});

describe("matrimoniosDeInvitados", () => {
  it("empareja al esposo con la esposa de la misma familia", () => {
    const lista = [
      persona({ nombre: "Benito", conyuge: CONYUGE.ESPOSO, anioBoda: "2001" }),
      persona({ nombre: "Ana", conyuge: CONYUGE.ESPOSA }),
      persona({ nombre: "Lucía" }),
    ];
    const [m] = matrimoniosDeInvitados(lista, "2026-11-13");
    expect(m.esposo.nombre).toBe("Benito");
    expect(m.esposa.nombre).toBe("Ana");
    expect(m.anioBoda).toBe("2001");
    expect(m.aniversario).toBe(25);
    expect(m.zona).toBe("Tenerife");
  });

  // El año de boda lo rellena el colaborador en el formulario y puede
  // haberlo puesto solo uno de los dos: vale el que esté.
  it("toma el año de boda de cualquiera de los dos", () => {
    const lista = [
      persona({ nombre: "Benito", conyuge: CONYUGE.ESPOSO }),
      persona({ nombre: "Ana", conyuge: CONYUGE.ESPOSA, anioBoda: "1998" }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")[0].aniversario).toBe(28);
  });

  it("sin año de boda no inventa aniversario", () => {
    const lista = [
      persona({ nombre: "Benito", conyuge: CONYUGE.ESPOSO }),
      persona({ nombre: "Ana", conyuge: CONYUGE.ESPOSA }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")[0].aniversario).toBe(null);
  });

  it("no cuenta a un cónyuge suelto ni cruza familias distintas", () => {
    const lista = [
      persona({ nombre: "Benito", conyuge: CONYUGE.ESPOSO }),
      persona({ nombre: "Rosa", apellido: "Pérez", grupoFamiliar: "Pérez", conyuge: CONYUGE.ESPOSA }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")).toHaveLength(0);
  });

  it("cae en el apellido cuando no hay grupo familiar", () => {
    const lista = [
      persona({ nombre: "Benito", grupoFamiliar: "", conyuge: CONYUGE.ESPOSO }),
      persona({ nombre: "Ana", grupoFamiliar: "", conyuge: CONYUGE.ESPOSA }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")).toHaveLength(1);
  });

  it("marca como no confirmado el matrimonio al que le falta uno", () => {
    const lista = [
      persona({ nombre: "Benito", conyuge: CONYUGE.ESPOSO }),
      persona({ nombre: "Ana", conyuge: CONYUGE.ESPOSA, confirmado: false }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")[0].confirmados).toBe(false);
  });

  it("cuenta cada familia con su pareja", () => {
    const lista = [
      persona({ nombre: "Benito", conyuge: CONYUGE.ESPOSO }),
      persona({ nombre: "Ana", conyuge: CONYUGE.ESPOSA }),
      persona({ nombre: "Juan", apellido: "Pérez", grupoFamiliar: "Pérez", conyuge: CONYUGE.ESPOSO }),
      persona({ nombre: "Rosa", apellido: "Pérez", grupoFamiliar: "Pérez", conyuge: CONYUGE.ESPOSA }),
    ];
    expect(contarMatrimonios(lista)).toBe(2);
  });
});
