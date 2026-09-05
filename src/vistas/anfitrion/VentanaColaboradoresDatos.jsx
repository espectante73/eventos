// Ventana "Datos Colab.": añadir uno nuevo (buscando entre los invitados
// ya existentes) y la tarjeta de cada uno (ColaboradorCard: enlace,
// email, invitación, relevo, eliminar, y sus invitados asignados con
// reasignación). Es la antigua VentanaColaboradores.jsx, solo renombrada
// y con clave nueva — accesible desde el submenú "Colaboradores" de
// "Abrir sección…" (reparto del 2026-08-09).
//
// 2026-09-05: absorbe lo que era la ventana "Avisos". El usuario lo vio
// claro -- "Avisos y configuración colaboradores trabajan en conjunto"
// -- y al mirarlo por dentro, Avisos no era un tema sino tres cosas de
// sitios distintos: los colaboradores a avisar (que esta tarjeta YA
// calculaba y mostraba, solo le faltaba el botón), las invitaciones
// pendientes (duplicado de la ventana Invitaciones, que ya lista las
// familias y las envía) y el historial de emails. Los avisos y el
// historial viven ahora aquí; lo de invitaciones se quedó donde ya
// estaba y Avisos desapareció del menú.
import { useState } from "react";
import { Plus, Mail } from "lucide-react";
import { C } from "../../theme";
import { uid } from "../../lib/id";
import { datosCompletos, resolverColaborador } from "../../lib/invitados";
import { BuscadorInvitado } from "../../components/BuscadorInvitado";
import { ColaboradorCard } from "../../components/ColaboradorCard";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { EncabezadoOrdenable } from "../../components/Widgets";

const ETIQUETA_TIPO_AVISO = {
  asignados: "Asignados",
  datos: "Datos",
  invitacion: "Invitación",
};

