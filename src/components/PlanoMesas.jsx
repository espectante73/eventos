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
import { useRef, useState, useLayoutEffect } from "react";
import { Printer, Image as IconoImagen, Plus, Minus } from "lucide-react";
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

// La cifra entre el − y el +: se lee, no se pulsa.
function Cifra({ children }) {
  return (
    <span
      className="px-1.5 py-0.5 text-xs text-center tabular-nums min-w-[3.25rem]"
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
    <div className="pt-1">
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: OP.secundario }}>
        Arrastra cada mesa a su sitio en el local; se guarda sola. «Plano del local» pone de
        fondo el dibujo del local, sin las mesas, y «Tamaño de las mesas» las ajusta a él. El
        + y el − de la esquina acercan o alejan solo para mirar. Para imprimirlo, pulsa
        «Imprimir» y elige papel A2.
      </p>
      <div className="flex items-center gap-2 mb-3 justify-end zurdo:justify-start">
        {planoLocal && (
          <BotonQuitar
            titulo="Quitar el plano del local"
            pregunta={{ titulo: "¿Quitar el plano del local?", texto: "Las mesas se quedan donde están.", rotulo: "Sí" }}
            onClick={() => persistEvento({ ...evento, planoLocal: "" })}
          />
        )}
        {/* Los dos, del mismo ancho (norma 4). */}
        <div className="grid grid-cols-2 gap-2">
          <Boton
            variante="principal"
            icono={IconoImagen}
            disabled={subiendoPlano}
            onClick={() => inputPlanoRef.current?.click()}
          >
            {subiendoPlano ? "Subiendo…" : "Plano del local"}
          </Boton>
          <Boton
            variante="principal"
            icono={Printer}
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
            Imprimir (A2)
          </Boton>
        </div>
        <input ref={inputPlanoRef} type="file" accept="image/*" onChange={onElegirPlano} className="sr-only" />
      </div>
      {errorPlano && <LineaAviso className="text-xs mb-3">{errorPlano}</LineaAviso>}
      {/* Se guarda y sale en el papel. El − antes que el +, como se lee, y
          sin invertir para zurdos (como el mando de la música). */}
      <div className="flex items-center gap-2 mb-3 justify-end zurdo:justify-start">
        <span className="text-sm" style={{ color: C.charcoal }}>Tamaño de las mesas</span>
        <Boton
          variante="principal"
          icono={Minus}
          titulo="Mesas más pequeñas"
          disabled={tamano <= TAMANO_MESAS.minimo}
          onClick={() => cambiarTamano(-1)}
        />
        <Cifra>{tamano} %</Cifra>
        <Boton
          variante="principal"
          icono={Plus}
          titulo="Mesas más grandes"
          disabled={tamano >= TAMANO_MESAS.maximo}
          onClick={() => cambiarTamano(1)}
        />
      </div>
      <div className="relative">
        <div
          ref={marcoRef}
          className="rounded"
          onMouseDown={empezarDesplazar}
          style={{ aspectRatio: "594 / 420", overflow: ampliado ? "auto" : "hidden", cursor: ampliado ? "grab" : undefined }}
        >
          <div id="zona-imprimible-plano" style={{ width: `${zoom}%` }}>
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
        {/* El zoom, como en un mapa: en la esquina del lado del pulgar. Fuera
            de la zona imprimible: no sale en el papel. */}
        <div className="absolute bottom-2 right-2 zurdo:right-auto zurdo:left-2 flex flex-col items-center gap-1.5">
          <Boton
            variante="principal"
            icono={Plus}
            titulo="Acercar el plano"
            disabled={zoom >= PASOS_ZOOM_PLANO[PASOS_ZOOM_PLANO.length - 1]}
            onClick={() => cambiarZoom(1)}
          />
          <Cifra>{zoom} %</Cifra>
          <Boton
            variante="principal"
            icono={Minus}
            titulo="Alejar el plano"
            disabled={!ampliado}
            onClick={() => cambiarZoom(-1)}
          />
        </div>
      </div>
      {mesas.length === 0 && (
        <p className="text-sm italic mt-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
          Todavía no hay mesas — créalas primero en "Mesas".
        </p>
      )}
    </div>
  );
}
