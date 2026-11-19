// La tarjeta de un colaborador, DIBUJADA (v91.2): si su cuenta no tiene
// email y su ficha sí, se ofrece el de la ficha con un toque.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { ColaboradorCard } from "./ColaboradorCard";

function dibujar({ c, invitados }) {
  const cambios = [];
  const vista = montar(
    <ColaboradorCard
      c={c}
      pendientes={0}
      invitados={invitados}
      colaboradores={[c]}
      onEliminar={() => {}}
      onRelevar={() => {}}
      onAsignarColaborador={() => {}}
      onCambiarEmail={(id, email) => cambios.push([id, email])}
      onProbarEmail={async () => true}
      onEnviarInvitacionLogin={async () => true}
      onConfirmarEmailActualizado={() => {}}
      onAvisar={() => {}}
    />
  );
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.textContent.includes(t));
  vista.pulsar(boton("Brown, Julien"));
  return { vista, cambios, boton };
}

it("cuenta sin email y ficha con email: «Usar el de su ficha» lo pone en su cuenta", () => {
  const { vista, cambios, boton } = dibujar({
    c: { id: "c9", nombre: "Brown, Julien", invitadoId: "g9", email: "" },
    invitados: [{ id: "g9", apellido: "Brown", nombre: "Julien", email: "dj@ejemplo.com" }],
  });
  vista.pulsar(boton("Usar el de su ficha"));
  expect(cambios).toEqual([["c9", "dj@ejemplo.com"]]);
  vista.desmontar();
});

it("sin email en ningún sitio, lo dice como siempre", () => {
  const { vista, boton } = dibujar({
    c: { id: "c9", nombre: "Brown, Julien", invitadoId: "g9", email: "" },
    invitados: [{ id: "g9", apellido: "Brown", nombre: "Julien", email: "" }],
  });
  expect(boton("Usar el de su ficha")).toBeUndefined();
  expect(vista.contenedor.textContent).toContain("sin email (no recibirá avisos)");
  vista.desmontar();
});
