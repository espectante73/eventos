// «Te falta» (él, v87.2): al abrir el tablón, lo que le queda por dar a su
// colaborador, con todo lo demás atenuado detrás (el VELO de ModalFlotante,
// norma 5). El importe, lo primero y muy resaltado (él: «que el aviso del
// importe se vea muy resaltado, todo lo demás atenuado»); la foto de boda y
// las alergias, debajo y apagadas. Se cierra con «Entendido» y vuelve a
// salir cada vez que abre el tablón, hasta que su colaborador lo apunte.
// Qué sale, en lib/rondasTablon.js (pendientesDelTablon); aparte de
// VistaTablon para poder dibujarlo en una prueba.
import { ModalFlotante } from "../components/VentanaFlotante";
import { Boton } from "../components/Boton";
import { C, OP, T, R, DEDO } from "../theme";
import { euros } from "../lib/formato";

export function TeFaltaTablon({ pendientes, colaborador, colaboradorEsYo, onCerrar }) {
  const { importe, fotoBoda, alergias } = pendientes;
  // Con el importe delante, lo demás se apaga; sin él, se lee normal.
  const apagado = importe > 0 ? { opacity: OP.tenue } : {};
  return (
    <ModalFlotante
      titulo="Te falta"
      ancho={420}
      onCerrar={onCerrar}
      acciones={
        <Boton variante="principal" onClick={onCerrar} className="w-full" style={{ minHeight: DEDO }}>
          Entendido
        </Boton>
      }
    >
      <div className="space-y-3" style={{ color: C.charcoal }}>
        {importe > 0 && (
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
      </div>
    </ModalFlotante>
  );
}
