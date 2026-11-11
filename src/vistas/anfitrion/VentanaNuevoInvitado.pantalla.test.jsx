// «Nuevo invitado» (v77), DIBUJADO de verdad: lo de siempre se elige; lo
// nuevo, con su «＋»; y al guardar sigue abierto para el siguiente.
import { it, expect, vi } from "vitest";
import { useState } from "react";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaNuevoInvitado } from "./VentanaNuevoInvitado";

// La foto de boda (v81.3): el almacén, de mentira.
const subidas = [];
vi.mock("../../lib/fotosAlmacen", () => ({
  CARPETA: { BODA: "boda" },
  subirFotoMatrimonio: async (archivo, familia, carpeta) => {
    subidas.push({ nombre: archivo.name, familia, carpeta });
    return `${carpeta}/${familia}.jpg`;
  },
  useEnlaceFoto: (ruta) => (ruta ? `https://foto/${ruta}` : ""),
}));
if (!URL.createObjectURL) URL.createObjectURL = () => "blob:vista";
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};

const escribir = (input, valor) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

const INVITADOS = [
  { id: "1", nombre: "Ana", apellido: "Pacheco", grupoFamiliar: "Pacheco01", zona: "Icod", rolFamiliar: "esposa" },
  { id: "2", nombre: "Luis", apellido: "Sierra", grupoFamiliar: "Sierra01", zona: "Puerto", rolFamiliar: "suelto" },
];

function dibujar(lista = INVITADOS, fotos = {}) {
  const guardados = [];
  const fotosGuardadas = [];
  function Prueba() {
    const [invitados, setInvitados] = useState(lista);
    const data = {
      invitados,
      colaboradores: [{ id: "c1", nombre: "Colaborador Uno" }],
      evento: { fecha: "2026-12-11" },
      fotosFamiliares: fotos,
      persistFotosFamiliares: (f) => fotosGuardadas.push(f),
      persistInvitados: (l) => {
        guardados.push(l);
        setInvitados(l);
      },
    };
    return <VentanaNuevoInvitado data={data} onCerrar={() => {}} />;
  }
  const vista = montar(<Prueba />);
  const q = (sel) => document.body.querySelector(sel);
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.title === t);
  return { vista, guardados, fotosGuardadas, q, boton };
}

it("con familia y zona de la lista, rol y colaborador: se guarda y sigue abierto para el siguiente", () => {
  const { vista, guardados, q, boton } = dibujar();
  escribir(q('input[aria-label="Apellido"]'), "Pacheco");
  escribir(q('input[aria-label="Nombre"]'), "Rubén");
  vista.elegir(q('select[aria-label="Familia"]'), "Pacheco01");
  vista.elegir(q('select[aria-label="Rol"]'), "esposo");
  vista.elegir(q('select[aria-label="Zona"]'), "Icod");
  vista.elegir(q('select[aria-label="Colaborador"]'), "c1");
  vista.pulsar(boton("Guardar"));
  expect(guardados.at(-1).at(-1)).toMatchObject({ apellido: "Pacheco", nombre: "Rubén", grupoFamiliar: "Pacheco01", rolFamiliar: "esposo", zona: "Icod", colaboradorId: "c1" });
  expect(document.body.textContent).toContain("Guardado: Pacheco, Rubén.");
  // Para el siguiente de la familia: lo de la familia, puesto; el nombre, vacío.
  expect(q('input[aria-label="Nombre"]').value).toBe("");
  expect(q('select[aria-label="Familia"]').value).toBe("Pacheco01");
  expect(q('select[aria-label="Colaborador"]').value).toBe("c1");
  vista.desmontar();
});

it("una zona nueva, fuera de la lista: ＋ para escribirla, y la próxima vez ya sale en el desplegable", () => {
  const { vista, guardados, q, boton } = dibujar();
  escribir(q('input[aria-label="Apellido"]'), "Abrante");
  escribir(q('input[aria-label="Nombre"]'), "Loly");
  vista.pulsar(boton("Familia nueva"));
  expect(q('input[aria-label="Familia nueva"]').value).toBe("Abrante01");
  vista.pulsar(boton("Zona nueva"));
  escribir(q('input[aria-label="Zona nueva"]'), "Garachico");
  vista.pulsar(boton("Guardar"));
  expect(guardados.at(-1).at(-1)).toMatchObject({ grupoFamiliar: "Abrante01", zona: "Garachico" });
  expect([...q('select[aria-label="Zona"]').options].map((o) => o.value)).toContain("Garachico");
  vista.desmontar();
});

