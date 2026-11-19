// La barra de ventanas del móvil (él, v57, con su propio boceto): abajo,
// del lado del pulgar, un cuadradito con el icono de cada ventana abierta
// y una casita para volver al inicio. Se ve una sola a la vez; tocar un
// cuadradito la pone delante. Sin palabras: solo iconos.
//
// Encima de cada cuadradito, su X para cerrarla (la de toda la app,
// BotonQuitar: se ve pequeña y el dedo acierta en 44px). Va ENCIMA y
// separada, no en la esquina: así tocar el icono nunca le da a la X sin
// querer. Y si se le da, pregunta antes.
//
// Si no caben (él, v90.4: todas las ventanas van a la barra), la fila se
// desliza de lado con el dedo, y el borde que esconde alguna se difumina
// para que se note que hay más. La casita, quieta en la esquina del pulgar
// (él, v90.5: «el icono inicio no debería moverse»).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Home } from "lucide-react";
import { Boton } from "./Boton";
import { BotonQuitar, TAMANO_BOTON_QUITAR } from "./PreguntaSeguridad";
import { mascaraFundida, HALO } from "./MenuFlotante";
import { C } from "../theme";
import { ICONOS_VENTANAS } from "../lib/iconosVentanas";
import { useSinGuardar, PREGUNTA_DESCARTAR } from "../lib/cambiosSinGuardar";
import { ContextoCapaBarra } from "../lib/capaBarra";

// Al menos 44, el mínimo del dedo; algo más, que se usa de pie y deprisa.
export const TAM_CUADRITO = 52;
const SEPARACION_ABAJO = 16;
// De la X al cuadradito: la zona de toque de la X (44) no llega al icono.
const HUECO_X = 14;
// Entre cuadradito y cuadradito.
const GAP = 12;
// Lo que la barra tapa por abajo: el contenido de detrás deja ese hueco.
export const ALTO_BARRA = SEPARACION_ABAJO + TAM_CUADRITO + HUECO_X + TAMANO_BOTON_QUITAR + 12;
// Las capas (él, v74.5: «el sello y el botón son para verlos al abrir; con
// una ventana abierta no son útiles, y ella tiene que poder agrandarse»):
// - con ventanas de la barra abiertas (el móvil), la barra va por encima de
//   todo, para poder cambiar de una a otra, y deja su hueco abajo;
// - sin ellas, la barra (solo Equipo) y el sello de los días van en la capa
//   del inicio: por encima del formulario a pantalla entera (CapaBarra, 40)
//   y DEBAJO de las ventanas flotantes (desde 51), que pueden taparlos y
//   bajar hasta abajo del todo.
export const Z_BARRA = 10000;
export const Z_INICIO = 45;

// Las ventanas que pueden ir en la barra. El icono, el del menú; el
// nombre, para su X («¿Cerrar Contabilidad?») y para quien no ve el icono.
// Las del anfitrión viven en VistaAnfitrion: Contabilidad e Invitaciones
// desde v90.3 (él: «no hay un icono en el pie como sí pasa con otras
// ventanas») y todas las demás desde v90.4 (él, opción A: todas, y la
// barra se desliza si no caben).
const NOMBRES_DEL_ANFITRION = {
  aniversarios: "Aniversarios",
  "avisar-equipo": "Avisar al equipo",
  "colaboradores-datos": "Datos de colaboradores",
  cuentas: "Contabilidad",
  diaEvento: "Día del evento",
  invitaciones: "Invitaciones",
  invitados: "Lista de invitados",
  marcador: "Acreditación",
  mesas: "Acomodación",
  "nuevo-invitado": "Nuevo invitado",
  permisos: "Permisos",
  progreso: "Progreso",
  versiones: "Versiones",
  "config-datos-evento": "Datos del evento",
  "config-modo-pruebas": "Modo pruebas",
  "config-zona-reinicio": "Reinicios",
  "config-zona-peligro": "Borrado total",
};
export const VENTANAS_DEL_ANFITRION = Object.keys(NOMBRES_DEL_ANFITRION);
export const VENTANAS_MOVIL = {
  formulario: { clave: "formulario", titulo: "Formulario", icono: ICONOS_VENTANAS.formulario },
  musica: { clave: "musica", titulo: "Multimedia", icono: ICONOS_VENTANAS.musicaEvento },
  ...Object.fromEntries(
    Object.entries(NOMBRES_DEL_ANFITRION).map(([clave, titulo]) => [clave, { clave, titulo, icono: ICONOS_VENTANAS[clave] }])
  ),
};
const INICIO = { clave: "inicio", titulo: "Inicio", icono: Home };
// Lo que la fila deslizante deja alrededor de los cuadraditos: arriba, la
// zona de toque de la X (44 px aunque se vea de 24, index.css); a los lados
// y abajo, su sombra. Sin ello, el deslizamiento los recortaría.
const RELLENO_FILA = { arriba: 10, lado: 4, abajo: 4 };
// Cuánto se difumina el borde que esconde algún cuadradito.
const FUNDIDO = 28;
const IconoEquipo = ICONOS_VENTANAS.equipo;

