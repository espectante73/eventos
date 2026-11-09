import { describe, it, expect } from "vitest";
import {
  huecosCanciones,
  textoDeHuecos,
  cancionesDe,
  tieneCancion,
  resumenCanciones,
  cancionesPedidas,
  estrellas,
  ordenarCanciones,
  tocarOrdenCanciones,
  ORDEN_CANCIONES_INICIAL,
  corregirCancion,
  corregirCancionEnTodas,
  alternarFueraDj,
  trasladarFueraDj,
  cambiarCanciones,
} from "./canciones";

describe("las que no pasan al DJ (v84.3)", () => {
  it("se marca y se desmarca por canción", () => {
    expect(alternarFueraDj([], "a")).toEqual(["a"]);
    expect(alternarFueraDj(["a", "b"], "a")).toEqual(["b"]);
    expect(alternarFueraDj(undefined, "a")).toEqual(["a"]);
  });

  it("al corregir cómo se escribe, la marca la sigue; si no estaba marcada, nada", () => {
    expect(trasladarFueraDj(["gasolin", "b"], "gasolin", "gasolina")).toEqual(["gasolina", "b"]);
    expect(trasladarFueraDj(["a", "b"], "a", "b")).toEqual(["b"]);
    const lista = ["a"];
    expect(trasladarFueraDj(lista, "otra", "nueva")).toBe(lista);
    expect(trasladarFueraDj(lista, "a", "a")).toBe(lista);
  });
});

describe("hasta 3 canciones, con título y artista (v69)", () => {
  it("la de antes, escrita en un solo hueco, pasa entera al título de la primera", () => {
    expect(huecosCanciones("Despacito - Luis Fonsi")).toEqual([
      { titulo: "Despacito - Luis Fonsi", artista: "" },
      { titulo: "", artista: "" },
      { titulo: "", artista: "" },
    ]);
    expect(cancionesDe("Despacito - Luis Fonsi")).toEqual(["Despacito - Luis Fonsi"]);
  });

  it("de los huecos al campo y vuelta, sin perder nada", () => {
    const huecos = [
      { titulo: "Bailando", artista: "Enrique Iglesias" },
      { titulo: "", artista: "" },
      { titulo: "Vivir mi vida", artista: "Marc Anthony" },
    ];
    const texto = textoDeHuecos(huecos);
    expect(texto).toBe("Bailando — Enrique Iglesias\n\nVivir mi vida — Marc Anthony");
    // El hueco vacío de en medio se queda en su sitio: nada salta mientras se escribe.
    expect(huecosCanciones(texto)).toEqual(huecos);
    expect(cancionesDe(texto)).toEqual(["Bailando — Enrique Iglesias", "Vivir mi vida — Marc Anthony"]);
  });

  it("mientras se teclea no se recorta nada; al enseñarlas, sí", () => {
    expect(textoDeHuecos([{ titulo: "Hotel ", artista: "" }])).toBe("Hotel ");
    expect(cancionesDe("Hotel ")).toEqual(["Hotel"]);
  });

  it("solo el artista, o solo el título, también valen", () => {
    const texto = textoDeHuecos([{ titulo: "", artista: "Rosalía" }]);
    expect(huecosCanciones(texto)[0]).toEqual({ titulo: "", artista: "Rosalía" });
    expect(cancionesDe(texto)).toEqual(["Rosalía"]);
  });

  it("sin nada escrito, el campo queda vacío y no cuenta como canción", () => {
    expect(textoDeHuecos([{ titulo: "", artista: "" }, { titulo: "  ", artista: "" }, { titulo: "", artista: "" }])).toBe("");
    expect(tieneCancion({ cancion: "\n\n" })).toBe(false);
    expect(tieneCancion({ cancion: "\nLa bamba" })).toBe(true);
  });

  it("nunca más de 3, y el resumen en una línea", () => {
    expect(cancionesDe("a\nb\nc\nd")).toEqual(["a", "b", "c"]);
    expect(resumenCanciones("Bailando — Enrique Iglesias\nLa bamba")).toBe("Bailando — Enrique Iglesias · La bamba");
  });
});

