import { describe, it, expect } from "vitest";
import {
  datosCompletos,
  contarDatosRellenados,
  totalDatosInvitado,
  conEmailDeColaborador,
  familiasSinEmail,
  emailObligatorio,
  faltanObligatorios,
  colaboradorConEmail,
  fichasIncompletasDe,
  pideDatosDeBoda,
  esMenorDeEdad,
  pideEmail,
  tieneAlergiaReal,
  calcularEdad,
  edadPromedio,
  importeEsperadoInvitado,
  resolverColaborador,
  parseImport,
} from "./invitados";

describe("datosCompletos", () => {
  it("exige año de nacimiento Y alergias, no solo uno de los dos", () => {
    expect(datosCompletos({ anioNacimiento: "1990", alergias: "No" })).toBe(true);
    expect(datosCompletos({ anioNacimiento: "1990", alergias: "" })).toBe(false);
    expect(datosCompletos({ anioNacimiento: "", alergias: "No" })).toBe(false);
    expect(datosCompletos({})).toBe(false);
  });
});

describe("tieneAlergiaReal", () => {
  it('"No" es una respuesta explícita, no cuenta como alergia', () => {
    expect(tieneAlergiaReal({ alergias: "No" })).toBe(false);
    expect(tieneAlergiaReal({ alergias: "  " })).toBe(false);
    expect(tieneAlergiaReal({ alergias: "" })).toBe(false);
    expect(tieneAlergiaReal({})).toBe(false);
  });
  it("cualquier otro texto sí cuenta", () => {
    expect(tieneAlergiaReal({ alergias: "Frutos secos" })).toBe(true);
  });
});

describe("contarDatosRellenados", () => {
  const casado = { rolFamiliar: "esposo" };

  it("cuenta solo los campos no vacíos, sin espacios en blanco", () => {
    expect(contarDatosRellenados({}, false)).toBe(0);
    expect(contarDatosRellenados({ anioNacimiento: "1990" }, false)).toBe(1);
    expect(
      contarDatosRellenados(
        {
          ...casado,
          anioNacimiento: "1990",
          anioBoda: "",
          email: "a@a.com",
          cancion: "",
          alergias: "No",
          observaciones: "  ", // solo espacios: no cuenta como relleno
        },
        true
      )
    ).toBe(4);
  });

  // Cambio de comportamiento del 2026-09-14: la foto es la foto DE BODA,
  // así que solo suma a quien se le pide (esposo/esposa). Antes sumaba a
  // cualquiera, incluido un hijo de 8 años.
  it("la foto solo cuenta si a esa persona se le pide foto de boda", () => {
    expect(contarDatosRellenados({}, true)).toBe(0);
    expect(contarDatosRellenados(casado, true)).toBe(1);
  });
});

describe("calcularEdad", () => {
  const evento = { fecha: "2026-11-13" };
  it("calcula respecto al año del evento, no al año actual", () => {
    expect(calcularEdad("1990", evento)).toBe(36);
  });
  it("descarta valores imposibles o vacíos", () => {
    expect(calcularEdad("", evento)).toBeNull();
    expect(calcularEdad("abc", evento)).toBeNull();
    expect(calcularEdad("2200", evento)).toBeNull(); // edad negativa
  });
});

describe("edadPromedio", () => {
  const evento = { fecha: "2026-11-13" };
  it("ignora a quien no tiene edad calculable", () => {
    const invitados = [
      { anioNacimiento: "1990" }, // 36
      { anioNacimiento: "2000" }, // 26
      { anioNacimiento: "" }, // se ignora
    ];
    expect(edadPromedio(invitados, evento)).toBe(31);
  });
  it("null si nadie tiene edad calculable", () => {
    expect(edadPromedio([{ anioNacimiento: "" }], evento)).toBeNull();
    expect(edadPromedio([], evento)).toBeNull();
  });
});

