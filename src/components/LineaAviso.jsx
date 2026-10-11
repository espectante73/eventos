// Una línea de aviso con su icono dibujado (él, v62): el triángulo si algo
// falla o hay que tener cuidado, el visto si salió bien. Sustituye a los
// símbolos de teclado (⚠, ✓) delante del texto, que junto a los iconos de
// la app se veían de otro tamaño y grosor. Mismo triángulo que ya llevaban
// la Revisión y Progreso.
//
// El icono mide como la letra (em): vale igual en text-xs que en text-sm.
import { AlertTriangle, Check } from "lucide-react";
import { C } from "../theme";

export function LineaAviso({ tipo = "error", className = "text-xs", style, children }) {
  const Icono = tipo === "ok" ? Check : AlertTriangle;
  return (
    <p className={`flex items-start gap-1.5 ${className}`} style={{ color: tipo === "ok" ? C.ink : C.wax, ...style }}>
      <Icono size="1.25em" style={{ flexShrink: 0, marginTop: "0.1em" }} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

// Una línea de aviso bajo una fila (el pago pendiente, lo que le falta a la
// familia): a todo el ancho, en rosa y en una sola línea (norma 6). Con
// `onClick` se puede tocar; `fuerte`, en negrita (vencido); `alto`, el de
// las filas de su lista.
export function LineaAvisoFila({ children, onClick, fuerte, alto }) {
  const estilo = { background: C.avisoFondo, color: C.peligro, height: alto, fontWeight: fuerte ? 600 : undefined };
  const dentro = (
    <>
      <AlertTriangle size={14} style={{ flexShrink: 0 }} aria-hidden />
      <span className="truncate">{children}</span>
    </>
  );
  return onClick ? (
    <button onClick={onClick} className="boton-3d flex items-center gap-2 w-full px-3 text-xs text-left" style={estilo}>
      {dentro}
    </button>
  ) : (
    <div className="flex items-center gap-2 px-3 text-xs" style={estilo}>
      {dentro}
    </div>
  );
}
