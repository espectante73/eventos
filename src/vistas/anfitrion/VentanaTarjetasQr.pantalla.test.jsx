// Tarjetas QR (v99.3, él: «primero ver, después descargar»): la vista previa
// y la descarga desde ella. Sin lienzo: el dibujo y la descarga, de pega.
import { it, expect } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaTarjetasQr } from "./VentanaTarjetasQr";

const tarjetas = [1, 2, 3].map((numero) => ({ numero, enlace: `https://nexuspoint.rsvp?mesa=${numero}` }));
const esperar = () => act(() => new Promise((r) => setTimeout(r, 30)));

it("enseña un folio por cada dos mesas y, al descargar, dice dónde está", async () => {
  const dibujadas = [];
  const bajadas = [];
  const vista = montar(
    <VentanaTarjetasQr
      nombreEvento="Las Bodas de todos."
      tarjetas={tarjetas}
      onCerrar={() => {}}
      vistaPrevia={async (o) => (dibujadas.push(o), ["data:image/jpeg;base64,A", "data:image/jpeg;base64,B"])}
      descargar={async (o) => bajadas.push(o)}
    />,
  );
  await esperar();
  expect(dibujadas).toEqual([{ nombreEvento: "Las Bodas de todos.", tarjetas }]);
  expect(document.body.querySelectorAll("[data-vista-previa] img")).toHaveLength(2);
  expect(document.body.querySelector("[data-resumen-qr]").textContent).toBe("3 tarjetas, una por mesa, en 2 folios A4: 2 por folio.");
  vista.pulsar([...document.body.querySelectorAll("[data-botones-qr] button")].find((b) => b.textContent === "Descargar"));
  await esperar();
  expect(bajadas).toEqual([{ nombreEvento: "Las Bodas de todos.", tarjetas }]);
  expect(document.body.querySelector("[data-descargado]").textContent).toContain("tarjetas-qr.pdf");
  vista.desmontar();
});

it("los botones van ARRIBA, antes del resumen y de la vista previa; «Cancelar» cierra", () => {
  let cerrada = 0;
  const vista = montar(<VentanaTarjetasQr nombreEvento="" tarjetas={tarjetas.slice(0, 1)} onCerrar={() => (cerrada += 1)} vistaPrevia={async () => []} descargar={async () => {}} />);
  const botones = document.body.querySelector("[data-botones-qr]");
  expect(botones.compareDocumentPosition(document.body.querySelector("[data-resumen-qr]")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.body.querySelector("[data-resumen-qr]").textContent).toBe("1 tarjeta, una por mesa, en 1 folio A4: 2 por folio.");
  vista.pulsar([...botones.querySelectorAll("button")].find((b) => b.textContent === "Cancelar"));
  expect(cerrada).toBe(1);
  vista.desmontar();
});
