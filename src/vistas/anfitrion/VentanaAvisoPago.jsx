// «Aviso de pago» (él, v89), en Lista de invitados → Acciones: el ANFITRIÓN
// escribe por WhatsApp a cada persona que no ha pagado. Una línea por
// persona (norma 6), agrupadas por familia; al tocar WhatsApp, el chat se
// abre con su mensaje ya escrito y él solo pulsa «Enviar». Arriba, la fecha
// límite, que va en el mensaje. Las reglas y el texto, en lib/avisoPago.js.
import { useState } from "react";
import { C, OP, R, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { LineaAviso } from "../../components/LineaAviso";
import { TextInput } from "../../components/Formulario";
import { FilaMarcable as Fila, ALTO_FILA_MARCABLE } from "../../components/FilaMarcable";
import { BotonWhatsapp, IconoWhatsApp } from "../../components/Contacto";
import { avisosDePago } from "../../lib/avisoPago";
import { hoyISO } from "../../lib/impagos";

// El rótulo de un campo, como los de Field, pero en la misma línea (norma 6).
const ROTULO = { color: C.gold, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em", whiteSpace: "nowrap" };

export function VentanaAvisoPago({ data, onCerrar }) {
  const { invitados, evento, colaboradores } = data;
  const [limite, setLimite] = useState("");
  const { filas, aviso } = avisosDePago({ invitados, evento, colaboradores, limite });
  const sinTelefono = filas.filter((f) => !f.telefono).length;

  return (
    <VentanaFlotante clave="avisoPago" titulo="Aviso de pago" onCerrar={onCerrar} ancho="min(420px, calc(100vw - 48px))">
      {aviso ? (
        <LineaAviso className="text-sm">{aviso}</LineaAviso>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="uppercase text-xs" style={ROTULO}>
              Fecha límite
            </span>
            <TextInput type="date" aria-label="Fecha límite" value={limite} min={hoyISO()} onChange={(e) => setLimite(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
          </div>
          {!limite && <LineaAviso className="text-xs">Elige la fecha límite: va en el mensaje.</LineaAviso>}
          <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
            {filas.length === 0 ? "Todos los confirmados han pagado." : `${filas.length} sin pagar${sinTelefono ? ` · ${sinTelefono} sin teléfono` : ""}`}
          </p>
          {filas.length > 0 && (
            <div style={{ border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden", maxHeight: "55vh", overflowY: "auto" }}>
              {filas.map((f, i) => (
                <Fila key={f.invitado.id} i={i} nombre={f.nombre} nota={f.importe}>
                  {!f.telefono ? (
                    <span style={{ color: C.charcoal, opacity: OP.secundario, fontSize: T.pequeno, whiteSpace: "nowrap" }}>Sin teléfono</span>
                  ) : f.texto ? (
                    <BotonWhatsapp telefono={f.telefono} nombre={f.nombre} mensaje={f.texto} lado={ALTO_FILA_MARCABLE} />
                  ) : (
                    // Sin fecha límite, todavía no: el mensaje la lleva.
                    <span aria-label="Elige antes la fecha límite" className="flex items-center justify-center" style={{ minWidth: ALTO_FILA_MARCABLE, opacity: OP.apagado }}>
                      <IconoWhatsApp />
                    </span>
                  )}
                </Fila>
              ))}
            </div>
          )}
          {/* La ayuda, al pie y plegada (norma 5). */}
          <details className="text-xs" style={{ color: C.charcoal }}>
            <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
              Cómo funciona
            </summary>
            <p className="mt-2" style={{ opacity: OP.secundario }}>
              Al tocar WhatsApp se abre el chat con su mensaje ya escrito: solo falta pulsar «Enviar». El mensaje es el mismo para toda la familia, con
              el nombre de quien lo recibe, la fecha de hoy, los días que quedan y lo que debe toda la familia. Sale desde tu número.
            </p>
          </details>
        </div>
      )}
    </VentanaFlotante>
  );
}
