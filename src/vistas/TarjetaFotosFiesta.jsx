// Las fotos de la fiesta en el tablón (él, v67.4): solo con la recogida
// abierta, y SIN ver las de los demás. Desde la v68, personal (él: «3 por
// familia» era injusto con las grandes): 2 por persona de 16 años o más,
// «Tus fotos · 1 de 2», una línea por foto suya con su miniatura (guardada
// en su propio móvil, v67.5) y la papelera para cambiarla por otra:
// «tendrán muchas fotos y tendrán que elegir». La papelera, solo en el
// móvil que la subió (`mia`): un impostor con su nombre no le borra nada.
// A quien tiene 16 o 17 años, su frase del permiso de los padres; a un
// menor de 16, solo que las suben los mayores.
//
// «Elegir foto» busca en la galería (él): el campo va sin `capture`, así el
// móvil no salta a la cámara. El menú propio del iPhone (Fototeca, Hacer
// foto, Seleccionar archivo) no se puede quitar. Es el mismo botón-etiqueta
// con el campo escondido que «Cambiar foto» del formulario (VistaColaborador).
import { useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { C, OP, T } from "../theme";
import { estilosBoton } from "../components/Boton";
import { BotonQuitar } from "../components/PreguntaSeguridad";
import { LineaAviso } from "../components/LineaAviso";
import { HuecoFoto } from "../components/HuecoFoto";
import { horaCorta } from "../lib/formato";
import { miniaturaFotoFiesta, textoCompleta, FRASE_HORIZONTAL, FRASE_PERMISO_PADRES, SOLO_MAYORES_16 } from "../lib/fotosFiesta";

const PREGUNTA_ELIMINAR = {
  titulo: "¿Eliminar esta foto?",
  texto: "Solo se borra de aquí: en tu móvil la sigues teniendo.",
  rotulo: "Sí, eliminar",
};

const estiloAyuda = { color: C.charcoal, opacity: OP.secundario };

// estado: lo que da tablon_fotos ({ maximo, menor, conPermiso, fotos: [{ id,
// creadaEn, mia }] }). onSubir(archivo) y onEliminar(id) devuelven { aviso }:
// vacío si salió bien.
export function TarjetaFotosFiesta({ estado, onSubir, onEliminar }) {
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState("");
  const { fotos, maximo, menor, conPermiso } = estado;
  const completa = fotos.length >= maximo;

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
      className="rounded-lg px-5 py-4 mb-6 flex items-start gap-3"
      style={{ background: C.blanco, border: `1px solid ${C.line}`, color: C.ink }}
    >
      <Camera size={28} className="mt-1" style={{ flexShrink: 0 }} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>
          Fotos de la fiesta
        </div>

        {menor ? (
          <p className="text-sm mt-1">{SOLO_MAYORES_16}</p>
        ) : (
          <>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado }}>
              Tus fotos · {fotos.length} de {maximo}
            </div>

            {fotos.length > 0 && (
              <ul className="mt-1">
                {fotos.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 py-1 text-sm">
                    <HuecoFoto titulo="Tu foto" enlace={miniaturaFotoFiesta(f.id)} soloLectura ajustada />
                    <span className="truncate flex-1 min-w-0">Subida a las {horaCorta(f.creadaEn)}</span>
                    {f.mia && (
                      <BotonQuitar borrar titulo="Eliminar esta foto" pregunta={PREGUNTA_ELIMINAR} onClick={() => eliminar(f.id)} />
                    )}
                  </li>
                ))}
              </ul>
            )}

            {completa ? (
              <p className="text-sm mt-2">{textoCompleta(maximo)}</p>
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
