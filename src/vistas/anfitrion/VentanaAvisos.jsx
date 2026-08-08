// Ventana "Avisos": resumen de pendientes (datos e invitaciones),
// colaboradores a los que avisar ("Avisar ahora" con vista previa del
// email antes de confirmar), historial de emails enviados con ✓/✗/? y
// filtro por tipo, y el resumen de invitaciones a familias pendientes.
// Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4,
// Ronda 4).
//
// Varias piezas NO viven aquí porque las comparte con la ventana
// Invitaciones (el motor de "enviar la invitación a una familia" es uno
// solo, usado desde las dos): familiasListasParaInvitacion,
// destinatarioConEmail, descargando y abrirPreviewInvitacion siguen en
// VistaAnfitrion y llegan como props. colaboradoresPendientes tampoco es
// exclusiva de aquí (también la usa el resumen de asignación de la tabla
// principal de invitados), así que también llega como prop.
import { useState } from "react";
import { C } from "../../theme";
import { Stamp, EncabezadoOrdenable } from "../../components/Widgets";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";

const ETIQUETA_TIPO_AVISO = {
  asignados: "Asignados",
  datos: "Datos",
  invitacion: "Invitación",
};

export function VentanaAvisos({
  data,
  familiasListasParaInvitacion,
  destinatarioConEmail,
  descargando,
  abrirPreviewInvitacion,
  colaboradoresPendientes,
  setFiltros,
  setAbierto,
  onCerrar,
}) {
  const { evento, invitados, colaboradores, avisosEnviados, avisarColaborador } = data;

  const datosConfirmadosPendientes = invitados.filter(
    (g) => g.avisoPendiente && g.confirmado
  ).length;

  const [filtroTipoAviso, setFiltroTipoAviso] = useState("todos"); // "todos" | "asignados" | "datos" | "invitacion"
  const [ordenAvisos, setOrdenAvisos] = useState({ columna: "fecha", direccion: "desc" });
  const cambiarOrdenAvisos = (columna) => {
    setOrdenAvisos((o) =>
      o.columna === columna
        ? { columna, direccion: o.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: "asc" }
    );
  };

  // Antes de mandar un aviso individual ("Avisar ahora"), se enseña el
  // mensaje exacto que se va a enviar y se pide confirmar — con opción de
  // ir directo a editar la plantilla si algo no convence.
  const [avisoPreview, setAvisoPreview] = useState(null); // { id, nombre } | null
  const [enviandoAvisoPreview, setEnviandoAvisoPreview] = useState(false);

  const confirmarEnvioAvisoPreview = async () => {
    if (!avisoPreview) return;
    setEnviandoAvisoPreview(true);
    await avisarColaborador(avisoPreview.id);
    setEnviandoAvisoPreview(false);
    setAvisoPreview(null);
  };

  const irAEditarAsignacion = () => {
    if (avisoPreview) {
      setFiltros((f) => ({ ...f, colaboradorId: avisoPreview.id }));
    }
    setAvisoPreview(null);
    setAbierto((a) => ({ ...a, invitados: true, avisos: false }));
  };

  const emailsFiltrados = avisosEnviados.filter(
    (a) => filtroTipoAviso === "todos" || a.tipo === filtroTipoAviso
  );
  const emailsOrdenados = [...emailsFiltrados].sort((a, b) => {
    let cmp = 0;
    if (ordenAvisos.columna === "fecha") {
      cmp = new Date(a.creadoEn) - new Date(b.creadoEn);
    } else if (ordenAvisos.columna === "email") {
      cmp = (a.destinatario || "").localeCompare(b.destinatario || "");
    } else if (ordenAvisos.columna === "tipo") {
      cmp = (a.tipo || "").localeCompare(b.tipo || "");
    }
    return ordenAvisos.direccion === "asc" ? cmp : -cmp;
  });
  const columnasHistorial = "110px 28px 80px 1fr 1fr";

  return (
    <>
      <VentanaFlotante
        clave="avisos"
        titulo={`Avisos${colaboradoresPendientes.length > 0 ? ` (${colaboradoresPendientes.length})` : ""}`}
        onCerrar={onCerrar}
      >
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                color: datosConfirmadosPendientes > 0 ? C.wax : C.ink,
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {datosConfirmadosPendientes}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
              Datos pendientes (confirmados)
            </div>
          </div>
          <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                color:
                  familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length > 0
                    ? C.wax
                    : C.ink,
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length}
            </div>
            <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
              Invitaciones pendientes
            </div>
          </div>
        </div>

        <div className="mb-5">
          <p
            className="text-xs uppercase mb-2"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Pendientes de avisar
          </p>
          {colaboradoresPendientes.length === 0 ? (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Ninguno — todos los colaboradores están al día.
            </p>
          ) : (
            <div className="space-y-2">
              {colaboradoresPendientes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
                  style={{ background: "#FBEAEC" }}
                >
                  <span className="text-sm" style={{ color: C.ink }}>
                    {c.nombre}
                    {!c.email && (
                      <span className="text-xs" style={{ color: C.wax }}> — sin email</span>
                    )}
                  </span>
                  <button
                    onClick={() => setAvisoPreview({ id: c.id, nombre: c.nombre })}
                    disabled={!c.email}
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{
                      background: c.email ? C.wax : C.line,
                      color: c.email ? "#fff" : C.charcoal,
                    }}
                  >
                    Avisar ahora
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-5">
          <p
            className="text-xs uppercase mb-2"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Emails enviados
          </p>
          <div className="flex gap-2 mb-2">
            {[
              { clave: "todos", etiqueta: "Todos" },
              { clave: "asignados", etiqueta: "Asignados" },
              { clave: "datos", etiqueta: "Datos" },
              { clave: "invitacion", etiqueta: "Invitación" },
            ].map((op) => (
              <button
                key={op.clave}
                onClick={() => setFiltroTipoAviso(op.clave)}
                className="text-xs px-2 py-1 rounded font-medium"
                style={{
                  background: filtroTipoAviso === op.clave ? C.ink : "transparent",
                  color: filtroTipoAviso === op.clave ? C.paper : C.charcoal,
                  border: `1px solid ${filtroTipoAviso === op.clave ? C.ink : C.line}`,
                }}
              >
                {op.etiqueta}
              </button>
            ))}
          </div>
          {emailsOrdenados.length === 0 ? (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              {avisosEnviados.length === 0
                ? "Todavía no se ha enviado ningún aviso."
                : "Ninguno de este tipo todavía."}
            </p>
          ) : (
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              <div
                className="grid text-xs mb-1 pb-1"
                style={{ gridTemplateColumns: columnasHistorial, borderBottom: `1px solid ${C.line}` }}
              >
                <EncabezadoOrdenable columna="fecha" orden={ordenAvisos} onClick={cambiarOrdenAvisos}>
                  Fecha
                </EncabezadoOrdenable>
                <span title="¿Resend confirmó el envío?" style={{ color: C.gold }}>✓?</span>
                <EncabezadoOrdenable columna="tipo" orden={ordenAvisos} onClick={cambiarOrdenAvisos}>
                  Tipo
                </EncabezadoOrdenable>
                <EncabezadoOrdenable columna="email" orden={ordenAvisos} onClick={cambiarOrdenAvisos}>
                  Email
                </EncabezadoOrdenable>
                <span className="text-center" style={{ color: C.gold }}>Asunto</span>
              </div>
              <div className="space-y-1">
                {emailsOrdenados.map((a) => (
                  <div
                    key={a.id}
                    className="grid items-center text-xs py-1"
                    style={{ gridTemplateColumns: columnasHistorial, borderBottom: `1px solid ${C.line}` }}
                  >
                    <span style={{ color: C.charcoal, opacity: 0.5 }} className="whitespace-nowrap">
                      {new Date(a.creadoEn).toLocaleString("es-ES")}
                    </span>
                    <span
                      title={
                        a.exito === true
                          ? "Resend lo aceptó"
                          : a.exito === false
                          ? "Resend lo rechazó — revisa la clave o el remitente"
                          : "Todavía sin confirmar (se comprueba solo cada minuto)"
                      }
                      style={{ color: a.exito === true ? C.ink : a.exito === false ? C.wax : C.line }}
                    >
                      {a.exito === true ? "✓" : a.exito === false ? "✗" : "?"}
                    </span>
                    <span style={{ color: C.charcoal, opacity: 0.7 }}>
                      {ETIQUETA_TIPO_AVISO[a.tipo] || a.tipo}
                    </span>
                    <span style={{ color: C.charcoal, opacity: 0.7 }} className="truncate">
                      {a.destinatario}
                    </span>
                    <span style={{ color: C.ink }} className="truncate">
                      {a.asunto}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4" style={{ borderTop: `2px solid ${C.line}` }}>
          <p
            className="text-xs uppercase mb-2"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Invitaciones a familias
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
              <div style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700, fontSize: 18 }}>
                {familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length}
              </div>
              <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Pendientes</div>
            </div>
            <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
              <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 18 }}>
                {familiasListasParaInvitacion.filter((f) => f.invitacionEnviada).length}
              </div>
              <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Enviadas</div>
            </div>
            <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
              <div style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700, fontSize: 18 }}>
                {
                  familiasListasParaInvitacion.filter(
                    (f) => !f.invitacionEnviada && !destinatarioConEmail(f)?.email
                  ).length
                }
              </div>
              <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Sin email</div>
            </div>
          </div>
          {familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length === 0 ? (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Ninguna familia lista con la invitación pendiente de enviar.
            </p>
          ) : (
            <div className="space-y-2">
              {familiasListasParaInvitacion
                .filter((f) => !f.invitacionEnviada)
                .map((f) => (
                  <div
                    key={f.clave}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
                    style={{ background: "#FBEAEC" }}
                  >
                    <span className="text-sm" style={{ color: C.ink }}>
                      Familia {f.apellido}
                      {!destinatarioConEmail(f)?.email && (
                        <span className="text-xs" style={{ color: C.wax }}> — sin email</span>
                      )}
                    </span>
                    <button
                      onClick={() => abrirPreviewInvitacion(f)}
                      disabled={!destinatarioConEmail(f)?.email || descargando === f.clave}
                      className="text-xs px-2 py-1 rounded font-medium"
                      style={{
                        background: destinatarioConEmail(f)?.email ? C.wax : C.line,
                        color: destinatarioConEmail(f)?.email ? "#fff" : C.charcoal,
                      }}
                    >
                      {descargando === f.clave ? "Generando…" : "Enviar ahora"}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </VentanaFlotante>

      {avisoPreview && (
        <ModalFlotante
          titulo={`Avisar a ${avisoPreview.nombre}`}
          onCerrar={() => setAvisoPreview(null)}
        >
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Colaborador
          </p>
          <p className="text-sm mb-3" style={{ color: C.ink }}>
            {avisoPreview.nombre}
            {" — "}
            {colaboradores.find((c) => c.id === avisoPreview.id)?.email || "sin email"}
          </p>
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Invitados asignados ({invitados.filter((g) => g.colaboradorId === avisoPreview.id).length}
            {" "}en total)
          </p>
          <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
            {invitados
              .filter((g) => g.colaboradorId === avisoPreview.id)
              .map((g) => (
                <li key={g.id}>
                  {g.apellido}, {g.nombre}
                  {g.avisoPendiente && g.confirmado && (
                    <span
                      className="text-xs ml-2 px-1.5 py-0.5 rounded"
                      style={{ background: C.wax, color: "#fff" }}
                    >
                      nuevo — se incluye en el email
                    </span>
                  )}
                  {g.avisoPendiente && !g.confirmado && (
                    <span
                      className="text-xs ml-2 px-1.5 py-0.5 rounded"
                      style={{ background: C.line, color: C.charcoal }}
                    >
                      tentativa — no se avisa todavía
                    </span>
                  )}
                </li>
              ))}
          </ul>
          <p
            className="text-xs uppercase mb-2"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Mensaje que se enviará
          </p>
          <div
            className="p-3 rounded text-sm mb-4"
            style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
            dangerouslySetInnerHTML={{
              __html: (evento.plantillaAsignacion || "").replace(
                "{colaborador}",
                avisoPreview.nombre
              ),
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={confirmarEnvioAvisoPreview}
              disabled={enviandoAvisoPreview}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoAvisoPreview ? "Enviando…" : "Aceptar y enviar"}
            </button>
            <button
              onClick={() => setAvisoPreview(null)}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Cancelar
            </button>
            <button
              onClick={irAEditarAsignacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.gold}`, color: C.gold }}
            >
              Editar asignación
            </button>
          </div>
        </ModalFlotante>
      )}
    </>
  );
}
