// «Te falta» en el tablón (v87.2-87.3), DIBUJADO de verdad.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { TeFaltaTablon } from "./TeFaltaTablon";
import { euros } from "../lib/formato";

const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.title === t);

// v87.3 (él): «el tablón queda ensombrecido hasta que su colaborador marque
// como pagado».
it("sin pagar: el importe, lo primero y resaltado; lo demás apagado; y no se puede cerrar", () => {
  let cerrada = false;
  let cambiado = false;
  const vista = montar(
    <TeFaltaTablon
      pendientes={{ importe: 47, fotoBoda: true, alergias: true }}
      nombre="Pacheco, Ana"
      colaborador="Bravo, Yeray"
      onCerrar={() => (cerrada = true)}
      onCambiar={() => (cambiado = true)}
    />
  );
  const texto = document.body.textContent;
  expect(texto).toContain(`El importe del evento: ${euros(47)}`);
  expect(texto).toContain("Es muy importante poder recoger el dinero de tu entrada.");
  expect(texto).toContain("Habla con tu colaborador: Bravo, Yeray.");
  expect(texto).toContain("Si ya has pagado, dile a tu colaborador que te marque como pagado en la aplicación. Así podrás ver el tablón.");
  const importe = document.body.querySelector("[data-importe]");
  const resto = document.body.querySelector("[data-resto]");
  expect(importe.compareDocumentPosition(resto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(Number(resto.style.opacity)).toBeLessThan(1);
  // Ni «Entendido», ni la X, ni Escape, ni tocar fuera.
  expect(boton("Entendido")).toBeUndefined();
  expect(boton("Cerrar")).toBeUndefined();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  vista.pulsar(document.body.querySelector(".modal-flotante-fondo"));
  expect(cerrada).toBe(false);
  // En un móvil de la familia, que pueda entrar otro.
  expect(texto).toContain("Has entrado como Pacheco, Ana.");
  vista.pulsar(boton("Cambiar"));
  expect(cambiado).toBe(true);
  vista.desmontar();
});

it("siendo su propio colaborador, se marca él", () => {
  const vista = montar(<TeFaltaTablon pendientes={{ importe: 47, fotoBoda: false, alergias: false }} colaborador="Bravo, Yeray" colaboradorEsYo onCerrar={() => {}} />);
  expect(document.body.textContent).toContain("Si ya has pagado, márcate como pagado en la aplicación.");
  expect(document.body.textContent).not.toContain("Habla con tu colaborador");
  vista.desmontar();
});

it("ya pagado: sin importe, lo que falta se lee normal y «Entendido» la cierra", () => {
  let cerrada = false;
  const vista = montar(<TeFaltaTablon pendientes={{ importe: 0, fotoBoda: true, alergias: false }} colaborador="Bravo, Yeray" onCerrar={() => (cerrada = true)} />);
  const texto = document.body.textContent;
  expect(texto).not.toContain("El importe del evento");
  expect(texto).not.toContain("Si ya has pagado");
  expect(document.body.querySelector("[data-resto]").style.opacity).toBe("");
  vista.pulsar(boton("Entendido"));
  expect(cerrada).toBe(true);
  vista.desmontar();
});
