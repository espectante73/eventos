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

// v89.1: al abrir el chat queda apuntado el día, en la base.
it("al tocar WhatsApp guarda cuándo, y la fila dice «✓ 17 nov»; sin el SQL, lo avisa", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 17, 12));
  const persistInvitados = vi.fn();
  const conColumna = { ...data, persistInvitados, invitados: data.invitados.map((g) => ({ ...g, avisoPagoEn: null })) };
  const vista = montar(<VentanaAvisoPago data={conColumna} onCerrar={() => {}} />);
  expect(vista.html).not.toContain("Falta subir el SQL");
  const fecha = document.body.querySelector('input[aria-label="Fecha límite"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(fecha, "2026-11-24");
    fecha.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const enlace = document.body.querySelector('a[aria-label="Escribir a Pacheco, Omar por WhatsApp"]');
  enlace.addEventListener("click", (e) => e.preventDefault());
  await act(async () => enlace.click());
  expect(persistInvitados).toHaveBeenCalledTimes(1);
  const guardados = persistInvitados.mock.calls[0][0];
  expect(guardados.find((g) => g.id === "g1").avisoPagoEn).toBe(new Date(2026, 10, 17, 12).toISOString());
  expect(guardados.find((g) => g.id === "g2").avisoPagoEn).toBeNull();
  vista.desmontar();

  const yaAvisado = montar(<VentanaAvisoPago data={{ ...conColumna, invitados: guardados }} onCerrar={() => {}} />);
  expect(yaAvisado.html).toContain('aria-label="Avisado el 17 nov"');
  yaAvisado.desmontar();

  const sinSql = montar(<VentanaAvisoPago data={{ ...data, persistInvitados }} onCerrar={() => {}} />);
  expect(sinSql.html).toContain("Falta subir el SQL de la versión 89.1");
  sinSql.desmontar();
});
