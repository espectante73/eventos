import { describe, it, expect, beforeEach } from "vitest";
import { queRespuesta } from "./respuestaTactil";

// Qué responde con clic y vibración al tocarlo, y qué no.
describe("respuesta al pulsar", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });
  const poner = (html) => {
    document.body.innerHTML = html;
    return document.body;
  };

  it("un botón, y también lo que hay dentro de él (su icono)", () => {
    const b = poner('<button id="b"><svg id="i"></svg></button>');
    expect(queRespuesta(b.querySelector("#b"))).toEqual({ sonido: true, vibracion: true });
    expect(queRespuesta(b.querySelector("#i"))).not.toBe(null);
  });

  it("un botón desactivado no responde", () => {
    const b = poner("<button disabled>x</button>");
    expect(queRespuesta(b.querySelector("button"))).toBe(null);
  });

  it("la etiqueta de un campo de texto NO es un botón; la de una casilla sí", () => {
    const b = poner(
      '<label id="t">Nombre <input type="text"></label><label id="c"><input type="checkbox"> Pagado</label>'
    );
    expect(queRespuesta(b.querySelector("#t"))).toBe(null);
    expect(queRespuesta(b.querySelector("#t input"))).toBe(null);
    expect(queRespuesta(b.querySelector("#c"))).not.toBe(null);
  });

  it("el texto normal no responde", () => {
    const b = poner("<p>hola</p>");
    expect(queRespuesta(b.querySelector("p"))).toBe(null);
  });

  it("el interruptor invisible de dentro de un botón cuenta como el botón", () => {
    const b = poner(
      '<button id="a">Añadir<input type="checkbox" switch class="interruptor-haptico"></button>' +
        '<button id="d" disabled>No<input type="checkbox" switch class="interruptor-haptico"></button>'
    );
    expect(queRespuesta(b.querySelector("#a .interruptor-haptico"))).toEqual({ sonido: true, vibracion: true });
    expect(queRespuesta(b.querySelector("#d .interruptor-haptico"))).toBe(null);
  });

  it("dentro de la Música del evento vibra pero no suena", () => {
    const b = poner('<div data-sin-sonido-clic><button>▶</button></div>');
    expect(queRespuesta(b.querySelector("button"))).toEqual({ sonido: false, vibracion: true });
  });
});
