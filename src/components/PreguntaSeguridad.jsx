// La pregunta de seguridad antes de quitar o borrar algo, y el botón rojo
// de quitar. Norma de la app (usuario, 2026-09-19): TODO lo que quite o
// borre pregunta antes, y todo botón de quitar es el mismo círculo rojo.
//
// Una sola pieza, dos cosas:
//   usePreguntaSeguridad()  para cualquier botón que necesite preguntar
//                           ("Vaciar mesa", "Borrar todo"...).
//   <BotonQuitar>           el círculo rojo. Lleva la pregunta DENTRO: no se
//                           puede poner uno sin que pregunte.
//
// Sustituye a window.confirm, prohibido en la app (en una ventana emergente
// sale en la pestaña equivocada y la deja colgada). El aspecto es el de la
// pregunta de "¿Quitar la foto?" de Aniversarios, la ya aprobada: título
// con la pregunta, una línea de texto, "Sí, …" en rojo y "Cancelar".
import { useState, useRef, forwardRef } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { C, OP } from "../theme";
import { ModalFlotante } from "./VentanaFlotante";
import { Boton } from "./Boton";

// preguntar({ titulo, texto, rotulo, peligro, alConfirmar })
//   titulo   la pregunta ("¿Quitar la mesa 3?")
//   texto    una línea con lo que va a pasar (opcional)
//   rotulo   el botón de aceptar ("Sí, quitarla")
//   peligro  false para una pregunta que no borra nada (botón verde)
//   soloAviso  true = no hay nada que confirmar, solo un "Entendido"
//              (p. ej. "no se puede marcar como pagado: faltan datos")
//   detalle  el motivo técnico, en letra pequeña (lo que dice la base de
//            datos cuando algo falla). Sin esto, un "no se pudo" no se
//            puede ni diagnosticar ni contar: pasó el 2026-09-20 con la
//            salida del Modo Pruebas.
export function usePreguntaSeguridad() {
  const [pendiente, setPendiente] = useState(null);
  const cerrar = () => setPendiente(null);
  // La ventana se pinta directamente en el <body>, no donde está el botón:
  // dentro de una fila de tabla heredaría el "una sola línea" y el recorte
  // de la celda. `ancla` dice en qué documento: el de la pestaña o el de
  // una ventana emergente (Novedades).
  const ancla = useRef(null);

  const ventana = pendiente && (
    <ModalFlotante
      titulo={pendiente.titulo}
      onCerrar={cerrar}
      ancho={320}
      acciones={
        // A la derecha, por el pulgar; en espejo con la mano izquierda. Así
        // "Cancelar" queda en el borde, lo más fácil de acertar.
        <div className="flex gap-2 w-full justify-end zurdo:flex-row-reverse">
          {pendiente.soloAviso ? (
            <Boton variante="principal" onClick={cerrar}>
              Entendido
            </Boton>
          ) : (
          <>
          <Boton
            variante={pendiente.peligro === false ? "principal" : "peligro"}
            onClick={() => {
              const { alConfirmar } = pendiente;
              cerrar();
              alConfirmar?.();
            }}
          >
            {pendiente.rotulo || "Sí, quitar"}
          </Boton>
          <Boton onClick={cerrar}>Cancelar</Boton>
          </>
          )}
        </div>
      }
    >
      {pendiente.texto && (
        <p className="text-sm" style={{ color: C.charcoal, whiteSpace: "pre-line" }}>
          {pendiente.texto}
        </p>
      )}
      {pendiente.detalle && (
        <p
          className="text-xs mt-2 pt-2"
          style={{ color: C.line, borderTop: `1px solid ${C.line}33`, whiteSpace: "pre-line", wordBreak: "break-word" }}
        >
          {pendiente.detalle}
        </p>
      )}
    </ModalFlotante>
  );

  const ventanaPregunta = (
    <>
      <span ref={ancla} style={{ display: "none" }} />
      {ventana &&
        ancla.current &&
        createPortal(
          // Un portal sigue pasando los toques a los componentes que rodean
          // al botón (una fila, una foto que se abre al tocarla...). Aquí se
          // cortan: tocar la pregunta no hace nada más.
          // Si el botón vive donde no debe sonar el clic (la Música del
          // evento), la pregunta tampoco.
          <div
            data-sin-sonido-clic={ancla.current.closest("[data-sin-sonido-clic]") ? "" : undefined}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {ventana}
          </div>,
          ancla.current.ownerDocument.body
        )}
    </>
  );

  return { preguntar: setPendiente, ventanaPregunta };
}

// Se ve de 24px, el tamaño de la X de las mesas (el modelo, 2026-09-16).
// El dedo, en cambio, acierta en 44px: el mínimo para un móvil, que antes
// no se cumplía (la papelera de Aniversarios medía 19). Esa zona de más es
// invisible (.boton-quitar::before en index.css).
export const TAMANO_BOTON_QUITAR = 24;

// `borrar`: papelera en vez de X -- lo que se borra para siempre (invitado,
//           colaborador, novedad, pista, foto). La X, lo que solo se quita.
// `pregunta`: { titulo, texto, rotulo } de la pregunta de seguridad.
// `yaPregunta`: SOLO si quien lo usa ya tiene su propia pregunta (p. ej.
//           Aniversarios, que enseña la foto en la suya).
export const BotonQuitar = forwardRef(function BotonQuitar(
  { borrar = false, titulo, pregunta, yaPregunta = false, onClick, disabled, className = "", style, ...resto },
  ref
) {
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  if (import.meta.env.DEV && !pregunta && !yaPregunta) {
    console.warn("BotonQuitar: todo quitar o borrar tiene que preguntar antes (`pregunta`).");
  }
  const Icono = borrar ? Trash2 : X;
  return (
    <>
      <button
        ref={ref}
        type="button"
        title={titulo}
        aria-label={titulo}
        disabled={disabled}
        onClick={(e) => {
          if (yaPregunta || !pregunta) onClick?.(e);
          else preguntar({ ...pregunta, alConfirmar: () => onClick?.(e) });
        }}
        className={`boton-3d boton-quitar relative rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          width: TAMANO_BOTON_QUITAR,
          height: TAMANO_BOTON_QUITAR,
          background: C.wax,
          color: "#fff",
          opacity: disabled ? OP.apagado : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
        }}
        {...resto}
      >
        <Icono size={borrar ? 13 : 15} />
      </button>
      {ventanaPregunta}
    </>
  );
});
