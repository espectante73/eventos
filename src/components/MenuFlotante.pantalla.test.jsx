// El panel que se queda abierto (Acciones de la Lista de invitados): con
// el móvil en horizontal no cabían sus 7 botones y no había forma de
// llegar a los últimos (él, v68.5).
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { MenuFlotante } from "./MenuFlotante";

const OPCIONES = ["Revisión", "Imprimir", "Canciones", "Alergias", "Formulario", "Editar", "Importar"].map((etiqueta) => ({
  id: etiqueta,
  etiqueta,
  onClick: () => {},
}));

it("ocupa como mucho todo el alto, se arrastra por su barra y sus botones se desplazan con el dedo", () => {
  const vista = montar(
    <MenuFlotante
      anchor="bottom-left"
      persistente={{ titulo: "Acciones", clave: "prueba-acciones" }}
      opciones={OPCIONES}
      render={({ ref, toggle }) => (
        <button ref={ref} onClick={toggle}>
          Acciones
        </button>
      )}
    />
  );
  vista.pulsar(document.body.querySelector("button"));
  const panel = document.body.querySelector("[data-menu-panel]");
  expect(panel.style.maxHeight).toBe(`${window.innerHeight - 24}px`);
  expect(panel.style.touchAction).toBe("");
  expect(document.body.querySelector("[data-barra-panel]").style.touchAction).toBe("none");
  const lista = document.body.querySelector("[data-lista-panel]");
  expect(lista.style.touchAction).toBe("pan-y");
  expect(lista.className).toContain("overflow-y-auto");
  expect(lista.textContent).toContain("Importar");
  vista.desmontar();
});

// «Columnas» (él, v89.4): el submenú de un panel fijo sale pegado a él, por
// el lado que tiene sitio. Empujado dentro de la pantalla, se montaba
// encima del propio panel.
it("el submenú de un panel fijo sale por el lado con sitio y con el fondo del panel", () => {
  const original = Element.prototype.getBoundingClientRect;
  let filaEn = 0;
  Element.prototype.getBoundingClientRect = function () {
    const left = this.closest?.("[data-menu-panel]") && !this.closest("[data-lista-panel]") ? 400 : filaEn;
    return { left, right: left + 146, top: 100, bottom: 140, width: 146, height: 40, x: left, y: 100 };
  };
  const abrir = (x) => {
    filaEn = x;
    const vista = montar(
      <MenuFlotante
        anchor="bottom-left"
        persistente={{ titulo: "Acciones", clave: "prueba-submenu" }}
        opciones={[{ id: "columnas", etiqueta: "Columnas", submenu: [{ id: "mesa", etiqueta: "Mesa", onClick: () => {} }] }]}
        render={({ ref, toggle }) => (
          <button ref={ref} onClick={toggle}>
            Acciones
          </button>
        )}
      />
    );
    vista.pulsar(document.body.querySelector("button"));
    vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent === "Columnas"));
    const sub = [...document.body.querySelectorAll("[data-menu-panel]")].find((p) => p.textContent === "Mesa");
    return { vista, sub };
  };
  try {
    const pegadoIzquierda = abrir(18);
    expect(pegadoIzquierda.sub.style.left, "sin sitio a la izquierda, a la derecha").toBe(`${18 + 146 + 4}px`);
    expect(pegadoIzquierda.sub.style.background, "el mismo fondo que el panel").not.toBe("");
    pegadoIzquierda.vista.desmontar();
    const pegadoDerecha = abrir(window.innerWidth - 160);
    expect(pegadoDerecha.sub.style.right, "con sitio a la izquierda, ahí").toBe(`${160 + 4}px`);
    pegadoDerecha.vista.desmontar();
  } finally {
    Element.prototype.getBoundingClientRect = original;
  }
});
