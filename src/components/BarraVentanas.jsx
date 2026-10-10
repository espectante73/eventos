// La barra de ventanas del móvil (él, v57, con su propio boceto): abajo,
// del lado del pulgar, un cuadradito con el icono de cada ventana abierta
// y una casita para volver al inicio. Se ve una sola a la vez; tocar un
// cuadradito la pone delante. Sin palabras: solo iconos.
//
// Encima de cada cuadradito, su X para cerrarla (la de toda la app,
// BotonQuitar: se ve pequeña y el dedo acierta en 44px). Va ENCIMA y
// separada, no en la esquina: así tocar el icono nunca le da a la X sin
// querer. Y si se le da, pregunta antes.
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Boton } from "./Boton";
import { BotonQuitar, TAMANO_BOTON_QUITAR } from "./PreguntaSeguridad";
import { C } from "../theme";
import { ICONOS_VENTANAS } from "../lib/iconosVentanas";

// Al menos 44, el mínimo del dedo; algo más, que se usa de pie y deprisa.
export const TAM_CUADRITO = 52;
const SEPARACION_ABAJO = 16;
// De la X al cuadradito: la zona de toque de la X (44) no llega al icono.
const HUECO_X = 14;
// Lo que la barra tapa por abajo: el contenido de detrás deja ese hueco.
export const ALTO_BARRA = SEPARACION_ABAJO + TAM_CUADRITO + HUECO_X + TAMANO_BOTON_QUITAR + 12;

// Las ventanas que pueden ir en la barra. El icono, el del menú.
export const VENTANAS_MOVIL = {
  formulario: { clave: "formulario", titulo: "Formulario", icono: ICONOS_VENTANAS.formulario },
  musica: { clave: "musica", titulo: "Multimedia", icono: ICONOS_VENTANAS.musicaEvento },
};
const INICIO = { clave: "inicio", titulo: "Inicio", icono: Home };

export function BarraVentanas({ abiertas, delante, onElegir, onCerrar }) {
  // Mientras se ve, las ventanas flotantes dejan su hueco abajo.
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.style.setProperty("--hueco-barra-ventanas", `${ALTO_BARRA}px`);
    return () => raiz.style.removeProperty("--hueco-barra-ventanas");
  }, []);
  const ventanas = [INICIO, ...abiertas.map((clave) => VENTANAS_MOVIL[clave]).filter(Boolean)];
  return (
    <div
      className="fixed left-0 right-0 flex items-end justify-end zurdo:justify-start gap-3 px-4 pointer-events-none"
      // Por encima de todo, también de las ventanas flotantes: tiene que
      // poder tocarse con una abierta. Ellas se acortan para no quedar
      // debajo (--hueco-barra-ventanas, en VentanaFlotante.jsx).
      style={{ bottom: SEPARACION_ABAJO, zIndex: 10000 }}
    >
      {ventanas.map(({ clave, titulo, icono: Icono }) => {
        const esDelante = clave === delante;
        return (
          <div key={clave} className="flex flex-col items-center pointer-events-auto" style={{ gap: HUECO_X }}>
            {clave !== "inicio" && (
              <BotonQuitar
                titulo={`Cerrar ${titulo}`}
                pregunta={{ titulo: `¿Cerrar ${titulo}?`, rotulo: "Sí", peligro: false }}
                onClick={() => onCerrar(clave)}
              />
            )}
            <Boton
              variante={esDelante ? "principal" : "secundario"}
              titulo={titulo}
              aria-label={titulo}
              aria-pressed={esDelante}
              onClick={() => onElegir(clave)}
              // El que está delante, en verde (principal); los demás, sobre
              // fondo opaco: la barra flota encima del contenido.
              style={{ width: TAM_CUADRITO, height: TAM_CUADRITO, padding: 0, ...(esDelante ? {} : { background: C.paper }) }}
            >
              <Icono size={26} />
            </Boton>
          </div>
        );
      })}
    </div>
  );
}

// Una ventana de la barra, a pantalla entera: de arriba hasta la barra.
// Fuera de la barra (el ordenador) no envuelve nada. La que no está
// delante se oculta sin desmontarse: no pierde lo escrito ni la conexión.
export function CapaBarra({ activa, delante, arriba = 0, children }) {
  if (!activa) return children;
  return (
    <div className="fixed left-0 right-0" style={{ top: arriba, bottom: ALTO_BARRA, zIndex: 40, display: delante ? undefined : "none" }}>
      {children}
    </div>
  );
}
