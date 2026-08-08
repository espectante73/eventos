// Sub-ventana de Configuración: Zona de Reinicio — pone a cero campos
// concretos de invitados (por colaborador/familia/invitado) sin borrar a
// nadie, y el reinicio aparte del historial de avisos. Ambas acciones
// piden confirmación escrita y descargan backup automático antes de
// ejecutar. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 2).
import { useState } from "react";
import { Repeat } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { ordenarPorApellidoNombre } from "../../lib/formato";
import { exportarTodo } from "../../lib/backup";
import { descargarJSON } from "../../lib/descargas";
import { Field, TextInput } from "../../components/Formulario";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";

// Cualquier reinicio que toque invitados limpia también su aviso
// pendiente — si la asignación o el dato era de prueba, el aviso que
// generó también lo era (se aplica siempre en el propio RPC).
const CATEGORIAS_RESET = {
  datos: {
    titulo: "Datos del invitado",
    familiar: false,
    descripcion: "Vacía año nacimiento, año de boda, email, canción, alergias y observaciones.",
  },
  pago: {
    titulo: "Pago",
    familiar: false,
    descripcion: 'Vuelve a "no pagado".',
  },
  mesa: {
    titulo: "Mesa",
    familiar: false,
    descripcion: 'Quita la mesa asignada (vuelve a "sin mesa").',
  },
  asignacion: {
    titulo: "Asignación de colaborador",
    familiar: false,
    descripcion:
      'Quita la asignación de colaborador (vuelve a "sin asignar"). Ni el invitado ni el colaborador se borran.',
  },
  foto: {
    titulo: "Foto familiar",
    familiar: true,
    descripcion: "Borra la foto guardada de la familia.",
  },
  invitacion: {
    titulo: "Invitación",
    familiar: true,
    descripcion: 'Pone a cero el aviso de "invitación enviada" de la familia.',
  },
};

