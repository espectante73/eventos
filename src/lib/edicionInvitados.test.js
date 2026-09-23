import { describe, it, expect } from "vitest";
import { agregarInvitado, importarInvitados, eliminarInvitado, mismaPersona } from "./edicionInvitados";

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
