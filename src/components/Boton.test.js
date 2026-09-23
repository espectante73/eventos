import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import { estilosBoton, EnlaceTexto } from "./Boton";

// La pieza existe para que no vuelva a haber 12 tamaños distintos: estas
// pruebas fijan que cada variante y cada tamaño tengan un único aspecto.
describe("estilosBoton", () => {
  it("el principal va lleno y el secundario solo con contorno", () => {
    expect(estilosBoton("principal").background).toBe("#1F3A2E");
    expect(estilosBoton("secundario").background).toBe("transparent");
    expect(estilosBoton("secundario").border).toContain("#1F3A2E");
  });

  it("el peligro es rojo y con letra blanca, en cualquier fondo", () => {
    expect(estilosBoton("peligro").background).toBe("#8C2F39");
    expect(estilosBoton("peligro", "pequeno", true).color).toBe("#fff");
  });

  it("sobre fondo oscuro cambia para que se vea", () => {
    expect(estilosBoton("principal", "normal", true).background).toBe("#D9B778");
    expect(estilosBoton("secundario", "normal", true).color).toBe("#D9B778");
  });

  it("solo hay dos tamaños, y el pequeño es más bajo", () => {
    expect(estilosBoton("principal", "normal").minHeight).toBe(36);
    expect(estilosBoton("principal", "pequeno").minHeight).toBe(28);
  });

  it("una variante desconocida no rompe: cae en secundario", () => {
    expect(estilosBoton("inventada").background).toBe(estilosBoton("secundario").background);
  });
});

// El link de texto: la norma 13, que separa acciones de links.
// Una ACCIÓN sobre los datos lleva relieve; un LINK que te lleva a otro
// sitio (otra pantalla del login, otra web) va subrayado.
describe("EnlaceTexto", () => {
  let contenedor, raiz;
  beforeEach(() => {
    contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    raiz = createRoot(contenedor);
  });
  afterEach(() => {
    act(() => raiz.unmount());
    contenedor.remove();
  });
  const pintar = (props, texto) => act(() => raiz.render(createElement(EnlaceTexto, props, texto)));

  it("sin href es un botón: en el login no se va a ninguna parte", () => {
    pintar({ onClick: () => {} }, "He olvidado mi contraseña");
    const el = contenedor.firstChild;
    expect(el.tagName).toBe("BUTTON");
    expect(el.style.textDecoration).toBe("underline");
  });

  it("con href sale de la app, y siempre en pestaña nueva", () => {
    pintar({ href: "https://ejemplo.com" }, "ver el proyecto");
    const el = contenedor.firstChild;
    expect(el.tagName).toBe("A");
    expect(el.target).toBe("_blank");
    // Sin esto, la web de destino puede manipular la pestaña de origen.
    expect(el.rel).toContain("noreferrer");
  });

  it("nunca lleva relieve: eso es de los botones", () => {
    pintar({ onClick: () => {} }, "Crear cuenta");
    expect(contenedor.firstChild.className).not.toContain("boton-3d");
  });

  it("dentro de una frase hereda la letra, para no verse como un trozo suelto", () => {
    pintar({ href: "https://ejemplo.com", enLinea: true }, "ver el proyecto en GitHub");
    const el = contenedor.firstChild;
    expect(el.style.display).toBe("inline");
    expect(el.style.fontSize).toBe("inherit");
    // Aun siendo texto corrido, el dedo necesita dónde acertar.
    expect(el.style.paddingTop).toBe("8px");
  });
});
