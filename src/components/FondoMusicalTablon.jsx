// Contenido del gestor de música ambiental del tablón público -- movido
// aquí desde su propia ventana de Configuración ("Fondo musical",
// VentanaConfigMusica.jsx) el 2026-09-05, a petición del usuario: era un
// botón de segundo nivel que solo abría para tocar algo de Novedades (el
// tablón público), así que encaja mejor como una fila plegable más en el
// pie de esa ventana -- mismo sitio donde ya viven el WhatsApp y la
// pregunta de acceso -- que como una entrada propia del menú "Abrir
// sección...".
//
// Sin `VentanaFlotante` propia: aquí es solo el CONTENIDO, para que
// pueda vivir dentro del plegable de VentanaNovedades.jsx. La lógica de
// Storage es exactamente la misma que tenía la ventana.
import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, Music } from "lucide-react";
import { C } from "../theme";
import { supabase } from "../supabaseClient";

const BUCKET = "musica-ambiental";

export function FondoMusicalTablon() {
  const [pistas, setPistas] = useState(null); // null = cargando todavía
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    const { data, error: errList } = await supabase.storage.from(BUCKET).list();
    if (errList) {
      setError("No se pudo cargar la lista de pistas.");
      return;
    }
    setPistas((data || []).filter((f) => f.name && !f.name.startsWith(".")));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const subir = async (e) => {
    const archivo = e.target.files && e.target.files[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo después
    if (!archivo) return;
    setSubiendo(true);
    setError("");
    // Nombre único delante del original (que puede repetirse o traer
    // espacios/acentos) -- evita colisiones sin depender de que el propio
    // usuario elija nombres distintos cada vez.
    const nombreArchivo = `${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: errSubida } = await supabase.storage.from(BUCKET).upload(nombreArchivo, archivo);
    setSubiendo(false);
    if (errSubida) {
      setError(`No se pudo subir el archivo: ${errSubida.message || errSubida}`);
      return;
    }
    cargar();
  };

  const eliminar = async (nombreArchivo) => {
    const { error: errBorrar } = await supabase.storage.from(BUCKET).remove([nombreArchivo]);
    if (errBorrar) {
      setError("No se pudo eliminar la pista.");
      return;
    }
    cargar();
  };

  return (
    <div>
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
        Suena de fondo mientras alguien tiene abierto el tablón público (nunca en tu propia
        app de gestión). Con varias pistas, van sonando una detrás de otra. El primer clic de
        cada visitante debe activarla a propósito.
      </p>

      <label
        className="flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium mb-2 cursor-pointer"
        style={{ background: C.ink, color: C.paper, opacity: subiendo ? 0.6 : 1 }}
      >
        <Upload size={13} />
        {subiendo ? "Subiendo…" : "Subir archivo de audio"}
        <input type="file" accept="audio/*" onChange={subir} disabled={subiendo} className="hidden" />
      </label>

      {error && (
        <p className="text-xs mb-2" style={{ color: C.wax }}>
          ⚠ {error}
        </p>
      )}

      {pistas === null ? (
        <p className="text-xs italic" style={{ color: C.charcoal, opacity: 0.6 }}>
          Cargando…
        </p>
      ) : pistas.length === 0 ? (
        <p className="text-xs italic" style={{ color: C.charcoal, opacity: 0.6 }}>
          Todavía no hay ninguna pista subida — el tablón no sonará hasta que subas al menos
          una.
        </p>
      ) : (
        <div className="space-y-1.5">
          {pistas.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
              style={{ background: "#fff", border: `1px solid ${C.line}` }}
            >
              <span className="flex items-center gap-1.5 text-xs truncate" style={{ color: C.charcoal }}>
                <Music size={13} style={{ color: C.gold, flexShrink: 0 }} />
                <span className="truncate">{p.name.replace(/^\d+-/, "")}</span>
              </span>
              <button onClick={() => eliminar(p.name)} title="Eliminar esta pista" className="p-1 flex-shrink-0">
                <Trash2 size={14} style={{ color: C.wax }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
