// «Aviso de pago» (él, v89): a cada persona que no ha pagado, el mismo
// mensaje de su familia, con su nombre, la fecha de hoy, los días que
// quedan, lo que debe la familia y la fecha límite.
import { describe, it, expect } from "vitest";
import { avisosDePago, diaYMesISO } from "./avisoPago";
import { ROL_FAMILIAR } from "./rolFamiliar";
import { euros } from "./formato";

const evento = { nombre: "Las Bodas de todos.", fecha: "2026-12-11", precioAdulto: "47", precioNino: "35", edadNinoDesde: "4", edadNinoHasta: "8" };
const hoy = new Date(2026, 10, 17, 12);
const colaboradores = [{ id: "c1", nombre: "Barrios, Jacob", invitadoId: "g0" }];
const invitados = [
  { id: "g0", nombre: "Jacob", apellido: "Barrios", grupoFamiliar: "Barrios01", confirmado: true, pagado: true, anioNacimiento: "1980", telefono: "611111111" },
  { id: "g1", nombre: "Omar", apellido: "Pacheco", grupoFamiliar: "Pacheco01", rolFamiliar: ROL_FAMILIAR.ESPOSO, colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "1985", telefono: "612345678" },
  { id: "g2", nombre: "Míriam", apellido: "Pacheco", grupoFamiliar: "Pacheco01", rolFamiliar: ROL_FAMILIAR.ESPOSA, colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "1988", telefono: "" },
  { id: "g3", nombre: "Lucía", apellido: "Pacheco", grupoFamiliar: "Pacheco01", rolFamiliar: ROL_FAMILIAR.HIJO, colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "2020" },
  { id: "g4", nombre: "Loly", apellido: "Abrante", grupoFamiliar: "Abrante01", confirmado: true, pagado: false, anioNacimiento: "1970", telefono: "699999999" },
  { id: "g5", nombre: "Ana", apellido: "Medina", confirmado: false, pagado: false, anioNacimiento: "1970", telefono: "688888888" },
];

describe("el aviso de pago del anfitrión", () => {
  const { filas } = avisosDePago({ invitados, evento, colaboradores, limite: "2026-11-24", hoy });
  const de = (id) => filas.find((f) => f.invitado.id === id);

  it("a cada persona confirmada que no ha pagado, ordenadas por familia y nombre; ni a quien pagó ni a quien no confirmó", () => {
    expect(filas.map((f) => f.invitado.id)).toEqual(["g4", "g3", "g2", "g1"]);
  });

  it("con lo que debe TODA la familia (47 + 47 + 35)", () => {
    expect(de("g1").importe).toBe(euros(129));
    expect(de("g2").importe).toBe(euros(129));
  });

  it("el mismo mensaje para la familia, con el nombre de cada uno, la fecha de hoy, los días, el importe, la fecha límite y su colaborador", () => {
    const omar = de("g1").texto;
    expect(omar.startsWith("PACHECO, Omar:\nLes escribe el ANFITRIÓN de «Las Bodas de todos».")).toBe(true);
    expect(omar).toContain(`Hoy, 17 de noviembre, quedan 24 días para la boda y el pago de la familia (${euros(129)}) sigue pendiente.`);
    expect(omar).toContain("Si el pago no está resuelto antes del 24 de noviembre, no podrán continuar como invitados.");
    expect(omar).toContain("Para pagar, hablen con su colaborador (Barrios, Jacob) o contesten a este mensaje.");
    expect(omar).not.toContain("cancelar");
    expect(de("g2").texto.replace("PACHECO, Míriam", "PACHECO, Omar")).toBe(omar);
  });

  it("a quien viene solo, en singular; sin colaborador, el anfitrión", () => {
    const loly = de("g4").texto;
    expect(loly).toContain("Te escribe el ANFITRIÓN");
    expect(loly).toContain(`tu pago (${euros(47)}) sigue pendiente`);
    expect(loly).toContain("no podrás seguir en la lista de invitados");
    expect(loly).toContain("Para pagar, habla con el anfitrión o contesta a este mensaje.");
  });

  it("sin teléfono, vacío (la ventana dice «Sin teléfono»)", () => {
    expect(de("g2").telefono).toBe("");
    expect(de("g3").telefono).toBe("");
  });

  it("sin fecha límite no hay mensaje; sin fecha del evento, ni lista", () => {
    expect(avisosDePago({ invitados, evento, colaboradores, hoy }).filas[0].texto).toBeNull();
    const sinFecha = avisosDePago({ invitados, evento: { ...evento, fecha: "" }, colaboradores, limite: "2026-11-24", hoy });
    expect(sinFecha.filas).toEqual([]);
    expect(sinFecha.aviso).toContain("Falta la fecha del evento");
  });

  it("queda 1 día, en singular", () => {
    expect(avisosDePago({ invitados, evento, colaboradores, limite: "2026-12-10", hoy: new Date(2026, 11, 10, 12) }).filas[0].texto).toContain("Hoy, 10 de diciembre, queda 1 día para la boda");
  });

  it("la fecha límite, como se dice", () => {
    expect(diaYMesISO("2026-11-24")).toBe("24 de noviembre");
    expect(diaYMesISO("")).toBe("");
  });
});