describe("importeEsperadoInvitado", () => {
  const evento = {
    fecha: "2026-11-13",
    edadNinoDesde: "2",
    edadNinoHasta: "12",
    precioAdulto: "50",
    precioNino: "25",
  };
  it("bebé por debajo de 'desde' no paga", () => {
    expect(importeEsperadoInvitado({ anioNacimiento: "2025" }, evento)).toBe(0);
  });
  it("entre 'desde' y 'hasta' paga precio niño", () => {
    expect(importeEsperadoInvitado({ anioNacimiento: "2020" }, evento)).toBe(25);
  });
  it("de 'hasta' en adelante paga precio adulto", () => {
    expect(importeEsperadoInvitado({ anioNacimiento: "1990" }, evento)).toBe(50);
  });
  it("sin año de nacimiento, se asume adulto", () => {
    expect(importeEsperadoInvitado({}, evento)).toBe(50);
  });
});

describe("resolverColaborador", () => {
  const colaboradores = [{ id: "c1", nombre: "Ana" }];
  it("devuelve null si no hay colaborador asignado", () => {
    expect(resolverColaborador({}, colaboradores)).toBeNull();
    expect(resolverColaborador({ colaboradorId: "no-existe" }, colaboradores)).toBeNull();
  });
  it("encuentra el colaborador por id", () => {
    expect(resolverColaborador({ colaboradorId: "c1" }, colaboradores)).toEqual(colaboradores[0]);
  });
});

describe("parseImport", () => {
  // Columnas, en orden: grupoFamiliar, apellido, nombre, colaborador, zona.
  const colaboradores = [{ id: "c1", nombre: "Ana Pérez" }];
  it("acepta filas separadas por tabulador o por coma", () => {
    const texto = "García,Pérez,Juan,Ana Pérez,Norte\nLópez\tGutiérrez\tMaría\t\tSur";
    const filas = parseImport(texto, colaboradores);
    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({
      grupoFamiliar: "García",
      apellido: "Pérez",
      nombre: "Juan",
      colaboradorId: "c1",
    });
    expect(filas[1]).toMatchObject({
      grupoFamiliar: "López",
      apellido: "Gutiérrez",
      nombre: "María",
      colaboradorId: null,
    });
  });
  it("descarta filas de cabecera o sin nombre/apellido", () => {
    const texto = "Apellido,Nombre\n,SoloNombre\nSoloApellido,";
    expect(parseImport(texto, colaboradores)).toHaveLength(0);
  });
  it("empareja el nombre del colaborador sin distinguir mayúsculas", () => {
    const texto = ",Ruiz,Pedro,ana pérez,";
    const filas = parseImport(texto, colaboradores);
    expect(filas[0].colaboradorId).toBe("c1");
  });
});

// ---------- Qué se le pide a cada persona (2026-09-14) ----------
describe("pideDatosDeBoda", () => {
  it("solo se lo pide a esposo y esposa", () => {
    expect(pideDatosDeBoda({ rolFamiliar: "esposo" })).toBe(true);
    expect(pideDatosDeBoda({ rolFamiliar: "esposa" })).toBe(true);
    expect(pideDatosDeBoda({ rolFamiliar: "hijo" })).toBe(false);
    expect(pideDatosDeBoda({ rolFamiliar: "padre" })).toBe(false);
    expect(pideDatosDeBoda({ rolFamiliar: "suelto" })).toBe(false);
  });

  it("sin rol marcado tampoco se pide: el anfitrión aún no lo ha revisado", () => {
    expect(pideDatosDeBoda({ rolFamiliar: "" })).toBe(false);
    expect(pideDatosDeBoda({})).toBe(false);
  });
});

describe("esMenorDeEdad / pideEmail", () => {
  const evento = { fecha: "2026-11-13" };

  it("usa la edad que tendrá el día del evento", () => {
    expect(esMenorDeEdad({ anioNacimiento: "2010" }, evento)).toBe(true); // 16
    expect(esMenorDeEdad({ anioNacimiento: "2008" }, evento)).toBe(false); // 18
    expect(esMenorDeEdad({ anioNacimiento: "1990" }, evento)).toBe(false);
  });

  it("los 18 justos ya son mayoría de edad", () => {
    expect(pideEmail({ anioNacimiento: "2008" }, evento)).toBe(true);
    expect(pideEmail({ anioNacimiento: "2009" }, evento)).toBe(false);
  });

  // Importante: si bloqueara el email por no saber la edad, el
  // colaborador se lo encontraría cerrado ANTES de poder escribir el año.
  it("sin año de nacimiento no se le trata como menor", () => {
    expect(esMenorDeEdad({ anioNacimiento: "" }, evento)).toBe(false);
    expect(pideEmail({}, evento)).toBe(true);
  });
});

