// «Tus canciones para bailar» en el tablón, DIBUJADA (v92.1, él: cada
// invitado cambia las suyas con su enlace personal; «check para cerrar a
// mano»): plegada con cuántas tiene; abierta, los 3 huecos y Guardar;
// cerrada, solo se ven.
import { it, expect } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { CancionesTablon } from "./CancionesTablon";
import { MOTIVOS_CANCIONES_TABLON } from "../lib/cancionesTablon";

function dibujar({ cancion = "Titanium — David Guetta", cerradas = false, respuesta = "" } = {}) {
  const guardadas = [];
  let abierta = false;
  let vista;
  const pintar = () =>
    vista.pintar(
      <CancionesTablon
        cancion={cancion}
        cerradas={cerradas}
        abierta={abierta}
        onAlternar={() => {
          abierta = !abierta;
          pintar();
        }}
        onGuardar={async (h) => {
          guardadas.push(h);
          return respuesta;
        }}
      />
    );
  vista = montar(<div />);
  pintar();
  return { vista, guardadas, abierta: () => abierta };
}
const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes(t));
const campo = (n) => document.body.querySelector(`input[aria-label="${n}"]`);
const escribir = (el, valor) =>
  act(() => {
    const fijar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    fijar.call(el, valor);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

it("plegada dice cuántas tiene; abierta, sus 3 huecos con lo que ya tenía", () => {
  const { vista } = dibujar();
  expect(document.body.textContent).toContain("Tus canciones para bailar");
  expect(document.body.textContent).toContain("1 de 3");
  expect(campo("Canción 1")).toBeNull();
  vista.pulsar(boton("Tus canciones para bailar"));
  expect(campo("Canción 1").value).toBe("Titanium");
  expect(campo("Artista 1").value).toBe("David Guetta");
  expect(campo("Canción 3")).not.toBeNull();
  // Sin cambios, «Guardar» no hace nada.
  expect(boton("Guardar").disabled).toBe(true);
  vista.desmontar();
});

it("escribir una y «Guardar» la manda, y se pliega", async () => {
  const { vista, guardadas, abierta } = dibujar();
  vista.pulsar(boton("Tus canciones para bailar"));
  escribir(campo("Canción 2"), "Bamboleo");
  expect(boton("Guardar").disabled).toBe(false);
  await act(async () => boton("Guardar").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(guardadas[0][1]).toEqual({ titulo: "Bamboleo", artista: "" });
  expect(abierta()).toBe(false);
  vista.desmontar();
});

it("si no se guarda, lo dice y se queda abierta con lo escrito", async () => {
  const { vista, abierta } = dibujar({ respuesta: MOTIVOS_CANCIONES_TABLON.llave });
  vista.pulsar(boton("Tus canciones para bailar"));
  escribir(campo("Canción 2"), "Bamboleo");
  await act(async () => boton("Guardar").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(document.body.textContent).toContain(MOTIVOS_CANCIONES_TABLON.llave);
  expect(abierta()).toBe(true);
  expect(campo("Canción 2").value).toBe("Bamboleo");
  vista.desmontar();
});

it("«Cancelar» con algo escrito pregunta antes de descartarlo", () => {
  const { vista } = dibujar();
  vista.pulsar(boton("Tus canciones para bailar"));
  escribir(campo("Canción 2"), "Bamboleo");
  vista.pulsar(boton("Cancelar"));
  expect(document.body.textContent).toContain("¿Descartar los cambios?");
  vista.desmontar();
});

it("cerradas: solo se ven, sin huecos ni Guardar, y dice a quién pedir un cambio", () => {
  const { vista } = dibujar({ cerradas: true });
  expect(document.body.textContent).toContain("1 de 3 · cerradas");
  vista.pulsar(boton("Tus canciones para bailar"));
  expect(document.body.textContent).toContain("Titanium — David Guetta");
  expect(document.body.textContent).toContain(MOTIVOS_CANCIONES_TABLON.cerradas);
  expect(campo("Canción 1")).toBeNull();
  expect(boton("Guardar")).toBeUndefined();
  vista.desmontar();
});
