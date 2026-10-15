// Ventana "Día del evento" (él, v66): lo que se abre o se usa ese día, una
// cosa por fila, solo para el anfitrión. Las llegadas vivían en Datos
// Colab.; se TRASLADAN aquí, no se copian: un interruptor en dos sitios
// acaba diciendo cosas distintas (norma 7). Después vendrán las fotos de la
// fiesta, con su propio interruptor igual que este.
import { DoorOpen, DoorClosed } from "lucide-react";
import { C, OP } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaDiaEvento({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  const llegadasAbiertas = Boolean(evento.asistenciaAbierta);
  return (
    <VentanaFlotante clave="diaEvento" titulo="Día del evento" onCerrar={onCerrar}>
      <div className="flex flex-col gap-1.5">
        {/* El mismo botón que había en Datos Colab.: verde abierto, blanco
            cerrado, con su puerta (él lo aprobó así). */}
        <button
          onClick={() => persistEvento({ ...evento, asistenciaAbierta: !llegadasAbiertas })}
          className="boton-3d flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
          style={{
            border: `1px solid ${llegadasAbiertas ? C.ink : C.line}`,
            background: llegadasAbiertas ? C.ink : C.blanco,
            color: llegadasAbiertas ? C.paper : C.charcoal,
          }}
          title={
            llegadasAbiertas
              ? "Los colaboradores pueden marcar quién ha llegado. Toca para cerrarlo."
              : "Los colaboradores NO pueden marcar llegadas. Toca para abrirlo el día del evento."
          }
        >
          {llegadasAbiertas ? <DoorOpen size={16} /> : <DoorClosed size={16} />}
          Llegadas: {llegadasAbiertas ? "abiertas" : "cerradas"}
        </button>
        <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
          {llegadasAbiertas
            ? "Los colaboradores pueden marcar quién ha llegado."
            : "Ábrelas el día del evento para que los colaboradores marquen quién llega."}
        </p>
      </div>
    </VentanaFlotante>
  );
}
