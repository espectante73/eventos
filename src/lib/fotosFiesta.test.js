import { describe, it, expect } from "vitest";
import { prepararFotoFiesta, subirFotoFiesta, eliminarFotoFiesta, verificarFotoFiesta, miniaturaFotoFiesta, nombresDescargaFotosFiesta, bajarFotosFiesta, marcarFotoFamilia, archivoFotosEvento, LIMITE_FOTO_FIESTA } from "./fotosFiesta";

// Una reducción de mentira: el tamaño que «pesaría» cada intento.
const reducirQuePesa = (pesos) => {
  const pedidos = [];
  const reducir = async (_archivo, lado, _alto, calidad) => {
    pedidos.push([lado, calidad]);
    return { size: pesos[pedidos.length - 1] };
  };
  return { reducir, pedidos };
};
const PEQUENA = async () => ({ size: 1000 });

// Un supabase de mentira: lo que responde cada función y el cajón.
const falso = ({ rpc = {}, subida = {} }) => {
  const llamadas = [];
  return {
    llamadas,
    rpc: async (nombre, params) => {
      llamadas.push([nombre, params]);
      return rpc[nombre] ?? { data: null, error: null };
    },
    storage: {
      from: (cubo) => ({
        upload: async (ruta) => {
          llamadas.push(["upload", cubo, ruta]);
          return subida;
        },
        remove: async (rutas) => {
          llamadas.push(["remove", cubo, rutas]);
          return {};
        },
      }),
    },
  };
};
const QUIEN = { token: "t", respuesta: "Medina Ana", dispositivo: "d1" };

describe("prepararFotoFiesta", () => {
  it("se queda con el primer intento que cabe en el tope", async () => {
    const { reducir, pedidos } = reducirQuePesa([LIMITE_FOTO_FIESTA + 1, LIMITE_FOTO_FIESTA]);
    expect((await prepararFotoFiesta({}, reducir)).size).toBe(LIMITE_FOTO_FIESTA);
    expect(pedidos).toEqual([
      [2560, 0.85],
      [2560, 0.7],
    ]);
  });

  it("si ninguno cabe, falla", async () => {
    const { reducir } = reducirQuePesa(Array(9).fill(LIMITE_FOTO_FIESTA + 1));
    await expect(prepararFotoFiesta({}, reducir)).rejects.toThrow("1,5 MB");
  });
});

describe("subirFotoFiesta", () => {
  it("reserva, sube a la ruta que da el servidor y confirma", async () => {
    const s = falso({
      rpc: {
        tablon_reservar_foto: { data: { id: "f1", ruta: "fiesta/f1.jpg" } },
        tablon_confirmar_foto: { data: true },
      },
    });
    expect(await subirFotoFiesta(s, { ...QUIEN, archivo: {} }, PEQUENA)).toEqual({ aviso: "" });
    expect(s.llamadas.map((l) => l[0])).toEqual(["tablon_reservar_foto", "upload", "tablon_confirmar_foto"]);
    expect(s.llamadas[0][1]).toEqual({ p_token: "t", p_respuesta: "Medina Ana", p_dispositivo: "d1" });
    expect(s.llamadas[1]).toEqual(["upload", "fotos-fiesta", "fiesta/f1.jpg"]);
    expect(s.llamadas[2][1]).toEqual({ p_token: "t", p_respuesta: "Medina Ana", p_id: "f1" });
  });

  it("con sus 2 ya subidas, dice por qué y no sube nada", async () => {
    const s = falso({ rpc: { tablon_reservar_foto: { data: { error: "completa" } } } });
    const { aviso } = await subirFotoFiesta(s, { ...QUIEN, archivo: {} }, PEQUENA);
    expect(aviso).toBe("Ya tienes tus 2 fotos.");
    expect(s.llamadas.map((l) => l[0])).toEqual(["tablon_reservar_foto"]);
  });

  it("un menor de 16 no sube nada, y se le dice por qué", async () => {
    const s = falso({ rpc: { tablon_reservar_foto: { data: { error: "menor" } } } });
    expect((await subirFotoFiesta(s, { ...QUIEN, archivo: {} }, PEQUENA)).aviso).toBe("Las fotos las suben los mayores de 16 años.");
    expect(s.llamadas.map((l) => l[0])).toEqual(["tablon_reservar_foto"]);
  });

  it("si la subida falla, suelta la reserva en el acto", async () => {
    const s = falso({
      rpc: { tablon_reservar_foto: { data: { id: "f1", ruta: "fiesta/f1.jpg" } } },
      subida: { error: { message: "red" } },
    });
    const { aviso, detalle } = await subirFotoFiesta(s, { ...QUIEN, archivo: {} }, PEQUENA);
    expect(aviso).toContain("No se pudo subir");
    expect(detalle).toBe("red");
    expect(s.llamadas.at(-1)).toEqual(["tablon_quitar_foto", { p_token: "t", p_respuesta: "Medina Ana", p_id: "f1", p_dispositivo: "d1" }]);
  });

  it("si el servidor no la confirma, la suelta y borra el archivo", async () => {
    const s = falso({
      rpc: {
        tablon_reservar_foto: { data: { id: "f1", ruta: "fiesta/f1.jpg" } },
        tablon_confirmar_foto: { data: false },
      },
    });
    expect((await subirFotoFiesta(s, { ...QUIEN, archivo: {} }, PEQUENA)).aviso).toContain("No se pudo subir");
    expect(s.llamadas.slice(-2).map((l) => l[0])).toEqual(["tablon_quitar_foto", "remove"]);
  });

  it("una foto que no se puede leer no llega al servidor", async () => {
    const s = falso({});
    const rota = async () => {
      throw new Error("No se pudo leer la imagen");
    };
    expect((await subirFotoFiesta(s, { ...QUIEN, archivo: {} }, rota)).aviso).toContain("No se pudo leer esa foto");
    expect(s.llamadas).toEqual([]);
  });
});

