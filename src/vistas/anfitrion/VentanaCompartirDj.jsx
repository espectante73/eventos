// «Compartir con el DJ» (él, v81): un enlace a «Canciones para bailar» solo
// para mirar, exclusivo de un DJ (DJ Brown): el enlace se le manda por
// WhatsApp y la clave de 5 letras y números se la da él por teléfono. Aquí
// se ve cuándo entró por última vez, y se cambia el enlace o se deja de
// compartir. La página del DJ, en VistaDj.jsx; la base, dj_canciones.
import { useEffect, useState } from "react";
import { Copy, Check, Send, RefreshCw } from "lucide-react";
import { C, OP, R, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { TextInput } from "../../components/Formulario";
import { Boton, EnlaceTexto } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { BotonQuitar, usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { construirEnlaceDj } from "../../lib/url";
import { fechaYHora } from "../../lib/formato";
import { realmDe } from "../../lib/realm";

const TOPE_FALLOS = 10;

export function VentanaCompartirDj({ data, onCerrar }) {
  const { evento, leerDj, compartirDj, dejarDj } = data;
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  // undefined: leyendo; null: no se comparte.
  const [dj, setDj] = useState(undefined);
  const [nombre, setNombre] = useState("DJ Brown");
  const [aviso, setAviso] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    leerDj().then((r) => {
      if (!vivo) return;
      if (r.error) setAviso(`No se pudo leer: ${r.error}`);
      setDj(r.dj ?? null);
    });
    return () => {
      vivo = false;
    };
  }, [leerDj]);

  const crear = async (para) => {
    setAviso("");
    const r = await compartirDj(para.trim() || "DJ");
    if (r.error) setAviso(`No se pudo crear el enlace: ${r.error}`);
    else setDj(r.dj);
  };
  const enlace = dj ? construirEnlaceDj(evento.urlPublica || window.location.origin, dj.token) : "";
  const mensaje = dj
    ? `Hola, ${dj.nombre}: estas son las canciones que han pedido los invitados de ${evento.nombre || "la boda"}. Se actualiza sola. La clave te llega por teléfono.\n${enlace}`
    : "";

  // Dentro del clic y con la ventana donde está el botón: la Lista es otra
  // ventana del sistema, y el portapapeles solo deja escribir a la que
  // tiene el foco (CLAUDE.md 2.2).
  const copiar = (e) => {
    const { win } = realmDe(e.currentTarget);
    win.navigator.clipboard.writeText(enlace).then(
      () => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      },
      () => setAviso("No se pudo copiar: selecciona el enlace y cópialo a mano.")
    );
  };
  const porWhatsApp = (e) => {
    const { win } = realmDe(e.currentTarget);
    win.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
  };
  const enlaceNuevo = () =>
    preguntar({
      titulo: "¿Enlace y clave nuevos?",
      texto: "El enlace y la clave de ahora dejarán de valer: habrá que mandarle los nuevos.",
      rotulo: "Sí",
      peligro: false,
      alConfirmar: () => crear(dj.nombre),
    });

  const texto = { color: C.charcoal, opacity: OP.secundario };
  return (
    <VentanaFlotante clave="compartirDj" titulo="Compartir con el DJ" onCerrar={onCerrar} ancho="min(440px, calc(100vw - 48px))">
      <div className="space-y-3 text-sm">
        {dj === undefined && <p style={texto}>Leyendo…</p>}

        {dj === null && (
          <>
            <p style={texto}>Un enlace a «Canciones para bailar», solo para mirar: sin nombres, con la edad de quien la pidió. Exclusivo: además pide una clave.</p>
            <div className="flex items-center gap-2">
              <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del DJ" aria-label="Nombre del DJ" className="flex-1 min-w-0" />
              <Boton variante="principal" onClick={() => crear(nombre)}>
                Crear enlace
              </Boton>
            </div>
          </>
        )}

        {dj && (
          <>
            <p style={{ color: C.ink }}>
              Para <strong>{dj.nombre}</strong>
            </p>
            {/* El enlace, en una línea (norma 6), y sus dos botones al lado. */}
            <div className="flex items-center gap-2">
              <span className="flex-1 min-w-0 truncate px-2 py-1.5" title={enlace} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: T.pequeno, border: `1px solid ${C.line}`, borderRadius: R.caja, background: C.blanco }}>
                {enlace}
              </span>
              <Boton variante="secundario" tamano="pequeno" icono={copiado ? Check : Copy} titulo="Copiar el enlace" onClick={copiar} />
              <Boton variante="principal" tamano="pequeno" icono={Send} onClick={porWhatsApp}>
                WhatsApp
              </Boton>
            </div>
            <div className="flex items-center gap-3">
              <span style={texto}>Clave</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: T.destacado, fontWeight: 700, letterSpacing: "0.2em", color: C.ink }}>{dj.clave}</span>
              <span style={texto}>· dísela por teléfono</span>
            </div>
            <p style={texto}>{dj.ultimoAcceso ? `Entró por última vez: ${fechaYHora(dj.ultimoAcceso)}.` : "Todavía no ha entrado."}</p>
            {dj.fallos >= TOPE_FALLOS ? (
              <LineaAviso className="text-sm">Bloqueado tras {TOPE_FALLOS} claves equivocadas: crea un enlace nuevo y mándaselo.</LineaAviso>
            ) : (
              dj.fallos > 0 && <LineaAviso className="text-sm">{dj.fallos === 1 ? "1 clave equivocada" : `${dj.fallos} claves equivocadas`} desde su última entrada.</LineaAviso>
            )}
            <div className="flex items-center gap-2 pt-3 zurdo:flex-row-reverse" style={{ borderTop: `1px solid ${C.line}` }}>
              <Boton variante="secundario" icono={RefreshCw} onClick={enlaceNuevo}>
                Enlace nuevo
              </Boton>
              <EnlaceTexto href={enlace}>Verla como el DJ</EnlaceTexto>
              <span className="ml-auto zurdo:ml-0 zurdo:mr-auto">
                <BotonQuitar
                  titulo="Dejar de compartir"
                  pregunta={{ titulo: "¿Dejar de compartir con el DJ?", texto: "El enlace dejará de funcionar.", rotulo: "Sí" }}
                  onClick={async () => {
                    const r = await dejarDj();
                    if (r.error) setAviso(`No se pudo: ${r.error}`);
                    else setDj(null);
                  }}
                />
              </span>
            </div>
          </>
        )}
        {aviso && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