export function VentanaConfigZonaReinicio({ data, onCerrar }) {
  const {
    evento,
    mesas,
    fotosFamiliares,
    colaboradores,
    invitados,
    resetearPorInvitados,
    resetearAvisos,
  } = data;

  // ---------- Reinicio "por invitados": colaborador -> alcance -> categoría ----------
  const [rColaborador, setRColaborador] = useState(""); // "" = todos los colaboradores
  const [rAlcance, setRAlcance] = useState("todos"); // "todos" | "familia" | "invitado"
  const [rFamiliaClave, setRFamiliaClave] = useState("");
  const [rInvitadoId, setRInvitadoId] = useState("");
  const [rCategoria, setRCategoria] = useState("");
  const [rPalabra, setRPalabra] = useState("");
  const [rEjecutando, setREjecutando] = useState(false);
  const [rMostrarConfirmar, setRMostrarConfirmar] = useState(false);

  const invitadosParaReset = rColaborador
    ? invitados.filter((g) => g.colaboradorId === rColaborador)
    : invitados;

  const familiasParaReset = (() => {
    const vistos = new Map();
    invitadosParaReset.forEach((g) => {
      const clave = g.grupoFamiliar || g.apellido || g.id;
      if (!vistos.has(clave)) vistos.set(clave, g.apellido || clave);
    });
    return Array.from(vistos.entries()).map(([clave, etiqueta]) => ({ clave, etiqueta }));
  })();

  const invitadoIdsParaReset = (() => {
    if (rAlcance === "invitado") return rInvitadoId ? [rInvitadoId] : [];
    if (rAlcance === "familia") {
      if (!rFamiliaClave) return [];
      return invitadosParaReset
        .filter((g) => (g.grupoFamiliar || g.apellido || g.id) === rFamiliaClave)
        .map((g) => g.id);
    }
    return invitadosParaReset.map((g) => g.id);
  })();

  const confirmarResetPorInvitados = async () => {
    if (rPalabra.trim().toUpperCase() !== "REINICIAR") return;
    if (invitadoIdsParaReset.length === 0 || !rCategoria) return;
    setREjecutando(true);
    // El contenido se captura ya (antes de resetear), pero la descarga se
    // dispara después de que el reinicio termine de verdad — en móvil, un
    // <a download> puede navegar la pestaña en vez de descargar sin más;
    // si eso pasara antes del await de abajo, el reinicio ni se llegaría
    // a intentar (visto en pruebas reales: en el móvil no se aplicaba).
    const datosBackup = JSON.parse(exportarTodo({ evento, mesas, fotosFamiliares, colaboradores, invitados }));
    await resetearPorInvitados(invitadoIdsParaReset, rCategoria);
    descargarJSON(`backup-antes-de-reiniciar-${rCategoria}-${Date.now()}.json`, datosBackup);
    setREjecutando(false);
    setRMostrarConfirmar(false);
    setRPalabra("");
    setRCategoria("");
  };

  // ---------- Reinicio de avisos (historial global, sin vínculo a invitado/colaborador) ----------
  const [reinicioAvisosPendiente, setReinicioAvisosPendiente] = useState(false);
  const [palabraAvisos, setPalabraAvisos] = useState("");
  const [reiniciandoAvisos, setReiniciandoAvisos] = useState(false);

  const confirmarReinicioAvisos = async () => {
    if (palabraAvisos.trim().toUpperCase() !== "AVISOS") return;
    setReiniciandoAvisos(true);
    // Mismo motivo que en confirmarResetPorInvitados: capturar antes,
    // descargar después de que la acción real ya haya terminado.
    const datosBackup = JSON.parse(exportarTodo({ evento, mesas, fotosFamiliares, colaboradores, invitados }));
    await resetearAvisos();
    descargarJSON(`backup-antes-de-reiniciar-avisos-${Date.now()}.json`, datosBackup);
    setReiniciandoAvisos(false);
    setReinicioAvisosPendiente(false);
    setPalabraAvisos("");
  };

  return (
    <>
      <VentanaFlotante clave="config-zona-reinicio" titulo="Reinicios" onCerrar={onCerrar}>
        <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
          Zona de reinicio: pone a cero campos concretos de los invitados de un colaborador
          (útil tras pruebas, o para reutilizar la app en otro evento). Los invitados y los
          colaboradores <strong>nunca</strong> se borran aquí — solo los campos que elijas.
          Se descarga automáticamente una copia de seguridad de todo el evento antes de
          ejecutar nada, y hay que escribir "REINICIAR" para confirmar.
        </p>
        <div className="flex flex-wrap items-end gap-2 mb-2">
          <Field label="Colaborador">
            <select
              value={rColaborador}
              onChange={(e) => {
                setRColaborador(e.target.value);
                setRAlcance("todos");
                setRFamiliaClave("");
                setRInvitadoId("");
              }}
              style={{ ...inputStyle, minWidth: 200 }}
            >
              <option value="">Todos los colaboradores</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Alcance">
            <select
              value={rAlcance}
              onChange={(e) => {
                setRAlcance(e.target.value);
                setRFamiliaClave("");
                setRInvitadoId("");
              }}
              style={{ ...inputStyle, minWidth: 180 }}
            >
              <option value="todos">Todos sus invitados</option>
              <option value="familia">Una familia en concreto</option>
              <option value="invitado">Un invitado en concreto</option>
            </select>
          </Field>
          {rAlcance === "familia" && (
            <Field label="Familia">
              <select
                value={rFamiliaClave}
                onChange={(e) => setRFamiliaClave(e.target.value)}
                style={{ ...inputStyle, minWidth: 200 }}
              >
                <option value="">Elige una familia…</option>
                {familiasParaReset.map((f) => (
                  <option key={f.clave} value={f.clave}>
                    {f.etiqueta}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {rAlcance === "invitado" && (
            <Field label="Invitado">
              <select
                value={rInvitadoId}
                onChange={(e) => setRInvitadoId(e.target.value)}
                style={{ ...inputStyle, minWidth: 220 }}
              >
                <option value="">Elige un invitado…</option>
                {ordenarPorApellidoNombre(
                  invitadosParaReset.filter((g) => g.confirmado)
                ).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.apellido}, {g.nombre}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.entries(CATEGORIAS_RESET)
            .filter(([, cfg]) => !cfg.familiar || rAlcance !== "invitado")
            .map(([clave, cfg]) => (
              <button
                key={clave}
                onClick={() => {
                  setRCategoria(clave);
                  setRMostrarConfirmar(true);
                  setRPalabra("");
                }}
                disabled={invitadoIdsParaReset.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{
                  border: `1px solid ${C.wax}`,
                  color: invitadoIdsParaReset.length === 0 ? C.line : C.wax,
                }}
              >
                <Repeat size={14} /> {cfg.titulo}
              </button>
            ))}
        </div>
        <p className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
          {rAlcance === "invitado"
            ? rInvitadoId
              ? "Afecta a 1 invitado."
              : "Elige un invitado arriba."
            : rAlcance === "familia"
            ? rFamiliaClave
              ? `Afecta a ${invitadoIdsParaReset.length} invitado(s) de esa familia.`
              : "Elige una familia arriba."
            : `Afecta a ${invitadoIdsParaReset.length} invitado(s).`}
        </p>
        <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${C.line}` }}>
          <button
            onClick={() => setReinicioAvisosPendiente(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{ border: `1px solid ${C.wax}`, color: C.wax }}
          >
            <Repeat size={14} /> Reiniciar avisos (historial de emails)
          </button>
        </div>
      </VentanaFlotante>

      {rMostrarConfirmar && rCategoria && (
        <ModalFlotante
          titulo={CATEGORIAS_RESET[rCategoria].titulo}
          onCerrar={() => {
            setRMostrarConfirmar(false);
            setRPalabra("");
          }}
        >
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            {CATEGORIAS_RESET[rCategoria].descripcion} Afecta a {invitadoIdsParaReset.length}{" "}
            invitado(s)
            {rColaborador
              ? ` de ${colaboradores.find((c) => c.id === rColaborador)?.nombre || "ese colaborador"}`
              : " (todos los colaboradores)"}
            {rAlcance === "familia" && rFamiliaClave ? `, familia "${rFamiliaClave}"` : ""}
            {rAlcance === "invitado" && rInvitadoId
              ? `, solo ${invitados.find((g) => g.id === rInvitadoId)?.nombre || "ese invitado"}`
              : ""}
            .
          </p>
          <p className="text-xs mb-3" style={{ color: C.wax }}>
            Se descargará antes una copia de seguridad completa del evento. Esta acción no se
            puede deshacer desde la app.
          </p>
          <Field label='Escribe "REINICIAR" para confirmar'>
            <TextInput
              value={rPalabra}
              onChange={(e) => setRPalabra(e.target.value)}
              placeholder="REINICIAR"
              className="w-full"
            />
          </Field>
          <div className="flex gap-2 mt-3">
            <button
              onClick={confirmarResetPorInvitados}
              disabled={rEjecutando || rPalabra.trim().toUpperCase() !== "REINICIAR"}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{
                background: rPalabra.trim().toUpperCase() === "REINICIAR" ? C.wax : C.line,
                color: "#fff",
              }}
            >
              {rEjecutando ? "Reiniciando…" : "Confirmar reinicio"}
            </button>
            <button
              onClick={() => {
                setRMostrarConfirmar(false);
                setRPalabra("");
              }}
              disabled={rEjecutando}
              className="px-3 py-2 rounded text-sm"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Cancelar
            </button>
          </div>
        </ModalFlotante>
      )}

      {reinicioAvisosPendiente && (
        <ModalFlotante
          titulo="Reiniciar avisos"
          onCerrar={() => {
            setReinicioAvisosPendiente(false);
            setPalabraAvisos("");
          }}
        >
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            Vacía el historial de emails enviados (el panel de "Avisos"). No reenvía ni deshace
            ningún email ya enviado de verdad.
          </p>
          <p className="text-xs mb-3" style={{ color: C.wax }}>
            Se descargará antes una copia de seguridad completa del evento. Esta acción no se
            puede deshacer desde la app.
          </p>
          <Field label='Escribe "AVISOS" para confirmar'>
            <TextInput
              value={palabraAvisos}
              onChange={(e) => setPalabraAvisos(e.target.value)}
              placeholder="AVISOS"
              className="w-full"
            />
          </Field>
          <div className="flex gap-2 mt-3">
            <button
              onClick={confirmarReinicioAvisos}
              disabled={reiniciandoAvisos || palabraAvisos.trim().toUpperCase() !== "AVISOS"}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{
                background: palabraAvisos.trim().toUpperCase() === "AVISOS" ? C.wax : C.line,
                color: "#fff",
              }}
            >
              {reiniciandoAvisos ? "Reiniciando…" : "Confirmar reinicio"}
            </button>
            <button
              onClick={() => {
                setReinicioAvisosPendiente(false);
                setPalabraAvisos("");
              }}
              disabled={reiniciandoAvisos}
              className="px-3 py-2 rounded text-sm"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Cancelar
            </button>
          </div>
        </ModalFlotante>
      )}
    </>
  );
}
