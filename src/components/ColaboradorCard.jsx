// Tarjeta de un colaborador en la ventana "Datos Colab.": nombre, email
// (con botón "Probar"), invitación de acceso, y las acciones de
// relevar/eliminar. NO incluye la lista de invitados asignados — eso
// vive en su propia ventana, "Formularios" (ver
// ColaboradorFormularioCard.jsx) desde el reparto del 2026-08-09, que
// separó "quién es cada colaborador" de "qué invitados gestiona cada
// uno" (antes vivían mezclados en la misma tarjeta). Movida fuera de
// App.jsx en el reparto del 2026-08-08 (ver CLAUDE.md).
import { useState } from "react";
import { Send, Repeat, Trash2, Mail } from "lucide-react";
import { C } from "../theme";
import { resolverColaborador } from "../lib/invitados";
import { Seal, GrupoFamiliarInput } from "./Widgets";
import { BuscadorInvitado } from "./BuscadorInvitado";

export function ColaboradorCard({ c, pendientes, invitados, colaboradores, onEliminar, onRelevar, onCambiarEmail, onProbarEmail, onEnviarInvitacionLogin }) {
  const [relevando, setRelevando] = useState(false);
  const [releveInvitadoId, setReleveInvitadoId] = useState("");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState(""); // "" | "ok" | "error"
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);
  const [resultadoInvitacion, setResultadoInvitacion] = useState(""); // "" | "ok" | "error"

  const probarEmail = async () => {
    setProbando(true);
    setResultadoPrueba("");
    const ok = await onProbarEmail(c.id);
    setProbando(false);
    setResultadoPrueba(ok ? "ok" : "error");
  };

  // Sustituye al antiguo "Copiar enlace": en vez de que el anfitrión copie
  // y pegue un enlace-token a mano, se manda directamente por email un
  // enlace al login con "Crear cuenta" ya abierta y su email ya relleno.
  const enviarInvitacion = async () => {
    setEnviandoInvitacion(true);
    setResultadoInvitacion("");
    const ok = await onEnviarInvitacionLogin(c.id);
    setEnviandoInvitacion(false);
    setResultadoInvitacion(ok ? "ok" : "error");
  };

  const asignados = invitados.filter((g) => resolverColaborador(g, colaboradores)?.id === c.id);
  // Los invitados en tentativa nunca se nombran en el email al colaborador
  // (ver anfitrion_avisar_colaborador) — así que tampoco cuentan aquí como
  // "pendiente de avisar", o el botón "Avisar ahora" mandaría un email
  // vacío de contenido.
  const pendientesAviso = asignados.filter((g) => g.avisoPendiente && g.confirmado);

  const confirmarRelevo = () => {
    if (!releveInvitadoId) return;
    onRelevar(c.id, { invitadoId: releveInvitadoId, nombreNuevo: "" });
    setRelevando(false);
    setReleveInvitadoId("");
  };

  const idsColaboradoresYaAsignados = new Set(
    colaboradores.map((col) => col.invitadoId).filter(Boolean)
  );
  const candidatosRelevo = invitados.filter((g) => !idsColaboradoresYaAsignados.has(g.id));

  if (relevando) {
    return (
      <div className="p-3 rounded space-y-2" style={{ background: "#fff", border: `1px solid ${C.wax}` }}>
        <div className="text-xs" style={{ color: C.charcoal, opacity: 0.8 }}>
          Elegir quién releva a <strong>{c.nombre}</strong>. Los datos ya recopilados de sus
          invitados no se pierden; solo cambia quién sigue a cargo.
        </div>
        <div className="flex gap-2">
          <BuscadorInvitado
            invitados={candidatosRelevo}
            invitadoId={releveInvitadoId}
            onSeleccionar={setReleveInvitadoId}
            placeholder="Buscar invitado que relevará..."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={confirmarRelevo}
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ background: C.wax, color: C.paper }}
          >
            Confirmar relevo
          </button>
          <button
            onClick={() => setRelevando(false)}
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-3 rounded"
      style={{ background: "#fff", border: `1px solid ${C.line}` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
            {c.nombre}
          </div>
          <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
            {asignados.length} asignado{asignados.length !== 1 && "s"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Seal count={pendientes} size={26} />
          <button
            onClick={enviarInvitacion}
            disabled={enviandoInvitacion || !c.email}
            title={
              c.email
                ? "Enviar por email la invitación para crear su cuenta"
                : "Añade primero un email para poder enviarle la invitación"
            }
          >
            <Send size={20} style={{ color: c.email ? C.gold : C.line }} />
          </button>
          <button onClick={() => setRelevando(true)} title="Relevar (sustituir) colaborador">
            <Repeat size={20} style={{ color: C.ink }} />
          </button>
          <button onClick={() => onEliminar(c.id)} title="Eliminar colaborador">
            <Trash2 size={20} style={{ color: C.wax }} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Mail size={13} style={{ color: C.gold }} />
        <div className="flex-1">
          <GrupoFamiliarInput
            value={c.email || ""}
            onCommit={(v) => {
              onCambiarEmail(c.id, v);
              setResultadoPrueba("");
            }}
          />
        </div>
        {!c.email && (
          <span className="text-xs whitespace-nowrap" style={{ color: C.charcoal, opacity: 0.5 }}>
            sin email (no recibirá avisos)
          </span>
        )}
        {c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) && (
          <button
            onClick={probarEmail}
            disabled={probando}
            className="text-xs px-2 py-1 rounded whitespace-nowrap"
            style={{ border: `1px solid ${C.gold}`, color: C.gold }}
            title="Envía un email de prueba a esta dirección para confirmar que llega"
          >
            {probando ? "Enviando…" : "Probar"}
          </button>
        )}
      </div>
      {c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) && (
        <p className="text-xs mt-1" style={{ color: C.wax }}>
          ⚠ No parece un email válido — revísalo antes de que este colaborador se quede sin
          avisos sin que nadie lo note.
        </p>
      )}
      {resultadoPrueba === "ok" && (
        <p className="text-xs mt-1" style={{ color: C.ink }}>
          ✓ Email de prueba enviado — confirma con el colaborador que le ha llegado.
        </p>
      )}
      {resultadoPrueba === "error" && (
        <p className="text-xs mt-1" style={{ color: C.wax }}>
          ⚠ No se pudo enviar el email de prueba. Mira "Avisos enviados" o los logs de Resend.
        </p>
      )}
      {resultadoInvitacion === "ok" && (
        <p className="text-xs mt-1" style={{ color: C.ink }}>
          ✓ Invitación de acceso enviada — confirma con el colaborador que le ha llegado.
        </p>
      )}
      {resultadoInvitacion === "error" && (
        <p className="text-xs mt-1" style={{ color: C.wax }}>
          ⚠ No se pudo enviar la invitación de acceso. Mira "Avisos enviados" o los logs de Resend.
        </p>
      )}

      {pendientesAviso.length > 0 && (
        <div
          className="flex items-center gap-2 mt-2 px-2 py-1 rounded"
          style={{ background: "#FBEAEC" }}
        >
          <span className="text-xs" style={{ color: C.wax }}>
            ⚠ {pendientesAviso.length} pendiente{pendientesAviso.length === 1 ? "" : "s"} de avisar
            — avisa desde la ventana "Avisos".
          </span>
        </div>
      )}
    </div>
  );
}
