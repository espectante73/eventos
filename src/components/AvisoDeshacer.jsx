// Botón "Deshacer" de la última acción destructiva (2026-09-17).
//
// Sustituye a las copias en JSON que se descargaban solas antes de cada
// reinicio o borrado. El usuario lo resumió bien: sin poder volver a
// subirlas, aquello no era un deshacer, solo archivos en la carpeta de
// Descargas. Ahora la foto se guarda en el servidor -- la misma maquinaria
// que ya usaba el Modo Pruebas -- y vuelve desde aquí.
//
// Solo se guarda la ÚLTIMA: deshacer lo de anteayer sigue siendo cosa del
// volcado diario.
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { C } from "../theme";
import { Boton } from "./Boton";
import { ModalFlotante } from "./VentanaFlotante";
import { formatearFecha } from "../lib/formato";

export function AvisoDeshacer({ data }) {
  const { fotoDeshacer, refrescarFotoDeshacer, deshacerUltimaAccion } = data;
  const [confirmando, setConfirmando] = useState(false);
  const [deshaciendo, setDeshaciendo] = useState(false);

  useEffect(() => {
    refrescarFotoDeshacer?.();
  }, [refrescarFotoDeshacer]);

  if (!fotoDeshacer) return null;

  const cuando = fotoDeshacer.creadoEn ? formatearFecha(fotoDeshacer.creadoEn) : "";

  return (
    <>
      <div
        className="flex items-center justify-between gap-2 flex-wrap rounded px-3 py-2 mb-3"
        style={{ background: C.avisoFondo, border: `1px solid ${C.peligro}` }}
      >
        <span className="text-xs" style={{ color: C.charcoal }}>
          Se puede deshacer: <b>{fotoDeshacer.accion || "última acción"}</b>
          {cuando && ` · ${cuando}`}
        </span>
        <Boton variante="peligro" tamano="pequeno" icono={RotateCcw} onClick={() => setConfirmando(true)}>
          Deshacer
        </Boton>
      </div>

      {confirmando && (
        <ModalFlotante
          titulo="¿Deshacer?"
          onCerrar={() => setConfirmando(false)}
          ancho={420}
          acciones={
            <>
              <Boton
                variante="peligro"
                disabled={deshaciendo}
                onClick={async () => {
                  setDeshaciendo(true);
                  const ok = await deshacerUltimaAccion();
                  setDeshaciendo(false);
                  setConfirmando(false);
                  // Recargar: la base ha cambiado por completo bajo los pies
                  // de la pantalla, y repintar a mano cada lista sería
                  // reinventar lo que el navegador hace de una pieza.
                  if (ok) window.location.reload();
                }}
              >
                {deshaciendo ? "Deshaciendo…" : "Sí, deshacer"}
              </Boton>
              <Boton onClick={() => setConfirmando(false)}>Cancelar</Boton>
            </>
          }
        >
          <p className="text-sm" style={{ color: C.charcoal }}>
            Los datos volverán a como estaban antes de <b>{fotoDeshacer.accion || "la última acción"}</b>
            {cuando && ` (${cuando})`}. Se perderá lo que hayas cambiado desde entonces, y solo se puede
            deshacer una vez.
          </p>
        </ModalFlotante>
      )}
    </>
  );
}
