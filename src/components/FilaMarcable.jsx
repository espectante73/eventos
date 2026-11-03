// Una fila de un repaso con casilla (norma 6: una línea, todas de la misma
// altura): la casilla para elegirla, lo principal recortado si no cabe, una
// nota tenue al lado y, al final, lo que se le ponga (un número, una
// duración). Sin `onMarcar`, sin casilla (lo que solo se enseña). La usan
// «Importar teléfonos» (v78.2) y «Repasar canciones» (v80).
import { C, OP, T } from "../theme";

export const ALTO_FILA_MARCABLE = 34;

export function FilaMarcable({ i, marcada, onMarcar, nombre, nota, children }) {
  return (
    <label className="flex items-center gap-2 px-2 text-sm" style={{ height: ALTO_FILA_MARCABLE, background: i % 2 ? C.paperDark : C.blanco, cursor: onMarcar ? "pointer" : undefined }}>
      {onMarcar ? <input type="checkbox" checked={marcada} onChange={(e) => onMarcar(e.target.checked)} style={{ accentColor: C.ink }} /> : <span style={{ width: 13 }} />}
      <span className="flex-1 min-w-0 truncate" title={nota ? `${nombre} · ${nota}` : nombre}>
        {nombre}
        {nota && <span style={{ color: C.charcoal, opacity: OP.secundario, fontSize: T.pequeno }}> · {nota}</span>}
      </span>
      {children}
    </label>
  );
}
