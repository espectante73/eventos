import { describe, it, expect } from "vitest";
import {
  agregarInvitado, importarInvitados, eliminarInvitado, mismaPersona,
  cambiarCampo, alternarRolTrabajo, alternarExcluidoTablon,
  permitirExcepcion, quitarExcepcion, marcarResponsable,
} from "./edicionInvitados";

// La lista de invitados es la base de toda la app: si aquí se pierde
// alguien, no se nota hasta que falta en la boda. Estas pruebas son el
// ensayo en el local vacío.
const juan = { id: "1", nombre: "Juan", apellido: "Gatell", grupoFamiliar: "Gatell01" };
const ana = { id: "2", nombre: "Ana", apellido: "Gatell", grupoFamiliar: "Gatell01" };

describe("añadir un invitado", () => {
  it("lo añade con todos sus campos, no a medias", () => {
    const { invitados, aviso } = agregarInvitado([], { nombre: "Juan", apellido: "Gatell", grupoFamiliar: "Gatell01" });
    expect(aviso).toBe("");
    expect(invitados).toHaveLength(1);
    // Si falta un campo, la ficha nace rara y el fallo aparece semanas
    // después, en otra pantalla.
    for (const campo of ["id", "zona", "confirmado", "mesa", "email", "pagado", "presente", "rolFamiliar"]) {
      expect(invitados[0], campo).toHaveProperty(campo);
    }
  });

  it("sin nombre, apellido o grupo familiar no se añade, y lo dice", () => {
    for (const falta of [{ apellido: "Gatell", grupoFamiliar: "G" }, { nombre: "Juan", grupoFamiliar: "G" }, { nombre: "Juan", apellido: "Gatell" }]) {
      const { invitados, aviso } = agregarInvitado([juan], falta);
      expect(invitados).toHaveLength(1);
      expect(aviso).not.toBe("");
    }
  });

  it("quita los espacios de los lados", () => {
    const { invitados } = agregarInvitado([], { nombre: "  Juan ", apellido: " Gatell ", grupoFamiliar: " G01 " });
    expect(invitados[0]).toMatchObject({ nombre: "Juan", apellido: "Gatell", grupoFamiliar: "G01" });
  });

  it("si ya hay alguien que se llama igual avisa, pero lo añade: puede ser el hijo", () => {
    const { invitados, aviso } = agregarInvitado([juan], { nombre: "juan", apellido: "GATELL", grupoFamiliar: "Gatell01" });
    expect(invitados).toHaveLength(2);
    expect(aviso).toContain("ya había");
  });
});

describe("importar una lista", () => {
  const fila = (nombre, apellido) => ({ nombre, apellido, zona: "Centro", grupoFamiliar: "X", colaboradorId: null });

  it("importa los que no estaban", () => {
    const { invitados, aviso } = importarInvitados([], [fila("Juan", "Gatell"), fila("Ana", "Gatell")]);
    expect(invitados).toHaveLength(2);
    expect(aviso).toBe("");
  });

  // El fallo que esto impide: pegar dos veces el mismo texto duplicaba a
  // los 140 invitados sin decir nada.
  it("pegar dos veces la misma lista NO duplica a nadie", () => {
    const primera = importarInvitados([], [fila("Juan", "Gatell"), fila("Ana", "Gatell")]).invitados;
    const { invitados, aviso } = importarInvitados(primera, [fila("Juan", "Gatell"), fila("Ana", "Gatell")]);
    expect(invitados).toHaveLength(2);
    expect(aviso).toContain("Ninguno");
  });

  it("si el texto pegado trae repetidos dentro, tampoco los duplica", () => {
    const { invitados } = importarInvitados([], [fila("Juan", "Gatell"), fila("JUAN", "gatell")]);
    expect(invitados).toHaveLength(1);
  });

  it("con algunos repetidos, importa el resto y dice a quién se saltó", () => {
    const { invitados, aviso } = importarInvitados([juan], [fila("Juan", "Gatell"), fila("Luis", "Mora")]);
    expect(invitados).toHaveLength(2);
    expect(aviso).toContain("Juan Gatell");
  });

  it("una lista vacía no toca nada", () => {
    const { invitados } = importarInvitados([juan], []);
    expect(invitados).toEqual([juan]);
  });
});

describe("eliminar un invitado", () => {
  it("lo quita y deja a los demás intactos", () => {
    const { invitados, aviso } = eliminarInvitado([juan, ana], "1");
    expect(aviso).toBe("");
    expect(invitados).toEqual([ana]);
  });

  it("un id que no existe no borra nada", () => {
    const { invitados } = eliminarInvitado([juan, ana], "999");
    expect(invitados).toHaveLength(2);
  });

  // Si además es colaborador, borrarlo le deja la cuenta sin ficha y la
  // base lo hace en silencio.
  it("no borra a quien además es colaborador: avisa y no toca nada", () => {
    const colaboradores = [{ id: "c1", nombre: "Juan G.", invitadoId: "1" }];
    const { invitados, aviso } = eliminarInvitado([juan, ana], "1", colaboradores);
    expect(invitados).toHaveLength(2);
    expect(aviso).toContain("colaborador");
  });
});

