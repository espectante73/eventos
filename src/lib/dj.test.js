import { describe, it, expect, vi } from "vitest";
import { filasDelDj, filtrarPeticiones, datosDjDesdeLista, cifrasDelDj, clavesDelDj, diaDe, referenciaCancionesDj, memoriaCancionesDj, clavesNuevas, textoCancionesNuevas } from "./dj";
import { construirEnlaceDj } from "./url";

const datos = {
  peticiones: [
    { cancion: "Despacito — Luis Fonsi\n\nBailando", edad: 62 },
    { cancion: "despacito", edad: 16 },
    { cancion: "Mi jaca — Estrellita Castro", edad: null },
  ],
};

describe("la página del DJ (v81)", () => {
  it("las que el anfitrión dejó fuera no llegan, en ninguna de sus peticiones (v84.3)", () => {
    const filas = filasDelDj({ ...datos, fuera: ["despacito"] });
    expect(filas.map((f) => f.cancion)).toEqual(["Bailando", "Mi jaca — Estrellita Castro"]);
    expect(filasDelDj(datos)).toHaveLength(4);
  });

  it("una fila por petición, con su edad y las veces de esa canción; sin nombres", () => {
    const filas = filasDelDj(datos);
    expect(filas.map((f) => `${f.veces}|${f.cancion}|${f.edad}`)).toEqual([
      "2|Despacito — Luis Fonsi|62",
      "1|Bailando|62",
      "2|Despacito — Luis Fonsi|16",
      "1|Mi jaca — Estrellita Castro|null",
    ]);
  });

  it("filtra por canción o artista (sin tildes) y por tramo de edad", () => {
    const filas = filasDelDj(datos);
    expect(filtrarPeticiones(filas, { texto: "fonsi" }).length).toBe(2);
    expect(filtrarPeticiones(filas, { texto: "JACA" }).map((f) => f.cancion)).toEqual(["Mi jaca — Estrellita Castro"]);
    expect(filtrarPeticiones(filas, { desde: "40" }).map((f) => f.edad)).toEqual([62, 62]);
    expect(filtrarPeticiones(filas, { desde: "10", hasta: "20" }).map((f) => f.edad)).toEqual([16]);
    expect(filtrarPeticiones(filas, {}).length).toBe(4);
  });

  it("el enlace", () => {
    expect(construirEnlaceDj("https://nexuspoint.rsvp/", "abc")).toBe("https://nexuspoint.rsvp?dj=abc");
    expect(construirEnlaceDj("", "abc")).toBe("");
  });
});

describe("la escucha previa (v81.1)", async () => {
  const { consultaDeFila, pedirMuestras } = await import("./escuchar");
  it("de una fila: canción y artista; y su número de Deezer si se encontró", () => {
    const f = { clave: "tucarinito", cancion: "Tu Cariñito — Edwin Rivera" };
    expect(consultaDeFila(f, {})).toEqual({ titulo: "Tu Cariñito", artista: "Edwin Rivera" });
    expect(consultaDeFila(f, { tucarinito: { titulo: "Tu Cariñito", deezer: 7 } })).toEqual({ titulo: "Tu Cariñito", artista: "Edwin Rivera", deezer: 7 });
    expect(consultaDeFila(f, { tucarinito: { noEncontrada: true, deezer: 7 } }).deezer).toBe(undefined);
  });

  it("al buscador: la llave, la sesión en la cabecera o el enlace y la clave del DJ", async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ candidatos: [] }) }));
    await pedirMuestras({ consulta: { titulo: "x" }, sesion: "jwt" }, f);
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer jwt");
    await pedirMuestras({ consulta: { titulo: "x" }, dj: { token: "d", clave: "K" } }, f);
    expect(JSON.parse(f.mock.calls[1][1].body)).toEqual({ escuchar: { titulo: "x" }, dj: { token: "d", clave: "K" } });
  });
});


