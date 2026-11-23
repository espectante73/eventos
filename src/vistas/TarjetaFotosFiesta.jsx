// Las fotos de la fiesta en el tablón (él, v67.4): solo con la recogida
// abierta, y SIN ver las de los demás. Desde la v68, personal (él: «3 por
// familia» era injusto con las grandes): 2 por persona de 15 años o más (16 hasta la v98),
// «Tus fotos · 1 de 2», una línea por foto suya con su miniatura (guardada
// en su propio móvil, v67.5) y la papelera para cambiarla por otra:
// «tendrán muchas fotos y tendrán que elegir». La papelera, solo en el
// móvil que la subió (`mia`): un impostor con su nombre no le borra nada.
// A quien tiene de 15 a 17 años, su frase del permiso de los padres; a un
// menor de 15, solo que las suben los mayores. Antes de la primera foto en
// un móvil, su mesa (v68.1; el año ya lo dio al entrar al tablón, v70): el
// servidor la coteja con su ficha y ese móvil queda recordado. Desde la v93
// (él), la del QR de su tarjeta, que el tablón lee solo: nadie elige nada.
// Sin mesa en su ficha, se le dice a quién preguntar.
//
// «Elegir foto» busca en la galería (él): el campo va sin `capture`, así el
// móvil no salta a la cámara. El menú propio del iPhone (Fototeca, Hacer
// foto, Seleccionar archivo) no se puede quitar. Es el mismo botón-etiqueta
// con el campo escondido que «Cambiar foto» del formulario (VistaColaborador).
import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus } from "lucide-react";
import { C, OP, T, DEDO, DORADO } from "../theme";
import { estilosBoton } from "../components/Boton";
import { BotonQuitar } from "../components/PreguntaSeguridad";
import { LineaAviso } from "../components/LineaAviso";
import { HuecoFoto } from "../components/HuecoFoto";
import { horaCorta } from "../lib/formato";
import {
  miniaturaFotoFiesta,
  textoCompleta,
  FRASE_HORIZONTAL,
  FRASE_PERMISO_PADRES,
  SOLO_MAYORES,
  FALTAN_CLAVES,
  ESCANEA_QR_MESA,
  COMPROBANDO_QR_MESA,
  FRASE_FOTO_FAMILIA,
  FRASE_FOTOS_PERSONALES,
  FRASE_FOTOS_SOLO,
  fraseFotoFamiliaHecha,
} from "../lib/fotosFiesta";

// La mesa, la del QR de su tarjeta (él, v93): con el QR leído (`qrMesa`,
// { mesa, codigo }), se comprueba solo al aparecer, una vez; sin él, que lo
// escanee. Lo que se coteja con su ficha lo decide el servidor.
function ConfirmarConQr({ qrMesa, onVerificar }) {
  const [comprobando, setComprobando] = useState(Boolean(qrMesa));
  const [aviso, setAviso] = useState("");
  const hecho = useRef(false);
  useEffect(() => {
    if (!qrMesa || hecho.current) return;
    hecho.current = true;
    onVerificar(qrMesa).then(({ aviso: motivo }) => {
      setComprobando(false);
      setAviso(motivo);
    });
  }, [qrMesa, onVerificar]);
  if (!qrMesa) return <p className="text-sm mt-2">{ESCANEA_QR_MESA}</p>;
  if (comprobando) return <p className="text-sm mt-2">{COMPROBANDO_QR_MESA}</p>;
  return aviso ? <LineaAviso className="text-sm mt-2">{aviso}</LineaAviso> : null;
}

const PREGUNTA_ELIMINAR = {
  titulo: "¿Eliminar esta foto?",
  texto: "Solo se borra de aquí: en tu móvil la sigues teniendo.",
  rotulo: "Sí, eliminar",
};

const estiloAyuda = { color: C.charcoal, opacity: OP.secundario };

