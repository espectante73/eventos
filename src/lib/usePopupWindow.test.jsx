// La ventana aparte (Lista de invitados en el Mac) no puede quedarse
// «muerta» tras recargarse la pestaña con una versión nueva (él, v68.7:
// «no filtra nada»).
import { it, expect, vi, afterEach } from "vitest";
import { act, Component, useEffect, useState } from "react";
import { montar } from "../pruebas/dibujar";
import { usePopupWindow, copiarEstilos } from "./usePopupWindow";

// Una ventana de mentira: su propio documento, como la de verdad.
function ventanaFalsa() {
  const doc = document.implementation.createHTMLDocument("");
  return { document: doc, closed: false, close: vi.fn(function () { this.closed = true; }), focus: () => {}, addEventListener: () => {} };
}

let abrirRef;
function Prueba() {
  const { abrir } = usePopupWindow({ nombreVentana: "lista-invitados" });
  useEffect(() => {
    abrirRef = abrir;
  });
  return null;
}

afterEach(() => vi.restoreAllMocks());

it("si con ese nombre ya había una ventana con la lista vieja, se vacía antes de pintar", () => {
  const vieja = ventanaFalsa();
  vieja.document.body.innerHTML = '<div class="raiz-ventana-emergente">lista muerta</div>';
  vi.spyOn(window, "open").mockReturnValue(vieja);
  const vista = montar(<Prueba />);
  act(() => abrirRef());
  expect(vieja.document.body.textContent).not.toContain("lista muerta");
  expect(vieja.document.querySelectorAll(".raiz-ventana-emergente")).toHaveLength(1);
  vista.desmontar();
});

// Como en VistaAnfitrion: un efecto sin dependencias repinta la ventana en
// cada cambio de datos, y un mismo clic cambia datos y la cierra (v83.7:
// «Algo ha fallado» al cerrar la acreditación con el marcador abierto).
class Barrera extends Component {
  state = { fallo: null };
  static getDerivedStateFromError(fallo) {
    return { fallo };
  }
  render() {
    return this.state.fallo ? <p>Algo ha fallado</p> : this.props.children;
  }
}

function ConDatos() {
  const { abrir, cerrar, actualizar, abierta } = usePopupWindow({ nombreVentana: "marcador-llegadas" });
  const [datos, setDatos] = useState("abierta");
  useEffect(() => {
    if (abierta) actualizar(<p>{datos}</p>);
  });
  return (
    <>
      <button onClick={abrir}>abrir</button>
      <button
        onClick={() => {
          setDatos("cerrada");
          cerrar();
        }}
      >
        cerrar
      </button>
    </>
  );
}

it("un mismo clic que cambia datos y cierra la ventana no rompe la pantalla", async () => {
  const ventana = ventanaFalsa();
  vi.spyOn(window, "open").mockReturnValue(ventana);
  vi.spyOn(console, "error").mockImplementation(() => {});
  const vista = montar(
    <Barrera>
      <ConDatos />
    </Barrera>
  );
  const pulsar = (texto) =>
    act(async () =>
      [...document.body.querySelectorAll("button")].find((b) => b.textContent === texto).dispatchEvent(new MouseEvent("click", { bubbles: true }))
    );
  await pulsar("abrir");
  expect(ventana.document.body.textContent).toContain("abierta");
  await pulsar("cerrar");
  expect(document.body.textContent).not.toContain("Algo ha fallado");
  expect(ventana.close).toHaveBeenCalled();
  vista.desmontar();
});

it("al irse la pestaña (recarga por versión nueva), cierra su ventana", () => {
  const nueva = ventanaFalsa();
  vi.spyOn(window, "open").mockReturnValue(nueva);
  const vista = montar(<Prueba />);
  act(() => abrirRef());
  window.dispatchEvent(new Event("pagehide"));
  expect(nueva.close).toHaveBeenCalled();
  vista.desmontar();
});

// v93.8 (él: «la lista se ve como rota unos segundos y luego abre»): la
// ventana copia los estilos YA LEÍDOS, no un <link> que tiene que volver a
// pedir el CSS por internet y, mientras llega, deja la Lista sin formato.
it("los estilos pasan ya leídos, en un <style>, sin volver a pedir el CSS", () => {
  const destino = document.implementation.createHTMLDocument("");
  const enlace = { sheet: { cssRules: [{ cssText: ".fila { display: flex; }" }], media: { mediaText: "" } }, cloneNode: vi.fn() };
  copiarEstilos({ querySelectorAll: () => [enlace] }, destino);
  expect(enlace.cloneNode).not.toHaveBeenCalled();
  expect(destino.head.querySelector("link")).toBeNull();
  expect(destino.head.querySelector("style").textContent).toBe(".fila { display: flex; }");
});

it("una hoja que no deja leer sus reglas (de otra web) se clona como antes", () => {
  const destino = document.implementation.createHTMLDocument("");
  const ajena = document.createElement("link");
  ajena.rel = "stylesheet";
  ajena.href = "https://otra.web/estilo.css";
  Object.defineProperty(ajena, "sheet", { get: () => ({ get cssRules() { throw new Error("SecurityError"); } }) });
  copiarEstilos({ querySelectorAll: () => [ajena] }, destino);
  expect(destino.head.querySelector('link[rel="stylesheet"]').href).toBe("https://otra.web/estilo.css");
});
