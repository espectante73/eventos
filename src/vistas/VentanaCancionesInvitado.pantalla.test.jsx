// Las canciones de quien ya ha pagado (él, v82.8), DIBUJADA de verdad. El
// recorrido entero (tocar el nombre, guardar, descartar), en
// VistaColaborador.pantalla.test.jsx.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { VentanaCancionesInvitado } from "./VentanaCancionesInvitado";

const invitado = { id: "a", nombre: "Omar", apellido: "Pacheco", pagado: true, cancion: "Bailando — Enrique Iglesias" };
const data = { invitados: [invitado], persistInvitados: () => {}, buscarParaEscuchar: async () => ({ candidatos: [] }) };

it("con su nombre, sus 3 huecos y lo que ya tenía escrito", () => {
  const vista = montar(<VentanaCancionesInvitado data={data} invitado={invitado} onCerrar={() => {}} />);
  expect(document.body.textContent).toContain("Canciones · Pacheco, Omar");
  const canciones = document.body.querySelectorAll('input[placeholder="Canción"]');
  expect(canciones).toHaveLength(3);
  expect(canciones[0].value).toBe("Bailando");
  expect(document.body.querySelector('input[aria-label="Artista 1"]').value).toBe("Enrique Iglesias");
  vista.desmontar();
});

it("sin canciones todavía, los 3 huecos vacíos", () => {
  const sinNada = { ...invitado, cancion: "" };
  const vista = montar(<VentanaCancionesInvitado data={{ ...data, invitados: [sinNada] }} invitado={sinNada} onCerrar={() => {}} />);
  expect([...document.body.querySelectorAll('input[placeholder="Canción"]')].map((i) => i.value)).toEqual(["", "", ""]);
  vista.desmontar();
});
