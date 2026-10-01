// Música del evento como página propia (?musica, v56): ver lib/ventanaMusica.js.
// Es la app entera enseñando solo Música, así que trae su sesión, su
// conexión del mando y la mano que haya elegido cada uno (main.jsx).
import { useEffect, useState } from "react";
import { C, OP } from "../theme";
import { VentanaMusicaEvento } from "./anfitrion/VentanaMusicaEvento";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { PantallaCargando } from "../components/PantallaCargando";
import { Boton } from "../components/Boton";
import { guardarAspecto, ASPECTO_POR_DEFECTO } from "../lib/temasMusica";
import { cogerCerrojoMusica } from "../lib/ventanaMusica";

export function PaginaMusica({ data }) {
  // null mientras se comprueba; false si ya hay otra Música abierta aquí.
  const [libre, setLibre] = useState(null);
  useEffect(() => cogerCerrojoMusica(setLibre), []);
  useEffect(() => {
    document.title = "Música del evento";
  }, []);

  if (libre === null) return <PantallaCargando />;

  // Mismo aspecto que la pantalla de "Modo pruebas" de App.jsx.
  if (!libre)
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Inter', sans-serif" }}
      >
        <div className="max-w-md w-full p-6 rounded-lg text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <h1 className="text-xl mb-2" style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700 }}>
            Música ya está abierta
          </h1>
          <p className="text-sm mb-4" style={{ color: C.charcoal, opacity: OP.secundario }}>
            En otra ventana de este aparato. Usa esa: dos a la vez sonarían a destiempo.
          </p>
          <div className="flex justify-center">
            <Boton variante="principal" onClick={() => window.close()}>
              Cerrar esta
            </Boton>
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ height: "100dvh" }}>
      <ErrorBoundary alReiniciar={() => guardarAspecto(ASPECTO_POR_DEFECTO)}>
        <VentanaMusicaEvento data={data} ventana={window} />
      </ErrorBoundary>
    </div>
  );
}
