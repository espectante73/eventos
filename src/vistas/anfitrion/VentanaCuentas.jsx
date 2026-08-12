// Ventana "Estado de cuentas": recaudado/pendiente de cobro (calculados
// solos a partir de los pagos), recaudado por cada colaborador (con
// acuse desglosado enviado por email), lista de gastos editable, y
// balance. Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08
// (Fase 4, Ronda 4).
import { useState } from "react";
import { Plus, X, Mail, Undo2 } from "lucide-react";
import { C } from "../../theme";
import { importeEsperadoInvitado, resolverColaborador } from "../../lib/invitados";
import { parsePrecio, formatearFecha, ordenarPorApellidoNombre } from "../../lib/formato";
import { uid } from "../../lib/id";
import { construirAsuntoAcuse, construirHtmlAcuse } from "../../lib/acuseRecogida";
import { TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";

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
  const [mostrarListaGastos, setMostrarListaGastos] = useState(false);
  const [mostrarColaboradores, setMostrarColaboradores] = useState(false);
  // Fila en la que se está editando el importe antes de confirmar la
  // recogida — null cuando ninguna está abierta.
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [importeConfirmar, setImporteConfirmar] = useState("");
  const [enviandoId, setEnviandoId] = useState(null);

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

  const confirmarRecogida = async (c) => {
    const importe = parseFloat(importeConfirmar.replace(",", ".")) || 0;
    const fechaISO = new Date().toISOString().slice(0, 10);
    const html = construirHtmlAcuse({
      evento,
      colaborador: c,
      items: itemsRecaudadosPorColaborador(c),
      total: importe,
      fechaISO,
    });
    const ok = await confirmarRecogidaColaborador(
      c.id,
      importe,
      c.email,
      construirAsuntoAcuse(evento),
      html
    );
    if (ok) setConfirmandoId(null);
  };

  const reenviarAcuse = async (c) => {
    setEnviandoId(c.id);
    const html = construirHtmlAcuse({
      evento,
      colaborador: c,
      items: itemsRecaudadosPorColaborador(c),
      total: c.dineroRecogidoImporte || 0,
      fechaISO: String(c.dineroRecogidoEn).slice(0, 10),
    });
    await reenviarAcuseColaborador(c.email, construirAsuntoAcuse(evento), html);
    setEnviandoId(null);
  };

  return (
    <VentanaFlotante clave="cuentas" titulo="Estado de cuentas" onCerrar={onCerrar}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
        "Lo que entra" se calcula solo (pagos de invitados confirmados). "Lo que sale"
        son los gastos que añadas abajo — incluye también los costes de la propia app
        (dominio, suscripciones...), no solo proveedores de la boda.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.ink }}>
            {formato(recaudado)} €
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Recaudado
          </div>
        </div>
        <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.charcoal }}>
            {formato(pendienteCobro)} €
          </div>
          <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
            Pendiente de cobro
          </div>
        </div>
        <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.wax }}>
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
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.ink }}>
            {formato(balance)} €
          </div>
          <div className="text-xs uppercase" style={{ color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}>
            Balance (recaudado − gastos pagados)
          </div>
        </div>
      </div>

      <button
        onClick={() => setMostrarColaboradores((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium mb-2"
        style={{ color: C.ink }}
      >
        {mostrarColaboradores ? "▾" : "▸"} Recaudado por colaborador ({colaboradores.length})
      </button>
      {mostrarColaboradores && (
        <div className="space-y-2 mb-4">
          <p className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
            Confirmar la recogida manda por email al propio colaborador un acuse con el
            desglose de sus invitados, el importe total, la fecha y la firma — para que
            lo guarde como comprobante.
          </p>
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
                    <button
                      onClick={() => confirmarRecogida(c)}
                      className="px-3 py-1.5 rounded text-xs font-medium"
                      style={{ background: C.ink, color: C.paper }}
                    >
                      Confirmar y enviar acuse
                    </button>
                    <button
                      onClick={() => setConfirmandoId(null)}
                      className="text-xs"
                      style={{ color: C.charcoal, opacity: 0.7 }}
                    >
                      Cancelar
                    </button>
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
                    <button
                      onClick={() => reenviarAcuse(c)}
                      disabled={enviandoId === c.id || !c.email}
                      title="Reenviar el acuse por email otra vez"
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                      style={{ border: `1px solid ${C.gold}`, color: C.gold }}
                    >
                      <Mail size={13} /> {enviandoId === c.id ? "Enviando…" : "Reenviar acuse"}
                    </button>
                    <button
                      onClick={() => deshacerRecogidaColaborador(c.id)}
                      title="Deshacer (si se confirmó por error)"
                    >
                      <Undo2 size={15} style={{ color: C.wax }} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => abrirConfirmar(c)}
                    disabled={importeSuyo === 0}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{
                      background: importeSuyo === 0 ? C.paperDark : C.ink,
                      color: importeSuyo === 0 ? C.charcoal : C.paper,
                    }}
                  >
                    Confirmar recogida
                  </button>
                )}
              </div>
            );
          })}
          {colaboradores.length === 0 && (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía no hay colaboradores.
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => setMostrarListaGastos((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium mb-2"
        style={{ color: C.ink }}
      >
        {mostrarListaGastos ? "▾" : "▸"} Gastos ({gastos.length})
      </button>
      {mostrarListaGastos && (
      <>
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={agregarGasto}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
          style={{ background: C.ink, color: C.paper }}
        >
          <Plus size={14} /> Añadir gasto
        </button>
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
            <button onClick={() => eliminarGasto(g.id)} title="Quitar este gasto">
              <X size={15} style={{ color: C.wax }} />
            </button>
          </div>
        ))}
        {gastos.length === 0 && (
          <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
            Todavía no hay gastos registrados.
          </p>
        )}
      </div>
      </>
      )}
    </VentanaFlotante>
  );
}
