import { describe, it, expect } from "vitest";
import { mensajesWhatsapp, saludoWhatsapp, rellenar, enLista, fechaDelMensaje, PLANTILLAS_WHATSAPP } from "./mensajesWhatsapp";
import { enlaceWhatsApp } from "./telefono";
import { euros } from "./formato";

const evento = { fecha: "2026-12-11" };
const persona = (id, nombre, extra = {}) => ({ id, nombre, apellido: "Pacheco", grupoFamiliar: "Pacheco01", confirmado: true, pagado: false, cancion: "", ...extra });
const omar = persona("o", "Omar");
const miriam = persona("m", "Míriam", { pagado: true, cancion: "Bailando — Enrique Iglesias" });
const lucia = persona("l", "Lucía");
const familia = [omar, miriam, lucia];
const FALTAN = { o: ["alergias"], l: ["anioNacimiento"] };
const IMPORTE = { o: 45, m: 45, l: 20 };
const para = (invitado, extra = {}) =>
  mensajesWhatsapp({ invitado, familia, evento, faltanDe: (g) => FALTAN[g.id] || [], importeDe: (g) => IMPORTE[g.id] || 0, ...extra });

describe("mensajes de WhatsApp por familia (v82.6)", () => {
  it("«PACHECO, Omar:» y el mensaje de la familia: lo que falta de cada uno", () => {
    const datos = para(omar).find((x) => x.id === "datos");
    expect(datos.texto).toBe("PACHECO, Omar: para la boda del 11 de diciembre nos faltan algunos datos de la familia: Omar (alergias) y Lucía (año de nacimiento). ¿Nos los mandan cuando puedan? ¡Gracias!");
  });

  it("la foto y el año de boda, una vez y para la familia (son del matrimonio)", () => {
    const m = mensajesWhatsapp({ invitado: omar, familia, evento, faltanDe: (g) => ({ o: ["email", "fotoBoda", "alergias"], m: ["fotoBoda"], l: ["anioNacimiento"] })[g.id] || [] });
    expect(m[0].texto).toContain("de la familia: Omar (email y alergias), Lucía (año de nacimiento) y la foto de boda.");
  });

  it("el mismo mensaje a toda la familia, menos el nombre", () => {
    const deOmar = para(omar).map((x) => x.texto.replace(/^PACHECO, \S+: /, ""));
    const deMiriam = para(miriam).map((x) => x.texto.replace(/^PACHECO, \S+: /, ""));
    expect(deMiriam).toEqual(deOmar);
    expect(para(miriam)[0].texto).toMatch(/^PACHECO, Míriam: /);
  });

  it("le toca si le toca a alguien de la familia: Míriam, ya pagada y con canción, recibe los tres", () => {
    expect(para(miriam).map((x) => x.id)).toEqual(["datos", "musica", "pagos"]);
  });

  it("el pago, el total pendiente de la familia (Míriam ya pagó)", () => {
    const pagos = para(omar).find((x) => x.id === "pagos");
    expect(pagos.etiqueta).toBe(`Pagos · ${euros(65)}`);
    expect(pagos.texto).toContain(`queda pendiente el pago de la familia: ${euros(65)}.`);
  });

  it("Música pide hasta 3, en plural para la familia", () => {
    expect(para(omar).find((x) => x.id === "musica").texto).toContain("les gustaría bailar en la fiesta? Cada uno puede pedir hasta 3");
  });

  it("quien viene solo: lo suyo y en singular, con su apellido", () => {
    const jacob = { id: "j", nombre: "Jacob", apellido: "Barrios", grupoFamiliar: "Barrios01", confirmado: true, pagado: false, cancion: "" };
    const m = mensajesWhatsapp({ invitado: jacob, familia: [jacob], evento, faltanDe: () => ["email"], importeDe: () => 45 });
    expect(m.map((x) => x.texto)).toEqual([
      "BARRIOS, Jacob: para la boda del 11 de diciembre nos faltan algunos datos tuyos: email. ¿Nos los mandas cuando puedas? ¡Gracias!",
      "BARRIOS, Jacob: ¿qué canciones te gustaría bailar en la fiesta? Puedes pedir hasta 3: dinos el título y quién la canta.",
      `BARRIOS, Jacob: queda pendiente tu pago: ${euros(45)}. Cuando lo hagas, avísanos y lo apuntamos. ¡Gracias!`,
    ]);
  });

  it("con todo hecho en la familia, ninguno; «No asiste» no cuenta para el pago", () => {
    const listos = familia.map((g) => ({ ...g, pagado: true, cancion: "Bailando — Enrique Iglesias" }));
    expect(mensajesWhatsapp({ invitado: listos[0], familia: listos, evento })).toEqual([]);
    const noAsiste = [{ ...omar, noAsiste: true, cancion: "x" }];
    expect(mensajesWhatsapp({ invitado: noAsiste[0], familia: noAsiste, evento, importeDe: () => 45 }).map((x) => x.id)).not.toContain("pagos");
  });

  it("con su texto en Datos del evento, vale el suyo para todos, detrás del saludo", () => {
    const conTexto = { ...evento, plantillaWhatsappMusica: "¿su canción?" };
    expect(para(omar, { evento: conTexto }).find((x) => x.id === "musica").texto).toBe("PACHECO, Omar: ¿su canción?");
  });

  it("el saludo, la lista, la fecha y los huecos", () => {
    expect(saludoWhatsapp({ nombre: "Ana", apellido: "Gil", grupoFamiliar: "Ruiz02" })).toBe("RUIZ, Ana");
    expect(saludoWhatsapp({ nombre: "Ana", apellido: "Gil" })).toBe("GIL, Ana");
    expect(rellenar("{nombre}/{importe}/{otro}", { nombre: "A", importe: "5 €" })).toBe("A/5 €/{otro}");
    expect(enLista(["a", "b", "c"])).toBe("a, b y c");
    expect(fechaDelMensaje({ fecha: "2026-12-11", fechaSinConfirmar: true })).toBe("día que se confirme");
    expect(PLANTILLAS_WHATSAPP.map((p) => p.titulo)).toEqual(["Faltan datos", "Música", "Pagos"]);
  });

  it("el enlace lleva el mensaje ya escrito", () => {
    expect(enlaceWhatsApp("612 34 56 78")).toBe("https://wa.me/34612345678");
    expect(enlaceWhatsApp("612 34 56 78", "Hola, ¿qué tal?")).toBe("https://wa.me/34612345678?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F");
  });
});