export function VentanaColaboradoresDatos({ data, asignarColaborador, setFiltros, setAbierto, onCerrar }) {
  const {
    evento,
    colaboradores,
    invitados,
    avisosEnviados,
    avisarColaborador,
    persistColaboradores,
    persistInvitados,
    probarEmailColaborador,
    enviarInvitacionLogin,
    confirmarEmailColaboradorActualizado,
  } = data;
  const [nuevoColab, setNuevoColab] = useState({ invitadoId: "" });

  // ---------- Aviso a un colaborador (antes, ventana "Avisos") ----------
  // Antes de mandarlo se enseña el mensaje exacto que se va a enviar y se
  // pide confirmar, con opción de ir directo a revisar su asignación si
  // algo no convence. Mismo flujo de siempre, solo cambia dónde vive.
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
    if (avisoPreview) setFiltros((f) => ({ ...f, colaboradorId: avisoPreview.id }));
    setAvisoPreview(null);
    setAbierto((a) => ({ ...a, invitados: true, "colaboradores-datos": false }));
  };

  // ---------- Historial de emails enviados ----------
  const [filtroTipoAviso, setFiltroTipoAviso] = useState("todos");
  const [ordenAvisos, setOrdenAvisos] = useState({ columna: "fecha", direccion: "desc" });
  const cambiarOrdenAvisos = (columna) => {
    setOrdenAvisos((o) =>
      o.columna === columna
        ? { columna, direccion: o.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: "asc" }
    );
  };
  const emailsFiltrados = avisosEnviados.filter(
    (a) => filtroTipoAviso === "todos" || a.tipo === filtroTipoAviso
  );
  const emailsOrdenados = [...emailsFiltrados].sort((a, b) => {
    let cmp = 0;
    if (ordenAvisos.columna === "fecha") cmp = new Date(a.creadoEn) - new Date(b.creadoEn);
    else if (ordenAvisos.columna === "email") cmp = (a.destinatario || "").localeCompare(b.destinatario || "");
    else if (ordenAvisos.columna === "tipo") cmp = (a.tipo || "").localeCompare(b.tipo || "");
    return ordenAvisos.direccion === "asc" ? cmp : -cmp;
  });
  const columnasHistorial = "110px 28px 80px 1fr 1fr";

  const idsYaColaboradores = new Set(colaboradores.map((c) => c.invitadoId).filter(Boolean));
  const invitadosDisponiblesParaColaborador = invitados.filter((g) => !idsYaColaboradores.has(g.id));

  const agregarColaborador = () => {
    if (!nuevoColab.invitadoId) return;

    const inv = invitados.find((g) => g.id === nuevoColab.invitadoId);
    if (!inv) return;
    const nombreFinal = `${inv.apellido}, ${inv.nombre}`.trim();

    persistColaboradores([
      ...colaboradores,
      { id: uid(), nombre: nombreFinal, invitadoId: nuevoColab.invitadoId, email: "" },
    ]);
    setNuevoColab({ invitadoId: "" });
  };

  const eliminarColaborador = (id) => {
    persistColaboradores(colaboradores.filter((c) => c.id !== id));
  };

  const cambiarEmailColaborador = (id, email) => {
    persistColaboradores(colaboradores.map((c) => (c.id === id ? { ...c, email } : c)));
  };

  // Relevo: un nuevo colaborador toma el relevo del anterior. Los invitados ya
  // asignados (y sus datos ya recopilados) pasan al nuevo sin perder nada.
  const relevarColaborador = (idAnterior, { invitadoId, nombreNuevo }) => {
    const anterior = colaboradores.find((c) => c.id === idAnterior);
    if (!anterior) return;

    let invitadoIdFinal = invitadoId;
    let nombreFinal = nombreNuevo;
    let invitadosSiguientes = invitados;

    if (invitadoIdFinal) {
      const inv = invitados.find((g) => g.id === invitadoIdFinal);
      if (inv) nombreFinal = `${inv.apellido}, ${inv.nombre}`.trim();
    } else if (nombreFinal) {
      const [apellido = "", nombre = ""] = nombreFinal.split(",").map((s) => s.trim());
      const nuevoInvitadoObj = {
        id: uid(),
        nombre,
        apellido,
        zona: "",
        confirmado: false,
        colaboradorId: null,
        grupoFamiliar: apellido || nombre,
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        rolFamiliar: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      };
      invitadoIdFinal = nuevoInvitadoObj.id;
      invitadosSiguientes = [...invitados, nuevoInvitadoObj];
    } else {
      return;
    }

    const nuevoId = uid();
    persistColaboradores(
      colaboradores
        .filter((c) => c.id !== idAnterior)
        .concat({ id: nuevoId, nombre: nombreFinal, invitadoId: invitadoIdFinal, email: "" })
    );
    persistInvitados(
      invitadosSiguientes.map((g) =>
        g.colaboradorId === idAnterior ? { ...g, colaboradorId: nuevoId } : g
      )
    );
  };

  return (
    <>
    <VentanaFlotante clave="colaboradores-datos" titulo="Datos de colaboradores" onCerrar={onCerrar}>
      {/* Añadir uno nuevo va plegado: se hace unas pocas veces y ocupaba
          media ventana con su explicación -- lo que se mira a diario son
          las tarjetas de abajo (2026-09-06). */}
      <div className="mb-3">
        <SeccionPlegable
          icono={Plus}
          titulo="Añadir colaborador"
          resumen={`${colaboradores.length} en total`}
        >
          <p className="text-xs mb-2 pt-1" style={{ color: C.charcoal, opacity: 0.7 }}>
            Los colaboradores son también invitados del evento: búscalo por apellido o nombre
            entre los ya añadidos a la lista. Si aún no está, añádelo primero en la Lista de
            invitados.
          </p>
          <div className="flex flex-wrap gap-2">
            <BuscadorInvitado
              invitados={invitadosDisponiblesParaColaborador}
              invitadoId={nuevoColab.invitadoId}
              onSeleccionar={(id) => setNuevoColab({ ...nuevoColab, invitadoId: id })}
              placeholder="Buscar invitado para hacerlo colaborador..."
            />
            <button
              onClick={agregarColaborador}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              <Plus size={14} /> Añadir
            </button>
          </div>
        </SeccionPlegable>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {colaboradores.map((c) => {
          const pendientes = invitados.filter(
            (g) =>
              resolverColaborador(g, colaboradores)?.id === c.id &&
              g.confirmado &&
              !datosCompletos(g)
          ).length;
          return (
            <ColaboradorCard
              key={c.id}
              c={c}
              pendientes={pendientes}
              invitados={invitados}
              colaboradores={colaboradores}
              onEliminar={eliminarColaborador}
              onRelevar={relevarColaborador}
              onAsignarColaborador={asignarColaborador}
              onCambiarEmail={cambiarEmailColaborador}
              onProbarEmail={probarEmailColaborador}
              onEnviarInvitacionLogin={enviarInvitacionLogin}
              onConfirmarEmailActualizado={confirmarEmailColaboradorActualizado}
              onAvisar={(colab) => setAvisoPreview({ id: colab.id, nombre: colab.nombre })}
            />
          );
        })}
        {colaboradores.length === 0 && (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
            Aún no hay colaboradores.
          </p>
        )}
      </div>

      {/* Historial de emails: registro, no gestión -- plegado. */}
      <div className="mt-3">
        <SeccionPlegable icono={Mail} titulo="Emails enviados" resumen={`${avisosEnviados.length} en total`}>
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
        </SeccionPlegable>
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