describe("eliminarFotoFiesta", () => {
  it("la da por quitada y borra su archivo", async () => {
    const s = falso({ rpc: { tablon_quitar_foto: { data: "fiesta/f1.jpg" } } });
    expect(await eliminarFotoFiesta(s, { ...QUIEN, id: "f1" })).toEqual({ aviso: "" });
    expect(s.llamadas[0]).toEqual(["tablon_quitar_foto", { p_token: "t", p_respuesta: "Medina Ana", p_id: "f1", p_dispositivo: "d1" }]);
    expect(s.llamadas.at(-1)).toEqual(["remove", "fotos-fiesta", ["fiesta/f1.jpg"]]);
  });

  it("si no es suya (o ya no está), avisa y no borra nada", async () => {
    const s = falso({});
    expect((await eliminarFotoFiesta(s, { ...QUIEN, id: "f1" })).aviso).toContain("No se pudo eliminar");
    expect(s.llamadas.map((l) => l[0])).toEqual(["tablon_quitar_foto"]);
  });
});

describe("la miniatura, solo en el móvil que la subió (v67.5)", () => {
  const RESPUESTAS = {
    tablon_reservar_foto: { data: { id: "m1", ruta: "fiesta/m1.jpg" } },
    tablon_confirmar_foto: { data: true },
    tablon_quitar_foto: { data: "fiesta/m1.jpg" },
  };
  const reducir = async () => new Blob(["x"], { type: "image/jpeg" });

  it("se guarda al subir y se olvida al eliminar", async () => {
    await subirFotoFiesta(falso({ rpc: RESPUESTAS }), { ...QUIEN, archivo: {} }, reducir);
    expect(miniaturaFotoFiesta("m1")).toMatch(/^data:image\/jpeg;base64,/);
    await eliminarFotoFiesta(falso({ rpc: RESPUESTAS }), { ...QUIEN, id: "m1" });
    expect(miniaturaFotoFiesta("m1")).toBe("");
  });

  it("si no se puede hacer, la foto se sube igual", async () => {
    expect(await subirFotoFiesta(falso({ rpc: RESPUESTAS }), { ...QUIEN, archivo: {} }, PEQUENA)).toEqual({ aviso: "" });
  });
});

describe("el ZIP de las fotos (v67.6)", () => {
  const foto = (id, familia, quien, hora) => ({ id, familia, quien, ruta: `fiesta/${id}.jpg`, creadaEn: `2026-11-13T${hora}:00` });

  // v85.5 (él): una sola carpeta, «diferenciados por el apellido».
  it("todas en una sola carpeta; cada foto, quién (por su apellido) y a qué hora", () => {
    expect(nombresDescargaFotosFiesta([foto("1", "abreu01", "Abreu, Gustavo", "22:47"), foto("2", "medina", "Medina, Ana", "23:05")])).toEqual([
      { ruta: "fiesta/1.jpg", nombre: "Abreu, Gustavo · 22.47.jpg" },
      { ruta: "fiesta/2.jpg", nombre: "Medina, Ana · 23.05.jpg" },
    ]);
  });

  it("dos de la misma persona en el mismo minuto no se pisan", () => {
    const nombres = nombresDescargaFotosFiesta([foto("1", "medina", "Medina, Ana", "22:47"), foto("2", "medina", "Medina, Ana", "22:47")]).map((n) => n.nombre);
    expect(nombres).toEqual(["Medina, Ana · 22.47.jpg", "Medina, Ana · 22.47 (2).jpg"]);
  });

  it("baja todas del cajón, ordenadas, y cuenta las que fallan", async () => {
    const bajadas = [];
    const s = {
      storage: {
        from: (cubo) => ({
          download: async (ruta) => {
            bajadas.push([cubo, ruta]);
            return ruta === "fiesta/3.jpg" ? { error: { message: "no" } } : { data: new Blob(["x"]) };
          },
        }),
      },
    };
    const { archivos, fallidas } = await bajarFotosFiesta(s, [foto("2", "medina", "Medina, Ana", "23:05"), foto("1", "abreu01", "Abreu, Gustavo", "22:47"), foto("3", "medina", "Medina, Luis", "23:10")]);
    expect(archivos.map((a) => a.nombre)).toEqual(["Abreu, Gustavo · 22.47.jpg", "Medina, Ana · 23.05.jpg"]);
    expect(fallidas).toBe(1);
    expect(bajadas.every(([cubo]) => cubo === "fotos-fiesta")).toBe(true);
  });
});

