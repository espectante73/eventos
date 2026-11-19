// Qué ventana de la barra del móvil va en esta capa (BarraVentanas.jsx,
// CapaBarra). La VentanaFlotante con esa misma clave se pone a pantalla
// entera sola; las que se abran dentro de ella siguen flotando. Aparte, en
// su propio fichero: BarraVentanas ya usa piezas que usan VentanaFlotante.
import { createContext, useContext } from "react";

export const ContextoCapaBarra = createContext(null);

export const useCapaBarra = () => useContext(ContextoCapaBarra);
