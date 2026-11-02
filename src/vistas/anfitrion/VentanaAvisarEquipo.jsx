// «Avisar al equipo» (él, v79): un aviso escrito por el anfitrión que llega
// al móvil de los colaboradores que tienen los avisos activos, como el de
// una app (una función nueva, un recordatorio). Estrecha y con lo justo.
// Solo lo que merece aviso: si llegaran demasiados, dejarían de leerlos.
import { useState } from "react";
import { Send, Check, BellOff } from "lucide-react";
import { C, OP, R, inputStyle } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { Cargando } from "../../components/Cargando";
import { SeccionPlegable } from "../../components/SeccionPlegable";
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
  const [verQuien, setVerQuien] = useState(false);
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();

  // Quién los tiene (él, v79.2: «¿puedo ver quién tiene activados los
  // avisos?»): por nombre, en orden alfabético; con cuántos móviles, si más de uno.
  const moviles = new Map((colaboradoresConAvisos || []).map((x) => [x.colaboradorId, Number(x.moviles) || 1]));
  const conAvisos = moviles.size;
  const porNombre = (a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
  const conLista = colaboradores.filter((c) => moviles.has(c.id)).sort(porNombre);
  const sinLista = colaboradores.filter((c) => !moviles.has(c.id)).sort(porNombre);
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
          {colaboradores.length > 0 && (
            <SeccionPlegable sencilla titulo="Quién los tiene" resumen={`${conLista.length} con avisos · ${sinLista.length} sin activar`} abierta={verQuien} onAlternar={() => setVerQuien((v) => !v)}>
              <div style={{ border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden", maxHeight: "40vh", overflowY: "auto" }}>
                {[...conLista, ...sinLista].map((c, i) => {
                  const tiene = moviles.has(c.id);
                  return (
                    <div key={c.id} data-con-avisos={tiene} className="flex items-center gap-2 px-2" style={{ height: 32, background: i % 2 ? C.paperDark : C.blanco }}>
                      {tiene ? <Check size={16} aria-label="Con avisos" style={{ color: C.ink, flexShrink: 0 }} /> : <BellOff size={16} aria-label="Sin activar" style={{ color: C.charcoal, opacity: OP.apagado, flexShrink: 0 }} />}
                      <span className="flex-1 min-w-0 truncate" style={{ color: tiene ? C.ink : C.charcoal, opacity: tiene ? 1 : OP.secundario }}>
                        {c.nombre}
                      </span>
                      {tiene && moviles.get(c.id) > 1 && (
                        <span className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
                          {moviles.get(c.id)} móviles
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </SeccionPlegable>
          )}
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
