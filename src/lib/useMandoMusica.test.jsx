import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { useMandoMusica } from "./useMandoMusica";

// Realtime puede lanzar de verdad al suscribirse: `subscribe()` llama por
// dentro a `socket.connect()`, que tira "WebSocket not available" si el
// navegador no puede abrir la conexión. Al pasar dentro de un efecto, ese
// error sube hasta React y tumba la ventana entera -- y la ventana de
// música tiene que seguir funcionando sin canal, porque la música se
// reproduce en local. Esta prueba fija ese comportamiento.
vi.mock("../supabaseClient", () => ({
  supabase: {
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        throw new Error("WebSocket not available: fallo simulado");
      },
      presenceState: () => ({}),
    }),
    removeChannel: () => {},
  },
}));

function Sonda() {
  const { conectado, estadoCanal } = useMandoMusica({ rol: "reproductor" });
  return <span>{`${conectado ? "sí" : "no"}|${estadoCanal}`}</span>;
}

describe("useMandoMusica con Realtime caído", () => {
  it("no propaga el error: informa del fallo y deja seguir a la ventana", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    await act(async () => {
      createRoot(div).render(<Sonda />);
    });
    expect(div.textContent).toBe("no|CHANNEL_ERROR");
  });
});
