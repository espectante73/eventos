// El marcador de llegadas (él, v69.2): para el día del evento, dos números
// grandes, bien distintos, que se leen de lejos: los que YA ESTÁN en el
// local y los que FALTAN por entrar, de todos los que han pagado. Va
// cambiando solo, cada vez que un colaborador acredita a alguien.
//
// Se abre desde «Día del evento». En el Mac, en una ventana propia del
// sistema (para llevarla a otra pantalla o a la tele); en el móvil, como
// ventana dentro de la app. La cuenta es la misma que la del marcador
// pequeño de la Lista de invitados (cuentaLlegadas): nunca dicen cosas
// distintas.
import { C, OP, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { cuentaLlegadas } from "../../lib/invitados";

// escala-libre: el número crece con la ventana, para leerse de lejos.
const TAMANO_NUMERO = "min(24vw, 42vh)";

export function VentanaMarcador({ data, onCerrar, fijo }) {
  const { yaEstan, faltan, esperados } = cuentaLlegadas(data.invitados, data.evento);
  return (
    <VentanaFlotante clave="marcador" titulo="Marcador de llegadas" onCerrar={onCerrar} fijo={fijo} ancho="min(720px, calc(100vw - 48px))">
      <div className="grid grid-cols-2 gap-4 text-center">
        {[
          { etiqueta: "Ya están", valor: yaEstan, color: C.ink },
          { etiqueta: "Faltan", valor: faltan, color: C.peligro },
        ].map(({ etiqueta, valor, color }) => (
          <div key={etiqueta} data-marcador={etiqueta}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: T.titulo, letterSpacing: 2, textTransform: "uppercase", color }}>
              {etiqueta}
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, lineHeight: 1, fontSize: TAMANO_NUMERO, color }}>{valor}</div>
          </div>
        ))}
      </div>
      <p className="text-center mt-2" style={{ fontSize: T.destacado, color: C.charcoal, opacity: OP.secundario }}>
        de {esperados} que han pagado
      </p>
    </VentanaFlotante>
  );
}
