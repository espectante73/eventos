// Tarjetas de acomodación (v97): las opciones, la cuenta y la vista previa. El
// dibujo de verdad necesita un lienzo, que aquí no hay: se pasa uno de pega
// que apunta con qué se le llamó.
import { it, expect, beforeEach } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaTarjetasAcomodacion } from "./VentanaTarjetasAcomodacion";

const g = (id, nombre, apellido, mesa, extra = {}) => ({ id, nombre, apellido, mesa, confirmado: true, ...extra });
const invitados = [...Array.from({ length: 12 }, (_, i) => g(String(i), `N${i}`, "Medina", 1 + (i % 3))), g("x", "Rosa", "Delgado", null)];

beforeEach(() => window.localStorage.clear());

const muestra = (id) => `data:image/png;base64,${id}`;
// Las hojas y las letras de la invitación: aquí no hay red; basta con algo.
const ADORNOS = { de: "pega" };
const cargarAdornos = () => Promise.resolve(ADORNOS);
// Dos vueltas: primero llegan el adorno y las letras de la invitación
// (cargarAdornos) y, con ellas, se dibuja la vista previa.
const esperar = async () => {
  await act(() => new Promise((r) => setTimeout(r, 60)));
  await act(() => new Promise((r) => setTimeout(r, 60)));
};

it("cuenta tarjetas y hojas, avisa de quien no tiene mesa y enseña la vista previa", async () => {
  const llamadas = [];
  const vistaPrevia = (tarjetas, opciones) => (llamadas.push({ n: tarjetas.length, ...opciones }), ["data:image/jpeg;base64,AAA", "data:image/jpeg;base64,BBB"]);
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={vistaPrevia} muestra={muestra} cargarAdornos={cargarAdornos} />);
  expect(document.body.querySelector("[data-resumen-tarjetas]").textContent).toBe("12 tarjetas en 2 hojas A3, 9 por hoja.");
  expect(document.body.querySelector("[data-sin-mesa]").textContent).toBe("1 confirmado sin mesa se queda sin tarjeta.");
  await esperar();
  expect(document.body.querySelectorAll("[data-vista-previa] img")).toHaveLength(2);
  expect(llamadas.at(-1)).toEqual({ n: 12, hoja: "a3", corte: "guillotina", acabado: "blancoHojas" });
  vista.desmontar();
});

// v98.9 (él): solo la tarjeta bancaria; el ancho ya no se elige.
it("cambiar la hoja rehace la vista previa y se recuerda en el aparato; el ancho ya no se elige", async () => {
  const llamadas = [];
  const vistaPrevia = (tarjetas, opciones) => (llamadas.push(opciones), []);
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={vistaPrevia} muestra={muestra} cargarAdornos={cargarAdornos} />);
  const selects = document.body.querySelectorAll("[data-opciones-tarjetas] select");
  expect([...selects].map((s) => s.getAttribute("aria-label"))).toEqual(["Hoja", "Cortar con"]);
  act(() => {
    selects[0].value = "a4";
    selects[0].dispatchEvent(new Event("change", { bubbles: true }));
  });
  await esperar();
  expect(llamadas.at(-1)).toEqual({ hoja: "a4", corte: "guillotina", acabado: "blancoHojas" });
  expect(document.body.querySelector("[data-resumen-tarjetas]").textContent).toBe("12 tarjetas en 3 hojas A4, 4 por hoja.");
  expect(JSON.parse(window.localStorage.getItem("tarjetas-acomodacion-opciones"))).toEqual({ hoja: "a4", corte: "guillotina", acabado: "blancoHojas" });
  vista.desmontar();
});

it("lo guardado de antes con el ancho de 9,5 cm se respeta en hoja y acabado, y el ancho se olvida", async () => {
  window.localStorage.setItem("tarjetas-acomodacion-opciones", JSON.stringify({ hoja: "a4", ancho: 95, acabado: "blancoHojasGruesoDentro" }));
  const llamadas = [];
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={(t, o) => (llamadas.push(o), [])} muestra={muestra} cargarAdornos={cargarAdornos} />);
  await esperar();
  expect(llamadas.at(-1)).toEqual({ hoja: "a4", corte: "guillotina", acabado: "blancoHojasGruesoDentro" });
  vista.desmontar();
});

// v99.2 (él): «los otros 6 los desechamos».
it("un acabado de los de antes, guardado en el aparato, pasa al primero de la línea de la invitación", async () => {
  window.localStorage.setItem("tarjetas-acomodacion-opciones", JSON.stringify({ hoja: "a3", corte: "tijera", acabado: "verde" }));
  const llamadas = [];
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={(t, o) => (llamadas.push(o), [])} muestra={muestra} cargarAdornos={cargarAdornos} />);
  await esperar();
  expect(llamadas.at(-1)).toEqual({ hoja: "a3", corte: "tijera", acabado: "blancoHojas" });
  vista.desmontar();
});

