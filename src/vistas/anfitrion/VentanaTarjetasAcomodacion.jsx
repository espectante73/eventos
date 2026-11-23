// Tarjetas de acomodación (él, v97): el nombre de cada invitado en su mesa, para
// imprimir, doblar y poner en el plato. Antes de descargar, la VISTA PREVIA
// de todas las hojas (él: «no sea que no me guste cómo quede»), y la hoja
// (A4 o A3). La tarjeta, siempre la bancaria: cada cara, de su tamaño (él,
// v98.9; retiró el ancho de 9,5 cm), plegada o de una cara (v99.8). Con qué se cortan (v99: guillotina,
// tijera o plóter), que decide las marcas. Y el acabado: los de la línea de la invitación (v99.2; el cuarto, v99.7) (él:
// «poder editar yo mismo el acabado… y verlo antes»).
//
// A pantalla entera y con los botones ARRIBA, del lado del pulgar, como la
// vista previa del acuse (v95, norma 5). Lo que se ve es lo que se
// descarga: la vista previa y el PDF salen del mismo dibujo
// (lib/tarjetasAcomodacion.js, norma 7).
import { useEffect, useMemo, useState } from "react";
import { Download, Palette } from "lucide-react";
import { C, OP, DEDO, DORADO, inputStyle } from "../../theme";
import { ModalFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { Field, Desplegable } from "../../components/Formulario";
import { descargarBlob } from "../../lib/descargas";
import {
  ACABADOS,
  CORTES,
  FORMATOS,
  ARCHIVO_MUESTRA_ACABADOS,
  ARCHIVO_TARJETAS_ACOMODACION,
  cargarAdornos as cargarAdornosDeLaApp,
  HOJAS,
  muestraAcabado,
  OPCIONES_POR_DEFECTO,
  pdfMuestraAcabados,
  pdfTarjetasAcomodacion,
  rejilla,
  tarjetasDeAcomodacion,
  vistaPreviaTarjetasAcomodacion,
} from "../../lib/tarjetasAcomodacion";

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// La hoja, la forma de cortar, el formato y el acabado se recuerdan en este aparato: es la
// impresora de casa la que manda.
const CLAVE_OPCIONES = "tarjetas-acomodacion-opciones";
function leerOpciones() {
  try {
    const o = JSON.parse(window.localStorage.getItem(CLAVE_OPCIONES) || "null");
    // (Lo guardado de antes traía también el ancho: ya no cuenta.)
    if (o && HOJAS[o.hoja]) {
      return {
        hoja: o.hoja,
        corte: CORTES.some((c) => c.id === o.corte) ? o.corte : OPCIONES_POR_DEFECTO.corte,
        acabado: ACABADOS.some((a) => a.id === o.acabado) ? o.acabado : OPCIONES_POR_DEFECTO.acabado,
        formato: FORMATOS.some((f) => f.id === o.formato) ? o.formato : OPCIONES_POR_DEFECTO.formato,
      };
    }
  } catch {
    // Sin almacenamiento (ventana privada): las de siempre.
  }
  return OPCIONES_POR_DEFECTO;
}
function guardarOpciones(o) {
  try {
    window.localStorage.setItem(CLAVE_OPCIONES, JSON.stringify(o));
  } catch {
    // Sin almacenamiento: se elige otra vez la próxima.
  }
}

// La paleta de acabados: UNA pieza partida en partes iguales, como «Sí / No»
// (ElegirSiNo), y en cada parte la muestra de la tarjeta con ese acabado.
// Las partes llenan el ancho; si no cupieran en una fila (el móvil),
// pasarían a la siguiente: cada muestra, de 56 px como poco.
// El elegido, enmarcado en el dorado de lo marcado (el de los menús), como
// cuando había muestras verdes, que el relleno de «Sí / No» confundía.
function ElegirAcabado({ valor, onCambiar, muestras }) {
  return (
    <div
      role="radiogroup"
      aria-label="Acabado"
      className="grid gap-1"
      style={{ ...inputStyle, padding: 3, minHeight: DEDO, gridTemplateColumns: "repeat(auto-fit, minmax(56px, 1fr))" }}
    >
      {ACABADOS.map((a) => {
        const elegido = valor === a.id;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={elegido}
            aria-label={a.rotulo}
            title={a.rotulo}
            onClick={() => onCambiar(a.id)}
            className="flex-1 min-w-0 rounded flex items-center"
            style={{ padding: 3, background: elegido ? DORADO.fondo : "transparent" }}
          >
            {muestras[a.id] ? (
              <img src={muestras[a.id]} alt="" className="w-full h-auto block" style={{ border: `1px solid ${C.line}` }} />
            ) : (
              <span className="w-full block" style={{ aspectRatio: "3 / 1", background: a.fondo || C.blanco, border: `1px solid ${C.line}` }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// `vistaPrevia` y `muestra`: quien dibuja las hojas y las muestras (las
// pruebas pasan unos sin lienzo); `pdfMuestra`, la hoja de muestra;
// `cargarAdornos`, quien trae el adorno y las letras de la invitación.
export function VentanaTarjetasAcomodacion({
  invitados,
  onCerrar,
  vistaPrevia = vistaPreviaTarjetasAcomodacion,
  muestra = muestraAcabado,
  pdfMuestra = pdfMuestraAcabados,
  cargarAdornos = cargarAdornosDeLaApp,
}) {
  const [opciones, setOpciones] = useState(leerOpciones);
  const elegir = (cambio) => {
    const nuevas = { ...opciones, ...cambio };
    setOpciones(nuevas);
    guardarOpciones(nuevas);
  };
  const { tarjetas, sinMesa } = useMemo(() => tarjetasDeAcomodacion(invitados), [invitados]);
  const { porHoja } = rejilla(opciones.hoja, opciones.formato);
  const hojas = Math.max(1, Math.ceil(tarjetas.length / porHoja));
  const hoja = HOJAS[opciones.hoja];
  const elegido = ACABADOS.find((a) => a.id === opciones.acabado) || ACABADOS[0];
  // Las hojas y las letras de la invitación (v99.2), una vez; si no
  // llegan, sus acabados salen sin ellas y se dice. undefined: cargando.
  const [adornos, setAdornos] = useState(undefined);
  useEffect(() => {
    let vivo = true;
    cargarAdornos()
      .then((a) => vivo && setAdornos(a))
      .catch(() => vivo && setAdornos(null));
    return () => {
      vivo = false;
    };
  }, [cargarAdornos]);

  // Las muestras: una cara, tal cual saldrá.
  const muestras = useMemo(
    () => (adornos === undefined ? {} : Object.fromEntries(ACABADOS.map((a) => [a.id, muestra(a.id, adornos, { escala: 0.6 })]))),
    [muestra, adornos],
  );

  // Las hojas se dibujan justo después de abrir (y de tener los adornos):
  // la ventana sale al momento y la vista previa, en cuanto está.
  const [imagenes, setImagenes] = useState(null);
  useEffect(() => {
    if (adornos === undefined) return undefined;
    setImagenes(null);
    const t = setTimeout(() => setImagenes(vistaPrevia(tarjetas, opciones, adornos)), 30);
    return () => clearTimeout(t);
  }, [tarjetas, opciones, vistaPrevia, adornos]);

  // Lo que se está preparando: "" (nada), "tarjetas" o "muestra".
  const [descargando, setDescargando] = useState("");
  const [descargado, setDescargado] = useState("");
  const bajar = async (que, archivo, hacer) => {
    setDescargando(que);
    descargarBlob(archivo, await hacer());
    setDescargando("");
    setDescargado(archivo);
  };
  const descargar = () => bajar("tarjetas", ARCHIVO_TARJETAS_ACOMODACION, () => pdfTarjetasAcomodacion(tarjetas, opciones, adornos));
  // La hoja de muestra (él, v99.1): todos los acabados, para
  // imprimirla y elegir en vivo; con la hoja y las marcas elegidas.
  const descargarMuestra = () => bajar("muestra", ARCHIVO_MUESTRA_ACABADOS, () => pdfMuestra(opciones, adornos));

  return (
    <ModalFlotante pantallaEntera titulo="Tarjetas de acomodación" onCerrar={onCerrar}>
      <div className="flex flex-wrap items-center gap-2 justify-end zurdo:flex-row-reverse mb-3" data-botones-tarjetas>
        <Boton variante="secundario" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="secundario" icono={Palette} onClick={descargarMuestra} disabled={!!descargando || adornos === undefined} data-muestra-acabados>
          {descargando === "muestra" ? "Preparando…" : "Muestra"}
        </Boton>
        <Boton variante="principal" icono={Download} onClick={descargar} disabled={!!descargando || !tarjetas.length || adornos === undefined}>
          {descargando === "tarjetas" ? "Preparando…" : "Descargar"}
        </Boton>
      </div>
      {/* La descarga pasa fuera de la pantalla: dice dónde está (norma 9). */}
      {descargado && (
        <p className="text-xs mb-3" style={{ color: C.ink }} data-descargado>
          Descargado: {descargado}. Lo tienes en tu carpeta de Descargas.
        </p>
      )}
      {/* La hoja, con qué se corta y el formato, en una sola línea (norma 6).
          La hoja solo dice «A4» o «A3»: más estrecha, para que «Para plegar»
          y «Tijera o cúter» quepan enteros en el móvil. */}
      <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "minmax(0, 0.6fr) minmax(0, 1.2fr) minmax(0, 1.2fr)" }} data-opciones-tarjetas>
        <Field label="Hoja">
          <Desplegable aria-label="Hoja" value={opciones.hoja} onChange={(e) => elegir({ hoja: e.target.value })} style={{ minHeight: DEDO }}>
            {Object.entries(HOJAS).map(([clave, h]) => (
              <option key={clave} value={clave}>
                {h.rotulo}
              </option>
            ))}
          </Desplegable>
        </Field>
        <Field label="Cortar con">
          <Desplegable aria-label="Cortar con" value={opciones.corte} onChange={(e) => elegir({ corte: e.target.value })} style={{ minHeight: DEDO }}>
            {CORTES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.rotulo}
              </option>
            ))}
          </Desplegable>
        </Field>
        <Field label="Formato">
          <Desplegable aria-label="Formato" value={opciones.formato} onChange={(e) => elegir({ formato: e.target.value })} style={{ minHeight: DEDO }}>
            {FORMATOS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.rotulo}
              </option>
            ))}
          </Desplegable>
        </Field>
      </div>
      <div className="mb-2" data-acabado>
        <Field label={`Acabado · ${elegido.rotulo}`}>
          <ElegirAcabado valor={elegido.id} onCambiar={(acabado) => elegir({ acabado })} muestras={muestras} />
        </Field>
      </div>
      <p className="text-sm mb-1" style={{ color: C.ink }} data-resumen-tarjetas>
        {tarjetas.length
          ? `${plural(tarjetas.length, "tarjeta", "tarjetas")} en ${plural(hojas, `hoja ${hoja.rotulo}`, `hojas ${hoja.rotulo}`)}, ${porHoja} por hoja.`
          : "Nadie tiene mesa todavía."}
      </p>
      {adornos === null && (
        <p className="text-sm mb-1" style={{ color: C.wax }} data-sin-adornos>
          No se pudieron cargar el adorno y las letras de la invitación: sus acabados salen sin ellos. Vuelve a abrir la ventana para
          intentarlo otra vez.
        </p>
      )}
      {sinMesa > 0 && (
        <p className="text-sm mb-1" style={{ color: C.wax }} data-sin-mesa>
          {sinMesa === 1 ? "1 confirmado sin mesa se queda sin tarjeta." : `${sinMesa} confirmados sin mesa se quedan sin tarjeta.`}
        </p>
      )}
      <div className="flex flex-col gap-3 mt-2" data-vista-previa>
        {imagenes === null ? (
          <p className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Preparando la vista previa…
          </p>
        ) : (
          imagenes.map((src, i) => (
            <img key={i} src={src} alt={`Hoja ${i + 1} de ${imagenes.length}`} className="rounded" style={{ width: "100%", height: "auto", border: `1px solid ${C.line}` }} />
          ))
        )}
      </div>
      {/* La ayuda, al pie y plegada (norma 5). */}
      <details className="text-xs mt-3" style={{ color: C.charcoal }}>
        <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
          Cómo se usa
        </summary>
        <p className="mt-2" style={{ opacity: OP.secundario }}>
          «Para plegar»: corta por las rayas y dobla cada tarjeta por los puntos; queda de pie y el nombre se lee por los dos lados.
          «Una cara»: cada tarjeta, plana y del tamaño de una tarjeta bancaria; solo se corta, y caben más por hoja. «Cortar con» pone las marcas de
          cada forma de cortar: rayitas en los bordes para la guillotina, líneas enteras para tijera o cúter, y marcas en las esquinas para
          el plóter (cada marca de plóter tiene las suyas: confírmalo con quien corte). Salen mesa por mesa, y la letra pequeña de la
          esquina es su familia dentro de la mesa, para repartirlas sin separar a nadie; quien viene solo no lleva letra. «Muestra»
          descarga los acabados, uno en cada cara y con su número, para imprimirlos y elegir viéndolos de verdad.
        </p>
      </details>
    </ModalFlotante>
  );
}
