// Los avisos al móvil (v79), del lado del móvil: con un móvil de mentira.
import { describe, it, expect, vi } from "vitest";
import { estadoAvisos, claveEnBytes, activarAvisos, pedirAvisos, textoInvitadosNuevos, AVISO_BLOQUEADOS } from "./avisosPush";

function movil({ iphone = false, instalada = false, permiso = "default", suscrito = false, soporta = true } = {}) {
  const suscripcion = { toJSON: () => ({ endpoint: "https://push/1", keys: { p256dh: "p", auth: "a" } }), unsubscribe: vi.fn() };
  const registro = { pushManager: { getSubscription: vi.fn(async () => (suscrito ? suscripcion : null)), subscribe: vi.fn(async () => suscripcion) } };
  const w = {
    navigator: { userAgent: iphone ? "iPhone" : "Android", standalone: instalada, ...(soporta ? { serviceWorker: { getRegistration: async () => registro, register: vi.fn(async () => registro), ready: Promise.resolve() } } : {}) },
    matchMedia: () => ({ matches: instalada }),
    Notification: { permission: permiso, requestPermission: vi.fn(async () => (permiso === "denied" ? "denied" : "granted")) },
  };
  if (soporta) w.PushManager = function () {};
  return { w, registro };
}

describe("estadoAvisos", () => {
  it("en el iPhone, solo con la app instalada", async () => {
    expect(await estadoAvisos(movil({ iphone: true }).w)).toBe("instalar");
    expect(await estadoAvisos(movil({ iphone: true, instalada: true }).w)).toBe("activar");
  });
  it("activos, bloqueados o un navegador que no puede", async () => {
    expect(await estadoAvisos(movil({ suscrito: true }).w)).toBe("activos");
    expect(await estadoAvisos(movil({ permiso: "denied" }).w)).toBe("bloqueados");
    expect(await estadoAvisos(movil({ soporta: false }).w)).toBe("no");
  });
});

describe("activarAvisos", () => {
  it("pide permiso, se apunta y lo guarda en la base", async () => {
    const { w, registro } = movil();
    const guardar = vi.fn(async () => true);
    expect(await activarAvisos(guardar, w)).toEqual({ ok: true, aviso: "" });
    expect(registro.pushManager.subscribe).toHaveBeenCalled();
    expect(guardar).toHaveBeenCalledWith({ endpoint: "https://push/1", p256dh: "p", auth: "a" });
  });
  it("si se le dice que no al permiso, lo explica", async () => {
    expect(await activarAvisos(vi.fn(), movil({ permiso: "denied" }).w)).toEqual({ ok: false, aviso: AVISO_BLOQUEADOS });
  });
});

describe("el resto", () => {
  it("la clave en bytes", () => {
    expect(Array.from(claveEnBytes("AQID"))).toEqual([1, 2, 3]);
  });
  it("pedir avisos al cartero: lo que conteste, o su error", async () => {
    const bien = vi.fn(async () => ({ ok: true, json: async () => ({ enviados: 3, fallidos: 0 }) }));
    expect(await pedirAvisos({ token: "t", texto: "x" }, bien)).toEqual({ enviados: 3, fallidos: 0 });
    const mal = vi.fn(async () => ({ ok: false, status: 503, json: async () => ({ error: "Falta la clave" }) }));
    expect(await pedirAvisos({ token: "t", texto: "x" }, mal)).toEqual({ error: "Falta la clave" });
  });
  it("el texto de invitados nuevos", () => {
    expect(textoInvitadosNuevos(1)).toBe("Tienes 1 invitado nuevo. Abre la app para ver su ficha.");
    expect(textoInvitadosNuevos(3)).toContain("3 invitados nuevos");
  });
});
