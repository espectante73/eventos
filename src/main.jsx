import React from "react";
import ReactDOM from "react-dom/client";
import App, { ErrorBoundary } from "./App.jsx";
import { AvisosGlobales } from "./components/AvisosGlobales.jsx";
import "./index.css";
import { iniciarRegistroErrores } from "./lib/registroErrores";
import { iniciarMano } from "./lib/mano";
import { activarRespuestaTactil } from "./lib/respuestaTactil";

// Lo primero de todo, para que atrape también los fallos del arranque.
iniciarRegistroErrores();
// Antes de pintar nada: si este móvil se maneja con la izquierda, que la
// primera imagen ya salga con los botones de ese lado.
iniciarMano();
// El clic suave y la vibración al pulsar cualquier cosa, en toda la app
// (anfitrión, colaboradores y tablón).
activarRespuestaTactil();

// Desde que la app se descarga a trozos (2026-09-18), una pestaña abierta
// de antes de un despliegue puede pedir un trozo que ya no existe (cambia
// de nombre con cada versión). Vite avisa con este evento: se recarga UNA
// vez para traer la versión nueva. La marca en sessionStorage evita un
// bucle de recargas si el fallo fuera otro (sin conexión, por ejemplo).
window.addEventListener("vite:preloadError", (evento) => {
  try {
    if (sessionStorage.getItem("recargadoPorVersionNueva")) return;
    sessionStorage.setItem("recargadoPorVersionNueva", "1");
  } catch (_) {
    // Sin sessionStorage (modo privado estricto): mejor no arriesgar un bucle.
    return;
  }
  evento.preventDefault();
  window.location.reload();
});
window.addEventListener("load", () => {
  // Si la página llegó a cargar entera, la próxima vez se puede volver a
  // intentar la recarga automática.
  setTimeout(() => {
    try {
      sessionStorage.removeItem("recargadoPorVersionNueva");
    } catch (_) {
      /* nada */
    }
  }, 10000);
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      {/* Los avisos de la app (lib/avisos.js): fuera de App para que
          salgan igual en el login, en el tablón y en cualquier vista. */}
      <AvisosGlobales />
    </ErrorBoundary>
  </React.StrictMode>
);
