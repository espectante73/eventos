// Error Boundary de la app, en su propio fichero para que lo pueda
// importar cualquiera sin depender de App.jsx (VistaAnfitrion.jsx monta
// uno propio dentro de la ventana emergente de Música del evento, y un
// import cruzado con App.jsx sería un círculo).
import React from "react";
import { C } from "../theme";

// Un Error Boundary tiene que ser una clase (React todavía no ofrece el
// equivalente con hooks) — es el único mecanismo que puede capturar un
// error de renderizado en cualquier parte del árbol y mostrar algo en vez
// de dejar la pantalla completamente en blanco sin explicación.
//
// Dos props opcionales, para poder usarlo también dentro de una ventana
// emergente (usePopupWindow.js):
// - `ventana`: la ventana que hay que recargar. Sin ella se recargaría
//   la pestaña principal, que no es donde está el problema.
// - `alReiniciar`: acción de rescate propia de esa ventana (en Música
//   del evento, devolver el aspecto a como venía de fábrica) para poder
//   salir de un error sin abrir las herramientas de desarrollador.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Error inesperado capturado por ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.paper, color: C.ink, fontFamily: "'Inter', sans-serif" }}
      >
        <div
          className="max-w-md w-full p-6 rounded-lg text-center"
          style={{ background: "#fff", border: `1px solid ${C.line}` }}
        >
          <h1
            className="text-xl mb-2"
            style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700 }}
          >
            Algo ha fallado
          </h1>
          <p className="text-sm mb-4" style={{ color: C.charcoal, opacity: 0.8 }}>
            Ha ocurrido un error inesperado y esta pantalla no se puede seguir mostrando.
            Tus datos están a salvo en la base de datos — nada de esto los afecta. Prueba a
            recargar la página.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => (this.props.ventana || window).location.reload()}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              Recargar la página
            </button>
            {this.props.alReiniciar && (
              <button
                onClick={() => {
                  this.props.alReiniciar();
                  (this.props.ventana || window).location.reload();
                }}
                className="px-4 py-2 rounded text-sm font-medium"
                style={{ background: "#fff", color: C.ink, border: `1px solid ${C.line}` }}
              >
                Restablecer el aspecto
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