describe("cuándo dos fichas son la misma persona", () => {
  it("no distingue mayúsculas ni tildes ni espacios de más", () => {
    expect(mismaPersona({ nombre: "José", apellido: "Pérez" }, { nombre: "jose", apellido: "perez" })).toBe(true);
    expect(mismaPersona({ nombre: "Ana  ", apellido: " Mora" }, { nombre: "Ana", apellido: "Mora" })).toBe(true);
  });

  it("dos personas distintas siguen siendo distintas", () => {
    expect(mismaPersona(juan, ana)).toBe(false);
  });
});

describe("cambiar un campo suelto", () => {
  const familia = [
    { id: "1", nombre: "Juan", apellido: "Gatell", grupoFamiliar: "Gatell01" },
    { id: "2", nombre: "Ana", apellido: "Gatell", grupoFamiliar: "Gatell01" },
    { id: "3", nombre: "Luis", apellido: "Gatell", grupoFamiliar: "Gatell01" },
  ];

  it("cambia solo a quien toca", () => {
    const { invitados } = cambiarCampo(familia, "1", "zona", "Centro");
    expect(invitados[0].zona).toBe("Centro");
    expect(invitados[1].zona).toBeUndefined();
  });

  it("quita los espacios de los lados", () => {
    const { invitados } = cambiarCampo(familia, "1", "nombre", "  Juan Carlos  ");
    expect(invitados[0].nombre).toBe("Juan Carlos");
  });

  it("si el valor es el mismo, no devuelve una lista nueva", () => {
    const { invitados } = cambiarCampo(familia, "1", "nombre", "Juan");
    expect(invitados).toBe(familia);
  });

  it("un campo que no existe no toca nada y lo dice", () => {
    const { invitados, aviso } = cambiarCampo(familia, "1", "pagado", true);
    expect(invitados).toBe(familia);
    expect(aviso).toContain("desconocido");
  });

  // Norma 16: cambiar el apellido saca a esa persona de su familia, y de
  // eso dependen la mesa, los matrimonios y el acceso al tablón. Es
  // legítimo (el hijo mayor con otro apellido), pero no en silencio.
  it("cambiar el grupo familiar avisa con cuántos se quedan atrás", () => {
    const { invitados, aviso } = cambiarCampo(familia, "1", "grupoFamiliar", "Mora01");
    expect(invitados[0].grupoFamiliar).toBe("Mora01");
    expect(aviso).toContain("otros 2");
  });

  it("si no deja a nadie atrás, no avisa de nada", () => {
    const solo = [{ id: "9", nombre: "Eva", apellido: "Sola", grupoFamiliar: "Sola01" }];
    const { aviso } = cambiarCampo(solo, "9", "grupoFamiliar", "Otra01");
    expect(aviso).toBe("");
  });
});

describe("roles de trabajo y marcas", () => {
  const g = [{ id: "1", nombre: "Juan", apellido: "Gatell", rolesTrabajo: ["acomodador"] }];

  it("pulsar un rol que ya tiene se lo quita", () => {
    expect(alternarRolTrabajo(g, "1", "acomodador").invitados[0].rolesTrabajo).toEqual([]);
  });

  it("pulsar uno nuevo se lo añade, sin perder los que tenía", () => {
    expect(alternarRolTrabajo(g, "1", "barra").invitados[0].rolesTrabajo).toEqual(["acomodador", "barra"]);
  });

  it("un rol vacío no hace nada", () => {
    expect(alternarRolTrabajo(g, "1", "   ").invitados).toBe(g);
  });

  it("excluir del tablón es un interruptor", () => {
    const una = alternarExcluidoTablon(g, "1").invitados;
    expect(una[0].excluidoTablon).toBe(true);
    expect(alternarExcluidoTablon(una, "1").invitados[0].excluidoTablon).toBe(false);
  });
});

describe("excepciones de la Revisión", () => {
  const g = [{ id: "1", nombre: "Juan", apellido: "Gatell" }];

  it("permitir la misma dos veces no la duplica", () => {
    const una = permitirExcepcion(g, "1", "familiaRepartida").invitados;
    const dos = permitirExcepcion(una, "1", "familiaRepartida").invitados;
    expect(dos[0].excepcionesRevision).toEqual(["familiaRepartida"]);
  });

  it("quitarla deja las demás", () => {
    let l = permitirExcepcion(g, "1", "a").invitados;
    l = permitirExcepcion(l, "1", "b").invitados;
    expect(quitarExcepcion(l, "1", "a").invitados[0].excepcionesRevision).toEqual(["b"]);
  });
});

describe("responsable de un rol", () => {
  it("uno solo por rol, y pulsarlo otra vez lo quita", () => {
    const uno = marcarResponsable({}, "acomodador", "1");
    expect(uno).toEqual({ acomodador: "1" });
    expect(marcarResponsable(uno, "acomodador", "2")).toEqual({ acomodador: "2" });
    expect(marcarResponsable(uno, "acomodador", "1")).toEqual({});
  });
});
