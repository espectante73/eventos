// Sub-ventana de Configuración: nombre, fecha, hora, lugar, dirección e
// imagen de portada del evento. Extraída de VistaAnfitrion.jsx en el
// reparto del 2026-08-08 (Fase 4, Ronda 2).
import { useState } from "react";
import { Image as ImageIcon, Euro, Mail, Globe } from "lucide-react";
import { C, inputStyle } from "../../theme";
import { redimensionarImagenArchivo } from "../../lib/descargas";
import { supabase } from "../../supabaseClient";
import { Field, TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { emailValido } from "../../lib/validacion";

// Miniatura que WhatsApp/Facebook muestran al pegar cualquier enlace de
// esta web (login, tablón...) -- a petición del usuario, 2026-08-25. Es
// una imagen APARTE de evento.imagen (que va como base64 en la propia
// fila de `evento`): las etiquetas og:image de index.html son estáticas
// (WhatsApp lee el HTML tal cual, sin ejecutar React) y necesitan una URL
// http de verdad, no un data: URI. Se sube siempre con el MISMO nombre
// (`og-imagen/portada.jpg`, ver schema.sql) para que la URL nunca cambie
// -- solo el archivo detrás cambia al volver a subir una foto.
const BUCKET_OG = "og-imagen";
const RUTA_OG = "portada.jpg";

// Los dos grupos de precios, tal cual venían de la ventana "Precios"
// (retirada el 2026-09-05 y fundida aquí): dos números grandes centrados
// sobre fondo verde, un grupo para los importes y otro para el tramo de
// edad que decide cuál se aplica.
function GrupoPrecio({ titulo, etiquetaA, valorA, onCambiarA, etiquetaB, valorB, onCambiarB, moneda }) {
  return (
    <div className="rounded-lg p-3" style={{ background: C.ink }}>
      {titulo && (
        <div
          className="text-center text-sm mb-1"
          style={{ color: C.paper, textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          {titulo}
        </div>
      )}
      <div
        className="flex items-center justify-center gap-4 text-xs uppercase mb-2"
        style={{ color: C.paper, opacity: 0.85, letterSpacing: "0.06em" }}
      >
        <span>{etiquetaA}</span>
        <span style={{ opacity: 0.5 }}>--</span>
        <span>{etiquetaB}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        {[
          { valor: valorA, onCambiar: onCambiarA },
          { valor: valorB, onCambiar: onCambiarB },
        ].map(({ valor, onCambiar }, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              value={valor}
              onChange={onCambiar}
              style={{ ...inputStyle, width: moneda ? 56 : 72, textAlign: "center", fontSize: 22, fontWeight: 700 }}
            />
            {moneda && <span style={{ color: C.paper, fontSize: 20, fontWeight: 700 }}>€</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VentanaConfigDatosEvento({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  const [subiendoImagenPortada, setSubiendoImagenPortada] = useState(false);
  const [errorImagenPortada, setErrorImagenPortada] = useState("");
  const [subiendoImagenOg, setSubiendoImagenOg] = useState(false);
  const [errorImagenOg, setErrorImagenOg] = useState("");
  // Solo para refrescar la miniatura de aquí dentro tras subir una nueva
  // -- la URL pública real (la que ve WhatsApp) es siempre la misma.
  const [vistaPreviaOg, setVistaPreviaOg] = useState(() => Date.now());

  const urlPublicaOg = supabase.storage.from(BUCKET_OG).getPublicUrl(RUTA_OG).data.publicUrl;

  const onSeleccionarImagenOg = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErrorImagenOg("");
    setSubiendoImagenOg(true);
    try {
      const dataUrl = await redimensionarImagenArchivo(file, 1200, 0.85);
      const blob = await (await fetch(dataUrl)).blob();
      const { error } = await supabase.storage
        .from(BUCKET_OG)
        .upload(RUTA_OG, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      setVistaPreviaOg(Date.now());
    } catch (err) {
      // Mensaje real de Supabase, no uno genérico -- para diagnosticar
      // sin adivinar (detectado el 2026-08-25: el bucket llevaba vacío
      // pese a intentos de subida, y el mensaje genérico no decía por qué).
      setErrorImagenOg(`No se ha podido subir la imagen: ${err?.message || err}`);
    } finally {
      setSubiendoImagenOg(false);
    }
  };

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
      </div>

      {/* Todo lo que sigue estaba antes suelto (las dos imágenes) o en su
          propia ventana del menú (Precios, Email anfitrión, URL web).
          Se juntan aquí, plegadas por defecto: son ajustes del evento que
          se tocan una vez y no hay que tener ocupando pantalla -- misma
          idea que ya se aplicó al pie de Novedades (2026-09-05). El
          `resumen` de cada una deja ver el valor actual sin desplegar. */}
      <div className="flex flex-col gap-2" style={{ maxWidth: 500 }}>
        <SeccionPlegable
          icono={ImageIcon}
          titulo="Imágenes"
          resumen={evento.imagen && evento.imagen !== "/cabecera-defecto.jpg" ? "portada propia" : "portada por defecto"}
        >
        <div>
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

        <div>
          <Field label="Imagen para compartir en WhatsApp">
            <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
              La miniatura que aparece al pegar cualquier enlace de esta web (el del tablón,
              el de login...) en WhatsApp — sube aquí la misma foto de cabecera si quieres que
              se vea ahí también.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <img
                key={vistaPreviaOg}
                src={`${urlPublicaOg}?v=${vistaPreviaOg}`}
                alt=""
                className="rounded object-cover"
                style={{ width: 60, height: 40, border: `1px solid ${C.line}`, background: C.paperDark }}
                onError={(e) => {
                  e.target.style.visibility = "hidden";
                }}
              />
              <label
                className="text-xs px-2 py-1 rounded cursor-pointer"
                style={{ border: `1px solid ${C.gold}`, color: C.gold }}
              >
                {subiendoImagenOg ? "Subiendo…" : "Subir imagen para WhatsApp"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onSeleccionarImagenOg}
                  disabled={subiendoImagenOg}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            {errorImagenOg && (
              <p className="text-xs mt-1" style={{ color: C.wax }}>
                {errorImagenOg}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: C.charcoal, opacity: 0.5 }}>
              Si vuelves a subirla más tarde, un enlace YA compartido antes puede tardar en
              actualizarse en WhatsApp — cachean la miniatura por su cuenta.
            </p>
          </Field>
        </div>
        </SeccionPlegable>

        <SeccionPlegable
          icono={Euro}
          titulo="Precios"
          resumen={`${evento.precioAdulto || "—"} € adulto · ${evento.precioNino || "—"} € niño`}
        >
          <div className="space-y-3 pt-1">
            <GrupoPrecio
              moneda
              etiquetaA="Adulto"
              valorA={evento.precioAdulto}
              onCambiarA={(e) => persistEvento({ ...evento, precioAdulto: e.target.value })}
              etiquetaB="Niño"
              valorB={evento.precioNino}
              onCambiarB={(e) => persistEvento({ ...evento, precioNino: e.target.value })}
            />
            <GrupoPrecio
              titulo="Edad niño"
              etiquetaA="Desde"
              valorA={evento.edadNinoDesde}
              onCambiarA={(e) => persistEvento({ ...evento, edadNinoDesde: e.target.value })}
              etiquetaB="Hasta"
              valorB={evento.edadNinoHasta}
              onCambiarB={(e) => persistEvento({ ...evento, edadNinoHasta: e.target.value })}
            />
          </div>
        </SeccionPlegable>

        <SeccionPlegable
          icono={Mail}
          titulo="Email del anfitrión"
          resumen={evento.emailAnfitrion || "sin configurar"}
        >
          <p className="text-xs mb-2 pt-1" style={{ color: C.charcoal, opacity: 0.75 }}>
            Tu email, para recibir avisos automáticos cuando un colaborador complete todos los
            datos o todos los pagos de sus invitados asignados.
          </p>
          <Field label="Tu email (anfitrión)">
            <TextInput
              value={evento.emailAnfitrion || ""}
              onChange={(e) => persistEvento({ ...evento, emailAnfitrion: e.target.value })}
              placeholder="tu@email.com"
              className="w-full"
            />
          </Field>
          {evento.emailAnfitrion && !emailValido(evento.emailAnfitrion) && (
            <p className="text-xs mt-1" style={{ color: C.wax }}>
              ⚠ No parece un email válido — revísalo, o te quedarás sin avisos sin que nadie lo note.
            </p>
          )}
        </SeccionPlegable>

        <SeccionPlegable icono={Globe} titulo="URL de la web" resumen={evento.urlPublica || "sin configurar"}>
          <p className="text-xs mb-2 pt-1" style={{ color: C.charcoal, opacity: 0.75 }}>
            <strong>Importante:</strong> la URL de tu web ya publicada. Sin este dato, los enlaces
            que copies para cada colaborador no apuntarán al sitio correcto.
          </p>
          <Field label="URL de la web">
            <TextInput
              value={evento.urlPublica}
              onChange={(e) => persistEvento({ ...evento, urlPublica: e.target.value })}
              placeholder="https://tu-boda.vercel.app"
              className="w-full"
            />
          </Field>
        </SeccionPlegable>
      </div>
    </VentanaFlotante>
  );
}
