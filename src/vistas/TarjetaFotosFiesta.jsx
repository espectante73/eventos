// Las fotos de la fiesta en el tablón (él, v67.4): solo con la recogida
// abierta, y SIN ver las fotos. La cuenta de su familia, una línea por foto
// («Medina, Ana · 22:47») y, en las suyas, la papelera para cambiarla por
// otra: «tendrán muchas fotos y tendrán que elegir». Para saber cuál, las
// suyas llevan su miniatura, guardada en su propio móvil (él, v67.5); las
// de los demás, el marco vacío, para que todas las filas midan lo mismo.
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
import { miniaturaFotoFiesta } from "../lib/fotosFiesta";

// Su frase, pulida con él: «en UNA pantalla», no «en la pantalla» (no se
// proyectan ese día en el local).
export const FRASE_HORIZONTAL =
  "Puedes hacerla en horizontal o en vertical; solo ten en cuenta que en horizontal se verá mejor en una pantalla.";

const PREGUNTA_ELIMINAR = {
  titulo: "¿Eliminar esta foto?",
  texto: "Solo se borra de aquí: en tu móvil la sigues teniendo.",
  rotulo: "Sí, eliminar",
};

// estado: lo que da tablon_fotos ({ maximo, fotos: [{ id, quien, creadaEn, mia }] }).
// onSubir(archivo) y onEliminar(id) devuelven { aviso }: vacío si salió bien.
export function TarjetaFotosFiesta({ estado, onSubir, onEliminar }) {
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState("");
  const { fotos, maximo } = estado;
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
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: T.destacado }}>
          Tu familia · {fotos.length} de {maximo}
        </div>

        {fotos.length > 0 && (
          <ul className="mt-1">
            {fotos.map((f) => (
              <li key={f.id} className="flex items-center gap-2 py-1 text-sm">
                <HuecoFoto titulo={`Foto de ${f.quien}`} enlace={f.mia ? miniaturaFotoFiesta(f.id) : ""} soloLectura ajustada />
                <span className="truncate flex-1 min-w-0">
                  {f.quien} · {horaCorta(f.creadaEn)}
                </span>
                {f.mia && (
                  <BotonQuitar borrar titulo="Eliminar esta foto" pregunta={PREGUNTA_ELIMINAR} onClick={() => eliminar(f.id)} />
                )}
              </li>
            ))}
          </ul>
        )}

        {completa ? (
          <p className="text-sm mt-2">
            Ya tienen sus {maximo} fotos. Si quieren cambiar una, eliminen antes otra.
          </p>
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
            <p className="text-xs mt-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
              {FRASE_HORIZONTAL}
            </p>
          </>
        )}

        {aviso && <LineaAviso className="text-xs mt-2">{aviso}</LineaAviso>}
      </div>
    </div>
  );
}
