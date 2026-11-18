// «Columnas» (él, v89.3), en Lista de invitados → Acciones: qué columnas se
// ven en la Lista de ESTE aparato. Una casilla por columna; el nombre, sin
// casilla, porque se ve siempre. «Volver a la original» las enseña todas.
// Las reglas, en lib/columnasLista.js.
import { Undo2 } from "lucide-react";
import { C, OP, R } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { FilaMarcable } from "../../components/FilaMarcable";
import { Boton } from "../../components/Boton";
import { COLUMNAS_LISTA, alternarColumna } from "../../lib/columnasLista";

export function VentanaColumnasLista({ ocultas, onCambiar, onCerrar }) {
  return (
    <VentanaFlotante clave="columnasLista" titulo="Columnas" onCerrar={onCerrar} ancho="min(330px, calc(100vw - 48px))">
      <div className="space-y-2">
        <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
          Lo que se ve en la Lista de este aparato.
        </p>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden" }}>
          {COLUMNAS_LISTA.map((c, i) => (
            <FilaMarcable
              key={c.id}
              i={i}
              nombre={c.titulo}
              nota={c.fija ? "siempre" : c.nota}
              marcada={!ocultas.has(c.id)}
              onMarcar={c.fija ? undefined : () => onCambiar(alternarColumna(ocultas, c.id))}
            />
          ))}
        </div>
        <div className="flex justify-end zurdo:justify-start">
          <Boton variante="secundario" disabled={ocultas.size === 0} onClick={() => onCambiar(new Set())}>
            <Undo2 size={14} /> Volver a la original
          </Boton>
        </div>
        {/* La ayuda, al pie y plegada (norma 5). */}
        <details className="text-xs" style={{ color: C.charcoal }}>
          <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
            Cómo funciona
          </summary>
          <p className="mt-2" style={{ opacity: OP.secundario }}>
            Cada aparato recuerda la suya: el móvil puede llevar solo Invitado, Mesa y Llegó, y el ordenador la Lista entera. Al ocultar una columna
            se quitan también su filtro y su orden, para que no desaparezcan filas por algo que no se ve. En el móvil caben unas tres columnas además
            del nombre.
          </p>
        </details>
      </div>
    </VentanaFlotante>
  );
}
