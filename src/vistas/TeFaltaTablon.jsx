// «Te falta» (él, v87.2-87.3): al abrir el tablón, lo que le queda por dar a
// su colaborador, con todo lo demás atenuado detrás (el VELO de
// ModalFlotante). El importe, lo primero y muy resaltado; la foto de boda y
// las alergias, debajo y apagadas. Qué sale, en lib/rondasTablon.js
// (pendientesDelTablon); aparte de VistaTablon para poder dibujarlo.
//
// ⚠️ Sin pagar, NO se cierra (v87.3, él: «el tablón queda ensombrecido
// hasta que su colaborador marque como pagado»): ni X ni «Entendido». Se
// abre solo en cuanto le marcan, con el refresco del tablón (cada minuto y
// al volver a la pestaña). Lleva «Cambiar» para que en un móvil que
// comparte la familia pueda entrar otro. Ya pagado, lo que falte se cierra
// con «Entendido» y vuelve a salir cada vez que abre el tablón.
import { ModalFlotante } from "../components/VentanaFlotante";
import { Boton, EnlaceTexto } from "../components/Boton";
import { C, OP, T, R, DEDO } from "../theme";
import { euros } from "../lib/formato";

export function TeFaltaTablon({ pendientes, nombre, colaborador, colaboradorEsYo, onCerrar, onCambiar }) {
  const { importe, fotoBoda, alergias } = pendientes;
  const sinPagar = importe > 0;
  // Con el importe delante, lo demás se apaga; sin él, se lee normal.
  const apagado = sinPagar ? { opacity: OP.tenue } : {};
  return (
    <ModalFlotante
      titulo="Te falta"
      ancho={420}
      cerrable={!sinPagar}
      onCerrar={sinPagar ? () => {} : onCerrar}
      acciones={
        sinPagar ? null : (
          <Boton variante="principal" onClick={onCerrar} className="w-full" style={{ minHeight: DEDO }}>
            Entendido
          </Boton>
        )
      }
    >
      <div className="space-y-3" style={{ color: C.charcoal }}>
        {sinPagar && (
          <div data-importe className="px-4 py-3" style={{ background: C.avisoFondo, border: `2px solid ${C.wax}`, borderRadius: R.caja, color: C.wax }}>
            <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.titulo, lineHeight: 1.2 }}>El importe del evento: {euros(importe)}</p>
            <p className="mt-1" style={{ fontSize: T.normal }}>
              Es muy importante poder recoger el dinero de tu entrada.
            </p>
          </div>
        )}
        {(fotoBoda || alergias) && (
          <ul data-resto className="list-disc pl-5 text-sm space-y-1" style={apagado}>
            {fotoBoda && <li>Tu foto de boda, para «Las bodas de todos».</li>}
            {alergias && <li>Tus alergias, o decir que no tienes.</li>}
          </ul>
        )}
        {colaborador && !colaboradorEsYo && (
          <p className="text-sm">
            Habla con tu colaborador: <b>{colaborador}</b>.
          </p>
        )}
        {/* Su frase (él, v87.3). */}
        {sinPagar && (
          <p className="text-sm">
            {colaboradorEsYo
              ? "Si ya has pagado, márcate como pagado en la aplicación. Así podrás ver el tablón."
              : "Si ya has pagado, dile a tu colaborador que te marque como pagado en la aplicación. Así podrás ver el tablón."}
          </p>
        )}
        {/* Un móvil que comparte la familia: que pueda entrar otro. */}
        {sinPagar && onCambiar && (
          <p className="text-xs flex items-center gap-1 flex-wrap" style={{ opacity: OP.secundario }}>
            Has entrado como {nombre}. <EnlaceTexto onClick={onCambiar}>Cambiar</EnlaceTexto>
          </p>
        )}
      </div>
    </ModalFlotante>
  );
}