describe("la lista para bailar (v79.5): una fila por petición, sin nombres", () => {
  const invitados = [
    { anio: 1964, cancion: "Despacito — Luis Fonsi\nBailando" },
    { anio: 2010, cancion: "despacito" },
    { anio: 1981, cancion: "DESPACITO — luis fonsi\n\nVivir mi vida — Marc Anthony" },
    { anio: null, cancion: "Vivir mi vida" },
    { anio: 1990, cancion: "Despasito" },
    { anio: 1970, cancion: "" },
  ];
  const filas = cancionesPedidas(invitados, (g) => (g.anio ? 2026 - g.anio : null));
  const ver = (lista) => lista.map((f) => `${f.veces}|${f.cancion}|${f.edad}`);

  it("cada petición es una fila, con la edad de quien la pidió; la misma canción cuenta junta y se escribe igual, una errata no", () => {
    expect(ver(filas)).toEqual([
      "3|Despacito — Luis Fonsi|62",
      "1|Bailando|62",
      "3|Despacito — Luis Fonsi|16",
      "3|Despacito — Luis Fonsi|45",
      "2|Vivir mi vida — Marc Anthony|45",
      "2|Vivir mi vida — Marc Anthony|null",
      "1|Despasito|36",
    ]);
  });

  it("al abrir, las más pedidas, juntas; dentro, de mayor a menor", () => {
    expect(ver(ordenarCanciones(filas, ORDEN_CANCIONES_INICIAL))).toEqual([
      "3|Despacito — Luis Fonsi|62",
      "3|Despacito — Luis Fonsi|45",
      "3|Despacito — Luis Fonsi|16",
      "2|Vivir mi vida — Marc Anthony|45",
      "2|Vivir mi vida — Marc Anthony|null",
      "1|Bailando|62",
      "1|Despasito|36",
    ]);
  });

  it("por edad: la primera vez de mayor a menor, la segunda al revés; sin edad, siempre al final", () => {
    const mayorAMenor = tocarOrdenCanciones(ORDEN_CANCIONES_INICIAL, "edad");
    expect(mayorAMenor).toEqual({ columna: "edad", direccion: "desc" });
    expect(ordenarCanciones(filas, mayorAMenor).map((f) => f.edad)).toEqual([62, 62, 45, 45, 36, 16, null]);
    const menorAMayor = tocarOrdenCanciones(mayorAMenor, "edad");
    expect(ordenarCanciones(filas, menorAMayor).map((f) => f.edad)).toEqual([16, 36, 45, 45, 62, 62, null]);
    expect(tocarOrdenCanciones(menorAMayor, "cancion")).toEqual({ columna: "cancion", direccion: "asc" });
  });

  it("una estrella por vez; de 6 en adelante, con la cifra", () => {
    expect(estrellas(1)).toBe("★");
    expect(estrellas(5)).toBe("★★★★★");
    expect(estrellas(7)).toBe("★ 7");
  });
});

