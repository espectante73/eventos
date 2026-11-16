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

it("anfitrión: «Mi cuenta» está en «Abrir sección…», entre Invitados y Multimedia, y abre su ventana", () => {
  const vista = montar(
    <Portada evento={evento} editable abierto={{}} toggle={() => {}} colaboradores={[]} onCerrarSesion={() => {}} />
  );
  expect(boton("Mi cuenta")).toBeFalsy(); // ya no está suelto en la portada
  vista.pulsar(botones().find((b) => b.textContent.includes("Abrir sección")));
  const nombres = botones().map((b) => b.textContent.trim());
  const i = nombres.findIndex((n) => n.endsWith("Mi cuenta"));
  expect(i).toBeGreaterThan(-1);
  expect(nombres[i - 1]).toMatch(/Invitados$/);
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

// v74.7 (él): «los nombres no se deben salir de los botones» («Mesas y
// acomodación» se cortaba). El más largo que cabe, «Día del evento»: 14.
it("«Abrir sección…»: en orden alfabético, y ningún nombre más largo de lo que cabe en su botón", () => {
  const vista = montar(
    <Portada evento={evento} editable abierto={{}} toggle={() => {}} colaboradores={[]} onCerrarSesion={() => {}} />
  );
  vista.pulsar(botones().find((b) => b.textContent.includes("Abrir sección")));
  const abrir = botones().findIndex((b) => b.textContent.includes("Abrir sección"));
  const nombres = botones().slice(abrir + 1).map((b) => b.textContent.trim()).filter(Boolean);
  expect(nombres[0]).toBe("Acomodación");
  expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b, "es")));
  expect(nombres.filter((n) => n.length > 14)).toEqual([]);
  vista.desmontar();
});

// v81.5 (él): «Invitados» con dos opciones, «Formulario» (antes «Añadir», v87.4) y «Lista».
it("«Invitados»: «Formulario» abre «Nuevo invitado» y «Lista», la Lista", () => {
  const abiertas = [];
  let lista = 0;
  const vista = montar(
    <Portada evento={evento} editable abierto={{}} toggle={(c) => abiertas.push(c)} colaboradores={[]} onCerrarSesion={() => {}} abrirInvitados={() => (lista += 1)} />
  );
  vista.pulsar(botones().find((b) => b.textContent.includes("Abrir sección")));
  vista.pulsar(boton("Invitados"));
  vista.pulsar(boton("Formulario"));
  expect(abiertas).toEqual(["nuevo-invitado"]);
  vista.pulsar(botones().find((b) => b.textContent.includes("Abrir sección")));
  vista.pulsar(boton("Invitados"));
  vista.pulsar(boton("Lista"));
  expect(lista).toBe(1);
  vista.desmontar();
});

// v88.3 (él): con la mano izquierda, «Abrir sección…» cae sobre la parte
// verde de la portada; cerrado lleva detrás el mismo velo claro que el menú
// abierto. Abierto, solo el del menú (dos juntos se verían más blancos).
it("«Abrir sección…» cerrado lleva su velo claro detrás; abierto, solo el del menú", () => {
  const vista = montar(
    <Portada evento={evento} editable abierto={{}} toggle={() => {}} colaboradores={[]} onCerrarSesion={() => {}} />
  );
  const halo = () => document.body.querySelector("[data-halo-boton]");
  expect(halo()).toBeTruthy();
  expect(halo().style.backdropFilter).toContain("blur");
  vista.pulsar(botones().find((b) => b.textContent.includes("Abrir sección")));
  expect(halo()).toBeNull();
  vista.desmontar();
});
