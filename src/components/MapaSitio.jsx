// Visor del mapa del sitio: la imagen con todas las secciones de la app
// (public/mapa-de-la-aplicacion.png, dibujada por scripts/dibujar-mapa.mjs).
//
// Se abría en una pestaña del navegador. El usuario lo probó el mismo día
// y dijo lo obvio: "se ve el mapa pero ¿cómo se sale de ahí?". En el móvil
// una pestaña nueva no tiene botón de volver -- hay que ir al gestor de
// pestañas y cerrarla, que es justo lo contrario de consultar algo rápido.
// Ahora se abre DENTRO de la app, en un modal con su X, su Escape y su
// clic fuera, como todo lo demás.
//
// El problema que llevó a la pestaña sigue ahí: la imagen es de 1920x1080
// y encogida a la anchura de un móvil no se lee. Por eso el modal tiene
// dos estados y se cambia tocando la imagen:
//   - ajustada (por defecto): se ve el mapa entero, para ubicarse.
//   - ampliada: la imagen a 1400px dentro de una caja con barras, para
//     leer las etiquetas moviéndose por ella con el dedo.
//
// "Imprimir" y "Descargar" (preguntados por el usuario justo después):
// imprimir usa el mismo truco de #zona-imprimible que el Plano de mesas
// (ver @media print en index.css) -- la zona se escapa de la caja del
// modal y se ancla a la página. Para ENVIARLO no hay botón de compartir
// propio: se descarga el PNG y se manda como cualquier otra foto, que es
// lo que ya sabe hacer cualquier móvil.
import { useState } from "react";
import { Printer, Download } from "lucide-react";
import { C, R, OP } from "../theme";
import { ModalFlotante } from "./VentanaFlotante";
import { Boton } from "./Boton";

const RUTA_MAPA = "/mapa-de-la-aplicacion.png";
const ANCHO_AMPLIADO = 1400;

export function ModalMapaSitio({ onCerrar }) {
  const [ampliada, setAmpliada] = useState(false);

  const imprimir = () => {
    // El mismo respiro que en PlanoMesas.jsx: sin él, algunos navegadores
    // abren el diálogo antes de aplicar los estilos de impresión.
    setTimeout(() => {
      try {
        window.print();
      } catch (_) {
        // Bloqueado por el navegador: Cmd/Ctrl+P a mano.
      }
    }, 60);
  };

  return (
    <ModalFlotante
      titulo="Mapa del sitio"
      onCerrar={onCerrar}
      ancho={1100}
      acciones={
        <>
          <Boton variante="principal" onClick={imprimir}>
            <Printer size={14} /> Imprimir
          </Boton>
          <a
            href={RUTA_MAPA}
            download="mapa-de-la-aplicacion.png"
            className="boton-3d flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{ border: `1px solid ${C.ink}`, color: C.ink }}
          >
            <Download size={14} /> Descargar
          </a>
          <span className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Para enviarlo, descárgalo y mándalo como una foto más.
          </span>
        </>
      }
    >
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
        {ampliada
          ? "Arrastra para moverte por el mapa. Toca la imagen para volver a verlo entero."
          : "Toca la imagen para ampliarla y poder leer los nombres."}
      </p>
      <div
        style={{
          overflow: "auto",
          overscrollBehavior: "contain",
          border: `1px solid ${C.line}`,
          borderRadius: R.caja,
          background: C.paperDark,
        }}
      >
        <div id="zona-imprimible-mapa">
          <img
            src={RUTA_MAPA}
            alt="Mapa de las secciones de la aplicación"
            onClick={() => setAmpliada((v) => !v)}
            style={{
              display: "block",
              width: ampliada ? ANCHO_AMPLIADO : "100%",
              maxWidth: "none",
              cursor: ampliada ? "zoom-out" : "zoom-in",
            }}
          />
        </div>
      </div>
    </ModalFlotante>
  );
}
