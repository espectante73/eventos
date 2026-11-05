// «Lo nuevo» (él, v81.9): arriba del todo en el Inicio de cada colaborador,
// plegado en una línea; al tocarlo, las novedades de estas semanas y, SIEMPRE
// (v82), cómo instalar la app y activar los avisos, con su icono. Temporal,
// sin «Entendido»: cuándo sale, en lib/loNuevo.js. Del ancho de la Portada.
import { Bell, Sparkles } from "lucide-react";
import { C, OP } from "../theme";
import { SeccionPlegable } from "./SeccionPlegable";
import { IconoLlamar, IconoWhatsApp } from "./Contacto";
import { PlayRelleno } from "./EscucharCancion";
import { ANCHO_MAXIMO_PORTADA } from "./Portada";
import { PASOS_INSTALAR } from "../lib/avisosPush";

const LINEA = "flex items-start gap-2";
const HUECO_ICONO = { width: 40, flexShrink: 0, display: "flex", justifyContent: "center", gap: 2, paddingTop: 1 };

export function AvisoLoNuevo() {
  const texto = { color: C.charcoal };
  return (
    <div className="mx-auto" style={{ maxWidth: ANCHO_MAXIMO_PORTADA }}>
      <SeccionPlegable icono={Sparkles} titulo="Lo nuevo" resumen="WhatsApp, avisos y canciones">
        <div className="space-y-2 text-sm pt-1">
          <p className={LINEA} style={texto}>
            <span style={{ ...HUECO_ICONO, color: C.champanTinta }}>
              <IconoLlamar size={18} />
              <IconoWhatsApp size={18} />
            </span>
            <span>Llama o escribe por WhatsApp a tu invitado desde su ficha.</span>
          </p>
          {/* v82.5 (él): los mensajes de WhatsApp ya escritos (v82.4). */}
          <p className={LINEA} style={texto}>
            <span style={HUECO_ICONO}>
              <IconoWhatsApp size={18} />
            </span>
            <span>Al escribirle, el mensaje ya sale escrito: lo que le falta, sus canciones (hasta 3) o su pago.</span>
          </p>
          <p className={LINEA} style={texto}>
            <span style={{ ...HUECO_ICONO, color: C.gold }}>
              <Bell size={18} />
            </span>
            <span>Avisos en el móvil, como cualquier app.</span>
          </p>
          <p className={LINEA} style={texto}>
            <span style={{ ...HUECO_ICONO, color: C.gold }}>
              <PlayRelleno size={18} />
            </span>
            <span>Escucha en la ficha de tu invitado la canción que pidió: si no suena, está mal escrita.</span>
          </p>
          <div className="space-y-1.5 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
            <p style={{ color: C.ink }}>
              <strong>Instala la app </strong>
              <span style={{ opacity: OP.secundario }}>(así te llegan los avisos):</span>
            </p>
            <p style={texto}>
              <strong>iPhone:</strong> {PASOS_INSTALAR.iphone}
            </p>
            <p style={texto}>
              <strong>Android:</strong> {PASOS_INSTALAR.android}
            </p>
            <p className="flex items-center gap-2" style={texto}>
              <img src="/icono-192.png" alt="" width={36} height={36} style={{ borderRadius: "22%", flexShrink: 0 }} /* escala-libre: la curva del icono en la pantalla de inicio, para reconocerlo */ />
              <span>Ábrela desde su icono, «Las Bodas», y activa «Avisos en este móvil».</span>
            </p>
          </div>
        </div>
      </SeccionPlegable>
    </div>
  );
}
