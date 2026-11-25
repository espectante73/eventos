// Tarjetas QR (v99.3, él: «primero ver, después descargar»): la vista previa
// y la descarga desde ella. Sin lienzo: el dibujo y la descarga, de pega.
import { it, expect, beforeEach } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaTarjetasQr } from "./VentanaTarjetasQr";

const tarjetas = [1, 2, 3].map((numero) => ({ numero, enlace: `https://nexuspoint.rsvp?mesa=${numero}` }));
const esperar = async () => {
  await act(() => new Promise((r) => setTimeout(r, 30)));
  await act(() => new Promise((r) => setTimeout(r, 30)));
};
// El adorno y las letras de la invitación (v99.4): aquí no hay red.
const ADORNOS = { de: "pega" };
const cargarAdornos = () => Promise.resolve(ADORNOS);

beforeEach(() => window.localStorage.clear());

it("enseña un folio por cada dos mesas y, al descargar, dice dónde está", async () => {
  const dibujadas = [];
  const bajadas = [];
  const vista = montar(
    <VentanaTarjetasQr
      nombreEvento="Las Bodas de todos."
      tarjetas={tarjetas}
      onCerrar={() => {}}
      vistaPrevia={async (o, a, x) => (dibujadas.push([o, a, x]), ["data:image/jpeg;base64,A", "data:image/jpeg;base64,B"])}
      descargar={async (o, a, { hoja, salida }) => (bajadas.push([o, a, hoja, salida]), { nombre: "tarjetas-qr.pdf", archivos: 1 })}
      cargarAdornos={cargarAdornos}
    />,
  );
  await esperar();
  expect(dibujadas).toEqual([[{ nombreEvento: "Las Bodas de todos.", tarjetas }, ADORNOS, { hoja: "a4" }]]);
  expect(document.body.querySelectorAll("[data-vista-previa] img")).toHaveLength(2);
  expect(document.body.querySelector("[data-resumen-qr]").textContent).toBe("3 tarjetas, una por mesa, en 2 folios A4: 2 por folio.");
  vista.pulsar(document.body.querySelector('[data-botones-qr] [data-descargar="pdf"]'));
  await esperar();
  expect(bajadas).toEqual([[{ nombreEvento: "Las Bodas de todos.", tarjetas }, ADORNOS, "a4", "pdf"]]);
  expect(document.body.querySelector("[data-descargado]").textContent).toBe("Descargado: tarjetas-qr.pdf. Lo tienes en tu carpeta de Descargas.");
  vista.desmontar();
});

// v101.7 (él): «cada una de las 14 tarjetas QR es un archivo independiente»,
// sin cambiar las medidas; y en PDF o PNG.
it("hoja «Suelta»: cada tarjeta en su archivo, vista previa en rejilla, se recuerda; «PNG» baja el .zip y lo dice", async () => {
  const dibujadas = [];
  const bajadas = [];
  const vista = montar(
    <VentanaTarjetasQr
      nombreEvento=""
      tarjetas={tarjetas}
      onCerrar={() => {}}
      vistaPrevia={async (o, a, x) => (dibujadas.push(x.hoja), ["data:image/jpeg;base64,A"])}
      descargar={async (o, a, { hoja, salida, alAvanzar }) => (bajadas.push([hoja, salida]), alAvanzar(3, 3), { nombre: `tarjetas-qr-sueltas-${salida}.zip`, archivos: 3 })}
      cargarAdornos={cargarAdornos}
    />,
  );
  const hoja = document.body.querySelector('[data-botones-qr] select[aria-label="Hoja"]');
  expect([...hoja.options].map((o) => o.textContent)).toEqual(["A4", "Suelta"]);
  act(() => {
    hoja.value = "suelta";
    hoja.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await esperar();
  expect(dibujadas.at(-1)).toBe("suelta");
  expect(window.localStorage.getItem("tarjetas-qr-hoja")).toBe("suelta");
  expect(document.body.querySelector("[data-resumen-qr]").textContent).toBe("3 tarjetas, una por mesa, cada una en su archivo, de 10,5 × 29,7 cm.");
  expect(document.body.querySelector("[data-vista-previa]").className).toContain("grid");
  vista.pulsar(document.body.querySelector('[data-descargar="png"]'));
  await esperar();
  expect(bajadas).toEqual([["suelta", "png"]]);
  expect(document.body.querySelector("[data-descargado]").textContent).toBe(
    "Descargado: tarjetas-qr-sueltas-png.zip, con 3 archivos. Lo tienes en tu carpeta de Descargas: ábrelo con doble clic.",
  );
  vista.desmontar();
});

it("los botones van ARRIBA, antes del resumen y de la vista previa; «Cancelar» cierra", () => {
  let cerrada = 0;
  const vista = montar(<VentanaTarjetasQr nombreEvento="" tarjetas={tarjetas.slice(0, 1)} onCerrar={() => (cerrada += 1)} vistaPrevia={async () => []} descargar={async () => {}} cargarAdornos={cargarAdornos} />);
  const botones = document.body.querySelector("[data-botones-qr]");
  expect(botones.compareDocumentPosition(document.body.querySelector("[data-resumen-qr]")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.body.querySelector("[data-resumen-qr]").textContent).toBe("1 tarjeta, una por mesa, en 1 folio A4: 2 por folio.");
  // La hoja, pegada a los botones, en la misma línea; los tres, iguales.
  expect([...botones.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Cancelar", "PDF", "PNG"]);
  vista.pulsar([...botones.querySelectorAll("button")].find((b) => b.textContent === "Cancelar"));
  expect(cerrada).toBe(1);
  vista.desmontar();
});

it("si el adorno y las letras no llegan, la vista previa sale igual (sin ellos) y se dice", async () => {
  const dibujadas = [];
  const vista = montar(
    <VentanaTarjetasQr
      nombreEvento=""
      tarjetas={tarjetas}
      onCerrar={() => {}}
      vistaPrevia={async (o, a) => (dibujadas.push(a), [])}
      descargar={async () => {}}
      cargarAdornos={() => Promise.reject(new Error("red"))}
    />,
  );
  await esperar();
  expect(dibujadas).toEqual([null]);
  expect(document.body.querySelector("[data-sin-adornos]").textContent).toContain("las tarjetas salen sin ellos");
  vista.desmontar();
});
