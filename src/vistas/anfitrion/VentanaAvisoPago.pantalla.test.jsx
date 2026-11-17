// «Aviso de pago» (él, v89), DIBUJADA: una línea por persona sin pagar; sin
// fecha límite, WhatsApp apagado; con ella, cada uno abre su chat con su
// mensaje ya escrito.
import { it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaAvisoPago } from "./VentanaAvisoPago";

afterEach(() => vi.useRealTimers());

const data = {
  evento: { nombre: "Las Bodas de todos.", fecha: "2026-12-11", precioAdulto: "47" },
  colaboradores: [{ id: "c1", nombre: "Barrios, Jacob", invitadoId: "g0" }],
  invitados: [
    { id: "g1", nombre: "Omar", apellido: "Pacheco", grupoFamiliar: "Pacheco01", colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "1985", telefono: "612345678" },
    { id: "g2", nombre: "Míriam", apellido: "Pacheco", grupoFamiliar: "Pacheco01", colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "1988", telefono: "" },
  ],
};

it("sin fecha límite, sin enlace; con ella, el chat de cada uno con su mensaje, y quien no tiene teléfono lo dice", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 17, 12));
  const vista = montar(<VentanaAvisoPago data={data} onCerrar={() => {}} />);
  expect(vista.html).toContain("Elige la fecha límite");
  expect(vista.html).toContain("2 sin pagar · 1 sin teléfono");
  expect(vista.html).toContain("Sin teléfono");
  expect(vista.contenedor.querySelector('a[aria-label^="Escribir a"]')).toBeNull();

  const fecha = document.body.querySelector('input[aria-label="Fecha límite"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(fecha, "2026-11-24");
    fecha.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const enlace = document.body.querySelector('a[aria-label="Escribir a Pacheco, Omar por WhatsApp"]');
  expect(enlace).not.toBeNull();
  const mensaje = decodeURIComponent(enlace.getAttribute("href"));
  expect(mensaje).toContain("PACHECO, Omar:\nLes escribe el ANFITRIÓN");
  expect(mensaje).toContain("Hoy, 17 de noviembre, quedan 24 días");
  expect(mensaje).toContain("antes del 24 de noviembre");
  vista.desmontar();
});