describe("la lista del DJ desde los datos del anfitrión (v91.5)", () => {
  it("todos los que piden canción, con su edad en el evento; los demás, no", () => {
    const d = datosDjDesdeLista(
      [
        { cancion: "A — B", anioNacimiento: "2000" },
        { cancion: "  " },
        { cancion: "C — D" },
      ],
      { nombre: "La boda", fecha: "2026-12-11", cancionesFueraDj: ["x"], catalogoCanciones: { y: {} } }
    );
    expect(d.peticiones).toEqual([
      { cancion: "A — B", edad: 26 },
      { cancion: "C — D", edad: null },
    ]);
    expect(d.evento).toBe("La boda");
    expect(d.fuera).toEqual(["x"]);
  });

  it("las cifras: peticiones, distintas y duración", () => {
    const cifras = cifrasDelDj({ peticiones: [{ cancion: "A — B" }, { cancion: "A — B" }], catalogo: {} });
    expect(cifras.map((c) => c.label)).toEqual(["Peticiones", "Distintas", "Duración"]);
    expect(cifras[1].value).toBe(1);
  });
});

// v92 (él): «a fecha de hoy, este es el número de canciones; cuando vuelvas
// a abrir, ¿ha cambiado? Entonces hay un cambio, hay que señalarlo».
describe("canciones nuevas o cambiadas para el DJ (v92)", () => {
  const AYER = "2026-11-18";
  const HOY = "2026-11-19";
  const MANANA = "2026-11-20";
  // Lo que pasa al abrir la lista: con qué se compara, qué sale nuevo y qué se recuerda.
  const abrir = (memoria, dia, claves) => {
    const { referencia, desde } = referenciaCancionesDj(memoria, dia, claves);
    return { nuevas: [...clavesNuevas(claves, referencia)], desde, memoria: memoriaCancionesDj(memoria, dia, claves) };
  };

  it("la primera vez de todas, nada sale como nuevo", () => {
    expect(abrir(null, HOY, ["a", "b"]).nuevas).toEqual([]);
  });

  it("su ejemplo: lo de las 11:00 sale a las 12:00; lo de las 23:00, al día siguiente", () => {
    let m = abrir(null, AYER, ["a", "b"]).memoria; // ayer a las 20:00
    let r = abrir(m, HOY, ["a", "b", "c"]); // hoy 10:00: «c» llegó por la noche
    expect(r.nuevas).toEqual(["c"]);
    expect(r.desde).toBe(AYER);
    r = abrir(r.memoria, HOY, ["a", "b", "c", "d"]); // 12:00: «d», de las 11:00
    expect(r.nuevas).toEqual(["c", "d"]); // lo de las 10:00 sigue marcado todo el día
    m = r.memoria;
    r = abrir(m, MANANA, ["a", "b", "c", "d", "e"]); // «e», de las 23:00
    expect(r.nuevas).toEqual(["e"]);
    expect(r.desde).toBe(HOY);
  });

  it("cambiar una canción por otra deja el número igual, y aun así sale", () => {
    const m = abrir(null, AYER, ["a", "b"]).memoria;
    expect(abrir(m, HOY, ["a", "c"]).nuevas).toEqual(["c"]);
  });

  it("varios días sin abrir: le salen juntos todos los cambios desde la última vez", () => {
    const m = abrir(null, "2026-11-10", ["a"]).memoria;
    const r = abrir(m, HOY, ["a", "b", "c"]);
    expect(r.nuevas).toEqual(["b", "c"]);
    expect(r.desde).toBe("2026-11-10");
  });

  it("la misma canción pedida por otro no es nueva; escrita de otra forma, tampoco", () => {
    const antes = { peticiones: [{ cancion: "Bailando — Enrique Iglesias", edad: 40 }] };
    const ahora = { peticiones: [...antes.peticiones, { cancion: "bailando", edad: 20 }] };
    expect(clavesDelDj(ahora)).toEqual(clavesDelDj(antes));
  });

  it("el día, en la hora del aparato; y el texto del aviso", () => {
    expect(diaDe(new Date(2026, 10, 9, 23, 59))).toBe("2026-11-09");
    expect(textoCancionesNuevas(1, HOY, HOY)).toBe("1 canción nueva o cambiada hoy");
    expect(textoCancionesNuevas(5, AYER, HOY)).toMatch(/^5 canciones nuevas o cambiadas desde el 18 nov/);
  });
});
