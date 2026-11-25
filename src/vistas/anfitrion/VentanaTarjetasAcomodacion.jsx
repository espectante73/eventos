// Tarjetas de acomodación (él, v97): el nombre de cada invitado en su mesa, para
// imprimir, doblar y poner en el plato. Antes de descargar, la VISTA PREVIA
// de todas las hojas (él: «no sea que no me guste cómo quede»), y la hoja
// (A4 o A3). La tarjeta, siempre la bancaria: cada cara, de su tamaño (él,
// v98.9; retiró el ancho de 9,5 cm), plegada o de una cara (v99.8). Con qué se cortan (v99: guillotina,
// tijera o plóter), que decide las marcas. Y el acabado: los de la línea de la invitación (v99.2; el cuarto, v99.7) (él:
// «poder editar yo mismo el acabado… y verlo antes»). Para el rotulista
// (v101.7): la hoja «Suelta», cada tarjeta en su archivo, y la descarga en
// PDF o en PNG (lib/archivosImprenta.js).
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
  cargarAdornos as cargarAdornosDeLaApp,
  descargaTarjetasAcomodacion,
  esSuelta,
  HOJAS,
  muestraAcabado,
  OPCIONES_POR_DEFECTO,
  papelDe,
  pdfMuestraAcabados,
  rejilla,
  tarjetasDeAcomodacion,
  vistaPreviaTarjetasAcomodacion,
} from "../../lib/tarjetasAcomodacion";

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const cm = (mm) => (mm / 10).toLocaleString("es-ES", { maximumFractionDigits: 2 });

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
// `descargarTarjetas`, los archivos de las tarjetas; `cargarAdornos`, quien
// trae el adorno y las letras de la invitación.
export function VentanaTarjetasAcomodacion({
  invitados,
  onCerrar,
  vistaPrevia = vistaPreviaTarjetasAcomodacion,
  muestra = muestraAcabado,
  pdfMuestra = pdfMuestraAcabados,
  descargarTarjetas = descargaTarjetasAcomodacion,
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
  const suelta = esSuelta(opciones.hoja);
  const papel = papelDe(opciones.hoja, opciones.formato);
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

  // Lo que se está preparando: "" (nada), "muestra", "pdf" o "png"; con
  // muchos archivos, el botón cuenta («37/126»).
  const [descargando, setDescargando] = useState("");
  const [progreso, setProgreso] = useState("");
  const [descargado, setDescargado] = useState(null);
  const [fallo, setFallo] = useState("");
  const bajar = async (que, hacer) => {
    setDescargando(que);
    setProgreso("");
    setFallo("");
    try {
      const { nombre, blob, archivos } = await hacer();
      descargarBlob(nombre, blob);
      setDescargado({ nombre, archivos });
    } catch (e) {
      setFallo(e?.message || String(e));
    }
    setDescargando("");
  };
  const descargar = (salida) =>
    bajar(salida, () => descargarTarjetas(tarjetas, opciones, adornos, { salida, alAvanzar: (hechos, total) => setProgreso(`${hechos}/${total}`) }));
  // La hoja de muestra (él, v99.1): todos los acabados, para
  // imprimirla y elegir en vivo; con la hoja y las marcas elegidas.
  const descargarMuestra = () => bajar("muestra", async () => ({ nombre: ARCHIVO_MUESTRA_ACABADOS, blob: await pdfMuestra(opciones, adornos), archivos: 1 }));
  const rotuloDescarga = (salida) => (descargando === salida ? progreso || "Preparando…" : salida.toUpperCase());

  return (
    <ModalFlotante pantallaEntera titulo="Tarjetas de acomodación" onCerrar={onCerrar}>
      {/* Los cuatro, del mismo ancho (norma 4); «PDF» y «PNG» descargan,
          del lado del pulgar (el zurdo, en espejo: norma 1.4). */}
      <div className="flex justify-end zurdo:justify-start mb-3">
        <div className="grid grid-cols-4 gap-2 w-full sm:w-auto" data-botones-tarjetas>
          <Boton variante="secundario" tamano="estrecho" onClick={onCerrar} className="zurdo:order-4">
            Cancelar
          </Boton>
          <Boton
            variante="secundario"
            tamano="estrecho"
            icono={Palette}
            titulo="Muestra de los acabados, para imprimirla y elegir"
            onClick={descargarMuestra}
            disabled={!!descargando || adornos === undefined}
            // En el móvil no cabe con su icono: el icono se aplastaba en un punto.
            className="zurdo:order-3 [&>svg]:hidden sm:[&>svg]:block"
            data-muestra-acabados
          >
            {descargando === "muestra" ? "Preparando…" : "Muestra"}
          </Boton>
          {["pdf", "png"].map((salida, i) => (
            <Boton
              key={salida}
              variante="principal"
              tamano="estrecho"
              icono={Download}
              titulo={`Descargar en ${salida.toUpperCase()}`}
              onClick={() => descargar(salida)}
              disabled={!!descargando || !tarjetas.length || adornos === undefined}
              className={i ? "zurdo:order-1" : "zurdo:order-2"}
              data-descargar={salida}
            >
              {rotuloDescarga(salida)}
            </Boton>
          ))}
        </div>
      </div>
      {/* La descarga pasa fuera de la pantalla: dice dónde está (norma 9). */}
      {descargado && (
        <p className="text-xs mb-3" style={{ color: C.ink }} data-descargado>
          {descargado.nombre.endsWith(".zip")
            ? `Descargado: ${descargado.nombre}, con ${plural(descargado.archivos, "archivo", "archivos")}. Lo tienes en tu carpeta de Descargas: ábrelo con doble clic.`
            : `Descargado: ${descargado.nombre}. Lo tienes en tu carpeta de Descargas.`}
        </p>
      )}
      {/* Norma 13: qué ha podido pasar y qué probar. */}
      {fallo && (
        <p className="text-sm mb-3" style={{ color: C.wax }} data-fallo-descarga>
          No se pudo preparar la descarga. Prueba otra vez o, si sigue, desde el ordenador (en PNG, cada imagen es grande para un
          móvil). <span className="text-xs" style={{ opacity: OP.secundario }}>({fallo})</span>
        </p>
      )}
      {/* La hoja, con qué se corta y el formato, en una sola línea (norma 6).
          Cada una, del ancho de su texto más largo («Suelta», «Tijera o
          cúter», «Para plegar»): así caben enteros en el móvil (390). */}
      <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.25fr) minmax(0, 1.15fr)" }} data-opciones-tarjetas>
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
          {/* Suelta, sin marcas: el borde de la página es el corte. */}
          <Desplegable
            aria-label="Cortar con"
            value={opciones.corte}
            onChange={(e) => elegir({ corte: e.target.value })}
            disabled={suelta}
            title={suelta ? "«Suelta» no lleva marcas: el borde de la página es el corte" : undefined}
            style={{ minHeight: DEDO, ...(suelta ? { opacity: OP.secundario } : {}) }}
          >
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
        {!tarjetas.length
          ? "Nadie tiene mesa todavía."
          : suelta
            ? `${plural(tarjetas.length, "tarjeta", "tarjetas")}, cada una en su archivo, de ${cm(papel.ancho)} × ${cm(papel.alto)} cm.`
            : `${plural(tarjetas.length, "tarjeta", "tarjetas")} en ${plural(hojas, `hoja ${hoja.rotulo}`, `hojas ${hoja.rotulo}`)}, ${porHoja} por hoja.`}
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
      {/* Suelta, las tarjetas en rejilla: una debajo de otra, 126 no se
          acabarían nunca. */}
      <div
        className={suelta ? "grid gap-2 mt-2" : "flex flex-col gap-3 mt-2"}
        style={suelta ? { gridTemplateColumns: `repeat(auto-fill, minmax(${opciones.formato === "cara" ? 150 : 120}px, 1fr))` } : undefined}
        data-vista-previa
      >
        {imagenes === null ? (
          <p className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Preparando la vista previa…
          </p>
        ) : (
          imagenes.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${suelta ? "Tarjeta" : "Hoja"} ${i + 1} de ${imagenes.length}`}
              className={suelta ? "" : "rounded"}
              style={{ width: "100%", height: "auto", border: `1px solid ${C.line}` }}
            />
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
          descarga los acabados, uno en cada cara y con su número, para imprimirlos y elegir viéndolos de verdad (con «Suelta», en
          A4). Hoja «Suelta», para el rotulista: cada tarjeta en su archivo, de su medida de siempre y sin marcas (el borde es el
          corte), numeradas en el orden de las mesas; llegan todas juntas en un .zip, que se abre con doble clic. «PDF» o «PNG», el
          formato de los archivos; el PNG, a calidad de imprenta (300 ppp). Con A4 o A3, el PDF es un solo archivo y el PNG, uno
          por hoja.
        </p>
      </details>
    </ModalFlotante>
  );
}
