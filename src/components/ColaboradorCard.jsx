// Tarjeta de un colaborador en la ventana "Datos Colab.": enlace personal,
// email (con botón "Probar"), sus invitados asignados, y las acciones de
// relevar/eliminar. Movida fuera de App.jsx en el reparto del 2026-08-08
// (ver CLAUDE.md).
import { useState } from "react";
import { Send, Repeat, Mail } from "lucide-react";
import { C, inputStyle, T, OP } from "../theme";
import { resolverColaborador, datosCompletos } from "../lib/invitados";
import { ordenarPorApellidoNombre, formatearFecha } from "../lib/formato";
import { emailValido } from "../lib/validacion";
import { Seal, GrupoFamiliarInput } from "./Widgets";
import { BuscadorInvitado } from "./BuscadorInvitado";
import { Boton } from "./Boton";
import { BotonQuitar } from "./PreguntaSeguridad";

export function ColaboradorCard({ c, pendientes, invitados, colaboradores, onEliminar, onRelevar, onAsignarColaborador, onCambiarEmail, onProbarEmail, onEnviarInvitacionLogin, onConfirmarEmailActualizado, onAvisar }) {
  const [relevando, setRelevando] = useState(false);
  // Plegada por defecto: fuera solo el nombre, cuántos lleva y los
  // iconos de acción. Todo lo demás (email, avisos, invitados
  // asignados) se despliega al tocar el nombre -- a petición del
  // usuario, 2026-09-06: con doce colaboradores, doce tarjetas
  // desplegadas eran una ventana interminable.
  const [abierta, setAbierta] = useState(false);
  const [releveInvitadoId, setReleveInvitadoId] = useState("");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState(""); // "" | "ok" | "error"
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);
  const [resultadoInvitacion, setResultadoInvitacion] = useState(""); // "" | "ok" | "error"
  // Motivo si se rechaza una reasignación por faltarle el rol familiar
  // al invitado (ver asignarColaborador en VistaAnfitrion.jsx). Texto
  // dentro de la tarjeta, nunca un diálogo del navegador.
  const [avisoAsignacion, setAvisoAsignacion] = useState("");

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
      <div className="p-4 rounded space-y-2" style={{ background: "#fff", border: `1px solid ${C.wax}` }}>
        <div className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
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
          <Boton variante="peligro" tamano="pequeno" onClick={confirmarRelevo}>
            Confirmar relevo
          </Boton>
          <Boton tamano="pequeno" onClick={() => setRelevando(false)}>
            Cancelar
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded"
      style={{ background: "#fff", border: `1px solid ${C.line}` }}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => setAbierta((v) => !v)}
          className="boton-3d text-left flex-1 rounded px-2 py-1"
        >
          <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
            {c.nombre}
          </div>
          <div className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
            {asignados.length} asignado{asignados.length !== 1 && "s"}
            {/* Con la tarjeta plegada, el botón "Avisar ahora" queda
                dentro: este aviso tiene que verse FUERA, o habría que ir
                abriendo una por una para saber a quién falta avisar. */}
            {pendientesAviso.length > 0 && (
              <span style={{ color: C.wax, fontWeight: 600 }}>
                {" · "}
                {pendientesAviso.length} sin avisar
              </span>
            )}{" "}
            {abierta ? "▲" : "▼"}
          </div>
        </button>
        <div className="flex items-center gap-3">
          <Seal count={pendientes} size={26} />
          <Boton
            variante="secundario"
            icono={Send}
            titulo={
              c.email
                ? "Enviar por email la invitación para crear su cuenta"
                : "Añade primero un email para poder enviarle la invitación"
            }
            onClick={enviarInvitacion}
            disabled={enviandoInvitacion || !c.email}
          />
          <Boton icono={Repeat} titulo="Relevar (sustituir) colaborador" onClick={() => setRelevando(true)} />
          <BotonQuitar
            borrar
            titulo="Eliminar colaborador"
            pregunta={{
              titulo: "¿Eliminar este colaborador?",
              texto: `${c.nombre || "Sin nombre"} deja de estar en Colaboradores.`,
              rotulo: "Sí, eliminar",
            }}
            onClick={() => onEliminar(c.id)}
          />
        </div>
      </div>

      {abierta && (
        <>
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
          <span className="text-xs whitespace-nowrap" style={{ color: C.charcoal, opacity: OP.tenue }}>
            sin email (no recibirá avisos)
          </span>
        )}
        {c.email && emailValido(c.email) && (
          <Boton
            tamano="pequeno"
            titulo="Envía un email de prueba a esta dirección para confirmar que llega"
            onClick={probarEmail}
            disabled={probando}
          >
            {probando ? "Enviando…" : "Probar"}
          </Boton>
        )}
      </div>
      {c.email && !emailValido(c.email) && (
        <p className="text-xs mt-1" style={{ color: C.wax }}>
          ⚠ No parece un email válido — revísalo antes de que este colaborador se quede sin
          avisos sin que nadie lo note.
        </p>
      )}

      {/* "Avisar ahora" vivía en la ventana Avisos, en una lista aparte de
          "pendientes de avisar" -- pero esta tarjeta YA calculaba esos
          mismos pendientes (`pendientesAviso`, arriba) y ya tiene el email
          con su botón "Probar". Faltaba justo el botón. Se trae aquí, que
          es donde estás mirando cuando decides avisarle (2026-09-05). */}
      {pendientesAviso.length > 0 && (
        <div
          className="flex items-center justify-between gap-2 mt-2 px-2 py-1.5 rounded"
          style={{ background: C.avisoFondo }}
        >
          <span className="text-xs" style={{ color: C.ink }}>
            {pendientesAviso.length} invitado{pendientesAviso.length !== 1 && "s"} nuevo
            {pendientesAviso.length !== 1 && "s"} sin avisar
          </span>
          <Boton
            variante="peligro"
            tamano="pequeno"
            titulo={c.email ? "Ver el email y enviarlo" : "Añade primero un email"}
            onClick={() => onAvisar(c)}
            disabled={!c.email}
          >
            Avisar ahora
          </Boton>
        </div>
      )}
      {c.emailSincronizadoEn && (
        <div
          className="flex items-center justify-between gap-2 mt-2 px-2 py-1 rounded"
          style={{ background: "#EAF2EC" }}
        >
          <span className="text-xs" style={{ color: C.ink }}>
            ℹ {c.nombre} cambió su email de acceso el {formatearFecha(String(c.emailSincronizadoEn).slice(0, 10))} —
            los avisos ya le llegan a esta dirección nueva.
          </span>
          <Boton tamano="pequeno" onClick={() => onConfirmarEmailActualizado(c.id)}>
            Entendido
          </Boton>
        </div>
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
        </>
      )}

      {abierta && avisoAsignacion && (
        <div
          className="flex items-start gap-2 rounded px-2 py-1.5 mt-2"
          style={{ background: C.avisoFondo, border: `1px solid ${C.peligro}` }}
        >
          <p className="text-xs flex-1" style={{ color: C.peligro }}>
            {avisoAsignacion}
          </p>
          <Boton tamano="pequeno" onClick={() => setAvisoAsignacion("")}>
            Entendido
          </Boton>
        </div>
      )}

      {abierta && (
        <div className="mt-3 space-y-1.5" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
          {asignados.length === 0 && (
            <p className="text-xs italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Nadie asignado todavía.
            </p>
          )}
          {ordenarPorApellidoNombre(asignados).map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-2 text-xs">
              <span style={{ color: C.charcoal }}>
                {g.apellido}, {g.nombre}{" "}
                <span style={{ opacity: OP.tenue }}>
                  ({g.confirmado ? (datosCompletos(g) ? "completo" : "confirmado") : "tentativa"})
                </span>
              </span>
              <select
                value={g.colaboradorId || ""}
                onChange={(e) => setAvisoAsignacion(onAsignarColaborador(g.id, e.target.value) || "")}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: T.pequeno }}
              >
                <option value="">Sin asignar</option>
                {colaboradores.map((otro) => (
                  <option key={otro.id} value={otro.id}>
                    {otro.nombre}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