// v99 (él): las marcas, según con qué se corte, en un desplegable.
it("«Cortar con»: guillotina, tijera o cúter y plóter; elegir una rehace la vista previa y se recuerda", async () => {
  const llamadas = [];
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={(t, o) => (llamadas.push(o), [])} muestra={muestra} cargarAdornos={cargarAdornos} />);
  const cortar = document.body.querySelector('[data-opciones-tarjetas] select[aria-label="Cortar con"]');
  expect([...cortar.options].map((o) => o.textContent)).toEqual(["Guillotina", "Tijera o cúter", "Plóter"]);
  act(() => {
    cortar.value = "ploter";
    cortar.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await esperar();
  expect(llamadas.at(-1).corte).toBe("ploter");
  expect(JSON.parse(window.localStorage.getItem("tarjetas-acomodacion-opciones")).corte).toBe("ploter");
  vista.desmontar();
});

// v99.1 (él): la hoja de muestra con los seis acabados.
it("«Muestra» descarga la hoja de muestra con la hoja y las marcas elegidas, y dice dónde está", async () => {
  const pedidas = [];
  const crear = URL.createObjectURL;
  URL.createObjectURL = () => "blob:muestra";
  const vista = montar(
    <VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={() => []} muestra={muestra} cargarAdornos={cargarAdornos} pdfMuestra={async (o) => (pedidas.push(o), new Blob(["%PDF"]))} />,
  );
  const boton = document.body.querySelector("[data-botones-tarjetas] [data-muestra-acabados]");
  expect(boton.textContent).toBe("Muestra");
  // Hasta que llegan el adorno y las letras de la invitación, espera.
  expect(boton.disabled).toBe(true);
  await esperar();
  expect(boton.disabled).toBe(false);
  vista.pulsar(boton);
  await esperar();
  expect(pedidas).toEqual([{ hoja: "a3", corte: "guillotina", acabado: "blancoHojas" }]);
  expect(document.body.querySelector("[data-descargado]").textContent).toContain("muestra-acabados-tarjetas.pdf");
  URL.createObjectURL = crear;
  vista.desmontar();
});

it("los botones van ARRIBA, antes de las opciones y de la vista previa", () => {
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={() => []} muestra={muestra} cargarAdornos={cargarAdornos} />);
  const botones = document.body.querySelector("[data-botones-tarjetas]");
  const opciones = document.body.querySelector("[data-opciones-tarjetas]");
  expect(botones.compareDocumentPosition(opciones) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(botones.textContent).toContain("Cancelar");
  expect(botones.textContent).toContain("Descargar");
  vista.desmontar();
});

it("la paleta: los cuatro (los tres de la invitación y el número grande), cada uno con su muestra; elegir uno rehace la vista previa y se recuerda", async () => {
  const llamadas = [];
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={(t, o) => (llamadas.push(o), [])} muestra={muestra} cargarAdornos={cargarAdornos} />);
  // Las muestras, en cuanto llegan el adorno y las letras de la invitación.
  await esperar();
  const radios = [...document.body.querySelectorAll('[role="radiogroup"][aria-label="Acabado"] [role="radio"]')];
  expect(radios.map((r) => r.querySelector("img").getAttribute("src"))).toEqual(["blancoHojas", "blancoHojasGruesoFuera", "blancoHojasGruesoDentro", "blancoHojasNumeroGrande"].map(muestra));
  expect(radios[0].getAttribute("aria-checked")).toBe("true");
  vista.pulsar(radios[2]);
  await esperar();
  expect(radios[2].getAttribute("aria-checked")).toBe("true");
  expect(document.body.querySelector("[data-acabado]").textContent).toContain("Doble marco, grueso dentro");
  expect(llamadas.at(-1).acabado).toBe("blancoHojasGruesoDentro");
  expect(JSON.parse(window.localStorage.getItem("tarjetas-acomodacion-opciones")).acabado).toBe("blancoHojasGruesoDentro");
  vista.desmontar();
});


// v99.2: los acabados de la invitación necesitan sus hojas y sus letras.
it("el adorno y las letras de la invitación llegan a la vista previa, a las muestras y a la hoja de muestra", async () => {
  const previa = [];
  const muestras = [];
  const pedidas = [];
  const crear = URL.createObjectURL;
  URL.createObjectURL = () => "blob:muestra";
  const vista = montar(
    <VentanaTarjetasAcomodacion
      invitados={invitados}
      onCerrar={() => {}}
      vistaPrevia={(t, o, a) => (previa.push(a), [])}
      muestra={(id, a) => (muestras.push(a), muestra(id))}
      pdfMuestra={async (o, a) => (pedidas.push(a), new Blob(["%PDF"]))}
      cargarAdornos={cargarAdornos}
    />,
  );
  await esperar();
  expect(previa.at(-1)).toBe(ADORNOS);
  expect(muestras.at(-1)).toBe(ADORNOS);
  vista.pulsar(document.body.querySelector("[data-muestra-acabados]"));
  await esperar();
  expect(pedidas).toEqual([ADORNOS]);
  expect(document.body.querySelector("[data-sin-adornos]")).toBeNull();
  URL.createObjectURL = crear;
  vista.desmontar();
});

it("si no llegan, la vista previa sale igual (sin ellas) y se dice", async () => {
  const previa = [];
  const vista = montar(
    <VentanaTarjetasAcomodacion
      invitados={invitados}
      onCerrar={() => {}}
      vistaPrevia={(t, o, a) => (previa.push(a), [])}
      muestra={muestra}
      cargarAdornos={() => Promise.reject(new Error("red"))}
    />,
  );
  await esperar();
  expect(previa.at(-1)).toBeNull();
  expect(document.body.querySelector("[data-sin-adornos]").textContent).toContain("No se pudieron cargar el adorno y las letras");
  vista.desmontar();
});