describe("confirmar el móvil: año y mesa (v68.1)", () => {
  it("manda lo escrito, limpio, y con «ok» no hay aviso", async () => {
    const s = falso({ rpc: { tablon_verificar_foto: { data: "ok" } } });
    expect(await verificarFotoFiesta(s, { ...QUIEN, anio: " 1975 ", mesa: "7" })).toEqual({ aviso: "" });
    expect(s.llamadas[0]).toEqual([
      "tablon_verificar_foto",
      { p_token: "t", p_respuesta: "Medina Ana", p_dispositivo: "d1", p_anio: "1975", p_mesa: 7 },
    ]);
  });

  it("si no coincide, dice qué revisar y dónde está la mesa", async () => {
    const s = falso({ rpc: { tablon_verificar_foto: { data: "no" } } });
    expect((await verificarFotoFiesta(s, { ...QUIEN, anio: "1975", mesa: "x" })).aviso).toBe("Revisa el número de tu mesa: es el que ves en ella.");
    expect(s.llamadas[0][1].p_mesa).toBeNull();
  });

  it("si a su ficha le falta el año o la mesa, no se confirma, y se le dice a quién preguntar", async () => {
    const s = falso({ rpc: { tablon_verificar_foto: { data: "faltan" } } });
    expect((await verificarFotoFiesta(s, { ...QUIEN, anio: "1975", mesa: "7" })).aviso).toContain("Pregúntale a tu colaborador");
  });

  it("bloqueado tras muchos fallos; y una respuesta rara no se da por buena", async () => {
    const bloqueado = falso({ rpc: { tablon_verificar_foto: { data: "bloqueado" } } });
    expect((await verificarFotoFiesta(bloqueado, { ...QUIEN, anio: "1975", mesa: "7" })).aviso).toContain("Espera 15 minutos");
    const raro = falso({ rpc: { tablon_verificar_foto: { data: null } } });
    expect((await verificarFotoFiesta(raro, { ...QUIEN, anio: "1975", mesa: "7" })).aviso).toBe("No se pudo comprobar. Prueba otra vez.");
  });
});

// v85.5 (él): la foto de familia, una por familia.
describe("marcar la foto de familia", () => {
  it("se marca con su llave, su móvil y su foto", async () => {
    const s = falso({ rpc: { tablon_marcar_foto_familia: { data: "" } } });
    expect(await marcarFotoFamilia(s, { ...QUIEN, id: "f1", marcar: true })).toEqual({ aviso: "" });
    expect(s.llamadas[0]).toEqual(["tablon_marcar_foto_familia", { p_token: "t", p_respuesta: "Medina Ana", p_id: "f1", p_dispositivo: "d1", p_marcar: true }]);
  });

  it("si ya la marcó otro de la familia, se dice quién; si no se pudo, que lo intente otra vez", async () => {
    const otro = falso({ rpc: { tablon_marcar_foto_familia: { data: "Medina, Luis" } } });
    expect((await marcarFotoFamilia(otro, { ...QUIEN, id: "f1", marcar: true })).aviso).toBe("La foto de familia ya la subió Medina, Luis: las tuyas son personales.");
    expect((await marcarFotoFamilia(falso({}), { ...QUIEN, id: "f1", marcar: true })).aviso).toContain("No se pudo marcar");
  });

  it("en el ZIP, la de familia lo dice, detrás del nombre: sigue en su sitio por apellido", () => {
    const [n] = nombresDescargaFotosFiesta([{ id: "1", familia: "medina", quien: "Medina, Ana", ruta: "fiesta/1.jpg", creadaEn: "2026-11-13T22:47:00", deFamilia: true }]);
    expect(n.nombre).toBe("Medina, Ana · Foto de familia · 22.47.jpg");
  });
});

// v85.7 (él): el ZIP lleva el nombre del evento, no «de la fiesta».
it("el ZIP se llama como el evento, sin su punto final", () => {
  expect(archivoFotosEvento({ nombre: "Las Bodas de todos." })).toBe("Fotos de Las Bodas de todos.zip");
  expect(archivoFotosEvento({ nombre: "" })).toBe("Fotos del evento.zip");
});