// `onEquipo` (él, v73.3): el cuadradito de Equipo, SIEMPRE, el primero y
// fijo en la esquina del pulgar; la casita y las ventanas abiertas salen a
// su lado. Así la barra está siempre (en el inicio del anfitrión y en el
// del colaborador), y frente a ella, del otro lado, el sello de los días.
export function BarraVentanas({ abiertas, delante, onElegir, onCerrar, onEquipo }) {
  // Con algo escrito sin guardar, su X pregunta si se descarta (v61.2).
  const haySinGuardar = useSinGuardar();
  const conVentanas = abiertas.length > 0;
  // Mientras se ve, las ventanas flotantes dejan su hueco abajo.
  // Solo con ventanas de la barra: con Equipo solo, las ventanas flotantes
  // pueden bajar hasta abajo y taparlo (Z_INICIO).
  useEffect(() => {
    if (!conVentanas) return undefined;
    const raiz = document.documentElement;
    raiz.style.setProperty("--hueco-barra-ventanas", `${ALTO_BARRA}px`);
    return () => raiz.style.removeProperty("--hueco-barra-ventanas");
  }, [conVentanas]);
  const ventanas = abiertas.map((clave) => VENTANAS_MOVIL[clave]).filter(Boolean);

  // La fila que se desliza: qué lado esconde algún cuadradito.
  const fila = useRef(null);
  const [escondidas, setEscondidas] = useState({ antes: false, despues: false });
  const medir = () => {
    const el = fila.current;
    if (!el) return;
    const antes = el.scrollLeft > 1;
    const despues = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEscondidas((e) => (e.antes === antes && e.despues === despues ? e : { antes, despues }));
  };
  // La que se pone delante (la recién abierta, sobre todo), siempre a la
  // vista: si quedaba escondida, la fila se desliza hasta ella.
  useLayoutEffect(() => {
    const el = fila.current;
    const pieza = el?.querySelector('[aria-pressed="true"]')?.parentElement;
    if (pieza) {
      const f = el.getBoundingClientRect();
      const p = pieza.getBoundingClientRect();
      if (p.left < f.left) el.scrollLeft -= f.left - p.left + RELLENO_FILA.lado;
      else if (p.right > f.right) el.scrollLeft += p.right - f.right + RELLENO_FILA.lado;
    }
    medir();
  }, [delante, abiertas.length]);
  useEffect(() => {
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  return (
    <div
      className="fixed left-0 right-0 flex justify-end zurdo:justify-start px-4 pointer-events-none"
      // Por encima de todo, también de las ventanas flotantes: tiene que
      // poder tocarse con una abierta. Ellas se acortan para no quedar
      // debajo (--hueco-barra-ventanas, en VentanaFlotante.jsx).
      style={{ bottom: SEPARACION_ABAJO - RELLENO_FILA.abajo, zIndex: conVentanas ? Z_BARRA : Z_INICIO }}
    >
      <div className="relative flex items-end min-w-0" style={{ gap: GAP - RELLENO_FILA.lado }}>
        {/* Detrás, el halo claro de «Abrir sección…» (él, v90.4): los
            cuadraditos se leen bien encima de lo que haya. */}
        <span aria-hidden="true" data-halo-barra className="absolute pointer-events-none" style={HALO} />
        {conVentanas && (
          <div
            ref={fila}
            data-fila-ventanas
            onScroll={medir}
            className="relative flex items-end min-w-0 overflow-x-auto pointer-events-auto"
            style={{
              gap: GAP,
              padding: `${RELLENO_FILA.arriba}px ${RELLENO_FILA.lado}px ${RELLENO_FILA.abajo}px`,
              scrollbarWidth: "none",
              overscrollBehavior: "contain",
              ...(escondidas.antes || escondidas.despues
                ? mascaraFundida({ izquierda: escondidas.antes ? FUNDIDO : 0, derecha: escondidas.despues ? FUNDIDO : 0, arriba: 0, abajo: 0 })
                : {}),
            }}
          >
            {ventanas.map(({ clave, titulo, icono }) => (
              <div key={clave} className="flex flex-col items-center flex-shrink-0" style={{ gap: HUECO_X }}>
                <BotonQuitar
                  titulo={`Cerrar ${titulo}`}
                  pregunta={haySinGuardar(clave) ? PREGUNTA_DESCARTAR : { titulo: `¿Cerrar ${titulo}?`, rotulo: "Sí", peligro: false }}
                  onClick={() => onCerrar(clave)}
                />
                <Cuadradito titulo={titulo} icono={icono} delante={clave === delante} onClick={() => onElegir(clave)} />
              </div>
            ))}
          </div>
        )}
        {/* En la esquina del pulgar, quieto, fuera de la fila que se
            desliza: el último (derecha) y, para el zurdo, el primero
            (izquierda). Con ventanas, la casita para volver al inicio (sin
            X); sin ellas, Equipo (él, v90.5: «solo visible si no hay
            ventanas abiertas»). */}
        {(conVentanas || onEquipo) && (
          <div
            className="relative flex flex-col items-center flex-shrink-0 pointer-events-auto order-last zurdo:order-first"
            style={{ padding: `0 ${RELLENO_FILA.lado}px ${RELLENO_FILA.abajo}px` }}
          >
            {conVentanas ? (
              <Cuadradito titulo={INICIO.titulo} icono={INICIO.icono} delante={delante === INICIO.clave} onClick={() => onElegir(INICIO.clave)} />
            ) : (
              <Cuadradito titulo="Equipo" icono={IconoEquipo} onClick={onEquipo} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Un cuadradito de la barra: el que está delante, en verde (principal); los
// demás, sobre fondo opaco, que la barra flota encima del contenido.
// `delante` undefined (Equipo): no es una ventana, no lleva aria-pressed.
function Cuadradito({ titulo, icono: Icono, delante, onClick }) {
  return (
    <Boton
      variante={delante ? "principal" : "secundario"}
      titulo={titulo}
      aria-label={titulo}
      aria-pressed={delante}
      onClick={onClick}
      style={{ width: TAM_CUADRITO, height: TAM_CUADRITO, padding: 0, ...(delante ? {} : { background: C.paper }) }}
    >
      <Icono size={26} />
    </Boton>
  );
}

// Una ventana de la barra, a pantalla entera: de arriba hasta la barra.
// Fuera de la barra (el ordenador) no envuelve nada. La que no está
// delante se oculta sin desmontarse: no pierde lo escrito ni la conexión.
// `marco`: una ventana de la app (el formulario) llega hasta abajo del todo,
// con un poco de margen a los lados para que se vean sus bordes; la barra
// flota encima y la ventana le deja el hueco dentro (VentanaFlotante
// pantallaEntera). Multimedia, sin marco: es una página entera.
// `clave`: la ventana que va en ella; esa VentanaFlotante se pone a
// pantalla entera sola (lib/capaBarra.js).
export function CapaBarra({ activa, delante, arriba = 0, marco = false, clave = null, children }) {
  if (!activa) return children;
  return (
    <ContextoCapaBarra.Provider value={clave}>
      <div
        className="fixed left-0 right-0"
        style={{
          top: arriba,
          bottom: marco ? 0 : ALTO_BARRA,
          ...(marco ? { padding: "6px 6px 0" } : {}),
          zIndex: 40,
          display: delante ? undefined : "none",
        }}
      >
        {children}
      </div>
    </ContextoCapaBarra.Provider>
  );
}
