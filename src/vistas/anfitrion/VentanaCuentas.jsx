// Ventana "Estado de cuentas": recaudado/pendiente de cobro (calculados
// solos a partir de los pagos), lista de gastos editable, y balance.
// Extraída de VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4,
// Ronda 4).
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { C } from "../../theme";
import { importeEsperadoInvitado } from "../../lib/invitados";
import { parsePrecio } from "../../lib/formato";
import { uid } from "../../lib/id";
import { TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaCuentas({ data, onCerrar }) {
  const { evento, invitados, gastos, persistGastos } = data;
  const [mostrarListaGastos, setMostrarListaGastos] = useState(false);

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
