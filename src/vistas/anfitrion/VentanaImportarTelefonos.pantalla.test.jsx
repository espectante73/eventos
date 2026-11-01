// «Importar teléfonos» (v78.2), DIBUJADA de verdad: se elige el archivo, se
// repasa y se guardan solo los marcados. Contactos de mentira.
import { it, expect } from "vitest";
import { useState } from "react";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaImportarTelefonos } from "./VentanaImportarTelefonos";

const VCF = [
  "BEGIN:VCARD", "N:Pacheco García;Rubén;;;", "TEL;type=CELL:612 34 56 78", "NOTE:no se lee", "END:VCARD",
  "BEGIN:VCARD", "N:Sierra;Ana;;;", "TEL;type=CELL:699 11 22 33", "END:VCARD",
].join("\n");

const INVITADOS = [
  { id: "1", apellido: "Pacheco", nombre: "Rubén", anioNacimiento: "1980", telefono: "" },
  { id: "2", apellido: "Sierra", nombre: "Ana", anioNacimiento: "1980", telefono: "+34611111111" },
  { id: "3", apellido: "Nadie", nombre: "Pepe", anioNacimiento: "1980", telefono: "" },
];

function dibujar() {
  const guardados = [];
  function Prueba() {
    const [invitados, setInvitados] = useState(INVITADOS);
    const data = {
      invitados,
      evento: { fecha: "2026-12-11" },
      persistInvitados: (l) => {
        guardados.push(l);
        setInvitados(l);
      },
    };
    return <VentanaImportarTelefonos data={data} onCerrar={() => {}} />;
  }
  const vista = montar(<Prueba />);
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(t));
  return { vista, guardados, boton };
}

async function elegirArchivo(texto) {
  const input = document.body.querySelector('input[aria-label="Archivo de contactos"]');
  const archivo = { text: async () => texto };
  Object.defineProperty(input, "files", { value: [archivo], configurable: true });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

it("lee el archivo, repasa y guarda solo los marcados: el nuevo sí, el distinto no", async () => {
  const { vista, guardados, boton } = dibujar();
  await elegirArchivo(VCF);
  expect(document.body.textContent).toContain("2 contactos leídos.");
  vista.pulsar(boton("Guardar 1"));
  const final = guardados.at(-1);
  expect(final.find((g) => g.id === "1").telefono).toBe("+34612345678");
  // El distinto se queda como estaba si no se marca.
  expect(final.find((g) => g.id === "2").telefono).toBe("+34611111111");
  expect(document.body.textContent).toContain("Guardado 1 teléfono.");
  vista.desmontar();
});

it("un archivo sin contactos con teléfono: lo dice y no sigue", async () => {
  const { vista, guardados } = dibujar();
  await elegirArchivo("hola");
  expect(document.body.textContent).toContain("no hay contactos con teléfono");
  expect(guardados).toEqual([]);
  vista.desmontar();
});