describe("corregir cómo se escribió una canción (v79.6)", () => {
  const invitados = [
    { id: "a", cancion: "Chica yeye — Conchita Velasco" },
    { id: "b", cancion: "Bailando\n\nUna Chica YE-YE - Concha Velasco" },
    { id: "c", cancion: "Una Chica YE-YE" },
    { id: "d", cancion: "una chica yeye" },
  ];
  const edad = () => 50;

  it("«yeye» y «YE-YE» son la misma; con una palabra de más, o el artista dentro del título, no", () => {
    const veces = Object.fromEntries(cancionesPedidas(invitados, edad).map((f) => [`${f.invitadoId}${f.hueco}`, f.veces]));
    expect(veces).toEqual({ a0: 1, b0: 1, b2: 1, c0: 2, d0: 2 });
  });

  it("cada fila sabe de quién es y en qué hueco está; corregida, se junta con las demás", () => {
    const fila = cancionesPedidas(invitados, edad).find((f) => f.invitadoId === "b" && f.hueco === 2);
    const { invitados: siguiente, aviso } = corregirCancion(invitados, fila.invitadoId, fila.hueco, { titulo: " Chica yeye ", artista: "Conchita Velasco" });
    expect(aviso).toBe("");
    expect(siguiente.find((g) => g.id === "b").cancion).toBe("Bailando\n\nChica yeye — Conchita Velasco");
    expect(siguiente.find((g) => g.id === "a")).toBe(invitados[0]);
    expect(cancionesPedidas(siguiente, edad).filter((f) => f.clave === "chicayeye").map((f) => `${f.veces}|${f.cancion}`)).toEqual([
      "2|Chica yeye — Conchita Velasco",
      "2|Chica yeye — Conchita Velasco",
    ]);
  });

  it("vacía no se guarda, y sin cambios no toca la lista", () => {
    expect(corregirCancion(invitados, "a", 0, { titulo: " ", artista: "" })).toEqual({ invitados, aviso: "Escribe la canción o el artista." });
    expect(corregirCancion(invitados, "a", 0, { titulo: "Chica yeye", artista: "Conchita Velasco" }).invitados).toBe(invitados);
  });
});

describe("corregir una canción en todas sus peticiones (v80.1)", () => {
  const invitados = [
    { id: "a", cancion: "Una chica yeye — Concha Velasco" },
    { id: "b", cancion: "Bailando\n\nUNA CHICA YE-YE" },
    { id: "c", cancion: "Bailando" },
  ];

  it("cambia todas las que son esa canción, y nada más", () => {
    const { invitados: siguientes, aviso } = corregirCancionEnTodas(invitados, "unachicayeye", { titulo: "Chica yeye ", artista: "Conchita Velasco" });
    expect(aviso).toBe("");
    expect(siguientes.map((g) => g.cancion)).toEqual(["Chica yeye — Conchita Velasco", "Bailando\n\nChica yeye — Conchita Velasco", "Bailando"]);
    expect(siguientes[2]).toBe(invitados[2]);
  });

  it("vacía no se guarda", () => {
    expect(corregirCancionEnTodas(invitados, "unachicayeye", { titulo: "", artista: " " })).toEqual({ invitados, aviso: "Escribe la canción o el artista." });
  });
});

describe("cambiarCanciones (v82.8): lo que le queda abierto tras el pago", () => {
  const lista = [{ id: "a", pagado: true, cancion: "Bailando — Enrique Iglesias" }, { id: "b", cancion: "" }];
  const huecos = (...h) => [...h, { titulo: "", artista: "" }, { titulo: "", artista: "" }].slice(0, 3);

  it("añade una, limpia los espacios y no toca nada más", () => {
    const { invitados, aviso } = cambiarCanciones(lista, "a", huecos({ titulo: "Bailando", artista: "Enrique Iglesias" }, { titulo: " Vivir mi vida ", artista: "Marc Anthony" }));
    expect(aviso).toBe("");
    expect(invitados[0]).toEqual({ id: "a", pagado: true, cancion: "Bailando — Enrique Iglesias\nVivir mi vida — Marc Anthony" });
    expect(invitados[1]).toBe(lista[1]);
  });

  it("se pueden quitar todas", () => {
    expect(cambiarCanciones(lista, "a", huecos()).invitados[0].cancion).toBe("");
  });

  it("sin cambios devuelve la misma lista, para no subir nada", () => {
    expect(cambiarCanciones(lista, "a", huecos({ titulo: "Bailando", artista: "Enrique Iglesias" })).invitados).toBe(lista);
  });

  it("si el invitado ya no está, lo dice", () => {
    const { invitados, aviso } = cambiarCanciones(lista, "z", huecos());
    expect(invitados).toBe(lista);
    expect(aviso).toMatch(/ya no está/);
  });
});
