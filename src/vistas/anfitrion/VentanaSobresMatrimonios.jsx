// Sobres de los matrimonios (él, v98): uno por matrimonio confirmado, con
// sus nombres, el número de su mesa en el círculo dorado y el logo del
// evento, para imprimir directamente en el sobre. Antes de descargar, la
// vista previa de todos; y se elige el tamaño del sobre (el de una foto de
// 10 × 15, de entrada), el nombre con o sin apellido, dónde va y dónde el
// logo (él).
//
// Como «Tarjetas de acomodación»: a pantalla entera, botones ARRIBA del
// lado del pulgar (norma 5), opciones en una línea, y la vista previa y el
// PDF del mismo dibujo (lib/sobresMatrimonios.js). Desde v99.3, con sus
// mismas letras y su corazón (él), cargados como allí.
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { C, OP, DEDO } from "../../theme";
import { ModalFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { Field, Desplegable } from "../../components/Formulario";
import { descargarBlob } from "../../lib/descargas";
import {
  ARCHIVO_SOBRES,
  FORMATOS_NOMBRE,
  OPCIONES_SOBRES_POR_DEFECTO,
  POSICIONES_LOGO,
  POSICIONES_NOMBRE,
  SOBRES,
  cargarLogo as cargarLogoDeLaApp,
  pdfSobres,
  sobresDeMatrimonios,
  vistaPreviaSobres,
} from "../../lib/sobresMatrimonios";
import { cargarAdornos as cargarAdornosDeLaApp } from "../../lib/tarjetasAcomodacion";

// Lo elegido se recuerda en este aparato (los sobres que tiene en casa).
const CLAVE_OPCIONES = "sobres-matrimonios-opciones";
function leerOpciones() {
  try {
    const o = JSON.parse(window.localStorage.getItem(CLAVE_OPCIONES) || "null");
    const vale = (lista, id) => lista.some((p) => p.id === id);
    if (o && SOBRES[o.sobre] && vale(FORMATOS_NOMBRE, o.formato) && vale(POSICIONES_NOMBRE, o.nombre) && vale(POSICIONES_LOGO, o.logo)) return o;
  } catch {
    // Sin almacenamiento (ventana privada): las de siempre.
  }
  return OPCIONES_SOBRES_POR_DEFECTO;
}
function guardarOpciones(o) {
  try {
    window.localStorage.setItem(CLAVE_OPCIONES, JSON.stringify(o));
  } catch {
    // Sin almacenamiento: se elige otra vez la próxima.
  }
}

// `vista`: lo que se ve con el campo cerrado, si la lista dice más (los
// sobres: en la lista, cada uno con sus medidas al lado; él).
function Opcion({ etiqueta, valor, opciones, onCambiar, vista }) {
  return (
    <Field label={etiqueta}>
      <Desplegable aria-label={etiqueta} value={valor} onChange={(e) => onCambiar(e.target.value)} style={{ minHeight: DEDO }} vista={vista}>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.rotulo}
          </option>
        ))}
      </Desplegable>
    </Field>
  );
}

