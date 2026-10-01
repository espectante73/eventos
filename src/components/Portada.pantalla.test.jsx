// @vitest-environment jsdom
// "Mi cuenta" (v50.6): el anfitrión lo tiene dentro de "Abrir sección…",
// en su orden alfabético; el colaborador, que no tiene ese menú, sigue
// con su botón en la portada.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { Portada } from "./Portada";

const evento = { nombre: "La boda", fecha: "2026-11-13", hora: "18:00", lugar: "El sitio" };
const botones = () => [...document.body.querySelectorAll("button")];
const boton = (t) => botones().find((b) => b.textContent.trim().endsWith(t));

it("anfitrión: «Mi cuenta» está en «Abrir sección…», entre Mesas y Multimedia, y abre su ventana", () => {
  const vista = montar(
    <Portada evento={evento} editable abierto={{}} toggle={() => {}} colaboradores={[]} onCerrarSesion={() => {}} />
  );
  expect(boton("Mi cuenta")).toBeFalsy(); // ya no está suelto en la portada
  vista.pulsar(botones().find((b) => b.textContent.includes("Abrir sección")));
  const nombres = botones().map((b) => b.textContent.trim());
  const i = nombres.findIndex((n) => n.endsWith("Mi cuenta"));
  expect(i).toBeGreaterThan(-1);
  expect(nombres[i - 1]).toMatch(/Mesas$/);
  expect(nombres[i + 1]).toMatch(/Multimedia$/);
  vista.pulsar(botones()[i]);
  expect(document.body.textContent).toContain("Cerrar sesión");
  vista.desmontar();
});

it("colaborador: sigue con su botón «Mi cuenta» en la portada", () => {
  const vista = montar(<Portada evento={evento} editable={false} onCerrarSesion={() => {}} />);
  expect(boton("Mi cuenta")).toBeTruthy();
  vista.desmontar();
});

it("anfitrión que también es colaborador: su sello en «Abrir sección…»", () => {
  const vista = montar(
    <Portada evento={evento} editable abierto={{}} toggle={() => {}} colaboradores={[]} onCerrarSesion={() => {}} sello={3} />
  );
  expect(botones().find((b) => b.textContent.includes("Abrir sección")).textContent).toContain("3");
  vista.desmontar();
});
