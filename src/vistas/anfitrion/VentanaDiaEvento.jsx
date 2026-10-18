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
//
// Las fotos se eligen FUERA de la app (él, v67.6): aquí solo se descargan
// todas en un ZIP, una carpeta por familia. Sin ventana para verlas.
import { useEffect, useState } from "react";
import { DoorOpen, DoorClosed, Camera, CameraOff, Download, QrCode, UserCheck } from "lucide-react";
import { C, OP } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { supabase } from "../../supabaseClient";
import { crearZip } from "../../lib/zip";
import { descargarBlob } from "../../lib/descargas";
import { bajarFotosFiesta, ARCHIVO_FOTOS_FIESTA } from "../../lib/fotosFiesta";
import { descargarTarjetasQr, ARCHIVO_TARJETAS_QR } from "../../lib/pdfTarjetasQr";
import { construirEnlaceTablon } from "../../lib/url";

// «12 fotos» y «De 5 familias, en un ZIP.», contando cada familia una vez.
// En dos líneas, como las demás filas: en una no cabía junto al botón.
const cuantas = (n, una, varias) => `${n} ${n === 1 ? una : varias}`;
export function cuentaFotosFiesta(fotos) {
  const familias = new Set(fotos.map((f) => f.familia)).size;
  return { titulo: cuantas(fotos.length, "foto", "fotos"), detalle: `De ${cuantas(familias, "familia", "familias")}, en un ZIP.` };
}

// Las dos celdas de cada fila de la rejilla, con su espejo para zurdos.
const CELDA_TEXTO = "col-start-1 zurdo:col-start-2 min-w-0";
const CELDA_BOTON = "col-start-2 zurdo:col-start-1";

// La celda del texto: icono y rótulo en una línea; debajo, en pequeño, para
// qué es el botón.
function CeldaTexto({ fila, Icono, titulo, children }) {
  return (
    <div className={CELDA_TEXTO} style={{ gridRow: fila }}>
      <span className="flex items-center gap-2 text-sm min-w-0" style={{ color: C.ink }}>
        <Icono size={16} style={{ flexShrink: 0 }} />
        <span className="truncate">{titulo}</span>
      </span>
      <div className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
        {children}
      </div>
    </div>
  );
}

function FilaAbrirCerrar({ fila, abierta, Icono, IconoCerrada, rotulo, onAlternar, children }) {
  return (
    <>
      <CeldaTexto
        fila={fila}
        Icono={abierta ? Icono : IconoCerrada}
        titulo={
          <>
            <b>{rotulo}</b>
            <span style={{ color: abierta ? C.ink : C.peligro, fontWeight: 600 }}>
              {" · "}
              {abierta ? "abiertas" : "cerradas"}
            </span>
          </>
        }
      >
        {children}
      </CeldaTexto>
      <Boton
        variante={abierta ? "secundario" : "principal"}
        onClick={onAlternar}
        className={CELDA_BOTON}
        style={{ gridRow: fila }}
      >
        {abierta ? "Cerrar" : "Abrir"}
      </Boton>
    </>
  );
}

export function VentanaDiaEvento({ data, onCerrar, onAbrirMarcador }) {
  const { evento, persistEvento, obtenerFotosFiesta, invitados = [], tokenTablon } = data;
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

  // Las tarjetas QR de las mesas (v67.7): llevan el enlace del tablón, el
  // mismo de Mi cuenta. Avisa al terminar (norma 9).
  const descargarTarjetas = async () => {
    const enlace = construirEnlaceTablon(evento.urlPublica, tokenTablon);
    if (!enlace) {
      preguntar({ titulo: "Todavía no", texto: "Falta la dirección pública de la app, en Configuración.", soloAviso: true });
      return;
    }
    await descargarTarjetasQr({ enlace, nombreEvento: evento.nombre });
    preguntar({ titulo: "Tarjetas descargadas", texto: `${ARCHIVO_TARJETAS_QR}\nLo tienes en tu carpeta de Descargas.`, soloAviso: true });
  };

  // Todas en un ZIP, y avisa al terminar (norma 9: pasa fuera de la pantalla).
  const [descargando, setDescargando] = useState(false);
  const descargarFotos = async () => {
    setDescargando(true);
    const lista = await obtenerFotosFiesta();
    const { archivos, fallidas } = await bajarFotosFiesta(supabase, lista, invitados);
    if (archivos.length) descargarBlob(ARCHIVO_FOTOS_FIESTA, new Blob([crearZip(archivos)], { type: "application/zip" }));
    setFotos(lista);
    setDescargando(false);
    preguntar({
      titulo: archivos.length ? "Fotos descargadas" : "No se pudo",
      texto: [
        archivos.length && `${ARCHIVO_FOTOS_FIESTA}\nLo tienes en tu carpeta de Descargas.`,
        fallidas && `No se pudieron bajar ${fallidas} de ${lista.length}: vuelve a intentarlo.`,
        !lista.length && "Todavía no hay fotos.",
      ]
        .filter(Boolean)
        .join("\n"),
      soloAviso: true,
    });
  };

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
          {llegadasAbiertas ? "Dejar de permitir acreditar invitados." : "Permitir acreditar invitados."}
        </FilaAbrirCerrar>
        {/* El marcador grande de llegadas (v69.2), junto a las llegadas. */}
        <CeldaTexto fila={2} Icono={UserCheck} titulo={<b>Marcador</b>}>
          Ya están y faltan, en grande.
        </CeldaTexto>
        <Boton onClick={onAbrirMarcador} className={CELDA_BOTON} style={{ gridRow: 2 }}>
          Abrir
        </Boton>
        <FilaAbrirCerrar
          fila={3}
          abierta={fotosAbiertas}
          Icono={Camera}
          IconoCerrada={CameraOff}
          rotulo="Fotos"
          onAlternar={alternarFotos}
        >
          {fotosAbiertas ? "Dejar de permitir subir fotos." : "Permitir subir fotos."}
        </FilaAbrirCerrar>
        <CeldaTexto fila={4} Icono={QrCode} titulo={<b>Tarjetas QR</b>}>
          Para las mesas, de pie: 2 por folio.
        </CeldaTexto>
        <Boton onClick={descargarTarjetas} className={CELDA_BOTON} style={{ gridRow: 4 }}>
          Descargar
        </Boton>
        {fotos?.length > 0 && (
          <>
            <CeldaTexto fila={5} Icono={Download} titulo={<b>{cuentaFotosFiesta(fotos).titulo}</b>}>
              {cuentaFotosFiesta(fotos).detalle}
            </CeldaTexto>
            <Boton onClick={descargarFotos} disabled={descargando} className={CELDA_BOTON} style={{ gridRow: 5 }}>
              {descargando ? "Preparando…" : "Descargar"}
            </Boton>
          </>
        )}
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
