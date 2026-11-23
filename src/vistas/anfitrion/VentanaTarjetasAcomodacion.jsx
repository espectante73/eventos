// Tarjetas de acomodación (él, v97): el nombre de cada invitado en su mesa, para
// imprimir, doblar y poner en el plato. Antes de descargar, la VISTA PREVIA
// de todas las hojas (él: «no sea que no me guste cómo quede»), y la hoja
// (A4 o A3). La tarjeta, siempre la bancaria: cada cara, de su tamaño (él,
// v98.9; retiró el ancho de 9,5 cm). Con qué se cortan (v99: guillotina,
// tijera o plóter), que decide las marcas. Y el acabado, de una paleta de seis (él:
// «poder editar yo mismo el acabado… y verlo antes»).
//
// A pantalla entera y con los botones ARRIBA, del lado del pulgar, como la
// vista previa del acuse (v95, norma 5). Lo que se ve es lo que se
// descarga: la vista previa y el PDF salen del mismo dibujo
// (lib/tarjetasAcomodacion.js, norma 7).
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { C, OP, DEDO, DORADO, inputStyle } from "../../theme";
import { ModalFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { Field, Desplegable } from "../../components/Formulario";
import { descargarBlob } from "../../lib/descargas";
import {
  ACABADOS,
  CORTES,
  ARCHIVO_TARJETAS_ACOMODACION,
  HOJAS,
  muestraAcabado,
  OPCIONES_POR_DEFECTO,
  pdfTarjetasAcomodacion,
  rejilla,
  tarjetasDeAcomodacion,
  vistaPreviaTarjetasAcomodacion,
} from "../../lib/tarjetasAcomodacion";

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// La hoja, la forma de cortar y el acabado se recuerdan en este aparato: es la
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

// La paleta de acabados: UNA pieza partida en seis, como «Sí / No»
// (ElegirSiNo), y en cada parte la muestra de la tarjeta con ese acabado.
// El elegido, enmarcado en el dorado de lo marcado (el de los menús): el
// relleno verde de «Sí / No» se confundiría con las muestras verdes.
function ElegirAcabado({ valor, onCambiar, muestras }) {
  return (
    <div role="radiogroup" aria-label="Acabado" className="flex gap-1" style={{ ...inputStyle, padding: 3, minHeight: DEDO }}>
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
// pruebas pasan unos sin lienzo).
export function VentanaTarjetasAcomodacion({ invitados, onCerrar, vistaPrevia = vistaPreviaTarjetasAcomodacion, muestra = muestraAcabado }) {
  const [opciones, setOpciones] = useState(leerOpciones);
  const elegir = (cambio) => {
    const nuevas = { ...opciones, ...cambio };
    setOpciones(nuevas);
    guardarOpciones(nuevas);
  };
  const { tarjetas, sinMesa } = useMemo(() => tarjetasDeAcomodacion(invitados), [invitados]);
  const { porHoja } = rejilla(opciones.hoja);
  const hojas = Math.max(1, Math.ceil(tarjetas.length / porHoja));
  const hoja = HOJAS[opciones.hoja];
  const elegido = ACABADOS.find((a) => a.id === opciones.acabado) || ACABADOS[0];
  // Las muestras: una cara, tal cual saldrá.
  const muestras = useMemo(() => Object.fromEntries(ACABADOS.map((a) => [a.id, muestra(a.id, { escala: 0.6 })])), [muestra]);

  // Las hojas se dibujan justo después de abrir: la ventana sale al
  // momento y la vista previa, en cuanto está.
  const [imagenes, setImagenes] = useState(null);
  useEffect(() => {
    setImagenes(null);
    const t = setTimeout(() => setImagenes(vistaPrevia(tarjetas, opciones)), 30);
    return () => clearTimeout(t);
  }, [tarjetas, opciones, vistaPrevia]);

  const [descargando, setDescargando] = useState(false);
  const [descargado, setDescargado] = useState("");
  const descargar = async () => {
    setDescargando(true);
    descargarBlob(ARCHIVO_TARJETAS_ACOMODACION, await pdfTarjetasAcomodacion(tarjetas, opciones));
    setDescargando(false);
    setDescargado(ARCHIVO_TARJETAS_ACOMODACION);
  };

  return (
    <ModalFlotante pantallaEntera titulo="Tarjetas de acomodación" onCerrar={onCerrar}>
      <div className="flex flex-wrap items-center gap-2 justify-end zurdo:flex-row-reverse mb-3" data-botones-tarjetas>
        <Boton variante="secundario" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="principal" icono={Download} onClick={descargar} disabled={descargando || !tarjetas.length}>
          {descargando ? "Preparando…" : "Descargar"}
        </Boton>
      </div>
      {/* La descarga pasa fuera de la pantalla: dice dónde está (norma 9). */}
      {descargado && (
        <p className="text-xs mb-3" style={{ color: C.ink }} data-descargado>
          Descargado: {descargado}. Lo tienes en tu carpeta de Descargas.
        </p>
      )}
      {/* La hoja y con qué se corta, en una sola línea (norma 6). */}
      <div className="grid grid-cols-2 gap-2 mb-2" data-opciones-tarjetas>
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
          Corta por las rayas y dobla cada tarjeta por los puntos: el nombre se lee por los dos lados. «Cortar con» pone las marcas de
          cada forma de cortar: rayitas en los bordes para la guillotina, líneas enteras para tijera o cúter, y marcas en las esquinas para
          el plóter (cada marca de plóter tiene las suyas: confírmalo con quien corte). Salen mesa por mesa, y la letra pequeña de la
          esquina es su familia dentro de la mesa, para repartirlas sin separar a nadie; quien viene solo no lleva letra.
        </p>
      </details>
    </ModalFlotante>
  );
}
