// «Avisar al equipo» (él, v79): un aviso escrito por el anfitrión que llega
// al móvil de los colaboradores que tienen los avisos activos, como el de
// una app (una función nueva, un recordatorio). Estrecha y con lo justo.
// Solo lo que merece aviso: si llegaran demasiados, dejarían de leerlos.
import { useState } from "react";
import { Send, Check } from "lucide-react";
import { C, OP, inputStyle } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { Cargando } from "../../components/Cargando";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { useSeccion } from "../../lib/useSeccion";

// Lo que cabe en un aviso sin que el móvil lo corte.
const LARGO_MAXIMO = 180;

export function VentanaAvisarEquipo({ data, onCerrar }) {
  const { colaboradores, colaboradoresConAvisos, avisarAlEquipo } = data;
  const listo = useSeccion(data, "avisosMovil");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // { enviados, fallidos } | { error }
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();

  const conAvisos = new Set((colaboradoresConAvisos || []).map((x) => x.colaboradorId)).size;
  const enviar = () =>
    preguntar({
      titulo: "¿Enviar el aviso?",
      texto: `Llegará al móvil de ${conAvisos === 1 ? "1 colaborador" : `${conAvisos} colaboradores`}.`,
      rotulo: "Sí",
      peligro: false,
      alConfirmar: async () => {
        setEnviando(true);
        setResultado(await avisarAlEquipo({ titulo: "Novedad", texto: texto.trim() }));
        setEnviando(false);
      },
    });

  return (
    <VentanaFlotante clave="avisarEquipo" titulo="Avisar al equipo" onCerrar={onCerrar} ancho="min(420px, calc(100vw - 48px))">
      {!listo || colaboradoresConAvisos === null ? (
        <Cargando />
      ) : (
        <div className="space-y-3 text-sm">
          <p style={{ color: C.charcoal, opacity: OP.secundario }}>
            {conAvisos === 0
              ? "Ningún colaborador tiene todavía los avisos activos: se activan en su panel, en «Avisos en este móvil»."
              : `${conAvisos} de ${colaboradores.length} colaboradores tienen los avisos activos.`}
          </p>
          <textarea
            aria-label="Texto del aviso"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value.slice(0, LARGO_MAXIMO));
              setResultado(null);
            }}
            rows={3}
            placeholder="Por ejemplo: nueva función, ya pueden llamar a sus invitados desde su ficha."
            style={{ ...inputStyle, width: "100%", resize: "vertical" }}
          />
          <div className="flex items-center gap-2 zurdo:flex-row-reverse">
            <span className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
              {texto.length}/{LARGO_MAXIMO}
            </span>
            <Boton variante="principal" icono={Send} className="ml-auto zurdo:ml-0 zurdo:mr-auto" disabled={!texto.trim() || conAvisos === 0 || enviando} onClick={enviar}>
              {enviando ? "Enviando…" : "Enviar"}
            </Boton>
          </div>
          {resultado?.error && <LineaAviso className="text-sm">{resultado.error}</LineaAviso>}
          {resultado && !resultado.error && (
            <p className="flex items-center gap-1.5" style={{ color: C.ink }}>
              <Check size={16} aria-hidden />
              {resultado.enviados === 1 ? "Enviado a 1 móvil." : `Enviado a ${resultado.enviados} móviles.`}
              {resultado.fallidos ? ` ${resultado.fallidos} no llegaron (avisos quitados en ese móvil).` : ""}
            </p>
          )}
        </div>
      )}
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
