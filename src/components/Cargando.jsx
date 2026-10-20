// «Cargando…»: lo que dice una ventana, o una parte de ella, mientras
// llegan sus datos. Una sola pieza (norma 7).
import { C, OP } from "../theme";

export function Cargando({ className = "" }) {
  return (
    <p className={`text-xs italic ${className}`.trim()} style={{ color: C.charcoal, opacity: OP.secundario }}>
      Cargando…
    </p>
  );
}
