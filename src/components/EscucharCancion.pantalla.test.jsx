// La escucha previa (v81.1), DIBUJADA, con Deezer y el sonido de mentira.
import { it, expect, vi, beforeAll } from "vitest";
import { act, useState } from "react";
import { montar } from "../pruebas/dibujar";
import { CampoCancion } from "./CampoCancion";

// jsdom no suena: el reproductor, de mentira, apuntando lo que le piden.
const sonadas = [];
beforeAll(() => {
  window.Audio = class {
    constructor() {
      this.ownerDocument = document;
    }
    play() {
      if (this.src && !this.src.startsWith("data:")) sonadas.push(this.src);
      return Promise.resolve();
    }
    pause() {}
  };
});

function Arnes({ buscar }) {
  const [c, setC] = useState({ titulo: "Tu cariñito", artista: "Elvis Crespo" });
  return <CampoCancion titulo={c.titulo} artista={c.artista} buscar={buscar} onCambiar={setC} />;
}
const pulsar = (el) => act(async () => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const boton = (titulo) => document.body.querySelector(`button[title="${titulo}"]`);

it("▶ suena la primera; con el cantante equivocado ofrece las que se llaman igual, y «Usar así» la deja escrita como en Deezer", async () => {
  const buscar = vi.fn(async () => ({
    soloTitulo: true,
    candidatos: [
      { titulo: "Tu Cariñito", artista: "Edwin Rivera", duracion: 241, deezer: 1, muestra: "https://muestra/1.mp3" },
      { titulo: "Tu Cariñito", artista: "Luisito Ayala", duracion: 200, deezer: 2, muestra: "https://muestra/2.mp3" },
    ],
  }));
  const vista = montar(<Arnes buscar={buscar} />);
  await pulsar(boton("Escuchar 30 segundos"));
  expect(buscar).toHaveBeenCalledWith({ titulo: "Tu cariñito", artista: "Elvis Crespo" });
  expect(sonadas.at(-1)).toBe("https://muestra/1.mp3");
  expect(document.body.textContent).toContain("Con ese cantante no está; estas se llaman igual:");
  expect(document.body.textContent).toContain("Tu Cariñito — Edwin Rivera · 4:01");
  const usar = [...document.body.querySelectorAll("button")].find((b) => b.textContent === "Usar así");
  await pulsar(usar);
  expect(document.body.querySelector('input[aria-label="Canción"]').value).toBe("Tu Cariñito");
  expect(document.body.querySelector('input[aria-label="Artista"]').value).toBe("Edwin Rivera");
  vista.desmontar();
});

it("si Deezer no la encuentra, lo dice: está mal escrita", async () => {
  const vista = montar(<Arnes buscar={async () => ({ candidatos: [], soloTitulo: false })} />);
  await pulsar(boton("Escuchar 30 segundos"));
  expect(document.body.textContent).toContain("No la encuentro en Deezer: revisa cómo está escrita.");
  vista.desmontar();
});
