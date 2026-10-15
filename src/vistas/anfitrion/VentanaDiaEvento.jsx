// Ventana "Día del evento" (él, v66): lo que se abre o se usa ese día, una
// cosa por fila, solo para el anfitrión. Las llegadas vivían en Datos
// Colab.; se TRASLADAN aquí, no se copian: un interruptor en dos sitios
// acaba diciendo cosas distintas (norma 7). Las fotos de la fiesta (v67),
// con su propia fila igual.
//
// Cada fila separa el estado de la acción (él, v66.1: a todo lo ancho y
// diciendo «Llegadas: abiertas» parecía un cartel, no un botón): el estado
// en texto y, del lado del pulgar, el botón de la app con lo que hace.
// Debajo, una línea que dice para qué es el botón, nada más (él, v67.1).
// Las filas comparten UNA rejilla: la columna de los botones mide lo que
// el más largo, y así todos son iguales (norma 4) sin medir nada.
import { useEffect, useState } from "react";
import { DoorOpen, DoorClosed, Camera, CameraOff } from "lucide-react";
import { C, OP } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";

// «12 fotos de 5 familias», contando cada familia una vez.
export function cuentaFotosFiesta(fotos) {
  if (!fotos.length) return "Todavía no hay fotos.";
  const familias = new Set(fotos.map((f) => f.familia)).size;
  const de = (n, una, varias) => `${n} ${n === 1 ? una : varias}`;
  return `${de(fotos.length, "foto", "fotos")} de ${de(familias, "familia", "familias")}`;
}

function FilaAbrirCerrar({ fila, abierta, Icono, IconoCerrada, rotulo, onAlternar, children }) {
  return (
    <>
      <div className="col-start-1 zurdo:col-start-2 min-w-0" style={{ gridRow: fila }}>
        <span className="flex items-center gap-2 text-sm min-w-0" style={{ color: C.ink }}>
          {abierta ? <Icono size={16} style={{ flexShrink: 0 }} /> : <IconoCerrada size={16} style={{ flexShrink: 0 }} />}
          <span className="truncate">
            <b>{rotulo}</b>
            <span style={{ color: abierta ? C.ink : C.peligro, fontWeight: 600 }}>
              {" · "}
              {abierta ? "abiertas" : "cerradas"}
            </span>
          </span>
        </span>
        <div className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
          {children}
        </div>
      </div>
      <Boton
        variante={abierta ? "secundario" : "principal"}
        onClick={onAlternar}
        className="col-start-2 zurdo:col-start-1"
        style={{ gridRow: fila }}
      >
        {abierta ? "Cerrar" : "Abrir"}
      </Boton>
    </>
  );
}

export function VentanaDiaEvento({ data, onCerrar }) {
  const { evento, persistEvento, obtenerFotosFiesta } = data;
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

  const fotosAbiertas = Boolean(evento.fotosFiestaAbierta);
  const fijarFotos = (abiertas) => persistEvento({ ...evento, fotosFiestaAbierta: abiertas });
  const alternarFotos = () =>
    fotosAbiertas
      ? preguntar({
          titulo: "¿Cerrar las fotos?",
          texto: "Los invitados dejarán de poder subir fotos desde su tablón.",
          peligro: false,
          alConfirmar: () => fijarFotos(false),
        })
      : fijarFotos(true);

  // La cuenta se lee al abrir la ventana y al abrir o cerrar las fotos.
  const [fotos, setFotos] = useState(null);
  useEffect(() => {
    let vigente = true;
    obtenerFotosFiesta().then((lista) => vigente && setFotos(lista));
    return () => {
      vigente = false;
    };
  }, [obtenerFotosFiesta, fotosAbiertas]);

  return (
    <VentanaFlotante clave="diaEvento" titulo="Día del evento" onCerrar={onCerrar} ancho="min(300px, calc(100vw - 48px))">
      <div className="grid grid-cols-[1fr_auto] zurdo:grid-cols-[auto_1fr] items-center gap-x-2 gap-y-3">
        <FilaAbrirCerrar
          fila={1}
          abierta={llegadasAbiertas}
          Icono={DoorOpen}
          IconoCerrada={DoorClosed}
          rotulo="Llegadas"
          onAlternar={alternarLlegadas}
        >
          {llegadasAbiertas ? "Cerrar para dejar de acreditar." : "Abrir para acreditar a los invitados."}
        </FilaAbrirCerrar>
        <FilaAbrirCerrar
          fila={2}
          abierta={fotosAbiertas}
          Icono={Camera}
          IconoCerrada={CameraOff}
          rotulo="Fotos"
          onAlternar={alternarFotos}
        >
          <p>
            {fotosAbiertas ? "Dejar de permitir subir fotos." : "Permitir subir fotos."}
          </p>
          {fotos && <p>{cuentaFotosFiesta(fotos)}</p>}
        </FilaAbrirCerrar>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
