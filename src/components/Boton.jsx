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
import { C, R, T, OP } from "../theme";

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
        opacity: disabled ? OP.tenue : 1,
        ...style,
      }}
      {...resto}
    >
      {Icono && <Icono size={tamano === "pequeno" ? 13 : 15} />}
      {children}
    </button>
  );
});

// ---------- El link de texto ----------
//
// Norma 4: lo que se PULSA lleva relieve; lo que es un LINK va
// subrayado. Son dos cosas distintas, no una regla con una excepción.
//
//   ACCIÓN sobre los datos  -> `Boton`, con relieve.
//   LINK: te lleva a otro sitio (otra pantalla del login, otra web)
//         -> `EnlaceTexto`, subrayado en gris suave.
//
// El subrayado no es un capricho: es el ESTÁNDAR DE INTERNET, el que
// cualquiera reconoce y el que un desarrollador espera encontrar. Lo
// fijó el usuario el 2026-09-21 mirando su propio login: *"'he olvidado
// mi contraseña'... en todas las páginas web se ve como un link
// subrayado con ese gris suave. Eso sí lo vamos a dejar como estándar"*.
//
// Con `href` sale un enlace de verdad, siempre en pestaña nueva (solo se
// usa para salir de la app). Sin él, un <button>: en el login no se va a
// ninguna parte, solo cambia lo que enseña el formulario.
//
// ⚠️ `py-2` no es decorativo: se ve como una línea de texto, pero el dedo
// necesita dónde acertar. Un link fino en el móvil se falla.
// `enLinea`: el link va DENTRO de una frase ("Tienes permiso para <ver
// el proyecto>"), no en su propia línea. Entonces no puede ser una caja
// flex con alto propio: descuadraría el renglón. El relleno de arriba y
// abajo se queda igualmente -- en un elemento en línea no cambia la
// altura del renglón, pero el dedo sigue teniendo dónde acertar.
export function EnlaceTexto({ children, href, onClick, disabled, color = C.charcoal, enLinea = false, className = "", style, ...resto }) {
  const comun = {
    className: `${enLinea ? "" : "inline-flex items-center gap-1.5 py-2"} ${className}`.trim(),
    style: {
      color,
      // Ese punto de transparencia es lo que lo vuelve "gris suave" en vez
      // de un texto normal subrayado.
      opacity: disabled ? OP.apagado : OP.secundario,
      textDecoration: "underline",
      textUnderlineOffset: 3,
      fontSize: T.pequeno,
      cursor: disabled ? "not-allowed" : "pointer",
      background: "none",
      border: "none",
      // Solo los lados: el alto lo pone `py-2` de la clase, y un
      // `padding: 0` en línea ganaría a la clase y se lo comería.
      paddingLeft: 0,
      paddingRight: 0,
      // Dentro de una frase hereda tamaño y grosor de la frase, o se
      // vería como un trozo suelto de otra letra.
      ...(enLinea ? { display: "inline", fontSize: "inherit", fontWeight: "inherit", paddingTop: 8, paddingBottom: 8 } : {}),
      ...style,
    },
    ...resto,
  };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...comun}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} {...comun}>
      {children}
    </button>
  );
}
