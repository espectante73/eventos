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
import { useRef, useState } from "react";
import { Printer, Image as IconoImagen } from "lucide-react";
import { C, OP, conAlfa } from "../theme";
import { MesaPlano } from "./Mesas";
import { Boton } from "./Boton";
import { BotonQuitar } from "./PreguntaSeguridad";
import { LineaAviso } from "./LineaAviso";
import { redimensionarImagenArchivo } from "../lib/descargas";
import { realmDe } from "../lib/realm";
import { guardarImagenEvento, IMAGEN_EVENTO } from "../lib/imagenesEvento";

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
        fondo el dibujo del local, sin las mesas: las mesas crecen y encogen con él. Para
        imprimirlo, pulsa «Imprimir» y elige papel A2.
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
      <div id="zona-imprimible-plano">
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
              />
            );
          })}
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
