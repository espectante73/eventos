import { describe, it, expect } from "vitest";
import { sobresDeMatrimonios, dibujarSobres, SOBRES } from "./sobresMatrimonios";
import { matrimoniosConLosQueVienenSolos } from "./matrimonios";

const g = (id, nombre, apellido, grupoFamiliar, rolFamiliar, mesa, extra = {}) => ({ id, nombre, apellido, grupoFamiliar, rolFamiliar, mesa, confirmado: true, ...extra });
const INVITADOS = [
  g("1", "Luis", "Abreu", "M1", "esposo", 7),
  g("2", "Ana", "Medina", "M1", "esposa", 7),
  g("3", "Leo", "Abreu", "M1", "hijo", 7),
  g("4", "Jacob", "Barrios", "B1", "esposo", 3),
  g("5", "Lucía", "Pacheco", "B1", "esposa", 3),
  g("6", "Daniel", "Suárez", "S1", "esposo", null),
  g("7", "Sara", "Mesa", "S1", "esposa", null),
  // Sin confirmar los dos: no es un matrimonio confirmado.
  g("8", "Pedro", "Afonso", "A1", "esposo", 5),
  g("9", "Elena", "Tomás", "A1", "esposa", 5, { confirmado: false }),
];

describe("sobresDeMatrimonios", () => {
  it("uno por matrimonio confirmado, los mismos que cuenta Aniversarios (norma 7)", () => {
    const { sobres } = sobresDeMatrimonios(INVITADOS, "2026-12-11");
    expect(sobres).toHaveLength(matrimoniosConLosQueVienenSolos(INVITADOS, "2026-12-11").filter((m) => m.confirmados).length);
    expect(sobres).toHaveLength(3);
  });
  it("en el orden de las mesas, el esposo primero; los que no tienen mesa, al final y contados", () => {
    const { sobres, sinMesa } = sobresDeMatrimonios(INVITADOS, "2026-12-11");
    expect(sobres.map((s) => [s.mesa, s.nombres])).toEqual([
      [3, "Jacob y Lucía"],
      [7, "Luis y Ana"],
      [null, "Daniel y Sara"],
    ]);
    expect(sinMesa).toBe(1);
  });
});

function hojaDePega() {
  const textos = [];
  const imagenes = [];
  const paginas = [];
  const pdf = {
    addPage: (formato, orientacion) => paginas.push([formato, orientacion]),
    getTextWidth: (t) => t.length * 6,
    text: (t, x, y) => textos.push({ t, x, y }),
    addImage: (...a) => imagenes.push(a),
  };
  for (const f of ["setFillColor", "setDrawColor", "setTextColor", "setLineWidth", "setFont", "setFontSize", "circle"]) pdf[f] = () => {};
  return { pdf, textos, imagenes, paginas };
}
const LOGO = { dato: "data:image/png;base64,AAA", imagen: null, proporcion: 0.9 };

describe("dibujarSobres", () => {
  const { sobres } = sobresDeMatrimonios(INVITADOS, "2026-12-11");
  it("una página por sobre, del tamaño del sobre elegido", () => {
    const h = hojaDePega();
    expect(dibujarSobres(h.pdf, sobres, { sobre: "c6", nombre: "centro", logo: "encima" }, LOGO)).toBe(3);
    expect(h.paginas).toHaveLength(2);
    const mm = 72 / 25.4;
    expect(h.paginas[0][0][0]).toBeCloseTo(SOBRES.c6.ancho * mm);
  });
  it("una línea: «Jacob y Lucía» (por defecto) o «BARRIOS, Jacob y Lucía», y el número de su mesa; sin mesa, sin número", () => {
    const solo = hojaDePega();
    dibujarSobres(solo.pdf, sobres, { sobre: "americano", nombre: "abajoDerecha", logo: "sin" }, LOGO);
    expect(solo.textos.map((x) => x.t)).toEqual(["Jacob y Lucía", "3", "Luis y Ana", "7", "Daniel y Sara"]);
    const con = hojaDePega();
    dibujarSobres(con.pdf, sobres, { sobre: "americano", formato: "apellido", nombre: "abajoDerecha", logo: "sin" }, LOGO);
    expect(con.textos.map((x) => x.t).slice(0, 3)).toEqual(["BARRIOS, ", "Jacob y Lucía", "3"]);
    expect(con.imagenes).toHaveLength(0);
  });
  it("el logo donde se elige; sin logo cargado, no se dibuja", () => {
    for (const logo of ["encima", "debajo", "alLado", "centro"]) {
      const h = hojaDePega();
      dibujarSobres(h.pdf, [sobres[0]], { sobre: "americano", nombre: "abajoDerecha", logo }, LOGO);
      expect(h.imagenes, logo).toHaveLength(1);
    }
    const sin = hojaDePega();
    dibujarSobres(sin.pdf, [sobres[0]], { sobre: "americano", nombre: "centro", logo: "encima" }, null);
    expect(sin.imagenes).toHaveLength(0);
  });
  it("nombre abajo a la derecha: dentro del margen, pegado a la derecha y abajo", () => {
    const h = hojaDePega();
    dibujarSobres(h.pdf, [sobres[0]], { sobre: "americano", nombre: "abajoDerecha", logo: "sin" }, LOGO);
    const mm = 72 / 25.4;
    const ancho = SOBRES.americano.ancho * mm;
    const alto = SOBRES.americano.alto * mm;
    for (const x of h.textos) {
      expect(x.x).toBeGreaterThan(ancho / 2);
      expect(x.x).toBeLessThan(ancho - 15 * mm);
      expect(x.y).toBeGreaterThan(alto / 2);
      expect(x.y).toBeLessThan(alto - 15 * mm);
    }
  });
});
