// La pieza "botón" única de la app (2026-09-17).
//
// Antes: 179 <button> con su receta escrita al lado (color, alto, letra,
// esquinas), copiada a mano. Salieron 12 combinaciones de tamaño distintas
// sin que nadie lo decidiera. Cambiar "todos los botones de borrar" obligaba
// a buscarlos uno a uno, y dos botones que hacen lo mismo se veían distintos
// en dos pantallas.
//
// Tres variantes, y el criterio de cuál usar:
//   principal   la acción principal de la pantalla (una sola). Verde lleno.
//   secundario  todo lo demás. Solo contorno.
//   peligro     lo que no tiene vuelta atrás. Rojo.
// Dos tamaños: `normal` y `pequeno` (para filas de tabla).
//
// Lo que la pieza GARANTIZA, y antes dependía de acordarse:
//   - un botón de solo icono siempre lleva nombre para lectores de pantalla
//     (`titulo` es obligatorio ahí: si falta, avisa en consola en desarrollo);
//   - el estado desactivado se ve igual en toda la app;
//   - el relieve .boton-3d y el aro de foco del teclado vienen de serie.
//
// Lo que NO pasa por aquí, a propósito: el mando de música (teclas con su
// propio lenguaje), las filas de MenuFlotante y los botones translúcidos
// sobre la foto de la Portada. Unificarlos los empeoraría.
import { forwardRef } from "react";
import { C, R, T } from "../theme";

const TAMANOS = {
  normal: { padding: "6px 12px", fontSize: T.normal, minHeight: 36 },
  pequeno: { padding: "3px 8px", fontSize: T.pequeno, minHeight: 28 },
};

// `oscuro`: el botón vive sobre fondo verde (cabeceras de ventana), donde el
// contorno verde del secundario sería invisible.
export function estilosBoton(variante = "secundario", tamano = "normal", oscuro = false) {
  const base = TAMANOS[tamano] || TAMANOS.normal;
  const colores = {
    principal: oscuro
      ? { background: C.goldClaro, color: C.ink, border: "1px solid transparent" }
      : { background: C.ink, color: C.goldClaro, border: "1px solid transparent" },
    secundario: oscuro
      ? { background: "transparent", color: C.goldClaro, border: `1px solid ${C.gold}` }
      : { background: "transparent", color: C.ink, border: `1px solid ${C.ink}` },
    peligro: { background: C.wax, color: "#fff", border: "1px solid transparent" },
  };
  return { ...base, ...(colores[variante] || colores.secundario), borderRadius: R.caja };
}

// forwardRef: MenuFlotante necesita la referencia al botón que lo abre para
// colocar el panel debajo. Sin esto, `ref` se pierde en silencio (React no
// lo pasa a un componente de función) y el desplegable de "Acciones" de la
// Lista de invitados se descoloca. Encontrado el 2026-09-17, al migrarlo.
export const Boton = forwardRef(function Boton({
  children,
  variante = "secundario",
  tamano = "normal",
  oscuro = false,
  icono: Icono,
  titulo,
  disabled,
  type = "button",
  className = "",
  style,
  ...resto
}, ref) {
  const soloIcono = !children;
  if (import.meta.env.DEV && soloIcono && !titulo) {
    // Un botón de solo icono sin nombre es mudo para un lector de pantalla.
    console.warn("Boton: un botón de solo icono necesita `titulo`.");
  }
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      title={titulo}
      aria-label={soloIcono ? titulo : undefined}
      className={`boton-3d inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium ${className}`}
      style={{
        ...estilosBoton(variante, tamano, oscuro),
        ...(soloIcono ? { padding: tamano === "pequeno" ? 5 : 8, gap: 0 } : {}),
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      {...resto}
    >
      {Icono && <Icono size={tamano === "pequeno" ? 13 : 15} />}
      {children}
    </button>
  );
});
