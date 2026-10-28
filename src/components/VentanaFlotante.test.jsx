// @vitest-environment jsdom
// Una pregunta que abre una ventana (usePreguntaSeguridad) tiene que
// seguir delante al apretarla. Antes la ventana "oía" ese toque, se ponía
// delante y la tapaba: sus botones no hacían nada (Invitaciones, 47.4).
import { it, expect } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { VentanaFlotante, ModalFlotante } from "./VentanaFlotante";
import { usePreguntaSeguridad } from "./PreguntaSeguridad";
import { Boton } from "./Boton";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Prueba({ alConfirmar }) {
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  return (
    <VentanaFlotante titulo="Ventana" onCerrar={() => {}}>
      <Boton onClick={() => preguntar({ titulo: "¿Seguro?", rotulo: "Sí, hazlo", alConfirmar })}>Abrir</Boton>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}

const boton = (t) => [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t));
const capa = (el) => {
  while (el && !el.style?.zIndex) el = el.parentElement;
  return Number(el.style.zIndex);
};

it("la pregunta sigue delante de su ventana al apretarla, y su botón funciona", async () => {
  let confirmado = false;
  const div = document.body.appendChild(document.createElement("div"));
  await act(async () => createRoot(div).render(<Prueba alConfirmar={() => (confirmado = true)} />));
  await act(async () => boton("Abrir").click());
  await act(async () => boton("Sí, hazlo").dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
  expect(capa(boton("Sí, hazlo"))).toBeGreaterThan(capa(boton("Abrir")));
  await act(async () => boton("Sí, hazlo").click());
  expect(confirmado).toBe(true);
});

// v61.3: una pregunta sin texto («¿Descartar los cambios?») dejaba una
// franja vacía entre el título y los botones.
it("una ventana de pregunta sin texto no deja franja vacía", async () => {
  const caja = document.createElement("div");
  document.body.appendChild(caja);
  const raiz = createRoot(caja);
  await act(async () => raiz.render(<ModalFlotante titulo="¿Descartar?" onCerrar={() => {}} acciones={<Boton>No</Boton>}>{false}{undefined}</ModalFlotante>));
  expect(document.querySelector(".modal-flotante-cuerpo")).toBeNull();
  await act(async () => raiz.render(<ModalFlotante titulo="¿Quitar?" onCerrar={() => {}}>Algo</ModalFlotante>));
  expect(document.querySelector(".modal-flotante-cuerpo").textContent).toBe("Algo");
  await act(async () => raiz.unmount());
  caja.remove();
});

// v63.5: lo que se abre encima aclara el fondo (velo marfil esmerilado),
// no lo oscurece.
it("una ventana encima pone detrás el velo claro", async () => {
  const caja = document.createElement("div");
  document.body.appendChild(caja);
  const raiz = createRoot(caja);
  await act(async () => raiz.render(<ModalFlotante titulo="Mi cuenta" onCerrar={() => {}}>Algo</ModalFlotante>));
  expect(document.querySelector(".modal-flotante-fondo").style.background).toBe("rgba(239, 233, 222, 0.55)");
  await act(async () => raiz.unmount());
  caja.remove();
});

// Norma 5: la salida, arriba y a la vista. Con el móvil en horizontal, lo
// de la cabecera de la Lista de invitados empujaba la X fuera (v68.6).
it("la X nunca va dentro de lo que se desplaza de la cabecera, y `llena` reparte el alto", async () => {
  const div = document.body.appendChild(document.createElement("div"));
  await act(async () =>
    createRoot(div).render(
      <VentanaFlotante titulo="Lista" onCerrar={() => {}} llena extra={<span>muchas cifras</span>}>
        <p>tabla</p>
      </VentanaFlotante>
    )
  );
  const extra = div.querySelector("[data-extra-ventana]");
  expect(extra.className).toContain("overflow-x-auto");
  const cerrar = div.querySelector('button[aria-label="Cerrar"]');
  expect(extra.contains(cerrar)).toBe(false);
  expect(cerrar.className).toContain("flex-shrink-0");
  const ventana = div.firstElementChild;
  expect(ventana.style.height).toContain("88vh");
  const cuerpo = div.querySelector(".ventana-cuerpo");
  expect(cuerpo.style.overflow).toBe("hidden");
  expect(cuerpo.style.flexDirection).toBe("column");
});

// v71.9 (él): al agrandarla por la esquina se salía del navegador, ya no se
// podía encoger, y al arrastrar se seleccionaba todo en azul.
it("agrandarla o moverla nunca la saca de la pantalla, y no selecciona texto", async () => {
  const { montar } = await import("../pruebas/dibujar");
  const { MARGEN_PANTALLA } = await import("../theme");
  // La receta de pruebas mide la ventana en (100, 100), de 100 x 100.
  const vista = montar(<VentanaFlotante titulo="Ventana" onCerrar={() => {}}>Algo</VentanaFlotante>);
  const ventana = document.querySelector(".fixed.rounded-lg");
  const raton = (el, tipo, x, y) => {
    const e = new MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y });
    act(() => el.dispatchEvent(e));
    return e;
  };

  const esquina = document.querySelector('[title="Arrastra para cambiar el tamaño"]');
  expect(raton(esquina, "mousedown", 200, 200).defaultPrevented).toBe(true);
  raton(window, "mousemove", 5000, 5000);
  raton(window, "mouseup", 5000, 5000);
  expect(ventana.style.width).toBe(`${window.innerWidth - 100 - MARGEN_PANTALLA}px`);
  expect(ventana.style.height).toBe(`${window.innerHeight - 100 - MARGEN_PANTALLA}px`);

  const cabecera = document.querySelector(".cursor-move");
  expect(raton(cabecera, "mousedown", 120, 120).defaultPrevented).toBe(true);
  raton(window, "mousemove", 5000, 5000);
  raton(window, "mouseup", 5000, 5000);
  expect(ventana.style.left).toBe(`${window.innerWidth - 100 - MARGEN_PANTALLA}px`);
  expect(ventana.style.top).toBe(`${window.innerHeight - 100 - MARGEN_PANTALLA}px`);
  raton(cabecera, "mousedown", 120, 120);
  raton(window, "mousemove", -5000, -5000);
  raton(window, "mouseup", -5000, -5000);
  expect(ventana.style.left).toBe(`${MARGEN_PANTALLA}px`);
  vista.desmontar();
});

