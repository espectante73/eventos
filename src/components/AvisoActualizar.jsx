// El aviso rojo de «Actualizar» (él, v81.6): arriba el número de la versión
// nueva y el botón, del lado del pulgar elegido; debajo, en 2 o 3 líneas,
// qué cambia. El texto, de lib/avisoVersion.js.
import { C } from "../theme";

const TRES_LINEAS = { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" };

export function AvisoActualizar({ titulo, texto, onActualizar }) {
  return (
    <div className="px-4 py-2 text-sm" style={{ background: C.wax, color: C.blanco }}>
      <div className="flex items-center justify-between gap-3 zurdo:flex-row-reverse">
        <span className="font-semibold truncate">{titulo}</span>
        <button
          onClick={onActualizar}
          className="boton-3d px-3 py-1 rounded font-medium whitespace-nowrap"
          style={{ background: C.blanco, color: C.wax }}
        >
          Actualizar
        </button>
      </div>
      {texto && (
        <p className="mt-1" style={TRES_LINEAS}>
          {texto}
        </p>
      )}
    </div>
  );
}
