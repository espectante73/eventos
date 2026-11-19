// «Canciones para bailar» tal como la ve el DJ (v81; pieza aparte en v91.5):
// una línea por petición, sin nombres, con las estrellas y la edad de quien
// la pidió. Buscar, quedarse con un tramo de edad, ordenar, exportar a CSV e
// imprimir o guardar en PDF; cada canción se abre en Deezer y se escucha 30
// segundos. La usan la página del enlace (VistaDj) y la ventana de la cuenta
// del DJ (VentanaCancionesDj): una sola pieza, no dos copias (norma 7).
//
// `datos`: lo que trae la base ({ peticiones, catalogo, fuera, evento }).
// `escuchar(consulta)`: la escucha previa, con la llave de quien mira.
// `nuevas` (claves) y `desde` (v92, solo en la cuenta del DJ): las nuevas o
// cambiadas, con el título en rojo, y arriba un recuadro rojo con cuántas
// que, al tocarlo, deja solo esas, también en lo que se imprime y se exporta.
import { useState } from "react";
import { Copy, Printer, ExternalLink, Music } from "lucide-react";
import { C, OP, T, inputStyle } from "../theme";
import { Boton } from "./Boton";
import { TextInput } from "./Formulario";
import { LineaAviso } from "./LineaAviso";
import { EncabezadoOrdenable } from "./Widgets";
import { EscucharCancion } from "./EscucharCancion";
import { estrellas, ordenarCanciones, tocarOrdenCanciones, ORDEN_CANCIONES_INICIAL } from "../lib/canciones";
import { enlaceDeezer } from "../lib/repasoCanciones";
import { filasDelDj, filtrarPeticiones, textoCancionesNuevas } from "../lib/dj";
import { descargarCSV } from "../lib/descargas";
import { consultaDeFila } from "../lib/escuchar";

// Mismas columnas que la ventana del anfitrión: estrellas · canción · edad · ▶,
// con la canción del ancho de la más larga (v81.2): las filas comparten las
// columnas de la lista (subgrid).
const COLUMNAS = "4.5rem minmax(0, max-content) 3.5rem 2.25rem";
const FILA = { gridColumn: "1 / -1", gridTemplateColumns: "subgrid" };
// Lo que va con la lista (filtros, botones) se acomoda a su ancho sin ensancharla.
const A_SU_ANCHO = { width: 0, minWidth: "100%" };

const SIN_NUEVAS = new Set();
// Una canción nueva: su título en el mismo rojo que el aviso de arriba.
const MARCA_NUEVA = { color: C.peligro, fontWeight: 600 };

