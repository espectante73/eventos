import { describe, it, expect } from "vitest";
import { mensajesWhatsapp, rellenar, enLista, fechaDelMensaje, PLANTILLAS_WHATSAPP } from "./mensajesWhatsapp";
import { enlaceWhatsApp } from "./telefono";

const evento = { fecha: "2026-12-11" };
const omar = { nombre: "Omar", apellido: "Pacheco", confirmado: true, pagado: false, cancion: "" };

describe("mensajes de WhatsApp por caso (v82.4)", () => {
  it("solo los que le tocan: faltan datos, sin canción y sin pagar", () => {
    const m = mensajesWhatsapp({ invitado: omar, evento, faltan: ["anioNacimiento", "alergias"], importe: 45 });
    expect(m.map((x) => x.id)).toEqual(["datos", "musica", "pagos"]);
    expect(m[0].texto).toBe("Hola, Omar: para la boda del 11 de diciembre nos faltan algunos datos tuyos: año de nacimiento y alergias. ¿Nos los mandas cuando puedas? ¡Gracias!");
    expect(m[1].texto).toContain("hasta 3");
    expect(m[2].etiqueta).toMatch(/^Pagos · 45/);
    expect(m[2].texto).toMatch(/pago de 45/);
  });

  it("con todo hecho, ninguno", () => {
    const listo = { ...omar, pagado: true, cancion: "Bailando — Enrique Iglesias" };
    expect(mensajesWhatsapp({ invitado: listo, evento, faltan: [], importe: 45 })).toEqual([]);
  });

  it("«No asiste» o sin importe (un bebé): sin mensaje de pago", () => {
    expect(mensajesWhatsapp({ invitado: { ...omar, noAsiste: true }, evento, importe: 45 }).map((x) => x.id)).not.toContain("pagos");
    expect(mensajesWhatsapp({ invitado: omar, evento, importe: 0 }).map((x) => x.id)).not.toContain("pagos");
  });

  it("con su texto en Datos del evento, vale el suyo", () => {
    const conTexto = { ...evento, plantillaWhatsappMusica: "Hey {nombre}, ¿tu canción?" };
    const m = mensajesWhatsapp({ invitado: omar, evento: conTexto });
    expect(m.find((x) => x.id === "musica").texto).toBe("Hey Omar, ¿tu canción?");
  });

  it("los huecos, la lista y la fecha", () => {
    expect(rellenar("{nombre}/{importe}/{otro}", { nombre: "A", importe: "5 €" })).toBe("A/5 €/{otro}");
    expect(enLista(["a"])).toBe("a");
    expect(enLista(["a", "b", "c"])).toBe("a, b y c");
    expect(fechaDelMensaje({ fecha: "2026-12-11", fechaSinConfirmar: true })).toBe("día que se confirme");
    expect(PLANTILLAS_WHATSAPP.map((p) => p.titulo)).toEqual(["Faltan datos", "Música", "Pagos"]);
  });

  it("el enlace lleva el mensaje ya escrito", () => {
    expect(enlaceWhatsApp("612 34 56 78")).toBe("https://wa.me/34612345678");
    expect(enlaceWhatsApp("612 34 56 78", "Hola, ¿qué tal?")).toBe("https://wa.me/34612345678?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F");
  });
});
