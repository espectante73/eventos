// «Canciones para bailar» en la cuenta del DJ (v91.5, él: el DJ entra con su
// usuario y, además de Multimedia, ve la lista). Lo mismo que la página del
// enlace (VistaDj), con la misma pieza (ListaCancionesDj), sin enlace ni
// clave: la base mira el permiso (colaborador_canciones_dj). Él la usa los
// días antes, para prepararlo todo; el día del evento ya trae las listas.
// El anfitrión, con «Cambiar vista», la ve con sus propios datos.
//
// Los datos y lo nuevo (v92) llegan ya hechos de useCancionesDj, el mismo
// que alimenta el aviso rojo de su inicio.
import { VentanaFlotante } from "../components/VentanaFlotante";
import { RecuadroCifras } from "../components/Widgets";
import { LineaAviso } from "../components/LineaAviso";
import { ListaCancionesDj } from "../components/ListaCancionesDj";
import { cifrasDelDj } from "../lib/dj";

export function VentanaCancionesDj({ canciones, esAnfitrion, escuchar, onCerrar }) {
  const { datos, motivo, hora, nuevas, desde } = canciones;
  return (
    <VentanaFlotante clave="cancionesDj" titulo="Canciones para bailar" onCerrar={onCerrar} extra={datos ? <RecuadroCifras cifras={cifrasDelDj(datos)} /> : undefined}>
      {datos ? (
        <ListaCancionesDj datos={datos} escuchar={escuchar} hora={esAnfitrion ? null : hora} motivo={motivo} nuevas={nuevas} desde={desde} />
      ) : (
        motivo && <LineaAviso className="text-sm">{motivo}</LineaAviso>
      )}
    </VentanaFlotante>
  );
}
