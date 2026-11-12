// El sello de los días que faltan, en el panel del colaborador (él, v73.1):
// siempre a la vista, haga lo que haga y sin abrir nada. La misma cuenta
// que el tablón (cuentaAtrasEvento): cambia cada día, el día del evento
// dice «¡Es hoy!» y, con la fecha sin confirmar, no sale. Abajo, del lado
// CONTRARIO al pulgar: ese es de la barra de ventanas (norma 3, con su
// espejo zurdo:). No se pulsa: los toques pasan a lo que hay debajo.
// En la capa del inicio (Z_INICIO, ver BarraVentanas): por encima del
// formulario a pantalla entera del móvil y debajo de las ventanas flotantes,
// que pueden taparlo (él, v74.5: «es para verlo al abrir»).
import { C, R, S, T, FONDO_VERDE } from "../theme";
import { cuentaAtrasEvento } from "../lib/formato";
import { Z_INICIO } from "./BarraVentanas";

export const TAM_SELLO = 76;
const MARGEN_SELLO = 16;
// Lo que el panel deja libre abajo para que lo último no quede debajo del sello.
export const HUECO_SELLO = TAM_SELLO + 2 * MARGEN_SELLO;

const ROTULO = { fontFamily: "'IBM Plex Mono', monospace", fontSize: T.micro, letterSpacing: 1, textTransform: "uppercase", lineHeight: 1.2 };

// `enLinea` (v85.4, él: «en un círculo dorado los días que faltan, igual
// que el inicio de la app»): el MISMO sello dentro de la página, en su
// sitio, en vez de fijo en la esquina. Lo usa el recuadro verde del tablón.
// `quieto` (v85.5, él): el día del evento, con las fotos abiertas, la que
// late es la tarjeta de las fotos; dos latidos a la vez compiten.
export function SelloCuentaAtras({ evento, hoy, enLinea = false, quieto = false }) {
  const cuenta = cuentaAtrasEvento(evento, hoy);
  if (!cuenta) return null;
  return (
    <div
      data-sello-cuenta-atras
      aria-label={cuenta.hoy ? "Es hoy" : `${cuenta.arriba} ${cuenta.numero} ${cuenta.abajo}`}
      // El latido y su halo, en index.css (.sello-cuenta-atras): dorado y
      // verde, lento, como el de los otros sellos pero sin prisa (él).
      className={`${quieto ? "" : "sello-cuenta-atras "}${enLinea ? "flex-shrink-0" : "fixed left-4 zurdo:left-auto zurdo:right-4"} flex flex-col items-center justify-center text-center pointer-events-none`}
      data-quieto={quieto || undefined}
      style={{
        ...(enLinea ? {} : { bottom: MARGEN_SELLO, zIndex: Z_INICIO }),
        ...(quieto ? { boxShadow: S.flotante } : {}),
        width: TAM_SELLO,
        height: TAM_SELLO,
        borderRadius: R.redondo,
        background: FONDO_VERDE,
        color: C.goldClaro,
        border: `2px solid ${C.gold}`,
      }}
    >
      {cuenta.arriba && <div style={ROTULO}>{cuenta.arriba}</div>}
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, lineHeight: 1, fontSize: cuenta.hoy ? T.normal : T.cifra }}>
        {cuenta.numero}
      </div>
      {cuenta.abajo && <div style={ROTULO}>{cuenta.abajo}</div>}
    </div>
  );
}
