// Un candado con Sí/No en su recuadro (él: «un check para cerrar a mano»):
// «Acomodación terminada» (v90.7) y «Canciones cerradas» (v92.1). «Sí» es
// lo hecho, en verde; «No», lo que sigue abierto, en rosa; debajo, una línea
// con lo que pasa ahora. Una sola pieza para los dos (norma 7), con su
// espejo para quien usa la mano izquierda (1.4).
//
// El Sí/No, PEGADO a su rótulo (él, v101.3: «si hay una etiqueta que declara
// algo, el botón tiene que estar cerca»): con la ventana a pantalla entera,
// al otro extremo había que recorrerla con la vista para encontrarlo.
// `compacto` (v101.3, él: «todo en una sola línea»): solo esa línea, del
// ancho de lo que lleva; lo que pasa ahora, al pasar por encima.
import { C } from "../theme";
import { ElegirSiNo } from "./Formulario";

const ANCHO_SI_NO = 104;

export function RecuadroSiNo({ titulo, valor, onCambiar, icono: Icono, nota, compacto = false, className = "mb-2", style }) {
  return (
    <div className={`${className} ${compacto ? "px-2 py-1 w-max max-w-full" : "px-3 py-2"} rounded`} title={compacto ? nota : undefined} style={{ background: valor ? C.okFondo : C.avisoFondo, border: `1px solid ${C.line}`, ...style }}>
      <div className="flex items-center gap-2 zurdo:flex-row-reverse">
        <Icono size={18} aria-hidden style={{ color: valor ? C.ink : C.peligro, flexShrink: 0 }} />
        {/* Compacto, si no cabe (un móvil estrecho), se acorta el rótulo, nunca el Sí/No. */}
        <span className={`text-sm font-semibold whitespace-nowrap ${compacto ? "truncate min-w-0" : ""}`} style={{ color: C.ink }}>
          {titulo}
        </span>
        <div style={{ width: ANCHO_SI_NO, flexShrink: 0 }}>
          <ElegirSiNo etiqueta={titulo} valor={valor} onCambiar={onCambiar} />
        </div>
      </div>
      {!compacto && (
        <p className="text-xs mt-1" style={{ color: valor ? C.charcoal : C.peligro }}>
          {nota}
        </p>
      )}
    </div>
  );
}