export function ListaCancionesDj({ datos, escuchar, hora, motivo, nuevas = SIN_NUEVAS, desde }) {
  const [filtro, setFiltro] = useState({ texto: "", desde: "", hasta: "" });
  const [orden, setOrden] = useState(ORDEN_CANCIONES_INICIAL);
  const [soloNuevas, setSoloNuevas] = useState(false);

  const catalogo = datos.catalogo || {};
  const todas = filasDelDj(datos);
  // Sin ninguna nueva (al día siguiente, por ejemplo), el filtro no se queda puesto.
  const filtrandoNuevas = soloNuevas && nuevas.size > 0;
  const base = filtrandoNuevas ? todas.filter((f) => nuevas.has(f.clave)) : todas;
  const filas = ordenarCanciones(filtrarPeticiones(base, filtro), orden);
  const poner = (campo) => (e) => setFiltro((f) => ({ ...f, [campo]: e.target.value }));
  const exportar = () =>
    descargarCSV(
      `canciones-${datos.evento || "evento"}.csv`,
      ["Veces", "Canción", "Edad"],
      filas.map((f) => [f.veces, f.cancion, f.edad ?? ""])
    );
  const edad = { ...inputStyle, width: 56, textAlign: "center", minWidth: 0 };

  return (
    <div className="space-y-3">
      {/* Todo el recuadro se toca, como el aviso de su inicio: un botón de
          contorno sobre el rojo no se leía. */}
      {nuevas.size > 0 && (
        <button
          onClick={() => setSoloNuevas(!filtrandoNuevas)}
          aria-pressed={filtrandoNuevas}
          className="boton-3d flex items-center gap-3 rounded px-3 py-2.5 text-sm text-left oculto-al-imprimir zurdo:flex-row-reverse zurdo:text-right"
          style={{ ...A_SU_ANCHO, background: C.peligro, color: C.blanco }}
        >
          <Music size={16} className="flex-shrink-0" aria-hidden />
          <span className="flex-1 min-w-0" style={{ fontWeight: 600 }}>
            {textoCancionesNuevas(nuevas.size, desde)}
          </span>
          <span className="flex-shrink-0 whitespace-nowrap" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
            {filtrandoNuevas ? "Ver todas" : "Ver solo esas"}
          </span>
        </button>
      )}
      {/* Los filtros, en una línea (norma 6). */}
      <div className="flex items-center gap-2 oculto-al-imprimir" style={A_SU_ANCHO}>
        <TextInput value={filtro.texto} onChange={poner("texto")} placeholder="Buscar canción o artista" aria-label="Buscar canción o artista" className="flex-1 min-w-0" />
        <span className="text-sm" style={{ color: C.charcoal }}>
          Edad
        </span>
        <input value={filtro.desde} onChange={poner("desde")} inputMode="numeric" placeholder="de" aria-label="Edad desde" style={edad} />
        <input value={filtro.hasta} onChange={poner("hasta")} inputMode="numeric" placeholder="a" aria-label="Edad hasta" style={edad} />
      </div>

      <div id="zona-imprimible" style={{ display: "grid", gridTemplateColumns: COLUMNAS, columnGap: 4 }}>
        <div className="grid text-xs uppercase px-2 py-2" style={{ ...FILA, fontFamily: "'IBM Plex Mono', monospace", borderBottom: `1px solid ${C.line}` }}>
          {[
            ["veces", "★"],
            ["cancion", "Canción"],
            ["edad", "Edad"],
          ].map(([columna, rotulo]) => (
            <EncabezadoOrdenable key={columna} sinDivisor columna={columna} orden={orden} onClick={(c) => setOrden((o) => tocarOrdenCanciones(o, c))}>
              {rotulo}
            </EncabezadoOrdenable>
          ))}
          <span />
        </div>
        {filas.map((f, i) => (
          <div key={`${f.invitadoId}-${f.hueco}`} className="grid items-center px-2 py-1.5 text-sm" style={{ ...FILA, background: i % 2 ? C.paperDark : C.blanco, color: C.charcoal }}>
            <span className="text-center whitespace-nowrap" style={{ color: C.gold }}>
              {estrellas(f.veces)}
            </span>
            {/* Escucharla en Deezer, en otra pestaña. */}
            <a href={enlaceDeezer(f, catalogo)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 min-w-0" style={{ color: C.charcoal }} title="Escucharla en Deezer">
              {/* Las nuevas, con el título en rojo: una etiqueta al lado
                  dejaba el título en tres letras en el móvil. */}
              <span className="truncate" style={{ textDecoration: "underline", textUnderlineOffset: 3, ...(nuevas.has(f.clave) ? MARCA_NUEVA : {}) }}>
                {f.cancion}
                {nuevas.has(f.clave) && <span className="sr-only"> (nueva o cambiada)</span>}
              </span>
              <ExternalLink size={12} className="flex-shrink-0 oculto-al-imprimir" style={{ opacity: OP.secundario }} aria-hidden />
            </a>
            <span className="text-center">{f.edad ?? "—"}</span>
            <span className="flex justify-center oculto-al-imprimir">
              <EscucharCancion consulta={consultaDeFila(f, catalogo)} buscar={escuchar} />
            </span>
          </div>
        ))}
        {!filas.length && (
          <p className="text-sm italic p-2" style={{ gridColumn: "1 / -1", color: C.charcoal, opacity: OP.secundario }}>
            {todas.length ? "Ninguna canción con estos filtros." : "Todavía nadie ha pedido una canción."}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-2 oculto-al-imprimir zurdo:flex-row-reverse" style={{ ...A_SU_ANCHO, borderTop: `1px solid ${C.line}` }}>
        <Boton variante="principal" icono={Printer} onClick={() => window.print()}>
          Imprimir / PDF
        </Boton>
        <Boton variante="secundario" icono={Copy} onClick={exportar}>
          Exportar CSV
        </Boton>
        <span className="ml-auto zurdo:ml-0 zurdo:mr-auto" style={{ color: C.charcoal, opacity: OP.secundario, fontSize: T.pequeno }}>
          {hora && `Se actualiza sola · ${hora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
        </span>
      </div>
      {motivo && <LineaAviso className="text-sm">{motivo}</LineaAviso>}
    </div>
  );
}
