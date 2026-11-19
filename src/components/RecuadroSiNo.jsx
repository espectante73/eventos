// Un candado con Sí/No en su recuadro (él: «un check para cerrar a mano»):
// «Acomodación terminada» (v90.7) y «Canciones cerradas» (v92.1). «Sí» es
// lo hecho, en verde; «No», lo que sigue abierto, en rosa; debajo, una línea
// con lo que pasa ahora. Una sola pieza para los dos (norma 7), con su
// espejo para quien usa la mano izquierda (1.4).
import { C } from "../theme";
import { ElegirSiNo } from "./Formulario";

const ANCHO_SI_NO = 104;

export function RecuadroSiNo({ titulo, valor, onCambiar, icono: Icono, nota, className = "mb-2", style }) {
  return (
    <div className={`${className} px-3 py-2 rounded`} style={{ background: valor ? C.okFondo : C.avisoFondo, border: `1px solid ${C.line}`, ...style }}>
      <div className="flex items-center gap-2 zurdo:flex-row-reverse">
        <Icono size={18} aria-hidden style={{ color: valor ? C.ink : C.peligro, flexShrink: 0 }} />
        <span className="text-sm font-semibold flex-1 whitespace-nowrap" style={{ color: C.ink }}>
          {titulo}
        </span>
        <div style={{ width: ANCHO_SI_NO, flexShrink: 0 }}>
          <ElegirSiNo etiqueta={titulo} valor={valor} onCambiar={onCambiar} />
        </div>
      </div>
      <p className="text-xs mt-1" style={{ color: valor ? C.charcoal : C.peligro }}>
        {nota}
      </p>
    </div>
  );
}
