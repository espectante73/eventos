// La Revisión (v99.5): lo que trae `borrar` lleva su papelera, que pregunta
// antes y dice qué borra (norma 9).
import { it, expect } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { InformeInvitados } from "./InformeInvitados";

const borrar = { titulo: "¿Borrar estas fotos?", texto: "Se borran para siempre la foto de boda de «Luis05».", rotulo: "Sí, eliminar" };
const hallazgos = [
  {
    clave: "fotosSinFamilia",
    titulo: "Fotos sin familia",
    ayuda: "",
    tipo: "error",
    personas: [{ id: "fotos-Luis05", etiqueta: "«Luis05»", detalle: "foto de boda", familia: "Luis05", borrar }],
  },
  { clave: "otro", titulo: "Otro aviso", ayuda: "", tipo: "error", personas: [{ id: "1", nombre: "Ana", apellido: "Gil" }] },
];

it("la papelera de «Fotos sin familia» pregunta y, con «Sí, eliminar», la borra; los demás avisos no la llevan", async () => {
  const borradas = [];
  const vista = montar(<InformeInvitados hallazgos={hallazgos} onBuscar={() => {}} onCerrar={() => {}} onExcepcion={() => {}} onBorrar={(g, h) => borradas.push([g.familia, h.clave])} />);
  const papeleras = [...document.body.querySelectorAll("button")].filter((b) => (b.getAttribute("aria-label") || "").startsWith("Borrar"));
  expect(papeleras.map((b) => b.getAttribute("aria-label"))).toEqual(["Borrar «Luis05»"]);
  vista.pulsar(papeleras[0]);
  expect(document.body.textContent).toContain("Se borran para siempre la foto de boda de «Luis05».");
  expect(borradas).toEqual([]);
  const si = [...document.body.querySelectorAll("button")].find((b) => b.textContent === "Sí, eliminar");
  await act(async () => si.click());
  expect(borradas).toEqual([["Luis05", "fotosSinFamilia"]]);
  vista.desmontar();
});
