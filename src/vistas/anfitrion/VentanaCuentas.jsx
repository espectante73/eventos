// Ventana "Estado de cuentas": recaudado/pendiente de cobro (calculados
// solos a partir de los pagos), recaudado por cada colaborador (con
// acuse desglosado enviado por email), lista de gastos editable, y
// balance. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 4).
import { useState } from "react";
import { Plus, Mail, Undo2, Calculator, Users, Receipt } from "lucide-react";
import { C, T, OP } from "../../theme";
import { importeEsperadoInvitado, resolverColaborador } from "../../lib/invitados";
import { parsePrecio, formatearFecha, ordenarPorApellidoNombre } from "../../lib/formato";
import { uid } from "../../lib/id";
import { construirAsuntoAcuse, construirHtmlAcuse } from "../../lib/acuseRecogida";
import { generarPdfAcuse } from "../../lib/acuseImagen";
import { TextInput } from "../../components/Formulario";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { BotonQuitar, usePreguntaSeguridad } from "../../components/PreguntaSeguridad";

export function VentanaCuentas({ data, onCerrar }) {
  const {
    evento,
    invitados,
    colaboradores,
    gastos,
    persistGastos,
    confirmarRecogidaColaborador,
    reenviarAcuseColaborador,
    deshacerRecogidaColaborador,
  } = data;
  // Las tres partes, plegadas y como mucho UNA abierta: la filosofía del
  // tablón, a petición del usuario (2026-09-19). Antes el resumen estaba
  // siempre a la vista y solo las otras dos se plegaban.
  // null | "resumen" | "colaboradores" | "gastos"
  const [seccionAbierta, setSeccionAbierta] = useState(null);
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const alternar = (id) => setSeccionAbierta((actual) => (actual === id ? null : id));
  // Fila en la que se está editando el importe antes de confirmar la
  // recogida — null cuando ninguna está abierta.
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [importeConfirmar, setImporteConfirmar] = useState("");
  const [enviandoId, setEnviandoId] = useState(null);
  // Vista previa del acuse antes de enviarlo -- "Confirmar recogida" y
  // "Probar acuse" ya no mandan nada directamente: generan el PDF,
  // abren este modal para revisarlo, y solo se envía/confirma de verdad
  // al pulsar "Aceptar" ahí dentro. { tipo: "confirmar" | "prueba",
  // colaborador, dataUrl, importe (solo "confirmar"), asunto, html } | null
  const [previewAcuse, setPreviewAcuse] = useState(null);
  const [generandoPreview, setGenerandoPreview] = useState(null); // id del colaborador mientras se genera
  const [enviandoAcuse, setEnviandoAcuse] = useState(false);

  const agregarGasto = () => {
    persistGastos([
      ...gastos,
      { id: uid(), concepto: "", categoria: "", importe: "", pagado: false },
    ]);
  };

  const cambiarGasto = (id, campo, valor) => {
    persistGastos(gastos.map((g) => (g.id === id ? { ...g, [campo]: valor } : g)));
  };

  const eliminarGasto = (id) => {
    persistGastos(gastos.filter((g) => g.id !== id));
  };

  const confirmados = invitados.filter((g) => g.confirmado);
  const recaudado = confirmados
    .filter((g) => g.pagado)
    .reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
  const pendienteCobro = confirmados
    .filter((g) => !g.pagado)
    .reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
  const totalGastos = gastos.reduce((s, g) => s + parsePrecio(g.importe), 0);
  const gastosPagados = gastos
    .filter((g) => g.pagado)
    .reduce((s, g) => s + parsePrecio(g.importe), 0);
  const balance = recaudado - gastosPagados;
  const formato = (n) =>
    n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Invitados confirmados y ya pagados de un colaborador — es tanto el
  // desglose del acuse como la base del importe total a confirmar.
  const itemsRecaudadosPorColaborador = (c) =>
    ordenarPorApellidoNombre(
      confirmados.filter((g) => resolverColaborador(g, colaboradores)?.id === c.id && g.pagado)
    ).map((g) => ({
      apellido: g.apellido,
      nombre: g.nombre,
      importe: importeEsperadoInvitado(g, evento),
    }));

  const importeRecaudadoPorColaborador = (c) =>
    itemsRecaudadosPorColaborador(c).reduce((s, it) => s + it.importe, 0);

  const abrirConfirmar = (c) => {
    setConfirmandoId(c.id);
    setImporteConfirmar(importeRecaudadoPorColaborador(c).toFixed(2));
  };

  const nombreArchivoAcuse = (c) =>
    `acuse-${(c.nombre || "colaborador").replace(/\s+/g, "-").toLowerCase()}.pdf`;

  // Ya no confirma/envía directamente -- genera el PDF y abre la vista
  // previa; el envío real solo pasa si se acepta ahí (ver
  // confirmarEnvioAcuse más abajo).
  const abrirPreviewConfirmar = async (c) => {
    const importe = parseFloat(importeConfirmar.replace(",", ".")) || 0;
    setGenerandoPreview(c.id);
    const dataUrl = await generarPdfAcuse({
      evento,
      colaborador: c,
      items: itemsRecaudadosPorColaborador(c),
      total: importe,
      fechaISO: new Date().toISOString().slice(0, 10),
    });
    setGenerandoPreview(null);
    setPreviewAcuse({
      tipo: "confirmar",
      colaborador: c,
      dataUrl,
      importe,
      asunto: construirAsuntoAcuse(evento),
      html: construirHtmlAcuse({ colaborador: c }),
    });
  };

  const reenviarAcuse = async (c) => {
    setEnviandoId(c.id);
    const dataUrl = await generarPdfAcuse({
      evento,
      colaborador: c,
      items: itemsRecaudadosPorColaborador(c),
      total: c.dineroRecogidoImporte || 0,
      fechaISO: String(c.dineroRecogidoEn).slice(0, 10),
    });
    await reenviarAcuseColaborador(
      c.email,
      construirAsuntoAcuse(evento),
      construirHtmlAcuse({ colaborador: c }),
      nombreArchivoAcuse(c),
      dataUrl.split(",")[1] || ""
    );
    setEnviandoId(null);
  };

  // "Probar acuse": genera el acuse con los datos reales de AHORA (sus
  // invitados ya pagados) pero SIN confirmar ni registrar ninguna
  // recogida -- no toca dineroRecogidoEn/Importe, así que no hace falta
  // deshacer nada después. Igual que "Confirmar recogida", ya no manda
  // nada directamente: abre la vista previa primero.
  const abrirPreviewProbar = async (c) => {
    setGenerandoPreview(c.id);
    const dataUrl = await generarPdfAcuse({
      evento,
      colaborador: c,
      items: itemsRecaudadosPorColaborador(c),
      total: importeRecaudadoPorColaborador(c),
      fechaISO: new Date().toISOString().slice(0, 10),
    });
    setGenerandoPreview(null);
    setPreviewAcuse({
      tipo: "prueba",
      colaborador: c,
      dataUrl,
      asunto: "[PRUEBA] " + construirAsuntoAcuse(evento),
      html: construirHtmlAcuse({ colaborador: c }),
    });
  };

  // Único punto real de envío: se llama al aceptar la vista previa, sea
  // "confirmar" (registra la recogida de verdad) o "prueba" (solo manda
  // el email, sin tocar dineroRecogidoEn/Importe) -- el PDF ya generado
  // para la vista previa se reutiliza tal cual, no se vuelve a construir.
  const confirmarEnvioAcuse = async () => {
    if (!previewAcuse) return;
    setEnviandoAcuse(true);
    const base64 = previewAcuse.dataUrl.split(",")[1] || "";
    if (previewAcuse.tipo === "confirmar") {
      const ok = await confirmarRecogidaColaborador(
        previewAcuse.colaborador.id,
        previewAcuse.importe,
        previewAcuse.colaborador.email,
        previewAcuse.asunto,
        previewAcuse.html,
        nombreArchivoAcuse(previewAcuse.colaborador),
        base64
      );
      setEnviandoAcuse(false);
      if (ok) {
        setConfirmandoId(null);
        setPreviewAcuse(null);
      }
    } else {
      await reenviarAcuseColaborador(
        previewAcuse.colaborador.email,
        previewAcuse.asunto,
        previewAcuse.html,
        nombreArchivoAcuse(previewAcuse.colaborador),
        base64
      );
      setEnviandoAcuse(false);
      setPreviewAcuse(null);
    }
  };

  return (
    <>
    <VentanaFlotante clave="cuentas" titulo="Estado de cuentas" onCerrar={onCerrar}>
      <div className="space-y-2">
      <SeccionPlegable
        icono={Calculator}
        titulo="Resumen"
        resumen={`Balance ${formato(balance)} €`}
        abierta={seccionAbierta === "resumen"}
        onAlternar={() => alternar("resumen")}
      >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 mt-2">
        <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.ink }}>
            {formato(recaudado)} €
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Recaudado
          </div>
        </div>
        <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.charcoal }}>
            {formato(pendienteCobro)} €
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Pendiente de cobro
          </div>
        </div>
        <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.wax }}>
            {formato(totalGastos)} €
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Total gastos
          </div>
        </div>
        <div
          className="p-2 rounded text-center"
          style={{ background: balance >= 0 ? "#E3E9AE" : "#F0D3C8", border: `1px solid ${C.line}` }}
        >
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado, color: C.ink }}>
            {formato(balance)} €
          </div>
          <div className="text-xs uppercase" style={{ color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}>
            Balance (recaudado − gastos pagados)
          </div>
        </div>
      </div>
      {/* La explicación, al pie de su sección (norma de la app). */}
      <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
        "Lo que entra" se calcula solo (pagos de invitados confirmados). "Lo que sale"
        son los gastos que añadas en Gastos — incluye también los costes de la propia app
        (dominio, suscripciones...), no solo proveedores de la boda.
      </p>
      </SeccionPlegable>

      <SeccionPlegable
        icono={Users}
        titulo="Recaudado por colaborador"
        resumen={`${colaboradores.length} colaborador${colaboradores.length !== 1 ? "es" : ""}`}
        abierta={seccionAbierta === "colaboradores"}
        onAlternar={() => alternar("colaboradores")}
      >
        <div className="space-y-2 mt-2">
          {colaboradores.map((c) => {
            const importeSuyo = importeRecaudadoPorColaborador(c);
            const recogido = Boolean(c.dineroRecogidoEn);
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 p-2 rounded"
                style={{ background: "#fff", border: `1px solid ${C.line}` }}
              >
                <div className="flex-1" style={{ minWidth: 160 }}>
                  <div style={{ color: C.ink, fontWeight: 600 }}>
                    Recaudado por {c.nombre}: {formato(importeSuyo)} €
                  </div>
                  {!c.email && (
                    <div className="text-xs" style={{ color: C.wax }}>
                      Sin email — no se podrá enviar el acuse automáticamente
                    </div>
                  )}
                </div>

                {confirmandoId === c.id ? (
                  <>
                    <TextInput
                      value={importeConfirmar}
                      onChange={(e) => setImporteConfirmar(e.target.value)}
                      style={{ width: 90, textAlign: "right" }}
                    />
                    <span className="text-xs" style={{ color: C.charcoal }}>€</span>
                    <Boton variante="principal" tamano="pequeno" onClick={() => abrirPreviewConfirmar(c)} disabled={generandoPreview === c.id}>
                      {generandoPreview === c.id ? "Generando…" : "Revisar y confirmar"}
                    </Boton>
                    <Boton variante="secundario" tamano="pequeno" onClick={() => setConfirmandoId(null)}>
                      Cancelar
                    </Boton>
                  </>
                ) : recogido ? (
                  <>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: "#E3E9AE", color: C.ink }}
                    >
                      ✓ Recogido {formato(c.dineroRecogidoImporte || 0)} € el{" "}
                      {formatearFecha(String(c.dineroRecogidoEn).slice(0, 10))}
                    </span>
                    <Boton variante="secundario" tamano="pequeno" onClick={() => reenviarAcuse(c)} disabled={enviandoId === c.id || !c.email} titulo="Reenviar el acuse por email otra vez">
                      <Mail size={13} /> {enviandoId === c.id ? "Enviando…" : "Reenviar acuse"}
                    </Boton>
                    <Boton
                      tamano="pequeno"
                      icono={Undo2}
                      titulo="Deshacer (si se confirmó por error)"
                      onClick={() =>
                        preguntar({
                          titulo: "¿Deshacer la recogida?",
                          texto: `El dinero de ${c.nombre} volverá a constar como no recogido.`,
                          rotulo: "Sí, deshacer",
                          alConfirmar: () => deshacerRecogidaColaborador(c.id),
                        })
                      }
                      style={{ color: C.wax }}
                    />
                  </>
                ) : (
                  <>
                    <Boton
                      variante="principal"
                      tamano="pequeno"
                      onClick={() => abrirConfirmar(c)}
                      disabled={importeSuyo === 0}
                    >
                      Confirmar recogida
                    </Boton>
                    <Boton variante="secundario" tamano="pequeno" onClick={() => abrirPreviewProbar(c)} disabled={generandoPreview === c.id || !c.email} titulo="Ver el acuse de prueba antes de enviarlo, sin confirmar ni registrar nada">
                      <Mail size={13} /> {generandoPreview === c.id ? "Generando…" : "Probar acuse"}
                    </Boton>
                  </>
                )}
              </div>
            );
          })}
          {colaboradores.length === 0 && (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Todavía no hay colaboradores.
            </p>
          )}
          <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Confirmar la recogida manda por email al propio colaborador un acuse con el
            desglose de sus invitados, el importe total, la fecha y la firma — para que
            lo guarde como comprobante.
          </p>
        </div>
      </SeccionPlegable>

      <SeccionPlegable
        icono={Receipt}
        titulo="Gastos"
        resumen={`${gastos.length} · ${formato(totalGastos)} €`}
        abierta={seccionAbierta === "gastos"}
        onAlternar={() => alternar("gastos")}
      >
      <div className="flex items-center justify-end zurdo:justify-start mb-2 mt-2">
        <Boton variante="principal" onClick={agregarGasto}>
          <Plus size={14} /> Añadir gasto
        </Boton>
      </div>
      <div className="space-y-2">
        {gastos.map((g) => (
          <div
            key={g.id}
            className="flex flex-wrap items-center gap-2 p-2 rounded"
            style={{ background: "#fff", border: `1px solid ${C.line}` }}
          >
            <TextInput
              value={g.concepto}
              onChange={(e) => cambiarGasto(g.id, "concepto", e.target.value)}
              placeholder="Concepto (ej. Suscripción Claude Code)"
              className="flex-1"
              style={{ minWidth: 160 }}
            />
            <TextInput
              value={g.categoria}
              onChange={(e) => cambiarGasto(g.id, "categoria", e.target.value)}
              placeholder="Categoría"
              style={{ width: 120 }}
            />
            <TextInput
              value={g.importe}
              onChange={(e) => cambiarGasto(g.id, "importe", e.target.value)}
              placeholder="Importe"
              style={{ width: 90, textAlign: "right" }}
            />
            <label className="flex items-center gap-1 text-xs" style={{ color: C.charcoal }}>
              <input
                type="checkbox"
                checked={g.pagado}
                onChange={(e) => cambiarGasto(g.id, "pagado", e.target.checked)}
              />
              Pagado
            </label>
            <BotonQuitar
              titulo="Quitar este gasto"
              pregunta={{
                titulo: "¿Quitar este gasto?",
                texto: [g.concepto, g.importe && `${g.importe} €`].filter(Boolean).join(" · ") || "Gasto sin concepto.",
                rotulo: "Sí, quitarlo",
              }}
              onClick={() => eliminarGasto(g.id)}
            />
          </div>
        ))}
        {gastos.length === 0 && (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Todavía no hay gastos registrados.
          </p>
        )}
      </div>
      </SeccionPlegable>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>

    {previewAcuse && (
      <ModalFlotante
        titulo={
          (previewAcuse.tipo === "confirmar" ? "Confirmar recogida — " : "Probar acuse — ") +
          previewAcuse.colaborador.nombre
        }
        onCerrar={() => setPreviewAcuse(null)}
      >
        <p className="text-xs uppercase mb-1" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
          Destinatario
        </p>
        <p className="text-sm mb-3" style={{ color: previewAcuse.colaborador.email ? C.ink : C.wax }}>
          {previewAcuse.colaborador.email || "Sin email — no se podrá enviar"}
        </p>
        {previewAcuse.tipo === "confirmar" && (
          <>
            <p className="text-xs uppercase mb-1" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
              Importe a confirmar
            </p>
            <p className="text-sm mb-3" style={{ color: C.ink }}>{formato(previewAcuse.importe)} €</p>
          </>
        )}
        <p className="text-xs uppercase mb-1" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
          Acuse (PDF) — revisa que todo esté bien antes de continuar
        </p>
        <iframe
          src={previewAcuse.dataUrl}
          title="Vista previa del acuse"
          className="rounded mb-3"
          style={{ width: "100%", height: 420, border: `1px solid ${C.line}` }}
        />
        <div className="flex flex-wrap gap-2">
          <Boton variante="principal" onClick={confirmarEnvioAcuse} disabled={enviandoAcuse || !previewAcuse.colaborador.email}>
            {enviandoAcuse
              ? "Enviando…"
              : previewAcuse.tipo === "confirmar"
              ? "Aceptar y confirmar"
              : "Aceptar y enviar"}
          </Boton>
          <Boton variante="secundario" onClick={() => setPreviewAcuse(null)}>
            Cancelar
          </Boton>
        </div>
      </ModalFlotante>
    )}
    </>
  );
}
