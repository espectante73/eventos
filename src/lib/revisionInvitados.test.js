import { describe, it, expect } from "vitest";
import { revisarInvitados } from "./revisionInvitados";
import { ROL_FAMILIAR } from "./rolFamiliar";

const persona = (extra) => ({
  id: Math.random().toString(36).slice(2),
  nombre: "X",
  apellido: "Fariña",
  grupoFamiliar: "Fariña 01",
  zona: "Tenerife",
  anioNacimiento: "1980",
  anioBoda: "2001",
  alergias: "No",
  confirmado: true,
  pagado: true,
  mesa: 1,
  rolFamiliar: ROL_FAMILIAR.SUELTO,
  ...extra,
});

const claves = (hallazgos) => hallazgos.map((h) => h.clave);
const buscar = (hallazgos, clave) => hallazgos.find((h) => h.clave === clave);

describe("revisarInvitados", () => {
  it("no encuentra nada en una lista sana", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
      persona({ nombre: "Lucía", rolFamiliar: ROL_FAMILIAR.HIJO }),
      persona({ nombre: "Rosa", apellido: "Pérez", grupoFamiliar: "Pérez 01" }),
    ];
    expect(revisarInvitados(lista, { fecha: "2026-11-13" })).toEqual([]);
  });

  it("caza al hijo que no tiene ningún adulto en su familia", () => {
    const lista = [persona({ nombre: "Lucía", rolFamiliar: ROL_FAMILIAR.HIJO })];
    const h = buscar(revisarInvitados(lista, {}), "hijoSinAdulto");
    expect(h.personas.map((g) => g.nombre)).toEqual(["Lucía"]);
  });

  it("caza a la P que viene sin hijos (deberia ser S)", () => {
    const lista = [persona({ nombre: "Marta", rolFamiliar: ROL_FAMILIAR.PADRE })];
    expect(claves(revisarInvitados(lista, {}))).toContain("padreSinHijos");
  });

  it("caza a la S que comparte grupo familiar con alguien", () => {
    const lista = [
      persona({ nombre: "Marta", rolFamiliar: ROL_FAMILIAR.SUELTO }),
      persona({ nombre: "Iván", rolFamiliar: ROL_FAMILIAR.HIJO }),
    ];
    expect(claves(revisarInvitados(lista, {}))).toContain("sueltoConFamilia");
  });

  // El caso que el usuario resolvió numerando las familias: si aparecen
  // dos matrimonios bajo el mismo grupo, es que falta ese número.
  it("caza dos esposas en el mismo grupo familiar", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
      persona({ nombre: "Rosa", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
    ];
    expect(claves(revisarInvitados(lista, {}))).toContain("dobleConyuge");
  });

  // Lo que ya es una columna de la lista (datos, pago, mesa, sin
  // revisar) NO entra aquí: se quitó por duplicado. El informe se queda
  // solo con lo que obliga a cruzar filas entre sí.
  it("no repite lo que la lista ya enseña columna a columna", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO, mesa: null, pagado: false, alergias: "" }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA, mesa: null, pagado: false, alergias: "" }),
      persona({ nombre: "Nadie", apellido: "Solo", grupoFamiliar: "Solo 01", rolFamiliar: "" }),
    ];
    const encontradas = claves(revisarInvitados(lista, { fecha: "2026-11-13" }));
    expect(encontradas).not.toContain("confirmadoSinMesa");
    expect(encontradas).not.toContain("confirmadoSinPagar");
    expect(encontradas).not.toContain("confirmadoSinDatos");
    expect(encontradas).not.toContain("sinRevisar");
  });

  it("cuenta como pendiente el matrimonio sin año de boda, una vez por pareja", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO, anioBoda: "" }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA, anioBoda: "" }),
    ];
    const h = buscar(revisarInvitados(lista, { fecha: "2026-11-13" }), "matrimonioSinAnioBoda");
    expect(h.personas).toHaveLength(1);
  });
});

// La app ya calcula la edad para los precios; ese mismo dato sirve para
// ver si un menor se ha quedado sentado sin nadie suyo al lado.
describe("menores en la mesa", () => {
  const evento = { fecha: "2026-11-13" };

  it("avisa del menor cuya familia no se sienta con él", () => {
    const lista = [
      persona({ nombre: "Lucía", anioNacimiento: "2016", rolFamiliar: ROL_FAMILIAR.HIJO, mesa: 5 }),
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO, mesa: 3 }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA, mesa: 3 }),
    ];
    const h = buscar(revisarInvitados(lista, evento), "menorSinAdultoEnMesa");
    expect(h.personas.map((g) => g.nombre)).toEqual(["Lucía"]);
  });

  it("no avisa si un adulto de su familia está en su mesa", () => {
    const lista = [
      persona({ nombre: "Lucía", anioNacimiento: "2016", rolFamiliar: ROL_FAMILIAR.HIJO, mesa: 3 }),
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO, mesa: 3 }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA, mesa: 3 }),
    ];
    expect(claves(revisarInvitados(lista, evento))).not.toContain("menorSinAdultoEnMesa");
  });

  // Un adulto de OTRA familia no vale: el aviso es "no tiene a los
  // suyos al lado", no "está rodeado de adultos".
  it("un adulto de otra familia no cuenta", () => {
    const lista = [
      persona({ nombre: "Lucía", anioNacimiento: "2016", rolFamiliar: ROL_FAMILIAR.HIJO, mesa: 3 }),
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO, mesa: 3 }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA, mesa: 3 }),
      // Iván se sienta con los Fariña, que son adultos pero no son los
      // suyos: sus padres no están en esa mesa.
      persona({ nombre: "Iván", apellido: "Pérez", grupoFamiliar: "Pérez 01", anioNacimiento: "2018", rolFamiliar: ROL_FAMILIAR.HIJO, mesa: 3 }),
    ];
    const h = buscar(revisarInvitados(lista, evento), "menorSinAdultoEnMesa");
    expect(h.personas.map((g) => g.nombre)).toEqual(["Iván"]);
  });

  it("no avisa de un menor que todavía no tiene mesa", () => {
    const lista = [persona({ nombre: "Lucía", anioNacimiento: "2016", rolFamiliar: ROL_FAMILIAR.HIJO, mesa: null })];
    expect(claves(revisarInvitados(lista, evento))).not.toContain("menorSinAdultoEnMesa");
  });
});
