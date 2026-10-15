// Ventana "Día del evento" (él, v66): lo que se abre o se usa ese día, una
// cosa por fila, solo para el anfitrión. Las llegadas vivían en Datos
// Colab.; se TRASLADAN aquí, no se copian: un interruptor en dos sitios
// acaba diciendo cosas distintas (norma 7). Después vendrán las fotos de la
// fiesta, con su propia fila igual que esta.
//
// Cada fila separa el estado de la acción (él, v66.1: a todo lo ancho y
// diciendo «Llegadas: abiertas» parecía un cartel, no un botón): el estado
// en texto y, del lado del pulgar, el botón de la app con lo que hace.
import { DoorOpen, DoorClosed } from "lucide-react";
import { C, OP } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";

export function VentanaDiaEvento({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const llegadasAbiertas = Boolean(evento.asistenciaAbierta);
  const fijarLlegadas = (abiertas) => persistEvento({ ...evento, asistenciaAbierta: abiertas });
  // Cerrar pregunta antes: en pleno evento, los colaboradores dejarían de
  // poder marcar a quien llega. Abrir, no.
  const alternarLlegadas = () =>
    llegadasAbiertas
      ? preguntar({
          titulo: "¿Cerrar las llegadas?",
          texto: "Los colaboradores dejarán de poder marcar quién llega.",
          peligro: false,
          alConfirmar: () => fijarLlegadas(false),
        })
      : fijarLlegadas(true);

  return (
    <VentanaFlotante clave="diaEvento" titulo="Día del evento" onCerrar={onCerrar}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 zurdo:flex-row-reverse">
          <span className="flex items-center gap-2 text-sm min-w-0" style={{ color: C.ink }}>
            {llegadasAbiertas ? <DoorOpen size={16} style={{ flexShrink: 0 }} /> : <DoorClosed size={16} style={{ flexShrink: 0 }} />}
            <span className="truncate">
              <b>Llegadas</b>
              <span style={{ color: llegadasAbiertas ? C.ink : C.peligro, fontWeight: 600 }}>
                {" · "}
                {llegadasAbiertas ? "abiertas" : "cerradas"}
              </span>
            </span>
          </span>
          <Boton variante={llegadasAbiertas ? "secundario" : "principal"} onClick={alternarLlegadas}>
            {llegadasAbiertas ? "Cerrar" : "Abrir"}
          </Boton>
        </div>
        <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
          {llegadasAbiertas
            ? "Los colaboradores pueden marcar quién ha llegado."
            : "Ábrelas el día del evento para que los colaboradores marquen quién llega."}
        </p>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
