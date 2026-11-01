// v78.2 (él): los teléfonos, desde el archivo de Contactos. Contactos de mentira.
import { describe, it, expect } from "vitest";
import { leerVCard, repasoTelefonos, ponerTelefonos } from "./importarTelefonos";

const VCF = [
  "BEGIN:VCARD", "VERSION:3.0", "N:Pacheco García;Rubén;;;", "FN:Rubén Pacheco García",
  "EMAIL;type=INTERNET:no@importa.com", "ADR;type=HOME:;;Calle Falsa 1;Icod;;;", "NOTE:una nota que no se lee",
  "item1.TEL;type=pref:922 11 22 33", "TEL;type=CELL;type=VOICE:612 34 56 78", "END:VCARD",
  "BEGIN:VCARD", "VERSION:3.0", "N:;;;;", "FN:Ana Sierra", "TEL;type=CELL:+34 699 11 22 33", "END:VCARD",
  "BEGIN:VCARD", "VERSION:3.0", "N:García;Juan;;;", "TEL:611 00 00 01", "END:VCARD",
  "BEGIN:VCARD", "VERSION:3.0", "N:García López;Juan;;;", "TEL:611 00 00 02", "END:VCARD",
  "BEGIN:VCARD", "VERSION:3.0", "N:primo;Luis;;;", "TEL:633 00 00 00", "END:VCARD",
  "BEGIN:VCARD", "VERSION:3.0", "N:Sin;Teléfono;;;", "END:VCARD",
  "BEGIN:VCARD", "VERSION:3.0", "N:Mesa;Eva;;;", "TEL;type=CELL:688 77 66 55", "END:VCARD",
  "BEGIN:VCARD", "VERSION:3.0", "N:Ruiz;Luz;;;", "TEL;type=CELL:655 44 33 2", " 2", "END:VCARD",
].join("\r\n");

describe("leerVCard", () => {
  it("de cada contacto, solo nombre, apellidos y teléfonos; el móvil, el primero", () => {
    const contactos = leerVCard(VCF);
    const ruben = contactos.find((c) => c.nombre === "Rubén");
    expect(ruben).toEqual({
      nombre: "Rubén",
      apellidos: "Pacheco García",
      completo: "Rubén Pacheco García",
      telefonos: [
        { numero: "+34612345678", tipo: "móvil" },
        { numero: "+34922112233", tipo: "otro" },
      ],
    });
    // Una línea partida en dos (empieza por espacio) sigue a la anterior.
    expect(contactos.find((c) => c.nombre === "Luz").telefonos[0].numero).toBe("+34655443322");
    // Sin teléfono, ni se cuenta.
    expect(contactos.some((c) => c.apellidos === "Sin")).toBe(false);
  });
});

describe("repasoTelefonos", () => {
  const evento = { fecha: "2026-12-11" };
  const g = (id, apellido, nombre, extra = {}) => ({ id, apellido, nombre, anioNacimiento: "1980", telefono: "", ...extra });
  const invitados = [
    g("1", "Pacheco", "Rubén"),
    g("2", "Sierra", "Ana", { telefono: "+34611111111" }),
    g("3", "García", "Juan"),
    g("4", "Hernández", "Luis"),
    g("5", "Mesa", "Eva", { telefono: "+34688776655" }),
    g("6", "Nadie", "Pepe"),
    g("7", "Pacheco", "Leo", { anioNacimiento: "2015" }),
  ];
  const repaso = repasoTelefonos(invitados, leerVCard(VCF), evento);
  const ids = (grupo) => repaso[grupo].map((x) => x.invitado.id);

  it("en cinco grupos, y los menores de 16, fuera", () => {
    expect(ids("nuevos")).toEqual(["1"]);
    expect(ids("distintos")).toEqual(["2"]);
    expect(ids("dudosos")).toEqual(["3"]);
    expect(ids("yaEstan")).toEqual(["5"]);
    expect(ids("sinEncontrar")).toEqual(["4", "6"].sort());
  });

  it("dos contactos posibles: se duda (no se adivina); si uno casa entero y otro a medias, gana el entero", () => {
    // «García, Juan» puede ser «Juan García» o «Juan García López».
    expect(repaso.dudosos[0].candidatos.map((c) => c.numero)).toEqual(["+34611000001", "+34611000002"]);
    // «García López, Juan»: entero solo con el segundo.
    const entero = repasoTelefonos([g("8", "García López", "Juan")], leerVCard(VCF), evento);
    expect(entero.nuevos[0].opciones[0].numero).toBe("+34611000002");
    const dos = repasoTelefonos([g("9", "García", "Juan")], [
      { nombre: "Juan", apellidos: "García López", completo: "", telefonos: [{ numero: "+34611000002", tipo: "móvil" }] },
      { nombre: "Juan", apellidos: "García Pérez", completo: "", telefonos: [{ numero: "+34611000003", tipo: "móvil" }] },
    ], evento);
    expect(dos.dudosos[0].candidatos.map((c) => c.numero)).toEqual(["+34611000002", "+34611000003"]);
  });

  it("el nuevo trae primero su móvil", () => {
    expect(repaso.nuevos[0].opciones[0]).toEqual({ numero: "+34612345678", tipo: "móvil" });
  });
});

describe("ponerTelefonos", () => {
  it("guarda los elegidos, limpios, y dice cuántos", () => {
    const lista = [{ id: "1", telefono: "" }, { id: "2", telefono: "+34611111111" }];
    const { invitados, aviso } = ponerTelefonos(lista, { 1: "612 34 56 78", 2: "+34611111111" });
    expect(invitados[0].telefono).toBe("+34612345678");
    expect(invitados[1]).toBe(lista[1]);
    expect(aviso).toBe("Guardado 1 teléfono.");
  });
});