it("sin lo obligatorio no se guarda, y se dice qué falta", () => {
  const { vista, guardados, q, boton } = dibujar();
  escribir(q('input[aria-label="Nombre"]'), "Sin apellido");
  vista.pulsar(boton("Guardar"));
  expect(guardados).toEqual([]);
  expect(document.body.textContent).toContain("Faltan el nombre, el apellido o el grupo familiar.");
  vista.desmontar();
});

it("el email solo aparece si tiene 16 años cumplidos, como en el formulario del colaborador", () => {
  const { vista, q } = dibujar();
  vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Año nac.")));
  escribir(q('input[aria-label="Año de nacimiento"]'), "2015");
  expect(q('input[aria-label="Email"]')).toBeNull();
  escribir(q('input[aria-label="Año de nacimiento"]'), "1990");
  expect(q('input[aria-label="Email"]')).toBeTruthy();
  vista.desmontar();
});

// v78 (él): el teléfono, también al añadir a alguien.
it("el teléfono, desde los 16 y limpio, con su prefijo; si no parece uno, se dice", () => {
  const { vista, guardados, q, boton } = dibujar();
  escribir(q('input[aria-label="Apellido"]'), "Pacheco");
  escribir(q('input[aria-label="Nombre"]'), "Rubén");
  vista.elegir(q('select[aria-label="Familia"]'), "Pacheco01");
  vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Año nac.")));
  escribir(q('input[aria-label="Año de nacimiento"]'), "1985");
  escribir(q('input[aria-label="Teléfono"]'), "6123");
  vista.pulsar(boton("Guardar"));
  expect(guardados).toEqual([]);
  expect(document.body.textContent).toContain("Ese teléfono no parece válido");
  escribir(q('input[aria-label="Teléfono"]'), "612 34 56 78");
  vista.pulsar(boton("Guardar"));
  expect(guardados.at(-1).at(-1).telefono).toBe("+34612345678");
  vista.desmontar();
});

// v81.3 (él): confirmarle desde aquí, y la boda del esposo o la esposa.
it("«Confirmado» Sí / No: de entrada No; con Sí, se guarda confirmado", () => {
  const { vista, guardados, q, boton } = dibujar();
  expect(boton("No").getAttribute("aria-checked")).toBe("true");
  escribir(q('input[aria-label="Apellido"]'), "Pacheco");
  escribir(q('input[aria-label="Nombre"]'), "Rubén");
  vista.elegir(q('select[aria-label="Familia"]'), "Pacheco01");
  vista.pulsar(boton("Sí"));
  vista.pulsar(boton("Guardar"));
  expect(guardados.at(-1).at(-1).confirmado).toBe(true);
  vista.desmontar();
});

