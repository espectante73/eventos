// «Avisos en este móvil» (v79), DIBUJADO: su estado y el botón, con un móvil de mentira.
import { it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { AvisosMovil } from "./AvisosMovil";

function movil({ iphone = false, instalada = false, suscrito = false } = {}) {
  const suscripcion = { toJSON: () => ({ endpoint: "https://push/1", keys: { p256dh: "p", auth: "a" } }), unsubscribe: vi.fn() };
  const registro = { pushManager: { getSubscription: vi.fn(async () => (suscrito ? suscripcion : null)), subscribe: vi.fn(async () => suscripcion) } };
  return {
    navigator: { userAgent: iphone ? "iPhone" : "Android", standalone: instalada, serviceWorker: { getRegistration: async () => registro, register: async () => registro, ready: Promise.resolve() } },
    matchMedia: () => ({ matches: instalada }),
    Notification: { permission: "default", requestPermission: async () => "granted" },
    PushManager: function () {},
  };
}

async function dibujar(entorno, guardar = vi.fn(async () => true)) {
  let vista;
  await act(async () => {
    vista = montar(<AvisosMovil entorno={entorno} guardar={guardar} quitar={vi.fn(async () => true)} abierta onAlternar={() => {}} />);
  });
  return { vista, guardar };
}

it("sin activar: lo dice y, al pulsar, se apunta y queda «Activados»", async () => {
  const { vista, guardar } = await dibujar(movil());
  expect(document.body.textContent).toContain("Sin activar");
  const boton = [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Activar avisos"));
  await act(async () => boton.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(guardar).toHaveBeenCalledWith({ endpoint: "https://push/1", p256dh: "p", auth: "a" });
  expect(document.body.textContent).toContain("Activados en este móvil.");
  vista.desmontar();
});

it("en el iPhone sin instalar: cómo instalarla, sin botón", async () => {
  const { vista } = await dibujar(movil({ iphone: true }));
  expect(document.body.textContent).toContain("Instala la app");
  expect(document.body.textContent).toContain("Añadir a pantalla de inicio");
  expect([...document.body.querySelectorAll("button")].some((b) => b.textContent.includes("Activar avisos"))).toBe(false);
  vista.desmontar();
});

// v79.3: el anfitrión lo tiene en Mi cuenta, con lo que a él le avisa.
it("con `explicacion`, cuenta la suya", async () => {
  let vista;
  await act(async () => {
    vista = montar(<AvisosMovil entorno={movil()} guardar={vi.fn()} quitar={vi.fn()} abierta onAlternar={() => {}} explicacion="Llega un aviso cuando una familia paga." />);
  });
  expect(document.body.textContent).toContain("Llega un aviso cuando una familia paga.");
  expect(document.body.textContent).not.toContain("invitados nuevos");
  vista.desmontar();
});
