// «Exportar contactos» (v93.4): la ficha de cada invitado en un .vcf que
// Contactos del Mac sabe importar, y que «Importar tel.» sabe leer.
import { describe, it, expect } from "vitest";
import { fichaVCard, contactosDeInvitados } from "./exportarContactos";
import { leerVCard } from "./importarTelefonos";

const ANA = { id: "a", nombre: "Ana", apellido: "Medina Pérez", telefono: "+34600111222", email: "ana@ejemplo.com" };

describe("exportar contactos", () => {
  it("la ficha: apellidos y nombre como los lee Contactos, el móvil y el email", () => {
    expect(fichaVCard(ANA)).toBe(
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:Medina Pérez;Ana;;;",
        "FN:Ana Medina Pérez",
        "TEL;type=CELL;type=VOICE;type=pref:+34600111222",
        "EMAIL;type=INTERNET;type=HOME;type=pref:ana@ejemplo.com",
        "END:VCARD",
      ].join("\r\n")
    );
  });

  it("de qué los conoce (v93.5): en Notas, «Evento: Las Bodas de todos», sin el punto", () => {
    const ficha = fichaVCard(ANA, [], { nombre: "Las Bodas de todos." });
    expect(ficha).toContain("NOTE:Evento: Las Bodas de todos\r\nEND:VCARD");
    expect(fichaVCard(ANA, [], {})).not.toContain("NOTE");
  });

  it("sin teléfono o sin email, solo lo que tiene; sin ninguno de los dos, nada", () => {
    expect(fichaVCard({ ...ANA, telefono: "" })).not.toContain("TEL");
    expect(fichaVCard({ ...ANA, email: "" })).not.toContain("EMAIL");
    expect(fichaVCard({ ...ANA, telefono: "", email: "" })).toBe("");
  });

  it("el email de un colaborador sin email en su ficha, el de su cuenta (emailDeInvitado)", () => {
    const colaboradores = [{ id: "c1", invitadoId: "a", email: "ana.cuenta@ejemplo.com" }];
    expect(fichaVCard({ ...ANA, email: "" }, colaboradores)).toContain("EMAIL;type=INTERNET;type=HOME;type=pref:ana.cuenta@ejemplo.com");
  });

  it("las comas y los puntos y coma de un nombre van escapados", () => {
    expect(fichaVCard({ ...ANA, nombre: "Ana; María", apellido: "Medina, hija" })).toContain("N:Medina\\, hija;Ana\\; María;;;");
  });

  it("todo el archivo: una ficha por invitado con algo que añadir, y «Importar tel.» lo lee igual", () => {
    const invitados = [ANA, { id: "b", nombre: "Luis", apellido: "Abreu", telefono: "+34611222333", email: "" }, { id: "c", nombre: "Sin", apellido: "Datos" }];
    const { texto, cuantos } = contactosDeInvitados(invitados, [], { nombre: "Las Bodas de todos." });
    expect(cuantos).toBe(2);
    const leidos = leerVCard(texto);
    expect(leidos.map((c) => [c.apellidos, c.nombre, c.telefonos[0].numero])).toEqual([
      ["Medina Pérez", "Ana", "+34600111222"],
      ["Abreu", "Luis", "+34611222333"],
    ]);
    expect(contactosDeInvitados([])).toEqual({ texto: "", cuantos: 0 });
  });
});
