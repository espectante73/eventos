// Sub-ventana de Configuración: nombre, fecha, hora, lugar, dirección e
// imagen de portada del evento. Extraída de VistaAnfitrion.jsx en el
// reparto del 2026-08-08 (Fase 4, Ronda 2).
import { useState } from "react";
import { C } from "../../theme";
import { redimensionarImagenArchivo } from "../../lib/descargas";
import { Field, TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";

export function VentanaConfigDatosEvento({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  const [subiendoImagenPortada, setSubiendoImagenPortada] = useState(false);
  const [errorImagenPortada, setErrorImagenPortada] = useState("");

  const onSeleccionarArchivoImagenPortada = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErrorImagenPortada("");
    setSubiendoImagenPortada(true);
    try {
      // 2000px / calidad 0.9 (no los valores por defecto, 1600/0.82):
      // desde el rediseño de la portada (2026-08-12) esta imagen se
      // muestra como póster grande y protagonista, no ya como una franja
      // pequeña de fondo -- con la compresión floja de antes se notaba
      // pixelada. Mismo nivel que ya usa la plantilla de Invitaciones
      // (redimensionarImagenArchivo(file, 2000, 0.88) en
      // VentanaInvitaciones.jsx), incluso un punto por encima.
      const dataUrl = await redimensionarImagenArchivo(file, 2000, 0.9);
      persistEvento({ ...evento, imagen: dataUrl });
    } catch (_) {
      setErrorImagenPortada("No se ha podido procesar la imagen. Prueba con otra.");
    } finally {
      setSubiendoImagenPortada(false);
    }
  };

  return (
    <VentanaFlotante clave="config-datos-evento" titulo="Datos del evento" onCerrar={onCerrar}>
      <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
        Datos del evento (esto es lo que se ve en la portada).
      </p>
      <div className="grid grid-cols-2 gap-4 mb-4" style={{ maxWidth: 500 }}>
        <div style={{ gridColumn: "span 2 / span 2" }}>
          <Field label="Nombre del evento">
            <TextInput
              value={evento.nombre}
              onChange={(e) => persistEvento({ ...evento, nombre: e.target.value })}
              placeholder="Boda de..."
              className="w-full"
            />
          </Field>
        </div>
        <Field label="Fecha">
          <TextInput
            type="date"
            value={evento.fecha}
            onChange={(e) => persistEvento({ ...evento, fecha: e.target.value })}
          />
        </Field>
        <Field label="Hora">
          <TextInput
            type="time"
            value={evento.hora}
            onChange={(e) => persistEvento({ ...evento, hora: e.target.value })}
          />
        </Field>
        <Field label="Lugar">
          <TextInput
            value={evento.lugar}
            onChange={(e) => persistEvento({ ...evento, lugar: e.target.value })}
            placeholder="Finca El Rincón"
          />
        </Field>
        <Field label="Dirección">
          <TextInput
            value={evento.direccion}
            onChange={(e) => persistEvento({ ...evento, direccion: e.target.value })}
            placeholder="Calle, número, municipio"
          />
        </Field>
        <div style={{ gridColumn: "span 2 / span 2" }}>
          <Field label="Imagen de portada">
            <div className="flex items-center gap-2 flex-wrap">
              {evento.imagen && (
                <img
                  src={evento.imagen}
                  alt="Portada"
                  className="rounded object-cover"
                  style={{ width: 60, height: 40, border: `1px solid ${C.line}` }}
                />
              )}
              <label
                className="text-xs px-2 py-1 rounded cursor-pointer"
                style={{ border: `1px solid ${C.gold}`, color: C.gold }}
              >
                {subiendoImagenPortada ? "Procesando…" : "Subir imagen desde el dispositivo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onSeleccionarArchivoImagenPortada}
                  disabled={subiendoImagenPortada}
                  style={{ display: "none" }}
                />
              </label>
              {evento.imagen !== "/cabecera-defecto.jpg" && (
                <button
                  type="button"
                  onClick={() => persistEvento({ ...evento, imagen: "/cabecera-defecto.jpg" })}
                  className="text-xs"
                  style={{ color: C.wax }}
                >
                  Quitar y usar la imagen incluida
                </button>
              )}
            </div>
            {errorImagenPortada && (
              <p className="text-xs mt-1" style={{ color: C.wax }}>
                {errorImagenPortada}
              </p>
            )}
          </Field>
          <label className="flex items-center gap-2 mt-2 text-xs" style={{ color: C.charcoal }}>
            <input
              type="checkbox"
              checked={evento.ocultarTituloEnImagen}
              onChange={(e) => persistEvento({ ...evento, ocultarTituloEnImagen: e.target.checked })}
            />
            La imagen ya incluye el título (ocultar el texto superpuesto)
          </label>
        </div>
      </div>
    </VentanaFlotante>
  );
}