describe("totalDatosInvitado", () => {
  const evento = { fecha: "2026-11-13" };

  // v52 (él): lo obligatorio cuenta siempre; lo demás, solo si se ha
  // rellenado. Vacío y no obligatorio no cuenta.
  it("vacío, a cualquiera se le piden solo los obligatorios: año de nacimiento y alergias", () => {
    expect(totalDatosInvitado({ rolFamiliar: "esposo", anioNacimiento: "1990" }, evento)).toBe(2);
    expect(totalDatosInvitado({ rolFamiliar: "hijo", anioNacimiento: "2015" }, evento)).toBe(2);
  });

  it("quien viene solo (S) suma el email, que para él es obligatorio", () => {
    expect(totalDatosInvitado({ rolFamiliar: "suelto", anioNacimiento: "1990" }, evento)).toBe(3);
  });

  it("lo que no es obligatorio cuenta en cuanto se rellena (y ya está relleno)", () => {
    const nino = { rolFamiliar: "hijo", anioNacimiento: "2015", alergias: "No" };
    expect(totalDatosInvitado({ ...nino, cancion: "Bamboleo", observaciones: "Silla alta" }, evento)).toBe(4);
    expect(contarDatosRellenados({ ...nino, cancion: "Bamboleo", observaciones: "Silla alta" }, "", evento)).toBe(4);
  });

  it("una alergia fuera de las tres de siempre (Melocotón) cuenta como contestada", () => {
    const casado = { rolFamiliar: "esposo", anioNacimiento: "1960", anioBoda: "1985", email: "a@a.com", alergias: "Melocotón" };
    expect(contarDatosRellenados(casado, "ruta/foto.jpg", evento)).toBe(5);
    expect(totalDatosInvitado(casado, evento, "ruta/foto.jpg")).toBe(5);
  });

  it("un invitado que es colaborador: su email de Colaboradores cuenta", () => {
    const raul = { rolFamiliar: "suelto", anioNacimiento: "1975", alergias: "No", email: "", cancion: "Bamboleo" };
    const comoColaborador = { id: "c1", invitadoId: "raul", email: "raul@ejemplo.com" };
    expect(contarDatosRellenados(raul, false, evento)).toBe(3);
    expect(contarDatosRellenados(conEmailDeColaborador(raul, comoColaborador), false, evento)).toBe(4);
    expect(totalDatosInvitado(raul, evento)).toBe(4);
    expect(conEmailDeColaborador(raul, undefined)).toBe(raul);
  });

  it("la foto de boda cuenta si está; sin ella, la ficha sigue completa", () => {
    const casada = { rolFamiliar: "esposa", anioNacimiento: "1962", anioBoda: "1985", alergias: "No" };
    expect(contarDatosRellenados(casada, "", evento)).toBe(totalDatosInvitado(casada, evento, ""));
    expect(totalDatosInvitado(casada, evento, "ruta/foto.jpg")).toBe(4);
  });

  it("con lo obligatorio contestado, la ficha sale completa: N de N", () => {
    const nino = { rolFamiliar: "hijo", anioNacimiento: "2015", alergias: "No" };
    expect(contarDatosRellenados(nino, false, evento)).toBe(totalDatosInvitado(nino, evento));
  });
});

