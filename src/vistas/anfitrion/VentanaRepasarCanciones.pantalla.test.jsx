// «Repasar canciones» (v80), DIBUJADA: al abrir busca en Deezer (de mentira)
// lo que falta, propone cómo dejarla escrita y, al corregir, cambia todas
// las fichas que la pidieron.
import { it, expect, vi } from "vitest";
import { act, useState } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaRepasarCanciones } from "./VentanaRepasarCanciones";

const INVITADOS = [
  { id: "a", cancion: "Una Chica YE-YE - Concha Velasco" },
  { id: "b", cancion: "Mi jaca — Estrellita Castro\n\nUna Chica YE-YE - Concha Velasco" },
  { id: "c", nombre: "Rubén", apellido: "Pacheco", anioNacimiento: "1964", cancion: "Canción inventada" },
];
const DEEZER = {
  "Una Chica YE-YE Concha Velasco": { pista: { titulo: "Chica Ye-Ye", artista: "Conchita Velasco", duracion: 143 } },
  "Mi jaca Estrellita Castro": { pista: { titulo: "Mi jaca", artista: "Estrellita Castro", duracion: 211 } },
  "Canción inventada": { pista: null },
  "Chica yeye Conchita Velasco": { pista: { titulo: "Chica Ye-Ye", artista: "Conchita Velasco", duracion: 143 } },
};

// Como la app: el evento y los invitados viven arriba y la ventana los recibe.
function Arnes({ espias }) {
  const [evento, setEvento] = useState({ fecha: "2026-11-13", catalogoCanciones: {} });
  const [invitados, setInvitados] = useState(INVITADOS);
  const data = {
    evento,
    invitados,
    persistInvitados: (lista) => {
      espias.persistInvitados(lista);
      setInvitados(lista);
    },
    buscarCanciones: async (consultas) => {
      espias.buscarCanciones(consultas);
      return { resultados: consultas.map((q) => DEEZER[q]) };
    },
    actualizarCatalogoCanciones: async (cambiar) => setEvento((e) => ({ ...e, catalogoCanciones: cambiar(e.catalogoCanciones) })),
    persistCancionesFueraDj: () => {},
  };
  return <VentanaRepasarCanciones data={data} onCerrar={() => {}} />;
}

it("busca lo que falta, propone separar canción y cantante, y al corregir cambia todas sus fichas", async () => {
  const espias = { persistInvitados: vi.fn(), buscarCanciones: vi.fn() };
  let vista;
  await act(async () => {
    vista = montar(<Arnes espias={espias} />);
  });
  expect(espias.buscarCanciones).toHaveBeenCalledWith(["Una Chica YE-YE Concha Velasco", "Mi jaca Estrellita Castro", "Canción inventada"]);
  const texto = document.body.textContent;
  expect(texto).toContain("Chica Ye-Ye — Conchita Velasco");
  expect(texto).toContain("escrita «Una Chica YE-YE - Concha Velasco»");
  expect(texto).toContain("2:23");

  const corregir = [...document.body.querySelectorAll("button")].find((b) => b.textContent.startsWith("Corregir"));
  expect(corregir.textContent).toBe("Corregir 1");
  await act(async () => corregir.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  const guardados = espias.persistInvitados.mock.calls[0][0];
  expect(guardados.map((g) => g.cancion)).toEqual([
    "Chica Ye-Ye — Conchita Velasco",
    "Mi jaca — Estrellita Castro\n\nChica Ye-Ye — Conchita Velasco",
    "Canción inventada",
  ]);
  expect(document.body.textContent).toContain("Corregidas 2 peticiones.");
  vista.desmontar();
});

// v80.1 (él): «en la ventana de primer plano no me deja editar».
it("la que Deezer no encontró se corrige con el lápiz, en todas sus peticiones, y se vuelve a buscar sola", async () => {
  const espias = { persistInvitados: vi.fn(), buscarCanciones: vi.fn() };
  let vista;
  await act(async () => {
    vista = montar(<Arnes espias={espias} />);
  });
  const botones = () => [...document.body.querySelectorAll("button")];
  // Abrir «No encontradas» y su lápiz.
  await act(async () => botones().find((b) => b.textContent.includes("No encontradas")).dispatchEvent(new MouseEvent("click", { bubbles: true })));
  const fila = [...document.body.querySelectorAll("label")].find((l) => l.textContent.includes("Canción inventada"));
  await act(async () => fila.querySelector('button[title="Corregir a mano"]').dispatchEvent(new MouseEvent("click", { bubbles: true })));
  // Quién la pidió, para consultarle (v80.3).
  expect(document.body.textContent).toContain("Pedida por Pacheco, Rubén (62)");
  const escribir = async (etiqueta, valor) => {
    const campo = document.body.querySelector(`input[aria-label="${etiqueta}"]`);
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(campo, valor);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };
  await escribir("Canción", "Chica yeye");
  await escribir("Artista", "Conchita Velasco");
  await act(async () => botones().find((b) => b.textContent === "Guardar").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(espias.persistInvitados.mock.calls[0][0].find((g) => g.id === "c").cancion).toBe("Chica yeye — Conchita Velasco");
  expect(espias.buscarCanciones).toHaveBeenLastCalledWith(["Chica yeye Conchita Velasco"]);
  vista.desmontar();
});

it("si la pidieron varios, salen todos con su edad", async () => {
  const espias = { persistInvitados: vi.fn(), buscarCanciones: vi.fn() };
  let vista;
  await act(async () => {
    vista = montar(<Arnes espias={espias} />);
  });
  const fila = [...document.body.querySelectorAll("label")].find((l) => l.textContent.includes("Chica Ye-Ye"));
  await act(async () => fila.querySelector('button[title="Corregir a mano"]').dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(document.body.textContent).toContain("Pedida 2 veces, se corrige en todas:");
  vista.desmontar();
});
