// Dibujar un componente dentro de una prueba. UNA sola receta para todo
// el proyecto (norma 7).
//
// Antes había CUATRO, tres de ellas copiadas entre sí: `Boton.test.js`,
// `Widgets.test.js` y `PreguntaSeguridad.test.js` repetían las mismas
// ocho líneas de montar/desmontar, y la prueba de pantalla de la Lista de
// invitados llegó el 2026-09-24 con una quinta forma distinta. Con tres
// pantallas más por cubrir habrían sido siete copias.
//
// Monta de VERDAD (`createRoot` + `act`), no genera texto: así se
// ejecutan también los efectos de la pantalla, y un fallo dentro de un
// `useEffect` se caza igual que uno del dibujo.
import { act } from "react";
import { createRoot } from "react-dom/client";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export function montar(elemento) {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);
  act(() => raiz.render(elemento));

  return {
    contenedor,
    // Lo que se ha pintado, para poder buscar un nombre dentro.
    get html() {
      return contenedor.innerHTML;
    },
    // Volver a dibujar con otras propiedades, sin montar otra vez.
    pintar: (otro) => act(() => raiz.render(otro)),
    pulsar: (el) => act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true }))),
    // Elegir en un desplegable. React escucha "change", y el valor hay
    // que ponerlo antes de avisar.
    elegir: (select, valor) =>
      act(() => {
        select.value = valor;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }),
    desmontar: () => {
      act(() => raiz.unmount());
      contenedor.remove();
    },
  };
}

// Atajo para la pregunta que se repite en las pruebas de pantalla: ¿esta
// pantalla se puede dibujar entera sin caerse? Devuelve el html.
export function dibujarYSoltar(elemento) {
  const vista = montar(elemento);
  const html = vista.html;
  vista.desmontar();
  return html;
}