describe("email: al menos uno por familia", () => {
  const evento = { fecha: "2026-11-13" };

  it("una familia sin ningún email de un adulto se señala; con uno basta", () => {
    const esposo = { id: "o", apellido: "Abreu", grupoFamiliar: "Abreu01", rolFamiliar: "esposo", confirmado: true, email: "" };
    const esposa = { id: "a", apellido: "Abreu", grupoFamiliar: "Abreu01", rolFamiliar: "esposa", confirmado: true, email: "" };
    const hijo = { id: "h", apellido: "Abreu", grupoFamiliar: "Abreu01", rolFamiliar: "hijo", confirmado: true, email: "hijo@a.com" };
    expect([...familiasSinEmail([esposo, esposa, hijo], [])]).toEqual(["abreu01"]);
    expect(familiasSinEmail([esposo, { ...esposa, email: "a@a.com" }, hijo], []).size).toBe(0);
  });

  it("el email de Colaboradores cuenta para la familia", () => {
    const raul = { id: "r", apellido: "Sierra", grupoFamiliar: "Sierra01", rolFamiliar: "suelto", confirmado: true, email: "" };
    expect(familiasSinEmail([raul], [{ id: "c", invitadoId: "r", email: "raul@a.com" }]).size).toBe(0);
  });

  // v50: el formulario del colaborador no guarda sin los obligatorios, y
  // el email lo es solo para quien puede darlo por la familia.
  describe("los obligatorios del formulario", () => {
    const adulto = { anioNacimiento: "1970", alergias: "No", email: "" };

    it("quien viene solo (S) siempre tiene que dar email", () => {
      expect(emailObligatorio({ ...adulto, rolFamiliar: "suelto" }, evento)).toBe(true);
    });

    it("en una familia sin email, los dos cónyuges y el padre o madre sin pareja", () => {
      for (const rol of ["esposo", "esposa", "padre"]) {
        expect(emailObligatorio({ ...adulto, rolFamiliar: rol }, evento, { familiaSinEmail: true })).toBe(true);
        expect(emailObligatorio({ ...adulto, rolFamiliar: rol }, evento, { familiaSinEmail: false })).toBe(false);
      }
    });

    it("al menor, a quien no puede darlo por la familia y al colaborador vinculado, no", () => {
      const sin = { familiaSinEmail: true };
      expect(emailObligatorio({ rolFamiliar: "hijo", anioNacimiento: "2015" }, evento, sin)).toBe(false);
      expect(emailObligatorio({ ...adulto, rolFamiliar: "hijo" }, evento, sin)).toBe(false);
      expect(emailObligatorio({ ...adulto, rolFamiliar: "" }, evento, sin)).toBe(false);
      expect(emailObligatorio({ ...adulto, rolFamiliar: "suelto" }, evento, { colaboradorVinculado: { email: "" } })).toBe(false);
    });

    it("dice qué falta, en el orden del formulario", () => {
      expect(faltanObligatorios({ rolFamiliar: "suelto" }, evento)).toEqual(["anioNacimiento", "email", "alergias"]);
      expect(faltanObligatorios({ ...adulto, rolFamiliar: "suelto", email: "no-es-un-email" }, evento)).toEqual(["email"]);
      expect(faltanObligatorios({ ...adulto, rolFamiliar: "suelto", email: "a@b.es" }, evento)).toEqual([]);
      expect(faltanObligatorios({ ...adulto, rolFamiliar: "esposo" }, evento)).toEqual([]);
    });
  });

  // v50.6: el anfitrión también es colaborador, y su sello cuenta igual.
  describe("el sello del anfitrión como colaborador", () => {
    const colaboradores = [
      { id: "c1", email: "Benito@Correo.es" },
      { id: "c2", email: "otra@correo.es" },
    ];

    it("se le reconoce por su email, sin mirar mayúsculas", () => {
      expect(colaboradorConEmail(colaboradores, "benito@correo.es")?.id).toBe("c1");
      expect(colaboradorConEmail(colaboradores, "")).toBe(null);
      expect(colaboradorConEmail(colaboradores, "nadie@correo.es")).toBe(null);
    });

    it("si su email está en dos colaboradores, en ninguno (mejor sin sello que con el de otro)", () => {
      expect(colaboradorConEmail([...colaboradores, { id: "c3", email: "benito@correo.es" }], "benito@correo.es")).toBe(null);
    });

    it("cuenta solo sus confirmados incompletos", () => {
      const invitados = [
        { id: "a", colaboradorId: "c1", confirmado: true, anioNacimiento: "", alergias: "" },
        { id: "b", colaboradorId: "c1", confirmado: false, anioNacimiento: "", alergias: "" },
        { id: "c", colaboradorId: "c2", confirmado: true, anioNacimiento: "", alergias: "" },
      ];
      const ids = fichasIncompletasDe("c1", { invitados, colaboradores, evento }).map((g) => g.id);
      expect(ids).toEqual(["a"]);
    });
  });
});

