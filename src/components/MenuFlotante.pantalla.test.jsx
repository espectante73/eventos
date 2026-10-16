// El panel que se queda abierto (Acciones de la Lista de invitados): con
// el móvil en horizontal no cabían sus 7 botones y no había forma de
// llegar a los últimos (él, v68.5).
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { MenuFlotante } from "./MenuFlotante";

const OPCIONES = ["Revisión", "Imprimir", "Canciones", "Alergias", "Añadir", "Editar", "Importar"].map((etiqueta) => ({
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
