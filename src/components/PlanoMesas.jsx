// Plano de mesas: lienzo donde cada mesa se arrastra a su posición real,
// pensado para imprimir en A2.
//
// Vivía en su propia ventana del menú (VentanaPlano.jsx) hasta el
// 2026-09-05, cuando el usuario señaló lo evidente: "Mesas y plano
// gestionan lo mismo desde diferentes perspectivas". Es cierto -- este
// lienzo no tiene datos propios, solo coloca las mesas que se crean en
// la ventana Mesas (y de hecho ya decía "créalas primero en Mesas"). Así
// que pasa a ser una sección plegable dentro de ella, en vez de una
// entrada más del menú.
//
// El dibujo del local, de fondo (v94, él: «ordenarla en el plano teniendo
// en cuenta cómo estarán las mesas en el local»): lo sube él con «Plano del
// local», SIN las mesas (las pone la app), y no se dibuja en el código: si
// cambia un pilar o el local de otro evento, cambia su dibujo y lo vuelve a
// subir. Va en un <img> y no de fondo CSS: los fondos no se imprimen.
//
// Zoom y tamaño de las mesas (v94.1): ver lib/planoMesas.js. El zoom ensancha
// la zona del plano dentro de un marco que se desliza (con el dedo, o
// arrastrando el fondo con el ratón); al imprimir, index.css la devuelve al
// 100 %: el zoom nunca sale en el papel.
//
// Todos los mandos en UNA línea, quieta arriba (v94.2, él: «rompes la regla
// de todo en una línea; al mover se esconden los botones»): lo que se
// desliza es el plano, dentro de su marco, nunca la línea. Al 100 %, el
// plano entero cabe en el marco (a lo ancho o a lo alto, lo que mande).
import { useRef, useState, useLayoutEffect } from "react";
import { Printer, Image as IconoImagen, Plus, Minus, ZoomIn, ZoomOut } from "lucide-react";
import { C, OP, R, conAlfa } from "../theme";
import { MesaPlano } from "./Mesas";
import { Boton } from "./Boton";
import { BotonQuitar } from "./PreguntaSeguridad";
import { LineaAviso } from "./LineaAviso";
import { redimensionarImagenArchivo } from "../lib/descargas";
import { realmDe } from "../lib/realm";
import { guardarImagenEvento, IMAGEN_EVENTO } from "../lib/imagenesEvento";
import {
  zoomSiguiente,
  tamanoMesasDe,
  tamanoMesasSiguiente,
  anchoMesaPlano,
  PASOS_ZOOM_PLANO,
  TAMANO_MESAS,
} from "../lib/planoMesas";

const PROPORCION_A2 = 594 / 420;

