// Sub-ventana de Configuración: imagen del cronograma/logística del día
// -- a petición del usuario, 2026-08-25. Es una imagen que ya tiene
// hecha pero que va a ir reemplazando según avanza el proyecto, así que
// se sube a Storage con un nombre de archivo FIJO (upsert), igual que la
// imagen para WhatsApp (ver VentanaConfigDatosEvento.jsx) -- la URL
// pública nunca cambia, solo el archivo detrás. Se muestra en el tablón
// público (VistaTablon.jsx), no solo aquí dentro.
import { useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { C } from "../../theme";
import { supabase } from "../../supabaseClient";
import { redimensionarImagenArchivo } from "../../lib/descargas";
import { VentanaFlotante } from "../../components/VentanaFlotante";

const BUCKET = "cronograma";
const RUTA = "cronograma.jpg";

export function VentanaConfigCronograma({ onCerrar }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  // Cache-busting solo para la vista previa de AQUÍ DENTRO -- la URL
  // pública real (la que ve el tablón) es siempre la misma.
  const [vistaPrevia, setVistaPrevia] = useState(() => Date.now());

  const urlPublica = supabase.storage.from(BUCKET).getPublicUrl(RUTA).data.publicUrl;

  const subir = async (e) => {
    const archivo = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    setError("");
    setSubiendo(true);
    try {
      const dataUrl = await redimensionarImagenArchivo(archivo, 1600, 0.88);
      const blob = await (await fetch(dataUrl)).blob();
      const { error: errSubida } = await supabase.storage
        .from(BUCKET)
        .upload(RUTA, blob, { upsert: true, contentType: "image/jpeg" });
      if (errSubida) throw errSubida;
      setVistaPrevia(Date.now());
    } catch (err) {
      setError(`No se ha podido subir la imagen: ${err?.message || err}`);
    } finally {
      setSubiendo(false);
    }
  };

  const quitar = async () => {
    const { error: errBorrar } = await supabase.storage.from(BUCKET).remove([RUTA]);
    if (errBorrar) {
      setError(`No se ha podido quitar la imagen: ${errBorrar.message || errBorrar}`);
      return;
    }
    setVistaPrevia(Date.now());
  };

  return (
    <VentanaFlotante clave="config-cronograma" titulo="Cronograma" onCerrar={onCerrar}>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
        Imagen con el cronograma o la logística del día — se ve en el tablón público. Puedes
        volver a subir una nueva cuando cambie algo; el enlace que ya se compartió no se ve
        afectado.
      </p>

      <img
        key={vistaPrevia}
        src={`${urlPublica}?v=${vistaPrevia}`}
        alt=""
        className="w-full rounded mb-3"
        style={{ border: `1px solid ${C.line}`, background: C.paperDark, minHeight: 80 }}
        onError={(e) => {
          e.target.style.display = "none";
        }}
        onLoad={(e) => {
          e.target.style.display = "block";
        }}
      />

      <div className="flex items-center gap-2">
        <label
          className="flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium cursor-pointer"
          style={{ background: C.ink, color: C.paper, opacity: subiendo ? 0.6 : 1 }}
        >
          <Upload size={14} />
          {subiendo ? "Subiendo…" : "Subir / reemplazar imagen"}
          <input type="file" accept="image/*" onChange={subir} disabled={subiendo} className="hidden" />
        </label>
        <button
          onClick={quitar}
          className="flex items-center gap-1 px-3 py-2 rounded text-sm"
          style={{ border: `1px solid ${C.wax}`, color: C.wax }}
          title="Quitar la imagen (deja de verse en el tablón)"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {error && (
        <p className="text-xs mt-2" style={{ color: C.wax }}>
          ⚠ {error}
        </p>
      )}
    </VentanaFlotante>
  );
}
