// La salvaguarda de una mesa ya enviada (él, v83.1), DIBUJADA de verdad:
// cambia la mesa y manda la invitación nueva, y si algo falla antes de tocar
// nada, no toca nada.
import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { ROL_FAMILIAR } from "../../lib/rolFamiliar";

let imagen = "data:image/png;base64,QUJD";
vi.mock("../../lib/imagenInvitacion", () => ({ generarInvitacionImagen: async () => imagen }));
const { VentanaCambiarMesa } = await import("./VentanaCambiarMesa");

const g = (id, nombre, rol, extra = {}) => ({ id, nombre, apellido: "García", grupoFamiliar: "García01", rolFamiliar: rol, confirmado: true, pagado: true, mesa: 1, email: "", ...extra });
const invitados = [g("1", "Isaias", ROL_FAMILIAR.ESPOSO, { email: "i@i.com" }), g("2", "Ana", ROL_FAMILIAR.ESPOSA)];
const lleno = Array.from({ length: 3 }, (_, i) => ({ id: `x${i}`, nombre: "Otro", apellido: `Otro${i}`, grupoFamiliar: `Otro${i}`, rolFamiliar: ROL_FAMILIAR.SUELTO, confirmado: true, mesa: 3 }));
const familia = { clave: "garcía01", representante: invitados[0], nombre: "García, Isaias", cuantos: 2, mesa: 1 };

function abrir(extra = {}) {
  const llamadas = [];
  const data = {
    invitados: [...invitados, ...lleno],
    mesas: [{ numero: 1, capacidad: 10 }, { numero: 2, capacidad: 8 }, { numero: 3, capacidad: 3 }],
    evento: { nombre: "La boda", plantillaInvitacionFamilia: "Aquí tienes tu invitación." },
    colaboradores: [],
    ordenFamiliares: { García01: { invitacionEnviada: true } },
    persistOrdenFamiliares: (o) => llamadas.push(["orden", o]),
    persistInvitados: async (l) => void llamadas.push(["mesa", l]),
    enviarInvitacionFamilia: async (...a) => (llamadas.push(["correo", ...a]), true),
    ...extra,
  };
  const cerrar = vi.fn();
  const vista = montar(<VentanaCambiarMesa data={data} familia={familia} onCerrar={cerrar} />);
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t);
  const select = () => document.body.querySelector('select[aria-label="Mesa nueva"]');
  const elegir = async (v) => {
    const poner = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    await act(async () => {
      poner.call(select(), v);
      select().dispatchEvent(new Event("change", { bubbles: true }));
    });
  };
  const pulsar = (t) => act(async () => boton(t).dispatchEvent(new MouseEvent("click", { bubbles: true })));
  return { vista, llamadas, elegir, pulsar, select, cerrar, boton };
}

describe("cambiar una mesa ya enviada", () => {
  it("ofrece solo las mesas donde cabe la familia entera, y enseña el aviso", async () => {
    const { vista, select, elegir } = abrir();
    expect([...select().options].map((o) => o.value)).toEqual(["", "2"]);
    await elegir("2");
    expect(document.body.textContent).toContain("Ahora su mesa asignada es la 2.");
    vista.desmontar();
  });

  it("pregunta antes; al confirmar, primero la mesa y después el correo con el aviso, y queda enviada", async () => {
    const { vista, llamadas, elegir, pulsar } = abrir();
    await elegir("2");
    await pulsar("Cambiar y enviar");
    expect(document.body.textContent).toContain("García, Isaias: de la mesa 1 a la 2.");
    expect(llamadas).toEqual([]);
    await pulsar("Sí");
    await act(async () => {});
    expect(llamadas.map((l) => l[0])).toEqual(["mesa", "correo", "orden"]);
    expect(llamadas[0][1].filter((x) => x.grupoFamiliar === "García01").map((x) => x.mesa)).toEqual([2, 2]);
    const [, email, asunto, html, base64] = llamadas[1];
    expect(email).toBe("i@i.com");
    expect(asunto).toBe("Tu invitación — La boda");
    expect(html).toBe("<p>Por cuestiones organizativas hemos tenido que cambiar su mesa asignada. Ahora su mesa asignada es la 2.</p>Aquí tienes tu invitación.");
    expect(base64).toBe("QUJD");
    expect(llamadas[2][1]["García01"].invitacionEnviada).toBe(true);
    expect(document.body.textContent).toContain("Invitación nueva enviada a i@i.com");
    vista.desmontar();
  });

  it("si el correo falla, lo dice: la mesa ya está cambiada y no se marca como enviada", async () => {
    const llamadasCorreo = [];
    const { vista, llamadas, elegir, pulsar } = abrir({ enviarInvitacionFamilia: async (...a) => (llamadasCorreo.push(a), false) });
    await elegir("2");
    await pulsar("Cambiar y enviar");
    await pulsar("Sí");
    await act(async () => {});
    expect(llamadas.map((l) => l[0])).toEqual(["mesa"]);
    expect(document.body.textContent).toContain("Envíasela desde Invitaciones");
    vista.desmontar();
  });

  it("sin imagen, o si no se puede guardar la mesa, no se manda nada", async () => {
    imagen = null;
    let v = abrir();
    await v.elegir("2");
    await v.pulsar("Cambiar y enviar");
    await v.pulsar("Sí");
    await act(async () => {});
    expect(v.llamadas).toEqual([]);
    expect(document.body.textContent).toContain("No se ha cambiado nada");
    v.vista.desmontar();
    imagen = "data:image/png;base64,QUJD";

    const correos = [];
    v = abrir({ persistInvitados: async () => "fallo", enviarInvitacionFamilia: async (...a) => (correos.push(a), true) });
    await v.elegir("2");
    await v.pulsar("Cambiar y enviar");
    await v.pulsar("Sí");
    await act(async () => {});
    expect(correos).toEqual([]);
    v.vista.desmontar();
  });

  it("sin email en la familia, no cambia nada", async () => {
    const sinEmail = [g("1", "Isaias", ROL_FAMILIAR.ESPOSO), g("2", "Ana", ROL_FAMILIAR.ESPOSA)];
    const { vista, llamadas, elegir, pulsar } = abrir({ invitados: sinEmail });
    await elegir("2");
    await pulsar("Cambiar y enviar");
    await pulsar("Sí");
    await act(async () => {});
    expect(llamadas).toEqual([]);
    expect(document.body.textContent).toContain("ninguno de esta familia tiene email");
    vista.desmontar();
  });

  it("si no cabe en ninguna otra, lo dice", () => {
    const { vista } = abrir({ mesas: [{ numero: 1, capacidad: 10 }] });
    expect(document.body.textContent).toContain("Ninguna otra mesa tiene 2 sitios libres");
    vista.desmontar();
  });
});
