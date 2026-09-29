// "Abriendo el libro de invitados…": UNA pantalla de carga para toda la app
// (norma 7). Antes eran tres copias en App.jsx.
//
// Si el servidor no contesta (le pasa a Supabase de vez en cuando: el
// 2026-09-29 su "puerta de entrada" estuvo degradada y la app se quedaba
// aquí para siempre, sin decir nada), a los pocos segundos lo dice y deja
// volver a intentarlo (él, v53.1). El botón hace falta: con la app guardada
// en la pantalla de inicio del móvil no hay botón de recargar.
// `sinRespuesta`: ya se sabe que el servidor ha fallado; se dice sin esperar.
import { useState, useEffect } from "react";
import { C } from "../theme";
import { Boton } from "./Boton";

export const ESPERA_ANTES_DE_AVISAR_MS = 8000;

export function PantallaCargando({ sinRespuesta = false }) {
  const [tarda, setTarda] = useState(sinRespuesta);
  useEffect(() => {
    if (sinRespuesta) return;
    const temporizador = setTimeout(() => setTarda(true), ESPERA_ANTES_DE_AVISAR_MS);
    return () => clearTimeout(temporizador);
  }, [sinRespuesta]);
  const avisar = tarda || sinRespuesta;
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center"
      style={{ background: C.paper, color: C.ink, fontFamily: "'Fraunces', serif" }}
    >
      Abriendo el libro de invitados…
      {avisar && (
        <>
          <p className="text-sm" style={{ color: C.wax, fontFamily: "'Inter', sans-serif" }}>
            El servidor tarda en responder. Inténtalo en un momento.
          </p>
          <Boton variante="principal" onClick={() => window.location.reload()}>
            Volver a intentar
          </Boton>
        </>
      )}
    </div>
  );
}
