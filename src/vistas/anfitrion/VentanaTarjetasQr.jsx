// Tarjetas QR de las mesas: antes de descargar, la vista previa de todos los
// folios (él, v99.3: «primero ver, después descargar», como las tarjetas de
// acomodación y los sobres de debajo en «Día del evento»).
//
// Como ellas: a pantalla entera, botones ARRIBA del lado del pulgar (norma
// 5), y la vista previa y el PDF del mismo dibujo (lib/pdfTarjetasQr.js).
// Las tarjetas ya llegan hechas: «Día del evento» lee los códigos de las
// mesas y avisa allí si falta algo, antes de abrir esta ventana. Desde
// v99.4, con el adorno y la letra de las tarjetas de acomodación (él),
// cargados como allí. Para el rotulista (v101.7), como las de
// acomodación: la hoja «Suelta», cada tarjeta en su archivo, y la descarga
// en PDF o en PNG.
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { C, OP, DEDO } from "../../theme";
import { ModalFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { Field, Desplegable } from "../../components/Formulario";
import { HOJAS_QR, HOJA_QR_POR_DEFECTO, descargarTarjetasQr, vistaPreviaTarjetasQr } from "../../lib/pdfTarjetasQr";
import { cargarAdornos as cargarAdornosDeLaApp } from "../../lib/tarjetasAcomodacion";

const cuantas = (n, una, varias) => `${n} ${n === 1 ? una : varias}`;

// La hoja se recuerda en este aparato, como en las de acomodación.
const CLAVE_HOJA = "tarjetas-qr-hoja";
function leerHoja() {
  try {
    const h = window.localStorage.getItem(CLAVE_HOJA);
    return HOJAS_QR.some((x) => x.id === h) ? h : HOJA_QR_POR_DEFECTO;
  } catch {
    return HOJA_QR_POR_DEFECTO;
  }
}
function guardarHoja(h) {
  try {
    window.localStorage.setItem(CLAVE_HOJA, h);
  } catch {
    // Sin almacenamiento: se elige otra vez la próxima.
  }
}

// `vistaPrevia`, `descargar` y `cargarAdornos`: quien dibuja, quien baja el
// PDF y quien trae el adorno y las letras (las pruebas pasan unos sin
// lienzo ni red).
export function VentanaTarjetasQr({
  nombreEvento,
  tarjetas,
  onCerrar,
  vistaPrevia = vistaPreviaTarjetasQr,
  descargar = descargarTarjetasQr,
  cargarAdornos = cargarAdornosDeLaApp,
}) {
  // El adorno y las letras, una vez; si no llegan, sin adorno y con la
  // letra de siempre, y se dice.
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

  const [hoja, setHoja] = useState(leerHoja);
  const suelta = hoja === "suelta";
  const elegirHoja = (h) => {
    setHoja(h);
    guardarHoja(h);
  };

  const [imagenes, setImagenes] = useState(null);
  useEffect(() => {
    if (adornos === undefined) return undefined;
    let vivo = true;
    setImagenes(null);
    vistaPrevia({ nombreEvento, tarjetas }, adornos, { hoja })
      .then((lista) => vivo && setImagenes(lista))
      .catch(() => vivo && setImagenes([]));
    return () => {
      vivo = false;
    };
  }, [nombreEvento, tarjetas, adornos, vistaPrevia, hoja]);

  // "" (nada), "pdf" o "png"; con varios archivos, el botón cuenta («5/14»).
  const [descargando, setDescargando] = useState("");
  const [progreso, setProgreso] = useState("");
  const [descargado, setDescargado] = useState(null);
  const [fallo, setFallo] = useState("");
  const bajar = async (salida) => {
    setDescargando(salida);
    setProgreso("");
    setFallo("");
    try {
      setDescargado(await descargar({ nombreEvento, tarjetas }, adornos, { hoja, salida, alAvanzar: (hechos, total) => setProgreso(`${hechos}/${total}`) }));
    } catch (e) {
      setFallo(e?.message || String(e));
    }
    setDescargando("");
  };

  return (
    <ModalFlotante pantallaEntera titulo="Tarjetas QR" onCerrar={onCerrar}>
      {/* La hoja y los botones, en una sola línea (norma 6): la hoja, del
          ancho de «Suelta», para que quepan en el móvil (390). Los botones,
          iguales (norma 4) y del lado del pulgar (1.4). */}
      <div className="flex flex-wrap items-end gap-2 mb-3 zurdo:flex-row-reverse" data-botones-qr>
        <div style={{ width: 84 }}>
          <Field label="Hoja">
            <Desplegable aria-label="Hoja" value={hoja} onChange={(e) => elegirHoja(e.target.value)} style={{ minHeight: DEDO }}>
              {HOJAS_QR.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.rotulo}
                </option>
              ))}
            </Desplegable>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-2 ml-auto zurdo:ml-0 zurdo:mr-auto">
          <Boton variante="secundario" tamano="estrecho" onClick={onCerrar} className="zurdo:order-3" style={{ minHeight: DEDO }}>
            Cancelar
          </Boton>
          {["pdf", "png"].map((salida, i) => (
            <Boton
              key={salida}
              variante="principal"
              tamano="estrecho"
              icono={Download}
              titulo={`Descargar en ${salida.toUpperCase()}`}
              onClick={() => bajar(salida)}
              disabled={!!descargando || adornos === undefined}
              className={i ? "zurdo:order-1" : "zurdo:order-2"}
              style={{ minHeight: DEDO }}
              data-descargar={salida}
            >
              {descargando === salida ? progreso || "Preparando…" : salida.toUpperCase()}
            </Boton>
          ))}
        </div>
      </div>
      {/* La descarga pasa fuera de la pantalla: dice dónde está (norma 9). */}
      {descargado && (
        <p className="text-xs mb-3" style={{ color: C.ink }} data-descargado>
          {descargado.nombre.endsWith(".zip")
            ? `Descargado: ${descargado.nombre}, con ${cuantas(descargado.archivos, "archivo", "archivos")}. Lo tienes en tu carpeta de Descargas: ábrelo con doble clic.`
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
      <p className="text-sm mb-1" style={{ color: C.ink }} data-resumen-qr>
        {suelta
          ? `${cuantas(tarjetas.length, "tarjeta", "tarjetas")}, una por mesa, cada una en su archivo, de 10,5 × 29,7 cm.`
          : `${cuantas(tarjetas.length, "tarjeta", "tarjetas")}, una por mesa, en ${cuantas(Math.ceil(tarjetas.length / 2), "folio", "folios")} A4: 2 por folio.`}
      </p>
      {adornos === null && (
        <p className="text-sm mb-1" style={{ color: C.wax }} data-sin-adornos>
          No se pudieron cargar el adorno y las letras de la invitación: las tarjetas salen sin ellos. Vuelve a abrir la ventana para
          intentarlo otra vez.
        </p>
      )}
      {/* Suelta, las tarjetas en rejilla, como las de acomodación. */}
      <div
        className={suelta ? "grid gap-2 mt-2" : "flex flex-col gap-3 mt-2"}
        style={suelta ? { gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" } : undefined}
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
              alt={`${suelta ? "Tarjeta" : "Folio"} ${i + 1} de ${imagenes.length}`}
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
          Imprime en A4, a una cara. Corta cada folio por la línea discontinua y dobla cada mitad por la de puntos: queda de pie, con el
          texto hacia un lado de la mesa y el código hacia el otro. Hoja «Suelta», para el rotulista: cada tarjeta en su archivo, de
          su medida de siempre (10,5 × 29,7 cm abierta), sin la línea de corte; llegan todas juntas en un .zip, que se abre con doble
          clic. «PDF» o «PNG», el formato de los archivos; el PNG, a calidad de imprenta (300 ppp).
        </p>
      </details>
    </ModalFlotante>
  );
}