// `vistaPrevia`, `cargarLogo` y `cargarAdornos`: quien dibuja, quien trae el
// logo y quien las letras y el corazón (las pruebas pasan unos sin lienzo ni
// red).
// `fecha`: la del evento, ya escrita para imprimirla abajo (fechaImpresa,
// v102), o nada.
export function VentanaSobresMatrimonios({
  invitados,
  fechaEvento,
  fecha,
  onCerrar,
  vistaPrevia = vistaPreviaSobres,
  cargarLogo = cargarLogoDeLaApp,
  cargarAdornos = cargarAdornosDeLaApp,
}) {
  const [opciones, setOpciones] = useState(leerOpciones);
  const elegir = (cambio) => {
    const nuevas = { ...opciones, ...cambio };
    setOpciones(nuevas);
    guardarOpciones(nuevas);
  };
  const sobre = SOBRES[opciones.sobre];
  // Lo que se dibuja: lo elegido y la fecha (que no se guarda: es de la base).
  const paraDibujar = useMemo(() => (fecha ? { ...opciones, fecha } : opciones), [opciones, fecha]);
  const { sobres, sinMesa } = useMemo(() => sobresDeMatrimonios(invitados, fechaEvento), [invitados, fechaEvento]);

  // El logo, una vez; si no llega, los sobres salen sin él y se dice.
  const [logo, setLogo] = useState(undefined);
  useEffect(() => {
    let vivo = true;
    cargarLogo()
      .then((l) => vivo && setLogo(l))
      .catch(() => vivo && setLogo(null));
    return () => {
      vivo = false;
    };
  }, [cargarLogo]);
  // Las letras y el corazón, igual: si no llegan, la letra de siempre.
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
  const cargando = logo === undefined || adornos === undefined;

  const [imagenes, setImagenes] = useState(null);
  useEffect(() => {
    if (cargando) return undefined;
    setImagenes(null);
    const t = setTimeout(() => setImagenes(vistaPrevia(sobres, paraDibujar, logo, adornos)), 30);
    return () => clearTimeout(t);
  }, [sobres, paraDibujar, logo, adornos, cargando, vistaPrevia]);

  const [descargando, setDescargando] = useState(false);
  const [descargado, setDescargado] = useState("");
  const descargar = async () => {
    setDescargando(true);
    descargarBlob(ARCHIVO_SOBRES, await pdfSobres(sobres, paraDibujar, logo, adornos));
    setDescargando(false);
    setDescargado(ARCHIVO_SOBRES);
  };

  return (
    <ModalFlotante pantallaEntera titulo="Sobres de matrimonios" onCerrar={onCerrar}>
      <div className="flex flex-wrap items-center gap-2 justify-end zurdo:flex-row-reverse mb-3" data-botones-sobres>
        <Boton variante="secundario" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="principal" icono={Download} onClick={descargar} disabled={descargando || !sobres.length || cargando}>
          {descargando ? "Preparando…" : "Descargar"}
        </Boton>
      </div>
      {/* La descarga pasa fuera de la pantalla: dice dónde está (norma 9). */}
      {descargado && (
        <p className="text-xs mb-3" style={{ color: C.ink }} data-descargado>
          Descargado: {descargado}. Lo tienes en tu carpeta de Descargas.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 mb-2" data-opciones-sobres>
        <Opcion
          etiqueta="Sobre"
          valor={opciones.sobre}
          opciones={Object.entries(SOBRES).map(([id, s]) => ({ id, rotulo: `${s.rotulo} · ${s.medida}` }))}
          vista={<span className="pl-1" style={{ color: C.charcoal }}>{sobre.rotulo}</span>}
          onCambiar={(v) => elegir({ sobre: v })}
        />
        <Opcion etiqueta="Nombre" valor={opciones.formato} opciones={FORMATOS_NOMBRE} onCambiar={(v) => elegir({ formato: v })} />
        <Opcion etiqueta="Dónde" valor={opciones.nombre} opciones={POSICIONES_NOMBRE} onCambiar={(v) => elegir({ nombre: v })} />
        <Opcion etiqueta="Logo" valor={opciones.logo} opciones={POSICIONES_LOGO} onCambiar={(v) => elegir({ logo: v })} />
      </div>
      <p className="text-sm mb-1" style={{ color: C.ink }} data-resumen-sobres>
        {sobres.length
          ? `${sobres.length === 1 ? "1 sobre" : `${sobres.length} sobres`}, uno por matrimonio confirmado. Sobre ${sobre.rotulo}: ${sobre.medida}.`
          : "Todavía no hay ningún matrimonio confirmado."}
      </p>
      {sinMesa > 0 && (
        <p className="text-sm mb-1" style={{ color: C.wax }} data-sin-mesa>
          {sinMesa === 1 ? "1 matrimonio sin mesa: su sobre sale sin número." : `${sinMesa} matrimonios sin mesa: sus sobres salen sin número.`}
        </p>
      )}
      {logo === null && (
        <p className="text-sm mb-1" style={{ color: C.wax }}>
          No se pudo cargar el logo: los sobres salen sin él. Prueba a cerrar y abrir otra vez.
        </p>
      )}
      {adornos === null && (
        <p className="text-sm mb-1" style={{ color: C.wax }} data-sin-adornos>
          No se pudieron cargar las letras y el corazón de la invitación: los sobres salen con la letra de siempre. Prueba a cerrar y abrir
          otra vez.
        </p>
      )}
      <div className="flex flex-col gap-3 mt-2" data-vista-previa>
        {imagenes === null ? (
          <p className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Preparando la vista previa…
          </p>
        ) : (
          imagenes.map((src, i) => (
            <img key={i} src={src} alt={`Sobre ${i + 1} de ${imagenes.length}`} className="rounded" style={{ width: "100%", height: "auto", border: `1px solid ${C.line}` }} />
          ))
        )}
      </div>
      {/* La ayuda, al pie y plegada (norma 5). */}
      <details className="text-xs mt-3" style={{ color: C.charcoal }}>
        <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
          Cómo se usa
        </summary>
        <p className="mt-2" style={{ opacity: OP.secundario }}>
          Cada página es un sobre, del tamaño elegido. Al imprimir, pon los sobres en la bandeja de la impresora y elige ese mismo tamaño de
          papel. Salen en el orden de las mesas, como las tarjetas de acomodación.
        </p>
      </details>
    </ModalFlotante>
  );
}