it("la «Boda», solo al esposo o la esposa: trae el año de su familia, y su foto se sube al guardar", async () => {
  const conAnio = INVITADOS.map((g) => (g.id === "1" ? { ...g, anioBoda: "2010" } : g));
  const { vista, guardados, fotosGuardadas, q, boton } = dibujar(conAnio);
  escribir(q('input[aria-label="Apellido"]'), "Pacheco");
  escribir(q('input[aria-label="Nombre"]'), "Rubén");
  vista.elegir(q('select[aria-label="Familia"]'), "Pacheco01");
  expect(document.body.textContent).not.toContain("Boda");
  vista.elegir(q('select[aria-label="Rol"]'), "esposo");
  vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Boda")));
  expect(q('input[aria-label="Año de boda"]').value).toBe("2010");
  const archivo = new File(["x"], "boda.jpg", { type: "image/jpeg" });
  const entrada = q('input[type="file"]');
  Object.defineProperty(entrada, "files", { value: [archivo] });
  await act(async () => entrada.dispatchEvent(new Event("change", { bubbles: true })));
  await act(async () => boton("Guardar").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(subidas.at(-1)).toEqual({ nombre: "boda.jpg", familia: "Pacheco01", carpeta: "boda" });
  expect(guardados.at(-1).at(-1)).toMatchObject({ rolFamiliar: "esposo", anioBoda: "2010" });
  expect(fotosGuardadas.at(-1)).toEqual({ Pacheco01: "boda/Pacheco01.jpg" });
  vista.desmontar();
});

it("si la familia ya tiene la foto, se enseña y no se pide otra", () => {
  const { vista, q } = dibujar(INVITADOS, { Pacheco01: "boda/Pacheco01.jpg" });
  vista.elegir(q('select[aria-label="Familia"]'), "Pacheco01");
  vista.elegir(q('select[aria-label="Rol"]'), "esposo");
  vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Boda")));
  expect(document.body.textContent).toContain("Ya la tienen");
  expect(q('input[type="file"]')).toBe(null);
  vista.desmontar();
});

// v84.7 (él): buscar a uno que YA está, confirmado o no, y añadirle un dato
// sin rellenar todo el formulario.
it("buscar a uno de la lista: sale con lo suyo, se toca un dato y solo cambia ese", () => {
  const lista = [{ ...INVITADOS[0], anioNacimiento: "1985", email: "", cancion: "Volare" }, INVITADOS[1]];
  const { vista, guardados, q, boton } = dibujar(lista);
  const opciones = [...q('select[aria-label="Elegir invitado"]').options].map((o) => o.textContent);
  expect(opciones).toContain("Pacheco, Ana · sin confirmar");
  vista.elegir(q('select[aria-label="Elegir invitado"]'), "1");
  expect(document.body.textContent).toContain("Editar invitado");
  expect(q('input[aria-label="Apellido"]').value).toBe("Pacheco");
  expect(q('select[aria-label="Familia"]').value).toBe("Pacheco01");
  vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Año nac.")));
  expect(q('input[aria-label="Año de nacimiento"]').value).toBe("1985");
  escribir(q('input[aria-label="Email"]'), "ana@correo.com");
  vista.pulsar(boton("Guardar"));
  const guardada = guardados.at(-1);
  expect(guardada).toHaveLength(2);
  expect(guardada[0]).toEqual({ ...lista[0], email: "ana@correo.com" });
  expect(guardada[1]).toBe(lista[1]);
  expect(document.body.textContent).toContain("Guardado: Pacheco, Ana.");
  // Sigue con ella, ya guardada.
  expect(q('input[aria-label="Email"]').value).toBe("ana@correo.com");
  vista.desmontar();
});

it("sin tocar nada no guarda; la ✕ vuelve a «Nuevo invitado», vacío", () => {
  const { vista, guardados, q, boton } = dibujar();
  vista.elegir(q('select[aria-label="Elegir invitado"]'), "2");
  vista.pulsar(boton("Guardar"));
  expect(guardados).toEqual([]);
  expect(document.body.textContent).toContain("No has cambiado nada.");
  vista.pulsar(boton("Quitar selección"));
  expect(document.body.textContent).toContain("Nuevo invitado");
  expect(q('input[aria-label="Apellido"]').value).toBe("");
  vista.desmontar();
});

it("con algo a medio escribir, elegir a otro pregunta antes de perderlo", () => {
  const { vista, q, boton } = dibujar();
  escribir(q('input[aria-label="Apellido"]'), "Abrante");
  vista.elegir(q('select[aria-label="Elegir invitado"]'), "2");
  expect(document.body.textContent).toContain("¿Descartar los cambios?");
  vista.pulsar(boton("No"));
  expect(q('input[aria-label="Apellido"]').value).toBe("Abrante");
  vista.elegir(q('select[aria-label="Elegir invitado"]'), "2");
  vista.pulsar(boton("Sí, descartar"));
  expect(q('input[aria-label="Apellido"]').value).toBe("Sierra");
  vista.desmontar();
});
