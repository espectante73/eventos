import { describe, it, expect } from "vitest";
import { revisarInvitados, revisarConExcepciones } from "./revisionInvitados";
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
  email: "x@x.com",
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

  it("caza al matrimonio con uno confirmado y el otro no", () => {
    const lista = [
      persona({ rolFamiliar: ROL_FAMILIAR.ESPOSO, confirmado: true }),
      persona({ rolFamiliar: ROL_FAMILIAR.ESPOSA, confirmado: false, mesa: null }),
    ];
    const aMedias = revisarInvitados(lista).find((h) => h.clave === "matrimonioAMedias");
    expect(aMedias.personas).toHaveLength(2);
  });

  it("NO avisa de un matrimonio con colaboradores distintos (reparto 10-12 por colaborador)", () => {
    const lista = [
      persona({ rolFamiliar: ROL_FAMILIAR.ESPOSO, colaboradorId: "c1" }),
      persona({ rolFamiliar: ROL_FAMILIAR.ESPOSA, colaboradorId: "c2" }),
    ];
    expect(revisarInvitados(lista).map((h) => h.clave)).not.toContain("matrimonioAMedias");
    expect(revisarInvitados(lista).some((h) => /colaborador/i.test(h.titulo) && h.clave !== "asignadoSinRolFamiliar")).toBe(false);
  });

  it("avisa del colaborador con menos de 10 o más de 12, y no del que tiene 0", () => {
    const colaboradores = [
      { id: "pocos", nombre: "Ana" },
      { id: "bien", nombre: "Luis" },
      { id: "muchos", nombre: "Eva" },
      { id: "dev", nombre: "Desarrollador" },
    ];
    const asignar = (id, n) => Array.from({ length: n }, () => persona({ colaboradorId: id }));
    const lista = [...asignar("pocos", 8), ...asignar("bien", 11), ...asignar("muchos", 14)];
    const reparto = revisarInvitados(lista, {}, colaboradores).find((h) => h.clave === "repartoColaboradores");
    expect(reparto.personas.map((p) => p.etiqueta)).toEqual(["Ana: 8", "Eva: 14"]);
    expect(reparto.personas[0].filtros).toEqual({ texto: "", colaboradorId: "pocos" });
    expect(reparto.tipo).toBe("pendiente");
  });

  it("una excepción aceptada deja de avisarse, SOLO para esa persona y ese aviso", () => {
    const madre = persona({ nombre: "Madre", apellido: "Gatell", grupoFamiliar: "Gatell01", excepcionesRevision: ["sueltoConFamilia"] });
    const otraS = persona({ nombre: "Otra", apellido: "Gatell", grupoFamiliar: "Gatell01" });
    const lista = [
      persona({ apellido: "Gatell", grupoFamiliar: "Gatell01", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ apellido: "Gatell", grupoFamiliar: "Gatell01", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
      madre,
      otraS,
    ];
    const { hallazgos, excepciones } = revisarConExcepciones(lista);
    const suelto = hallazgos.find((h) => h.clave === "sueltoConFamilia");
    expect(suelto.personas).toEqual([otraS]);
    expect(excepciones).toHaveLength(1);
    expect(excepciones[0]).toMatchObject({ clave: "sueltoConFamilia", persona: madre });
  });

  it("si todas las personas de un aviso son excepciones, el aviso desaparece", () => {
    const lista = [
      persona({ apellido: "Gatell", grupoFamiliar: "Gatell01", rolFamiliar: ROL_FAMILIAR.ESPOSO }),
      persona({ apellido: "Gatell", grupoFamiliar: "Gatell01", rolFamiliar: ROL_FAMILIAR.ESPOSA }),
      persona({ apellido: "Gatell", grupoFamiliar: "Gatell01", excepcionesRevision: ["sueltoConFamilia"] }),
    ];
    expect(revisarInvitados(lista).map((h) => h.clave)).not.toContain("sueltoConFamilia");
  });

  it("señala a la familia sin ningún email, y no a la que tiene uno", () => {
    const sinNinguno = [
      persona({ apellido: "Abreu", grupoFamiliar: "Abreu01", rolFamiliar: ROL_FAMILIAR.ESPOSO, email: "" }),
      persona({ apellido: "Abreu", grupoFamiliar: "Abreu01", rolFamiliar: ROL_FAMILIAR.ESPOSA, email: "" }),
    ];
    const conUno = [
      persona({ apellido: "Luis", grupoFamiliar: "Luis01", rolFamiliar: ROL_FAMILIAR.ESPOSO, email: "a@a.com" }),
      persona({ apellido: "Luis", grupoFamiliar: "Luis01", rolFamiliar: ROL_FAMILIAR.ESPOSA, email: "" }),
    ];
    const h = revisarInvitados([...sinNinguno, ...conUno]).find((x) => x.clave === "familiaSinEmail");
    expect(h.personas.map((p) => p.grupoFamiliar)).toEqual(["Abreu01", "Abreu01"]);
  });

  it("caza a una familia repartida en varias mesas", () => {
    const lista = [
      persona({ rolFamiliar: ROL_FAMILIAR.PADRE, mesa: 1 }),
      persona({ rolFamiliar: ROL_FAMILIAR.HIJO, mesa: 2 }),
      persona({ rolFamiliar: ROL_FAMILIAR.SUELTO, apellido: "Otro", grupoFamiliar: "Otro 01", mesa: 3 }),
    ];
    const repartida = revisarInvitados(lista).find((h) => h.clave === "familiaRepartida");
    expect(repartida.personas).toHaveLength(2);
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

describe("asignados sin rol familiar", () => {
  const claves = (hs) => hs.map((h) => h.clave);

  it("avisa de quien tiene colaborador pero no tiene rol", () => {
    const lista = [
      { id: "1", nombre: "Ana", apellido: "Ruiz", grupoFamiliar: "Ruiz", colaboradorId: "c1", rolFamiliar: "" },
    ];
    expect(claves(revisarInvitados(lista, { fecha: "2026-11-13" }))).toContain("asignadoSinRolFamiliar");
  });

  it("no avisa si tiene rol, ni si todavía no tiene colaborador", () => {
    const conRol = [
      { id: "1", nombre: "Ana", apellido: "Ruiz", grupoFamiliar: "Ruiz", colaboradorId: "c1", rolFamiliar: "suelto" },
    ];
    const sinColaborador = [
      { id: "2", nombre: "Luis", apellido: "Paz", grupoFamiliar: "Paz", colaboradorId: null, rolFamiliar: "" },
    ];
    expect(claves(revisarInvitados(conRol, { fecha: "2026-11-13" }))).not.toContain("asignadoSinRolFamiliar");
    expect(claves(revisarInvitados(sinColaborador, { fecha: "2026-11-13" }))).not.toContain("asignadoSinRolFamiliar");
  });
});

describe("colaboradores sin su ficha enlazada", () => {
  const jacob = persona({ id: "inv-1", nombre: "Jacob", apellido: "Barrios", grupoFamiliar: "Barrios 01" });

  it("sale en la revisión, y deja de salir en cuanto se enlaza", () => {
    const suelto = { id: "c1", nombre: "Barrios, Jacob", invitadoId: null, email: "j@j.com" };
    const enlazado = { ...suelto, invitadoId: "inv-1" };
    expect(claves(revisarInvitados([jacob], {}, [suelto]))).toContain("colaboradorSinFicha");
    expect(claves(revisarInvitados([jacob], {}, [enlazado]))).not.toContain("colaboradorSinFicha");
  });

  it("señala a la persona, para poder saltar a ella en la lista", () => {
    const suelto = { id: "c1", nombre: "Barrios, Jacob", invitadoId: null, email: "j@j.com" };
    const h = buscar(revisarInvitados([jacob], {}, [suelto]), "colaboradorSinFicha");
    expect(h.personas.map((p) => p.id)).toEqual(["inv-1"]);
  });
});

describe("la misma persona, dos veces en la lista", () => {
  it("dos fichas con el mismo nombre y apellido salen las dos", () => {
    const uno = persona({ id: "a", nombre: "Jacob", apellido: "Barrios", grupoFamiliar: "Barrios 01" });
    const otro = persona({ id: "b", nombre: "Jacob", apellido: "Barrios", grupoFamiliar: "Barrios 01" });
    const h = buscar(revisarInvitados([uno, otro]), "invitadoRepetido");
    expect(h.personas.map((p) => p.id).sort()).toEqual(["a", "b"]);
  });

  it("las tildes y las mayúsculas no engañan", () => {
    const uno = persona({ id: "a", nombre: "Adrián", apellido: "Jordán" });
    const otro = persona({ id: "b", nombre: "adrian", apellido: "JORDAN" });
    expect(claves(revisarInvitados([uno, otro]))).toContain("invitadoRepetido");
  });

  it("dos personas distintas de la misma familia no son un repetido", () => {
    const uno = persona({ id: "a", nombre: "Dani", apellido: "Luis" });
    const otro = persona({ id: "b", nombre: "Míriam", apellido: "Luis" });
    expect(claves(revisarInvitados([uno, otro]))).not.toContain("invitadoRepetido");
  });

  it("las fichas todavía en blanco no cuentan como repetidas", () => {
    const uno = persona({ id: "a", nombre: "", apellido: "" });
    const otro = persona({ id: "b", nombre: "", apellido: "" });
    expect(claves(revisarInvitados([uno, otro]))).not.toContain("invitadoRepetido");
  });
});
