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

  it("separa lo que está mal de lo que solo está pendiente", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO, mesa: null }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA, mesa: null }),
    ];
    const hallazgos = revisarInvitados(lista, { fecha: "2026-11-13" });
    expect(buscar(hallazgos, "confirmadoSinMesa").tipo).toBe("pendiente");
    expect(buscar(hallazgos, "confirmadoSinMesa").personas).toHaveLength(2);
  });

  it("cuenta como pendiente el matrimonio sin año de boda, una vez por pareja", () => {
    const lista = [
      persona({ nombre: "Benito", rolFamiliar: ROL_FAMILIAR.ESPOSO, anioBoda: "" }),
      persona({ nombre: "Ana", rolFamiliar: ROL_FAMILIAR.ESPOSA, anioBoda: "" }),
    ];
    const h = buscar(revisarInvitados(lista, { fecha: "2026-11-13" }), "matrimonioSinAnioBoda");
    expect(h.personas).toHaveLength(1);
  });

  it("no da por revisado a quien tiene el rol en blanco", () => {
    const lista = [persona({ nombre: "Nadie", rolFamiliar: "" })];
    expect(claves(revisarInvitados(lista, {}))).toContain("sinRevisar");
  });
});
