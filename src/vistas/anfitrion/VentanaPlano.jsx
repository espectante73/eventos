// Ventana "Plano de mesas": lienzo donde cada mesa se arrastra a su
// posición real, pensado para imprimir en A2. Extraída de
// VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4, Ronda 4).
//
// `ocupacionMesa` no vive aquí: la usan también la ventana Mesas y la
// tabla principal de invitados, así que sigue en VistaAnfitrion y llega
// como prop.
import { useRef } from "react";
import { Printer } from "lucide-react";
import { C } from "../../theme";
import { MesaPlano } from "../../components/Mesas";
import { VentanaFlotante } from "../../components/VentanaFlotante";

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

export function VentanaPlano({ data, ocupacionMesa, onCerrar }) {
  const { mesas, persistMesas } = data;
  const lienzoPlanoRef = useRef(null);

  const moverMesaPlano = (numero, posX, posY) => {
    persistMesas(
      mesas.map((m) => (m.numero === numero ? { ...m, posX, posY } : m))
    );
  };

  return (
    <VentanaFlotante clave="plano" titulo="Plano de mesas" onCerrar={onCerrar}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
        Arrastra cada mesa a la posición que quieras para representar cómo queda en el local.
        La posición se guarda sola. Para imprimirlo en A2, pulsa "Imprimir" y elige el tamaño
        de papel A2 en el diálogo de impresión de tu navegador.
      </p>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => {
            setTimeout(() => {
              try {
                window.print();
              } catch (_) {
                // Bloqueado por el navegador: Cmd/Ctrl+P a mano.
              }
            }, 60);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
          style={{ background: C.ink, color: C.paper }}
        >
          <Printer size={14} /> Imprimir (A2)
        </button>
      </div>
      <div id="zona-imprimible-plano">
        <div
          ref={lienzoPlanoRef}
          className="relative w-full rounded"
          style={{
            aspectRatio: "594 / 420",
            background: "#F7F4EA",
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
            backgroundSize: "5% 5%",
            border: `1px solid ${C.line}`,
          }}
        >
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
        <p className="text-sm italic mt-2" style={{ color: C.charcoal, opacity: 0.6 }}>
          Todavía no hay mesas — créalas primero en "Mesas".
        </p>
      )}
    </VentanaFlotante>
  );
}
