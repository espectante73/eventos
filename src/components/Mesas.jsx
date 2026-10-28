// La mesa arrastrable dentro del lienzo del Plano de mesas. (La redonda con
// sillas de la ventana Mesas se fue en la v74.6: «Mesas y acomodación»
// muestra cada mesa como una columna.) Movida fuera de App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { useState, useEffect, useRef } from "react";
import { C, T } from "../theme";

// Mesa arrastrable dentro del lienzo del plano — la posición se guarda como
// porcentaje (0-100) del ancho/alto del lienzo, no en píxeles, para que
// siga siendo válida aunque se cambie el tamaño de la ventana o se imprima
// en otro formato.
export function MesaPlano({ m, ocupados, canvasRef, onMover }) {
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
    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
    window.addEventListener("touchmove", mover);
    window.addEventListener("touchend", soltar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
      window.removeEventListener("touchmove", mover);
      window.removeEventListener("touchend", soltar);
    };
  }, [m.numero, canvasRef, onMover]);

  const diametro = 44;
  const sillas = Math.max(0, Math.min(m.capacidad, 16));
  const radioSillas = diametro / 2 + 6;
  const lienzoMesa = diametro + 16;
  const centro = lienzoMesa / 2;

  return (
    <div
      onMouseDown={() => (arrastrando.current = true)}
      onTouchStart={() => (arrastrando.current = true)}
      className="absolute select-none"
      style={{
        width: lienzoMesa,
        height: lienzoMesa,
        left: `${posVisual.x}%`,
        top: `${posVisual.y}%`,
        transform: "translate(-50%, -50%)",
        cursor: "grab",
        touchAction: "none",
      }}
      title={`Mesa ${m.numero} — ${ocupados}/${m.capacidad}`}
    >
      {/* Sillas alrededor — su número sigue a la capacidad, igual que en
          la sección Mesas, para que el plano refleje lo mismo. */}
      {Array.from({ length: sillas }).map((_, i) => {
        const angulo = (2 * Math.PI * i) / sillas - Math.PI / 2;
        const cx = centro + radioSillas * Math.cos(angulo);
        const cy = centro + radioSillas * Math.sin(angulo);
        return (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              width: 6,
              height: 4,
              left: cx - 3,
              top: cy - 2,
              background: C.paperDark,
              border: `1px solid ${C.line}`,
              transform: `rotate(${(angulo * 180) / Math.PI + 90}deg)`,
            }}
          />
        );
      })}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: diametro,
          height: diametro,
          left: (lienzoMesa - diametro) / 2,
          top: (lienzoMesa - diametro) / 2,
          background: C.okFondo,
          border: `2px solid ${C.line}`,
        }}
      >
        <div className="text-center leading-tight">
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.pequeno, color: C.ink }}>
            {m.numero}
          </div>
          <div style={{ fontSize: T.micro, color: C.charcoal }}>
            {ocupados}/{m.capacidad}
          </div>
        </div>
      </div>
    </div>
  );
}
