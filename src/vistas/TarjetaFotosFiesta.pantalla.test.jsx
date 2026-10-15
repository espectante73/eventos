// La tarjeta de las fotos de la fiesta en el tablón (v67.4): la cuenta de
// su familia, una línea por foto y la papelera solo en las suyas.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { TarjetaFotosFiesta } from "./TarjetaFotosFiesta";
import { FRASE_HORIZONTAL } from "../lib/fotosFiesta";

const nada = async () => ({ aviso: "" });
const foto = (id, quien, mia) => ({ id, quien, mia, creadaEn: "2026-11-13T22:47:00" });
const papeleras = () => document.body.querySelectorAll('button[aria-label="Eliminar esta foto"]');
const campoFoto = () => document.body.querySelector('input[type="file"]');

it("con sitio: la cuenta, una línea por foto, la papelera solo en las suyas y «Elegir foto» a la galería", () => {
  const vista = montar(
    <TarjetaFotosFiesta
      estado={{ maximo: 3, fotos: [foto("1", "Medina, Ana", true), foto("2", "Medina, Luis", false)] }}
      onSubir={nada}
      onEliminar={nada}
    />
  );
  const texto = document.body.textContent;
  expect(texto).toContain("Tu familia · 2 de 3");
  expect(texto).toContain("Medina, Ana · 22:47");
  expect(texto).toContain("Medina, Luis · 22:47");
  expect(papeleras()).toHaveLength(1);
  expect(texto).toContain("Elegir foto");
  expect(texto).toContain(FRASE_HORIZONTAL);
  // La galería, no la cámara (él): sin `capture`.
  expect(campoFoto().getAttribute("accept")).toBe("image/*");
  expect(campoFoto().hasAttribute("capture")).toBe(false);
  vista.desmontar();
});

it("con las 3: sin botón, y dice cómo cambiar una", () => {
  const vista = montar(
    <TarjetaFotosFiesta
      estado={{ maximo: 3, fotos: [foto("1", "Medina, Ana", true), foto("2", "Medina, Luis", false), foto("3", "Medina, Eva", false)] }}
      onSubir={nada}
      onEliminar={nada}
    />
  );
  expect(document.body.textContent).toContain("Ya tienen sus 3 fotos. Si quieren cambiar una, eliminen antes otra.");
  expect(campoFoto()).toBeNull();
  vista.desmontar();
});

it("eliminar pregunta antes, y con «Sí, eliminar» la elimina", () => {
  const eliminadas = [];
  const vista = montar(
    <TarjetaFotosFiesta
      estado={{ maximo: 3, fotos: [foto("1", "Medina, Ana", true)] }}
      onSubir={nada}
      onEliminar={async (id) => {
        eliminadas.push(id);
        return { aviso: "" };
      }}
    />
  );
  vista.pulsar(papeleras()[0]);
  expect(document.body.textContent).toContain("¿Eliminar esta foto?");
  expect(eliminadas).toEqual([]);
  vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Sí, eliminar"));
  expect(eliminadas).toEqual(["1"]);
  vista.desmontar();
});

it("las suyas llevan su miniatura (guardada en su móvil); las de los demás, el marco vacío", () => {
  window.localStorage.setItem("fotos-fiesta-miniatura-1", "data:image/jpeg;base64,eA==");
  const vista = montar(
    <TarjetaFotosFiesta
      estado={{ maximo: 3, fotos: [foto("1", "Medina, Ana", true), foto("2", "Medina, Luis", false)] }}
      onSubir={nada}
      onEliminar={nada}
    />
  );
  const imagenes = document.body.querySelectorAll("img");
  expect(imagenes).toHaveLength(1);
  expect(imagenes[0].getAttribute("alt")).toBe("Foto de Medina, Ana");
  // Sin `onVer`, la miniatura no se pinta como botón.
  expect(imagenes[0].closest("button")).toBeNull();
  vista.desmontar();
  window.localStorage.removeItem("fotos-fiesta-miniatura-1");
});
