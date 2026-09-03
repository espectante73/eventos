import { describe, it, expect } from "vitest";
import { matrimoniosDeInvitados, contarMatrimonios, conyugesSueltos, anioDelEvento } from "./matrimonios";
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

describe("conyugesSueltos", () => {
  const suelto = (extra) => persona(extra);

  it("no señala a nadie cuando todos tienen pareja", () => {
    const lista = [
      suelto({ nombre: "Benito", conyuge: CONYUGE.ESPOSO }),
      suelto({ nombre: "Ana", conyuge: CONYUGE.ESPOSA }),
    ];
    expect(conyugesSueltos(lista)).toHaveLength(0);
  });

  // El caso que de verdad importa: se marcó al esposo y se olvidó la
  // esposa. Antes se ignoraba en silencio y el matrimonio no aparecía.
  it("señala al que se quedó sin pareja en su familia", () => {
    const lista = [
      suelto({ nombre: "Benito", conyuge: CONYUGE.ESPOSO }),
      suelto({ nombre: "Ana" }),
    ];
    expect(conyugesSueltos(lista).map((g) => g.nombre)).toEqual(["Benito"]);
  });

  it("señala solo al que sobra cuando hay más de un lado", () => {
    const lista = [
      suelto({ nombre: "Benito", conyuge: CONYUGE.ESPOSO }),
      suelto({ nombre: "Ana", conyuge: CONYUGE.ESPOSA }),
      suelto({ nombre: "Rosa", conyuge: CONYUGE.ESPOSA }),
    ];
    expect(conyugesSueltos(lista).map((g) => g.nombre)).toEqual(["Rosa"]);
  });

  it("no cruza familias distintas", () => {
    const lista = [
      suelto({ nombre: "Benito", conyuge: CONYUGE.ESPOSO }),
      suelto({ nombre: "Rosa", apellido: "Pérez", grupoFamiliar: "Pérez", conyuge: CONYUGE.ESPOSA }),
    ];
    expect(conyugesSueltos(lista)).toHaveLength(2);
  });
});
