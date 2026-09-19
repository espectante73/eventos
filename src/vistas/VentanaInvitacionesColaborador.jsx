// Ventana "Enviar invitaciones" para un colaborador con el permiso
// PERMISOS.INVITACIONES_ENVIAR (ver lib/permisos.js) -- a petición del
// usuario, 2026-08-25. Deliberadamente más simple que
// anfitrion/VentanaInvitaciones.jsx (esa tiene además: subir la
// plantilla de imagen, elegir carpeta de descarga, reordenar nombres,
// editar el email de cada invitado suelto -- todo eso sigue siendo
// exclusivo del anfitrión).
//
// Dos capas de "solo confirmados y pagados": `motor.familiasListasParaInvitacion`
// (lib/useMotorInvitaciones.js) YA filtra a familias confirmadas + con
// todos los pagos + con mesa asignada -- no hace falta repetir ese
// filtro aquí, es el mismo cálculo que usa el anfitrión. Y antes de
// abrir cada envío, se pide confirmar aparte que el colaborador tiene
// de verdad el dinero en su poder -- una pregunta más, no solo la lista
// ya filtrada.
import { Send, Check } from "lucide-react";
import { C } from "../theme";
import { VentanaFlotante, ModalFlotante } from "../components/VentanaFlotante";
import { Boton } from "../components/Boton";
import { usePreguntaSeguridad } from "../components/PreguntaSeguridad";

export function VentanaInvitacionesColaborador({ motor, onCerrar }) {
  const {
    familiasListasParaInvitacion,
    destinatarioConEmail,
    descargando,
    abrirPreviewInvitacion,
    previewInvitacion,
    setPreviewInvitacion,
    enviandoInvitacion,
    confirmarEnvioInvitacion,
  } = motor;

  const pendientes = familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada);
  const yaEnviadas = familiasListasParaInvitacion.filter((f) => f.invitacionEnviada);

  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const intentarEnviar = (familia) =>
    preguntar({
      titulo: "¿Tienes ya el dinero?",
      texto: `Confirma que ya tienes en tu poder el dinero de "${familia.apellido}". Solo se genera y envía la invitación si confirmas.`,
      rotulo: "Sí, lo tengo",
      peligro: false,
      alConfirmar: () => abrirPreviewInvitacion(familia),
    });

  return (
    <VentanaFlotante clave="invitaciones-colaborador" titulo="Enviar invitaciones" onCerrar={onCerrar}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
        Solo aparecen aquí las familias ya confirmadas, con todos los pagos hechos y con mesa
        asignada. Antes de cada envío se te pedirá confirmar que ya tienes el dinero en tu
        poder.
      </p>

      {pendientes.length === 0 ? (
        <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
          Todavía no hay ninguna familia lista para enviar.
        </p>
      ) : (
        <div className="space-y-2">
          {pendientes.map((f) => {
            const destinatario = destinatarioConEmail(f);
            return (
              <div
                key={f.clave}
                className="flex items-center justify-between gap-2 p-3 rounded"
                style={{ background: "#fff", border: `1px solid ${C.line}` }}
              >
                <div className="min-w-0">
                  <div className="truncate" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                    {f.apellido}
                  </div>
                  <div className="text-xs truncate" style={{ color: C.charcoal, opacity: 0.6 }}>
                    {destinatario?.email || "sin email"}
                  </div>
                </div>
                <Boton variante="principal" tamano="pequeno" onClick={() => intentarEnviar(f)} disabled={!destinatario?.email || descargando === f.clave}>
                  <Send size={13} /> {descargando === f.clave ? "Generando…" : "Enviar"}
                </Boton>
              </div>
            );
          })}
        </div>
      )}

      {yaEnviadas.length > 0 && (
        <>
          <h4 className="text-xs uppercase mt-4 mb-1" style={{ color: C.gold, letterSpacing: 1 }}>
            Ya enviadas
          </h4>
          <div className="space-y-1">
            {yaEnviadas.map((f) => (
              <div key={f.clave} className="flex items-center gap-2 text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
                <Check size={12} style={{ color: C.ink }} /> {f.apellido}
              </div>
            ))}
          </div>
        </>
      )}

      {previewInvitacion && (
        <ModalFlotante titulo="Confirmar envío" onCerrar={() => setPreviewInvitacion(null)}>
          <p className="text-sm mb-2" style={{ color: C.charcoal }}>
            Se enviará a <b>{previewInvitacion.destinatario.email}</b>.
          </p>
          <img
            src={previewInvitacion.dataUrl}
            alt=""
            className="w-full rounded mb-3"
            style={{ border: `1px solid ${C.line}` }}
          />
          <div className="flex gap-2 justify-end zurdo:flex-row-reverse">
            <Boton variante="secundario" onClick={() => setPreviewInvitacion(null)}>
              Cancelar
            </Boton>
            <Boton variante="principal" onClick={confirmarEnvioInvitacion} disabled={enviandoInvitacion}>
              {enviandoInvitacion ? "Enviando…" : "Confirmar y enviar"}
            </Boton>
          </div>
        </ModalFlotante>
      )}
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
