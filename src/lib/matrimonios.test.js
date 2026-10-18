import { describe, it, expect } from "vitest";
import { matrimoniosDeInvitados, contarMatrimonios, conyugesSueltos, anioDelEvento } from "./matrimonios";
import { ROL_FAMILIAR } from "./rolFamiliar";

const persona = (extra) => ({
  nombre: "X",
  apellido: "Fariña",
  grupoFamiliar: "Fariña",
  zona: "Tenerife",
  anioBoda: "",
  confirmado: true,
  rolFamiliar: "",
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
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO, anioBoda: "2001" }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
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
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA, anioBoda: "1998" }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")[0].aniversario).toBe(28);
  });

  it("sin año de boda no inventa aniversario", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")[0].aniversario).toBe(null);
  });

  it("no cuenta a un cónyuge suelto ni cruza familias distintas", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Rosa", apellido: "Pérez", grupoFamiliar: "Pérez", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")).toHaveLength(0);
  });

  it("cae en el apellido cuando no hay grupo familiar", () => {
    const lista = [
      persona({ nombre: "Benito", grupoFamiliar: "", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Ana", grupoFamiliar: "", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")).toHaveLength(1);
  });

  it("marca como no confirmado el matrimonio al que le falta uno", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA, confirmado: false }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")[0].confirmados).toBe(false);
  });

  it("cuenta cada familia con su pareja", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
      persona({ nombre: "Juan", apellido: "Pérez", grupoFamiliar: "Pérez", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Rosa", apellido: "Pérez", grupoFamiliar: "Pérez", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
    ];
    expect(contarMatrimonios(lista)).toBe(2);
  });
});

describe("conyugesSueltos", () => {
  const suelto = (extra) => persona(extra);

  it("no señala a nadie cuando todos tienen pareja", () => {
    const lista = [
      suelto({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      suelto({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
    ];
    expect(conyugesSueltos(lista)).toHaveLength(0);
  });

  // El caso que de verdad importa: se marcó al esposo y se olvidó la
  // esposa. Antes se ignoraba en silencio y el matrimonio no aparecía.
  it("señala al que se quedó sin pareja en su familia", () => {
    const lista = [
      suelto({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      suelto({ nombre: "Ana" }),
    ];
    expect(conyugesSueltos(lista).map((g) => g.nombre)).toEqual(["Benito"]);
  });

  it("señala solo al que sobra cuando hay más de un lado", () => {
    const lista = [
      suelto({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      suelto({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
      suelto({ nombre: "Rosa", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
    ];
    expect(conyugesSueltos(lista).map((g) => g.nombre)).toEqual(["Rosa"]);
  });

  it("no cruza familias distintas", () => {
    const lista = [
      suelto({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      suelto({ nombre: "Rosa", apellido: "Pérez", grupoFamiliar: "Pérez", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
    ];
    expect(conyugesSueltos(lista)).toHaveLength(2);
  });
});

// La H no participa en los matrimonios: un hijo marcado no puede
// emparejarse con nadie ni contar como marca suelta.
describe("hijos", () => {
  it("los hijos no forman pareja ni salen como sueltos", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
      persona({ nombre: "Lucía", rolFamiliar: ROL_FAMILIAR.HIJO }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")).toHaveLength(1);
    expect(conyugesSueltos(lista)).toHaveLength(0);
  });
});

// P (padre/madre sin su cónyuge) y S (suelto) no forman matrimonio: a
// efectos de contar parejas dan igual, aunque a efectos de mesa sean
// opuestos (uno va con sus hijos, el otro cabe en cualquier hueco).
describe("padres solos y sueltos", () => {
  it("ni cuentan como matrimonio ni salen como marca suelta", () => {
    const lista = [
      persona({ nombre: "Marta", rolFamiliar: ROL_FAMILIAR.PADRE }),
      persona({ nombre: "Iván", rolFamiliar: ROL_FAMILIAR.HIJO }),
      persona({ nombre: "Rosa", apellido: "Pérez", grupoFamiliar: "Pérez", rolFamiliar: ROL_FAMILIAR.SUELTO }),
    ];
    expect(matrimoniosDeInvitados(lista, "2026-11-13")).toHaveLength(0);
    expect(conyugesSueltos(lista)).toHaveLength(0);
  });

  it("un matrimonio de verdad sigue contando junto a ellos", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
      persona({ nombre: "Marta", apellido: "García", grupoFamiliar: "García 04", rolFamiliar: ROL_FAMILIAR.PADRE }),
    ];
    expect(contarMatrimonios(lista)).toBe(1);
  });
});

// v71 (él): quien viene sin su pareja, marcado como excepción en la Revisión.
import { matrimoniosConLosQueVienenSolos, nombresMatrimonio, vieneSinPareja } from "./matrimonios";
describe("los casados que vienen sin su pareja (excepción en la Revisión)", () => {
  const pareja = [
    { id: "o", nombre: "Gustavo", apellido: "Abreu", grupoFamiliar: "Abreu01", rolFamiliar: ROL_FAMILIAR.ESPOSO, anioBoda: "1998", confirmado: true },
    { id: "a", nombre: "Míriam", apellido: "Abreu", grupoFamiliar: "Abreu01", rolFamiliar: ROL_FAMILIAR.ESPOSA, anioBoda: "1998", confirmado: true },
  ];
  const sola = { id: "s", nombre: "Rosa", apellido: "Pérez", grupoFamiliar: "Pérez01", rolFamiliar: ROL_FAMILIAR.ESPOSA, anioBoda: "1990", confirmado: true, excepcionesRevision: ["conyugeSinPareja"] };
  const suelto = { id: "x", nombre: "Luis", apellido: "Gil", grupoFamiliar: "Gil01", rolFamiliar: ROL_FAMILIAR.ESPOSO, anioBoda: "2000", confirmado: true };

  it("con la excepción, es un matrimonio de uno, con su aniversario", () => {
    const lista = matrimoniosConLosQueVienenSolos([...pareja, sola, suelto], "2026-12-11");
    expect(lista.map((m) => m.familia)).toEqual(["Abreu01", "Pérez01"]);
    const rosa = lista[1];
    expect(rosa.esposa.id).toBe("s");
    expect(rosa.esposo).toBeNull();
    expect(rosa.aniversario).toBe(36);
    expect(nombresMatrimonio(rosa)).toBe("Rosa");
    expect(nombresMatrimonio(lista[0])).toBe("Gustavo y Míriam");
  });

  it("sin la excepción, una marca suelta no cuenta (sigue siendo un error)", () => {
    expect(vieneSinPareja(suelto)).toBe(false);
    expect(contarMatrimonios([...pareja, sola, suelto])).toBe(2);
  });
});
