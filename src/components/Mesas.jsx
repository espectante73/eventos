// La mesa arrastrable dentro del lienzo del Plano de mesas. (La redonda con
// sillas de la ventana Mesas se fue en la v74.6: «Mesas y acomodación»
// muestra cada mesa como una columna.) Movida fuera de App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { useState, useEffect, useRef } from "react";
import { C, T } from "../theme";
import { realmDe } from "../lib/realm";
import { ANCHO_MESA_PLANO } from "../lib/planoMesas";

// Mesa arrastrable dentro del lienzo del plano — la posición se guarda como
// porcentaje (0-100) del ancho/alto del lienzo, no en píxeles, para que
// siga siendo válida aunque se cambie el tamaño de la ventana o se imprima
// en otro formato.
// `ancho`: lo que mide, en % del ancho del plano (lib/planoMesas.js).
export function MesaPlano({ m, ocupados, canvasRef, onMover, ancho = ANCHO_MESA_PLANO }) {
  const arrastrando = useRef(false);
  // Posición visual mientras se arrastra — no llama a guardar hasta soltar,
  // para no disparar una petición a la base de datos en cada píxel de
  // movimiento del ratón (eso fue justo el fallo: si una fallaba, el aviso
  // se repetía sin parar porque el ratón seguía generando eventos).
  const [posVisual, setPosVisual] = useState({ x: m.posX, y: m.posY });
  const posFinal = useRef({ x: m.posX, y: m.posY });

  useEffect(() => {
    if (!arrastrando.current) setPosVisual({ x: m.posX, y: m.posY });
  }, [m.posX, m.posY]);

  useEffect(() => {
    const coords = (e) => (e.touches ? e.touches[0] : e);
    const mover = (e) => {
      if (!arrastrando.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const { clientX, clientY } = coords(e);
      const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
      posFinal.current = { x, y };
      setPosVisual({ x, y });
    };
    const soltar = () => {
      if (!arrastrando.current) return;
      arrastrando.current = false;
      onMover(m.numero, posFinal.current.x, posFinal.current.y);
    };
    // El ratón de la ventana donde está el plano (v93.9, él: «en Mesas no
    // se pueden mover»): en el Mac, Mesas es otra ventana del sistema, y
    // escuchando en la principal la mesa no se enteraba de nada.
    const { win } = realmDe(canvasRef.current);
    win.addEventListener("mousemove", mover);
    win.addEventListener("mouseup", soltar);
    win.addEventListener("touchmove", mover);
    win.addEventListener("touchend", soltar);
    return () => {
      win.removeEventListener("mousemove", mover);
      win.removeEventListener("mouseup", soltar);
      win.removeEventListener("touchmove", mover);
      win.removeEventListener("touchend", soltar);
    };
  }, [m.numero, canvasRef, onMover]);

  // El dibujo, en unidades propias (las del viewBox): 60 de lado, con la
  // mesa de 44 y las sillas alrededor. El navegador lo escala al tamaño
  // de la caja, con letras y sillas en la misma proporción.
  const lado = 60;
  const diametro = 44;
  const sillas = Math.max(0, Math.min(m.capacidad, 16));
  const radioSillas = diametro / 2 + 6;
  const centro = lado / 2;

  return (
    <div
      onMouseDown={() => (arrastrando.current = true)}
      onTouchStart={() => (arrastrando.current = true)}
      data-mesa-plano
      className="absolute select-none"
      style={{
        width: `${ancho}%`,
        aspectRatio: "1",
        left: `${posVisual.x}%`,
        top: `${posVisual.y}%`,
        transform: "translate(-50%, -50%)",
        cursor: "grab",
        touchAction: "none",
      }}
      title={`Mesa ${m.numero} — ${ocupados}/${m.capacidad}`}
    >
      <svg viewBox={`0 0 ${lado} ${lado}`} width="100%" height="100%" className="block" aria-hidden="true">
        {/* Sillas alrededor — su número sigue a la capacidad, igual que en
            la sección Mesas, para que el plano refleje lo mismo. */}
        {Array.from({ length: sillas }).map((_, i) => {
          const angulo = (2 * Math.PI * i) / sillas - Math.PI / 2;
          const cx = centro + radioSillas * Math.cos(angulo);
          const cy = centro + radioSillas * Math.sin(angulo);
          return (
            <rect
              key={i}
              x={cx - 2.5}
              y={cy - 1.5}
              width={5}
              height={3}
              rx={1}
              fill={C.paperDark}
              stroke={C.line}
              strokeWidth={1}
              transform={`rotate(${(angulo * 180) / Math.PI + 90} ${cx} ${cy})`}
            />
          );
        })}
        <circle cx={centro} cy={centro} r={diametro / 2 - 1} fill={C.okFondo} stroke={C.line} strokeWidth={2} />
        <text x={centro} y={centro - 1.5} textAnchor="middle" fontFamily="'Fraunces', serif" fontWeight={700} fontSize={T.pequeno} fill={C.ink}>
          {m.numero}
        </text>
        <text x={centro} y={centro + 10.5} textAnchor="middle" fontSize={T.micro} fill={C.charcoal}>
          {ocupados}/{m.capacidad}
        </text>
      </svg>
    </div>
  );
}
