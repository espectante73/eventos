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
