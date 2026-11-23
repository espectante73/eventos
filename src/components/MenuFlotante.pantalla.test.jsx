// El panel que se queda abierto (Acciones de la Lista de invitados): con
// el móvil en horizontal no cabían sus 7 botones y no había forma de
// llegar a los últimos (él, v68.5).
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { MenuFlotante } from "./MenuFlotante";
import { DORADO } from "../theme";

const OPCIONES = ["Revisión", "Imprimir", "Canciones", "Alergias", "Formulario", "Edición", "Importar"].map((etiqueta) => ({
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

// v95.8 (él: «a medida que vaya abriendo menús y submenús, el que quede
// protagonista, en primer plano, deje todo lo demás difuminado; que no se
// confundan los botones»): en el móvil el tercer nivel caía encima del
// primero. Cada submenú lleva su velo detrás, por encima de lo anterior;
// tocarlo vuelve un paso atrás, sin cerrar el menú entero.
it("cada submenú, con su velo detrás y encima de lo anterior; tocar el velo vuelve un paso atrás", () => {
  const vista = montar(
    <MenuFlotante
      anchor="right"
      opciones={[
        {
          id: "colaboradores",
          etiqueta: "Colaboradores",
          submenu: [
            { id: "datos", etiqueta: "Datos Colab.", onClick: () => {} },
            { id: "formularios", etiqueta: "Formularios", submenu: [{ id: "ana", etiqueta: "Ruiz, Ana", onClick: () => {} }] },
          ],
        },
        { id: "novedades", etiqueta: "Novedades", onClick: () => {} },
      ]}
      render={({ ref, toggle }) => (
        <button ref={ref} onClick={toggle}>
          Abrir sección…
        </button>
      )}
    />
  );
  const boton = (texto) => [...document.body.querySelectorAll("button")].find((b) => b.textContent === texto);
  const velos = () => [...document.body.querySelectorAll("[data-velo-submenu]")];
  const panel = (texto) => [...document.body.querySelectorAll("[data-menu-panel]")].find((p) => p.textContent.includes(texto) && !p.textContent.includes("Novedades"));
  vista.pulsar(boton("Abrir sección…"));
  expect(velos()).toHaveLength(0);
  vista.pulsar(boton("Colaboradores"));
  expect(velos()).toHaveLength(1);
  const z = (el) => Number(el.style.zIndex);
  const segundo = panel("Datos Colab.");
  expect(z(velos()[0])).toBeGreaterThan(9999); // por encima del primer panel
  expect(z(segundo)).toBeGreaterThan(z(velos()[0]));
  vista.pulsar(boton("Formularios"));
  expect(velos()).toHaveLength(2);
  const tercero = panel("Ruiz, Ana");
  const veloTercero = velos().find((v) => z(v) > z(segundo));
  expect(veloTercero, "el velo del tercero, por encima del segundo").toBeTruthy();
  expect(z(tercero)).toBeGreaterThan(z(veloTercero));
  // Tocar el velo: se cierra el tercero; el segundo y el menú siguen.
  vista.pulsar(veloTercero);
  expect(velos()).toHaveLength(1);
  expect(document.body.textContent).not.toContain("Ruiz, Ana");
  expect(document.body.textContent).toContain("Datos Colab.");
  expect(document.body.textContent).toContain("Novedades");
  vista.desmontar();
});

// «Día del evento» destaca siempre (él, v97.1): marco y brillo dorados;
// abierta, el relleno dorado de todas y sin el brillo.
it("una opción con realce lleva marco y brillo dorados; marcada, solo el relleno de abierta", () => {
  const pintar = (marcado) =>
    montar(
      <MenuFlotante
        opciones={[{ id: "dia", etiqueta: "Día del evento", realce: true, marcado, onClick: () => {} }, { id: "otra", etiqueta: "Otra", onClick: () => {} }]}
        render={({ ref, toggle }) => (
          <button ref={ref} onClick={toggle}>
            Abrir
          </button>
        )}
      />
    );
  const fila = (texto) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === texto);
  const cerrada = pintar(false);
  cerrada.pulsar(fila("Abrir"));
  expect(fila("Día del evento").style.boxShadow).toBe(DORADO.brillo);
  expect(fila("Día del evento").style.border).toContain("3px solid");
  expect(fila("Otra").style.boxShadow).toBe("");
  cerrada.desmontar();
  const abierta = pintar(true);
  abierta.pulsar(fila("Abrir"));
  expect(fila("Día del evento").style.boxShadow).toBe("");
  expect(fila("Día del evento").style.background).toContain("linear-gradient");
  abierta.desmontar();
});
