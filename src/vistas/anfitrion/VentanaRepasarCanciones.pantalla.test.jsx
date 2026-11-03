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
  { id: "c", cancion: "Canción inventada" },
];
const DEEZER = {
  "Una Chica YE-YE Concha Velasco": { pista: { titulo: "Chica Ye-Ye", artista: "Conchita Velasco", duracion: 143 } },
  "Mi jaca Estrellita Castro": { pista: { titulo: "Mi jaca", artista: "Estrellita Castro", duracion: 211 } },
  "Canción inventada": { pista: null },
};

// Como la app: el evento y los invitados viven arriba y la ventana los recibe.
function Arnes({ espias }) {
  const [evento, setEvento] = useState({ catalogoCanciones: {} });
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