// v74.4 (él): la ventana de Mesas tapaba el sello de los días. Ninguna
// ventana baja hasta la franja de la barra y el sello.
it("agrandarla o moverla no la mete en la franja de abajo, la de la barra y el sello", async () => {
  const { montar } = await import("../pruebas/dibujar");
  const { MARGEN_PANTALLA } = await import("../theme");
  document.documentElement.style.setProperty("--hueco-barra-ventanas", "90px");
  const vista = montar(<VentanaFlotante titulo="Ventana" onCerrar={() => {}}>Algo</VentanaFlotante>);
  const ventana = document.querySelector(".fixed.rounded-lg");
  const raton = (el, tipo, x, y) => act(() => el.dispatchEvent(new MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y })));
  raton(document.querySelector('[title="Arrastra para cambiar el tamaño"]'), "mousedown", 200, 200);
  raton(window, "mousemove", 5000, 5000);
  raton(window, "mouseup", 5000, 5000);
  expect(ventana.style.height).toBe(`${window.innerHeight - 90 - MARGEN_PANTALLA - 100}px`);
  raton(document.querySelector(".cursor-move"), "mousedown", 120, 120);
  raton(window, "mousemove", 120, 5000);
  raton(window, "mouseup", 120, 5000);
  expect(ventana.style.top).toBe(`${window.innerHeight - 90 - MARGEN_PANTALLA - 100}px`);
  document.documentElement.style.removeProperty("--hueco-barra-ventanas");
  vista.desmontar();
});