// estado: lo que da tablon_fotos ({ maximo, menor, conPermiso, verificado,
// faltanDatos, fotos: [{ id, creadaEn, mia }] }). onSubir(archivo), onEliminar(id) y
// onVerificar({ mesa, codigo }) devuelven { aviso }: vacío si salió bien.
// `qrMesa`: el QR de su mesa leído en este móvil, o null (v93).
// `destacada` (v85.5, él: el día del evento «sería el protagonista»): la
// primera del tablón, en el dorado, con la cámara en grande y un latido
// suave (.tarjeta-latido en index.css), mientras lo demás se pliega.
// `onMarcarFamilia(id, marcar)` (v85.5): la casilla «Familia» de cada foto
// suya, si viene en familia. Una por familia: si ya la marcó otro de ella,
// no sale la casilla y se dice quién.
export function TarjetaFotosFiesta({ estado, onSubir, onEliminar, onVerificar, onMarcarFamilia, qrMesa = null, destacada = false }) {
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState("");
  const { fotos, maximo, menor, conPermiso } = estado;
  const completa = fotos.length >= maximo;
  // La de familia: suya (una de sus fotos) o de otro de la familia. Sin el
  // dato (la base sin la v85.5), como si viniera en familia y sin casilla.
  const familiaMia = fotos.some((f) => f.deFamilia);
  const familiaDeOtro = !familiaMia && estado.fotoFamilia ? estado.fotoFamilia : "";
  const conCasilla = Boolean(onMarcarFamilia) && estado.enFamilia === true && !familiaDeOtro;
  const marcarFamilia = async (id, marcar) => {
    setAviso("");
    const { aviso: motivo } = await onMarcarFamilia(id, marcar);
    setAviso(motivo);
  };

  const alElegir = async (e) => {
    const archivo = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    setAviso("");
    setSubiendo(true);
    const { aviso: motivo } = await onSubir(archivo);
    setSubiendo(false);
    setAviso(motivo);
  };
  const eliminar = async (id) => {
    setAviso("");
    const { aviso: motivo } = await onEliminar(id);
    setAviso(motivo);
  };

  return (
    <div
      className={`rounded-lg px-5 py-4 mb-6 flex items-start gap-3${destacada ? " tarjeta-latido formulario-dorado" : ""}`}
      data-destacada={destacada || undefined}
      style={destacada ? { background: DORADO.fondo, boxShadow: DORADO.relieveFlotante, color: C.ink } : { background: C.blanco, border: `1px solid ${C.line}`, color: C.ink }}
    >
      <Camera size={destacada ? 44 : 28} className="mt-1" style={{ flexShrink: 0 }} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>
          Fotos de la fiesta
        </div>

        {menor ? (
          <p className="text-sm mt-1">{SOLO_MAYORES}</p>
        ) : (
          <>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado }}>
              Tus fotos · {fotos.length} de {maximo}
            </div>

            {/* Qué foto es cada una (v85.5, él): una de familia, que sube
                solo uno de ellos, y las demás personales. */}
            <div className="text-sm mt-1 space-y-0.5">
              {estado.enFamilia === false ? (
                <p>{FRASE_FOTOS_SOLO}</p>
              ) : (
                <>
                  <p>
                    {familiaDeOtro ? (
                      <span className="inline-flex items-center gap-1">
                        <Check size={15} aria-hidden /> {fraseFotoFamiliaHecha(familiaDeOtro)}
                      </span>
                    ) : (
                      FRASE_FOTO_FAMILIA
                    )}
                  </p>
                  <p>{FRASE_FOTOS_PERSONALES}</p>
                </>
              )}
            </div>

            {fotos.length > 0 && (
              <ul className="mt-1">
                {fotos.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 py-1 text-sm">
                    <HuecoFoto titulo="Tu foto" enlace={miniaturaFotoFiesta(f.id)} soloLectura ajustada />
                    <span className="truncate flex-1 min-w-0">Subida a las {horaCorta(f.creadaEn)}</span>
                    {/* «Familia» (v85.5): la marca quien la subió, desde su móvil. */}
                    {conCasilla && f.mia && (
                      <label className="flex items-center gap-1 flex-shrink-0 cursor-pointer" style={{ minHeight: DEDO }}>
                        <input type="checkbox" checked={Boolean(f.deFamilia)} onChange={(e) => marcarFamilia(f.id, e.target.checked)} aria-label="Es la foto de familia" />
                        Familia
                      </label>
                    )}
                    {f.mia && (
                      <BotonQuitar borrar titulo="Eliminar esta foto" pregunta={PREGUNTA_ELIMINAR} onClick={() => eliminar(f.id)} />
                    )}
                  </li>
                ))}
              </ul>
            )}

            {completa ? (
              <p className="text-sm mt-2">{textoCompleta(maximo)}</p>
            ) : estado.verificado === false && estado.faltanDatos ? (
              <p className="text-sm mt-2">{FALTAN_CLAVES}</p>
            ) : estado.verificado === false ? (
              <ConfirmarConQr qrMesa={qrMesa} onVerificar={onVerificar} />
            ) : (
              <>
                <div className="flex justify-end zurdo:justify-start mt-3">
                  <label
                    className="boton-3d inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium cursor-pointer"
                    style={{ ...estilosBoton("principal", "normal"), opacity: subiendo ? OP.tenue : 1 }}
                  >
                    <ImagePlus size={15} aria-hidden />
                    {subiendo ? "Subiendo…" : "Elegir foto"}
                    <input type="file" accept="image/*" className="sr-only" disabled={subiendo} onChange={alElegir} />
                  </label>
                </div>
                <p className="text-xs mt-2" style={estiloAyuda}>
                  {FRASE_HORIZONTAL}
                </p>
              </>
            )}

            {conPermiso && (
              <p className="text-xs mt-2" style={estiloAyuda}>
                {FRASE_PERMISO_PADRES}
              </p>
            )}
          </>
        )}

        {aviso && <LineaAviso className="text-xs mt-2">{aviso}</LineaAviso>}
      </div>
    </div>
  );
}
