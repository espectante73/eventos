// El marcador de llegadas, «Acreditación» (él, v69.2; el nombre, v70.6):
// para el día del evento, dos números grandes, bien distintos, que se leen
// de lejos: los que YA ESTÁN en el local y los que FALTAN por entrar, de
// todos los que han pagado. Va cambiando solo, cada vez que un colaborador
// acredita a alguien.
//
// Se abre desde «Día del evento». En el Mac, en una ventana propia del
// sistema (para llevarla a otra pantalla o a la tele); en el móvil, como
// ventana dentro de la app. La cuenta es la misma que la del marcador
// pequeño de la Lista de invitados (cuentaLlegadas): nunca dicen cosas
// distintas.
//
// Para leerse a 10 metros (él, v70.7): centrado en la ventana, los rótulos
// en una fila y los números en otra (a la misma altura los dos), y todo
// creciendo con la ventana. El número, unos dos tercios del alto, sin
// salirse de su mitad aunque tenga tres cifras.
import { C, OP, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { cuentaLlegadas } from "../../lib/invitados";

// escala-libre: crecen con la ventana, para leerse de lejos; con un mínimo,
// para el móvil.
const TAMANO_NUMERO = "min(26vw, 62vh)";
const TAMANO_ROTULO = `max(${T.titulo}px, min(4vw, 7vh))`;
const TAMANO_PIE = `max(${T.normal}px, min(2.6vw, 4.5vh))`;

export function VentanaMarcador({ data, onCerrar, fijo }) {
  const { yaEstan, faltan, esperados } = cuentaLlegadas(data.invitados, data.evento);
  const columnas = [
    { etiqueta: "Ya están", valor: yaEstan, color: C.ink },
    { etiqueta: "Faltan", valor: faltan, color: C.peligro },
  ];
  return (
    <VentanaFlotante clave="marcador" titulo="Acreditación" onCerrar={onCerrar} fijo={fijo} ancho="min(720px, calc(100vw - 48px))">
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-x-4 text-center items-end">
          {columnas.map(({ etiqueta, color }) => (
            <div key={etiqueta} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: TAMANO_ROTULO, letterSpacing: 2, textTransform: "uppercase", color }}>
              {etiqueta}
            </div>
          ))}
          {columnas.map(({ etiqueta, valor, color }) => (
            <div key={etiqueta} data-marcador={etiqueta} style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, lineHeight: 1, fontSize: TAMANO_NUMERO, color }}>
              {valor}
            </div>
          ))}
        </div>
        <p className="text-center mt-2" style={{ fontSize: TAMANO_PIE, color: C.charcoal, opacity: OP.secundario }}>
          de {esperados} que han pagado
        </p>
      </div>
    </VentanaFlotante>
  );
}
