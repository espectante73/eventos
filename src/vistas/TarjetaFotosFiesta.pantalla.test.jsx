// La tarjeta de las fotos de la fiesta en el tablón (v67.4-68): personal,
// 2 por persona, la papelera solo en el móvil que la subió, y lo que ven
// los menores.
import { it, expect } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { TarjetaFotosFiesta } from "./TarjetaFotosFiesta";
import { opcionesAnios } from "../lib/formato";
import { FRASE_HORIZONTAL, FRASE_PERMISO_PADRES } from "../lib/fotosFiesta";

const nada = async () => ({ aviso: "" });
const foto = (id, mia) => ({ id, quien: "Medina, Ana", mia, creadaEn: "2026-11-13T22:47:00" });
const papeleras = () => document.body.querySelectorAll('button[aria-label="Eliminar esta foto"]');
const campoFoto = () => document.body.querySelector('input[type="file"]');
const tarjeta = (estado, extra = {}) => (
  <TarjetaFotosFiesta estado={{ maximo: 2, menor: false, conPermiso: false, ...estado }} onSubir={nada} onEliminar={nada} {...extra} />
);

it("con sitio: «Tus fotos · 1 de 2», su línea, «Elegir foto» a la galería y su frase", () => {
  const vista = montar(tarjeta({ fotos: [foto("1", true)] }));
  const texto = document.body.textContent;
  expect(texto).toContain("Tus fotos · 1 de 2");
  expect(texto).toContain("Subida a las 22:47");
  expect(papeleras()).toHaveLength(1);
  expect(texto).toContain("Elegir foto");
  expect(texto).toContain(FRASE_HORIZONTAL);
  expect(texto).not.toContain(FRASE_PERMISO_PADRES);
  // La galería, no la cámara (él): sin `capture`.
  expect(campoFoto().getAttribute("accept")).toBe("image/*");
  expect(campoFoto().hasAttribute("capture")).toBe(false);
  vista.desmontar();
});

it("la papelera, solo en el móvil que la subió", () => {
  const vista = montar(tarjeta({ fotos: [foto("1", true), foto("2", false)] }));
  expect(papeleras()).toHaveLength(1);
  vista.desmontar();
});

it("con las 2: sin botón, y dice cómo cambiar una", () => {
  const vista = montar(tarjeta({ fotos: [foto("1", true), foto("2", false)] }));
  expect(document.body.textContent).toContain("Ya tienes tus 2 fotos. Para cambiar una, elimínala desde el móvil con el que la subiste.");
  expect(campoFoto()).toBeNull();
  vista.desmontar();
});

it("con 16 o 17 años, además, su frase del permiso de los padres", () => {
  const vista = montar(tarjeta({ fotos: [], conPermiso: true }));
  expect(document.body.textContent).toContain(FRASE_PERMISO_PADRES);
  vista.desmontar();
});

it("un menor de 16: solo que las suben los mayores, sin botón", () => {
  const vista = montar(tarjeta({ fotos: [], menor: true }));
  expect(document.body.textContent).toContain("Las fotos las suben los mayores de 16 años.");
  expect(document.body.textContent).not.toContain("Tus fotos");
  expect(campoFoto()).toBeNull();
  vista.desmontar();
});

it("eliminar pregunta antes, y con «Sí, eliminar» la elimina", () => {
  const eliminadas = [];
  const vista = montar(
    tarjeta(
      { fotos: [foto("1", true)] },
      {
        onEliminar: async (id) => {
          eliminadas.push(id);
          return { aviso: "" };
        },
      }
    )
  );
  vista.pulsar(papeleras()[0]);
  expect(document.body.textContent).toContain("¿Eliminar esta foto?");
  expect(eliminadas).toEqual([]);
  vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Sí, eliminar"));
  expect(eliminadas).toEqual(["1"]);
  vista.desmontar();
});

it("su miniatura, guardada en su móvil; sin ella, el marco vacío", () => {
  window.localStorage.setItem("fotos-fiesta-miniatura-1", "data:image/jpeg;base64,eA==");
  const vista = montar(tarjeta({ fotos: [foto("1", true), foto("2", false)] }));
  const imagenes = document.body.querySelectorAll("img");
  expect(imagenes).toHaveLength(1);
  expect(imagenes[0].getAttribute("alt")).toBe("Tu foto");
  // Sin `onVer`, la miniatura no se pinta como botón.
  expect(imagenes[0].closest("button")).toBeNull();
  vista.desmontar();
  window.localStorage.removeItem("fotos-fiesta-miniatura-1");
});

it("sin confirmar el móvil: solo la mesa, en desplegable (el año lo dio al entrar, v70)", async () => {
  const enviados = [];
  const vista = montar(
    tarjeta(
      { fotos: [], verificado: false, mesas: [1, 2, 7] },
      {
        onVerificar: async (mesa) => {
          enviados.push(mesa);
          return { aviso: "" };
        },
      }
    )
  );
  expect(document.body.textContent).toContain("elige el número de tu mesa: lo ves en ella");
  expect(campoFoto()).toBeNull();
  expect(document.body.querySelectorAll("input")).toHaveLength(0);
  const selects = document.body.querySelectorAll("select");
  expect(selects).toHaveLength(1);
  expect([...selects[0].options].map((o) => o.textContent)).toEqual(["Mesa", "1", "2", "7"]);
  vista.elegir(selects[0], "7");
  await act(async () => document.body.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(enviados).toEqual(["7"]);
  vista.desmontar();
});

it("si a su ficha le falta la mesa: ni desplegable ni botón, y a quién preguntar", () => {
  const vista = montar(tarjeta({ fotos: [], verificado: false, faltanDatos: true, anios: { desde: 1950, hasta: 2010 }, mesas: [1] }));
  expect(document.body.textContent).toContain("tu ficha tiene que tener tu mesa");
  expect(document.body.querySelectorAll("select")).toHaveLength(0);
  expect(campoFoto()).toBeNull();
  vista.desmontar();
});

it("sin años en la lista, ofrece los últimos 100", () => {
  expect(opcionesAnios(null, 2026)).toHaveLength(101);
  expect(opcionesAnios(null, 2026)[0]).toBe(2026);
});
