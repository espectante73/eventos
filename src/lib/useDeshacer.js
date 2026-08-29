import { useRef, useState } from "react";

// Hook compartido para el botón "Deshacer" en los textos largos de la
// app (cuerpo de una novedad, plantillas de email) -- a petición del
// usuario, 2026-08-29: "deshacer mientras escribes, antes de guardar".
// Los navegadores ya ofrecen esto con Ctrl+Z a nivel de carácter, pero
// sin ningún botón visible (importante sobre todo en móvil) -- este
// hook guarda "fotos" del texto de vez en cuando (no en cada tecla, o
// cada pulsación contaría como un paso de deshacer distinto) y permite
// volver a la anterior con un botón.
//
// No persiste nada -- es deshacer EN VIVO, dentro de esta sesión de
// edición, distinto del historial guardado en servidor (ver
// "anfitrion_listar_historial_texto" en schema.sql), que cubre el caso
// de "ya guardé y cerré la ventana".
const PAUSA_MS = 700;
const TOPE_PILA = 20;

export function useDeshacer(valorInicial) {
  const [valor, setValor] = useState(valorInicial);
  // No hace falta que la propia pila dispare renders -- solo su
  // longitud (para saber si el botón "Deshacer" debe verse activo), así
  // que un simple contador de renders basta para reflejarlo en pantalla.
  const [, forzarRender] = useState(0);
  const pilaRef = useRef([]);
  // Valor de justo antes de que empezara la "racha" de tecleo actual --
  // null si no hay ninguna racha sin confirmar todavía.
  const inicioRachaRef = useRef(null);
  const temporizadorRef = useRef(null);

  const confirmarRacha = () => {
    if (inicioRachaRef.current === null) return;
    pilaRef.current.push(inicioRachaRef.current);
    if (pilaRef.current.length > TOPE_PILA) pilaRef.current.shift();
    inicioRachaRef.current = null;
    forzarRender((n) => n + 1);
  };

  const cambiar = (nuevo) => {
    if (inicioRachaRef.current === null) inicioRachaRef.current = valor;
    clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(confirmarRacha, PAUSA_MS);
    setValor(nuevo);
  };

  const deshacer = () => {
    clearTimeout(temporizadorRef.current);
    confirmarRacha(); // por si la racha en curso todavía no se había confirmado
    const anterior = pilaRef.current.pop();
    if (anterior !== undefined) {
      setValor(anterior);
      forzarRender((n) => n + 1);
    }
  };

  return {
    valor,
    cambiar,
    deshacer,
    puedeDeshacer: pilaRef.current.length > 0 || inicioRachaRef.current !== null,
    // Para cuando hace falta fijar el valor desde fuera (p.ej. al
    // restaurar una versión del historial guardado en servidor) sin que
    // cuente como un paso más de "deshacer en vivo".
    fijarValor: setValor,
  };
}
