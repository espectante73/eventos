// Tarjetas QR de las mesas: antes de descargar, la vista previa de todos los
// folios (él, v99.3: «primero ver, después descargar», como las tarjetas de
// acomodación y los sobres de debajo en «Día del evento»).
//
// Como ellas: a pantalla entera, botones ARRIBA del lado del pulgar (norma
// 5), y la vista previa y el PDF del mismo dibujo (lib/pdfTarjetasQr.js).
// Las tarjetas ya llegan hechas: «Día del evento» lee los códigos de las
// mesas y avisa allí si falta algo, antes de abrir esta ventana.
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { C, OP } from "../../theme";
import { ModalFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { ARCHIVO_TARJETAS_QR, descargarTarjetasQr, vistaPreviaTarjetasQr } from "../../lib/pdfTarjetasQr";

const cuantas = (n, una, varias) => `${n} ${n === 1 ? una : varias}`;

// `vistaPrevia` y `descargar`: quien dibuja y quien baja el PDF (las pruebas
// pasan unos sin lienzo).
export function VentanaTarjetasQr({ nombreEvento, tarjetas, onCerrar, vistaPrevia = vistaPreviaTarjetasQr, descargar = descargarTarjetasQr }) {
  const [imagenes, setImagenes] = useState(null);
  useEffect(() => {
    let vivo = true;
    vistaPrevia({ nombreEvento, tarjetas })
      .then((lista) => vivo && setImagenes(lista))
      .catch(() => vivo && setImagenes([]));
    return () => {
      vivo = false;
    };
  }, [nombreEvento, tarjetas, vistaPrevia]);

  const [descargando, setDescargando] = useState(false);
  const [descargado, setDescargado] = useState("");
  const bajar = async () => {
    setDescargando(true);
    await descargar({ nombreEvento, tarjetas });
    setDescargando(false);
    setDescargado(ARCHIVO_TARJETAS_QR);
  };

  return (
    <ModalFlotante pantallaEntera titulo="Tarjetas QR" onCerrar={onCerrar}>
      <div className="flex flex-wrap items-center gap-2 justify-end zurdo:flex-row-reverse mb-3" data-botones-qr>
        <Boton variante="secundario" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="principal" icono={Download} onClick={bajar} disabled={descargando}>
          {descargando ? "Preparando…" : "Descargar"}
        </Boton>
      </div>
      {/* La descarga pasa fuera de la pantalla: dice dónde está (norma 9). */}
      {descargado && (
        <p className="text-xs mb-3" style={{ color: C.ink }} data-descargado>
          Descargado: {descargado}. Lo tienes en tu carpeta de Descargas.
        </p>
      )}
      <p className="text-sm mb-1" style={{ color: C.ink }} data-resumen-qr>
        {`${cuantas(tarjetas.length, "tarjeta", "tarjetas")}, una por mesa, en ${cuantas(Math.ceil(tarjetas.length / 2), "folio", "folios")} A4: 2 por folio.`}
      </p>
      <div className="flex flex-col gap-3 mt-2" data-vista-previa>
        {imagenes === null ? (
          <p className="text-sm" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Preparando la vista previa…
          </p>
        ) : (
          imagenes.map((src, i) => (
            <img key={i} src={src} alt={`Folio ${i + 1} de ${imagenes.length}`} className="rounded" style={{ width: "100%", height: "auto", border: `1px solid ${C.line}` }} />
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
          texto hacia un lado de la mesa y el código hacia el otro.
        </p>
      </details>
    </ModalFlotante>
  );
}
