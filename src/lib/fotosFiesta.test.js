import { describe, it, expect } from "vitest";
import { prepararFotoFiesta, subirFotoFiesta, eliminarFotoFiesta, miniaturaFotoFiesta, nombresDescargaFotosFiesta, bajarFotosFiesta, LIMITE_FOTO_FIESTA } from "./fotosFiesta";

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
const QUIEN = { token: "t", respuesta: "Medina Ana" };

describe("prepararFotoFiesta", () => {
  it("se queda con el primer intento que cabe en 2 MB", async () => {
    const { reducir, pedidos } = reducirQuePesa([LIMITE_FOTO_FIESTA + 1, LIMITE_FOTO_FIESTA]);
    expect((await prepararFotoFiesta({}, reducir)).size).toBe(LIMITE_FOTO_FIESTA);
    expect(pedidos).toEqual([
      [2560, 0.85],
      [2560, 0.7],
    ]);
  });

  it("si ninguno cabe, falla", async () => {
    const { reducir } = reducirQuePesa(Array(9).fill(LIMITE_FOTO_FIESTA + 1));
    await expect(prepararFotoFiesta({}, reducir)).rejects.toThrow("2 MB");
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
    expect(s.llamadas[1]).toEqual(["upload", "fotos-fiesta", "fiesta/f1.jpg"]);
    expect(s.llamadas[2][1]).toEqual({ p_token: "t", p_respuesta: "Medina Ana", p_id: "f1" });
  });

  it("con las 3 de la familia, dice por qué y no sube nada", async () => {
    const s = falso({ rpc: { tablon_reservar_foto: { data: { error: "completa" } } } });
    const { aviso } = await subirFotoFiesta(s, { ...QUIEN, archivo: {} }, PEQUENA);
    expect(aviso).toContain("ya tiene sus 3 fotos");
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
    expect(s.llamadas.at(-1)).toEqual(["tablon_quitar_foto", { p_token: "t", p_respuesta: "Medina Ana", p_id: "f1" }]);
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
  const INVITADOS = [
    { grupoFamiliar: "Abreu01", apellido: "Abreu" },
    { grupoFamiliar: "", apellido: "Medina" },
  ];

  it("una carpeta por familia, con su nombre de la lista; cada foto, quién y a qué hora", () => {
    expect(nombresDescargaFotosFiesta([foto("1", "abreu01", "Abreu, Gustavo", "22:47"), foto("2", "medina", "Medina, Ana", "23:05")], INVITADOS)).toEqual([
      { ruta: "fiesta/1.jpg", nombre: "Abreu01/Abreu, Gustavo · 22.47.jpg" },
      { ruta: "fiesta/2.jpg", nombre: "Medina/Medina, Ana · 23.05.jpg" },
    ]);
  });

  it("dos de la misma persona en el mismo minuto no se pisan; una familia que ya no está, con su clave", () => {
    const nombres = nombresDescargaFotosFiesta([foto("1", "medina", "Medina, Ana", "22:47"), foto("2", "medina", "Medina, Ana", "22:47"), foto("3", "pérez", "Pérez, Eva", "21:00")], INVITADOS).map((n) => n.nombre);
    expect(nombres).toEqual(["Medina/Medina, Ana · 22.47.jpg", "Medina/Medina, Ana · 22.47 (2).jpg", "pérez/Pérez, Eva · 21.00.jpg"]);
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
    const { archivos, fallidas } = await bajarFotosFiesta(s, [foto("2", "medina", "Medina, Ana", "23:05"), foto("1", "abreu01", "Abreu, Gustavo", "22:47"), foto("3", "medina", "Medina, Luis", "23:10")], INVITADOS);
    expect(archivos.map((a) => a.nombre)).toEqual(["Abreu01/Abreu, Gustavo · 22.47.jpg", "Medina/Medina, Ana · 23.05.jpg"]);
    expect(fallidas).toBe(1);
    expect(bajadas.every(([cubo]) => cubo === "fotos-fiesta")).toBe(true);
  });
});
