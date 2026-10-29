// «Nuevo invitado» (v77), DIBUJADO de verdad: lo de siempre se elige; lo
// nuevo, con su «＋»; y al guardar sigue abierto para el siguiente.
import { it, expect } from "vitest";
import { useState } from "react";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaNuevoInvitado } from "./VentanaNuevoInvitado";

const escribir = (input, valor) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

const INVITADOS = [
  { id: "1", nombre: "Ana", apellido: "Pacheco", grupoFamiliar: "Pacheco01", zona: "Icod", rolFamiliar: "esposa" },
  { id: "2", nombre: "Luis", apellido: "Sierra", grupoFamiliar: "Sierra01", zona: "Puerto", rolFamiliar: "suelto" },
];

function dibujar() {
  const guardados = [];
  function Prueba() {
    const [invitados, setInvitados] = useState(INVITADOS);
    const data = {
      invitados,
      colaboradores: [{ id: "c1", nombre: "Colaborador Uno" }],
      evento: { fecha: "2026-12-11" },
      persistInvitados: (l) => {
        guardados.push(l);
        setInvitados(l);
      },
    };
    return <VentanaNuevoInvitado data={data} onCerrar={() => {}} />;
  }
  const vista = montar(<Prueba />);
  const q = (sel) => document.body.querySelector(sel);
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.title === t);
  return { vista, guardados, q, boton };
}

it("con familia y zona de la lista, rol y colaborador: se guarda y sigue abierto para el siguiente", () => {
  const { vista, guardados, q, boton } = dibujar();
  escribir(q('input[aria-label="Apellido"]'), "Pacheco");
  escribir(q('input[aria-label="Nombre"]'), "Rubén");
  vista.elegir(q('select[aria-label="Familia"]'), "Pacheco01");
  vista.elegir(q('select[aria-label="Rol"]'), "esposo");
  vista.elegir(q('select[aria-label="Zona"]'), "Icod");
  vista.elegir(q('select[aria-label="Colaborador"]'), "c1");
  vista.pulsar(boton("Guardar"));
  expect(guardados.at(-1).at(-1)).toMatchObject({ apellido: "Pacheco", nombre: "Rubén", grupoFamiliar: "Pacheco01", rolFamiliar: "esposo", zona: "Icod", colaboradorId: "c1" });
  expect(document.body.textContent).toContain("Guardado: Pacheco, Rubén.");
  // Para el siguiente de la familia: lo de la familia, puesto; el nombre, vacío.
  expect(q('input[aria-label="Nombre"]').value).toBe("");
  expect(q('select[aria-label="Familia"]').value).toBe("Pacheco01");
  expect(q('select[aria-label="Colaborador"]').value).toBe("c1");
  vista.desmontar();
});

it("una zona nueva, fuera de la lista: ＋ para escribirla, y la próxima vez ya sale en el desplegable", () => {
  const { vista, guardados, q, boton } = dibujar();
  escribir(q('input[aria-label="Apellido"]'), "Abrante");
  escribir(q('input[aria-label="Nombre"]'), "Loly");
  vista.pulsar(boton("Familia nueva"));
  expect(q('input[aria-label="Familia nueva"]').value).toBe("Abrante01");
  vista.pulsar(boton("Zona nueva"));
  escribir(q('input[aria-label="Zona nueva"]'), "Garachico");
  vista.pulsar(boton("Guardar"));
  expect(guardados.at(-1).at(-1)).toMatchObject({ grupoFamiliar: "Abrante01", zona: "Garachico" });
  expect([...q('select[aria-label="Zona"]').options].map((o) => o.value)).toContain("Garachico");
  vista.desmontar();
});

it("sin lo obligatorio no se guarda, y se dice qué falta", () => {
  const { vista, guardados, q, boton } = dibujar();
  escribir(q('input[aria-label="Nombre"]'), "Sin apellido");
  vista.pulsar(boton("Guardar"));
  expect(guardados).toEqual([]);
  expect(document.body.textContent).toContain("Faltan el nombre, el apellido o el grupo familiar.");
  vista.desmontar();
});

it("el email solo aparece si tiene 16 años cumplidos, como en el formulario del colaborador", () => {
  const { vista, q } = dibujar();
  vista.pulsar([...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Año nac.")));
  escribir(q('input[aria-label="Año de nacimiento"]'), "2015");
  expect(q('input[aria-label="Email"]')).toBeNull();
  escribir(q('input[aria-label="Año de nacimiento"]'), "1990");
  expect(q('input[aria-label="Email"]')).toBeTruthy();
  vista.desmontar();
});