// La cifra entre el − y el +: se lee, no se pulsa.
function Cifra({ children, className = "" }) {
  return (
    <span
      className={`px-1.5 py-0.5 text-xs text-center tabular-nums whitespace-nowrap ${className}`}
      style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}`, borderRadius: R.caja }}
    >
      {children}
    </span>
  );
}

// Posición por defecto en rejilla para las mesas que todavía no se han
// arrastrado a mano en el plano (posX/posY a null).
function posicionPorDefecto(indice, total) {
  const columnas = Math.max(1, Math.ceil(Math.sqrt(total)));
  const filas = Math.max(1, Math.ceil(total / columnas));
  const col = indice % columnas;
  const fila = Math.floor(indice / columnas);
  return {
    posX: ((col + 0.5) / columnas) * 100,
    posY: ((fila + 0.5) / filas) * 100,
  };
}

export function PlanoMesas({ data, ocupacionMesa }) {
  const { mesas, persistMesas, evento, persistEvento } = data;
  const lienzoPlanoRef = useRef(null);
  const inputPlanoRef = useRef(null);
  const [subiendoPlano, setSubiendoPlano] = useState(false);
  const [errorPlano, setErrorPlano] = useState("");
  const planoLocal = evento?.planoLocal || "";
  const tamano = tamanoMesasDe(evento);
  // Sin su columna en la base (falta el SQL de la v94.1), guardar no hace
  // nada y al releer el evento el tamaño vuelve solo al 100 % (él lo vio:
  // «salta solo de 70 % a 100 %»). Mejor decirlo y no dejar tocarlo.
  const faltaSqlTamano = Boolean(evento) && !("tamanoMesasPlano" in evento);
  const anchoMesa = anchoMesaPlano(tamano);
  const cambiarTamano = (direccion) =>
    persistEvento({ ...evento, tamanoMesasPlano: tamanoMesasSiguiente(tamano, direccion) });

  // El zoom: solo en esta pantalla, no se guarda.
  const marcoRef = useRef(null);
  const [zoom, setZoom] = useState(PASOS_ZOOM_PLANO[0]);
  const ampliado = zoom > PASOS_ZOOM_PLANO[0];
  // Al acercar o alejar, se queda en el centro lo que estaba en el centro.
  const centroPendiente = useRef(null);
  const cambiarZoom = (direccion) => {
    const marco = marcoRef.current;
    if (marco) {
      centroPendiente.current = {
        x: (marco.scrollLeft + marco.clientWidth / 2) / marco.scrollWidth,
        y: (marco.scrollTop + marco.clientHeight / 2) / marco.scrollHeight,
      };
    }
    setZoom((z) => zoomSiguiente(z, direccion));
  };
  // Lo que mide el marco, para que al 100 % quepa el plano entero. Con el
  // ResizeObserver de la ventana donde está (en el Mac, Mesas es otra).
  const [marcoMide, setMarcoMide] = useState(null);
  useLayoutEffect(() => {
    const marco = marcoRef.current;
    const Observador = marco && realmDe(marco).win.ResizeObserver;
    if (!Observador) return undefined;
    const observador = new Observador(() => setMarcoMide({ ancho: marco.clientWidth, alto: marco.clientHeight }));
    observador.observe(marco);
    return () => observador.disconnect();
  }, []);
  const anchoBase = marcoMide
    ? marcoMide.alto > 0
      ? Math.min(marcoMide.ancho, marcoMide.alto * PROPORCION_A2)
      : marcoMide.ancho
    : null;

  useLayoutEffect(() => {
    const marco = marcoRef.current;
    const centro = centroPendiente.current;
    if (!marco || !centro) return;
    centroPendiente.current = null;
    marco.scrollLeft = centro.x * marco.scrollWidth - marco.clientWidth / 2;
    marco.scrollTop = centro.y * marco.scrollHeight - marco.clientHeight / 2;
  }, [zoom]);

  // Con el ratón, arrastrar el fondo desliza el plano (con el dedo ya lo
  // hace el navegador). Sobre una mesa, no: eso mueve la mesa. Con el ratón
  // de la ventana donde está el plano (realmDe, v93.9).
  const empezarDesplazar = (e) => {
    if (!ampliado || e.button !== 0 || e.target.closest("[data-mesa-plano]")) return;
    const marco = marcoRef.current;
    const { win } = realmDe(marco);
    const inicio = { x: e.clientX, y: e.clientY, izquierda: marco.scrollLeft, arriba: marco.scrollTop };
    const mover = (ev) => {
      marco.scrollLeft = inicio.izquierda - (ev.clientX - inicio.x);
      marco.scrollTop = inicio.arriba - (ev.clientY - inicio.y);
    };
    const soltar = () => {
      win.removeEventListener("mousemove", mover);
      win.removeEventListener("mouseup", soltar);
    };
    win.addEventListener("mousemove", mover);
    win.addEventListener("mouseup", soltar);
    e.preventDefault();
  };

  const onElegirPlano = async (e) => {
    const archivo = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    setErrorPlano("");
    setSubiendoPlano(true);
    try {
      // Grande, como la plantilla de invitación: se imprime en A2.
      const dataUrl = await redimensionarImagenArchivo(archivo, 2400, 0.9);
      const url = await guardarImagenEvento(dataUrl, IMAGEN_EVENTO.PLANO_LOCAL);
      persistEvento({ ...evento, planoLocal: url });
    } catch (_) {
      setErrorPlano("No se ha podido guardar el plano. Prueba con otra imagen.");
    } finally {
      setSubiendoPlano(false);
    }
  };

  const moverMesaPlano = (numero, posX, posY) => {
    persistMesas(
      mesas.map((m) => (m.numero === numero ? { ...m, posX, posY } : m))
    );
  };

  return (
    <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
      {/* Una sola línea, quieta (v94.2). Tres grupos: el dibujo, las mesas y
          el zoom (lo más usado, en el lado del pulgar). Los zurdos ven los
          grupos al revés; dentro de cada uno, el − antes que el +, como el
          mando de la música. En el móvil, solo iconos (su nombre al pasar o
          tocar y mantener). */}
      <div data-linea-mandos className="flex items-center gap-3 mb-2 justify-end zurdo:flex-row-reverse whitespace-nowrap">
        <div className="flex items-center gap-1">
          {planoLocal && (
            <BotonQuitar
              titulo="Quitar el plano del local"
              pregunta={{ titulo: "¿Quitar el plano del local?", texto: "Las mesas se quedan donde están.", rotulo: "Sí" }}
              onClick={() => persistEvento({ ...evento, planoLocal: "" })}
            />
          )}
          <Boton
            variante="principal"
            tamano="pequeno"
            icono={IconoImagen}
            titulo={planoLocal ? "Cambiar el dibujo del local" : "Poner de fondo el dibujo del local, sin las mesas"}
            disabled={subiendoPlano}
            onClick={() => inputPlanoRef.current?.click()}
          >
            <span className="hidden sm:inline">{subiendoPlano ? "Subiendo…" : "Plano del local"}</span>
          </Boton>
          <Boton
            variante="principal"
            tamano="pequeno"
            icono={Printer}
            titulo="Imprimir el plano entero: elige papel A2"
            onClick={() => {
              // La ventana del plano, no la pestaña (v94): en el Mac, Mesas
              // es otra ventana del sistema, y la pestaña no tiene el plano.
              const { win } = realmDe(lienzoPlanoRef.current);
              setTimeout(() => {
                try {
                  win.print();
                } catch (_) {
                  // Bloqueado por el navegador: Cmd/Ctrl+P a mano.
                }
              }, 60);
            }}
          >
            <span className="hidden sm:inline">Imprimir</span>
          </Boton>
          <input ref={inputPlanoRef} type="file" accept="image/*" onChange={onElegirPlano} className="sr-only" />
        </div>
        {/* Se guarda y sale en el papel. */}
        <div className="flex items-center gap-1">
          <Boton
            variante="principal"
            tamano="pequeno"
            icono={Minus}
            titulo={faltaSqlTamano ? "Falta subir el SQL de la versión 94.1" : "Mesas más pequeñas"}
            disabled={faltaSqlTamano || tamano <= TAMANO_MESAS.minimo}
            onClick={() => cambiarTamano(-1)}
          />
          <Cifra>Mesas {tamano} %</Cifra>
          <Boton
            variante="principal"
            tamano="pequeno"
            icono={Plus}
            titulo={faltaSqlTamano ? "Falta subir el SQL de la versión 94.1" : "Mesas más grandes"}
            disabled={faltaSqlTamano || tamano >= TAMANO_MESAS.maximo}
            onClick={() => cambiarTamano(1)}
          />
        </div>
        {/* Solo para mirar: ni se guarda ni sale en el papel. */}
        <div className="flex items-center gap-1">
          <Boton
            variante="principal"
            tamano="pequeno"
            icono={ZoomOut}
            titulo="Alejar el plano"
            disabled={!ampliado}
            onClick={() => cambiarZoom(-1)}
          />
          {/* En el móvil no cabe en la línea, y para mirar no hace falta. */}
          <Cifra className="hidden sm:inline">{zoom} %</Cifra>
          <Boton
            variante="principal"
            tamano="pequeno"
            icono={ZoomIn}
            titulo="Acercar el plano"
            disabled={zoom >= PASOS_ZOOM_PLANO[PASOS_ZOOM_PLANO.length - 1]}
            onClick={() => cambiarZoom(1)}
          />
        </div>
      </div>
      {errorPlano && <LineaAviso className="text-xs mb-2">{errorPlano}</LineaAviso>}
      <div
        ref={marcoRef}
        className="rounded"
        onMouseDown={empezarDesplazar}
        style={{ flex: 1, minHeight: 0, overflow: ampliado ? "auto" : "hidden", cursor: ampliado ? "grab" : undefined }}
      >
        <div
          id="zona-imprimible-plano"
          className="mx-auto"
          style={{ width: anchoBase ? `${(anchoBase * zoom) / 100}px` : `${zoom}%` }}
        >
          <div
            ref={lienzoPlanoRef}
            className="relative w-full rounded"
            style={{
              aspectRatio: "594 / 420",
              background: C.papelPlano,
              backgroundImage:
                `linear-gradient(${conAlfa(C.negro, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${conAlfa(C.negro, 0.05)} 1px, transparent 1px)`,
              backgroundSize: "5% 5%",
              border: `1px solid ${C.line}`,
            }}
          >
            {planoLocal && (
              <img
                src={planoLocal}
                alt="Plano del local"
                draggable={false}
                className="absolute inset-0 w-full h-full rounded pointer-events-none select-none"
                style={{ objectFit: "contain" }}
              />
            )}
            {mesas.map((m, i) => {
              const ocupados = ocupacionMesa(m.numero);
              const posDefecto = posicionPorDefecto(i, mesas.length);
              const posX = m.posX ?? posDefecto.posX;
              const posY = m.posY ?? posDefecto.posY;
              return (
                <MesaPlano
                  key={m.numero}
                  m={{ ...m, posX, posY }}
                  ocupados={ocupados}
                  canvasRef={lienzoPlanoRef}
                  onMover={moverMesaPlano}
                  ancho={anchoMesa}
                />
              );
            })}
          </div>
        </div>
      </div>
      {mesas.length === 0 && (
        <p className="text-sm italic mt-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
          Todavía no hay mesas — créalas primero en "Mesas".
        </p>
      )}
      {/* La ayuda, al pie y plegada (norma 5). */}
      <details className="text-xs mt-2" style={{ color: C.charcoal }}>
        <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
          Cómo se usa
        </summary>
        <p className="mt-2" style={{ opacity: OP.secundario }}>
          Arrastra cada mesa a su sitio en el local; se guarda sola. El primer botón pone de fondo
          el dibujo del local, sin las mesas, y «Mesas» las agranda o encoge para que encajen en él:
          eso sale en el papel. La lupa acerca o aleja solo para mirar; ampliado, arrastra el fondo
          para moverte. Para imprimir, elige papel A2.
        </p>
      </details>
    </div>
  );
}
