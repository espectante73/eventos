// «Lo nuevo» (él, v81.7): pone al día a cada colaborador de lo que se ha
// añadido estas semanas (él no lee «Versiones», que es del anfitrión), una
// sola vez: se cierra con «Entendido». «Instala la app» sigue saliendo en el
// móvil mientras no la abra instalada, porque en el iPhone sin eso no le
// llegan los avisos; abierta desde su icono, desaparece sola. Qué sale, en
// lib/loNuevo.js. Abierta o no, como los demás apartados del panel (uno
// solo a la vez): `abierta` y `onAlternar`.
import { Bell, Smartphone, Sparkles } from "lucide-react";
import { C, OP } from "../theme";
import { SeccionPlegable } from "./SeccionPlegable";
import { Boton } from "./Boton";
import { IconoLlamar, IconoWhatsApp } from "./Contacto";
import { PlayRelleno } from "./EscucharCancion";
import { PASOS_INSTALAR } from "../lib/avisosPush";

const LINEA = "flex items-start gap-2";
const HUECO_ICONO = { width: 40, flexShrink: 0, display: "flex", justifyContent: "center", gap: 2, paddingTop: 1 };

export function TarjetaLoNuevo({ verNovedades, verInstalar, abierta, onAlternar, onEntendido }) {
  const texto = { color: C.charcoal };
  return (
    <SeccionPlegable
      icono={verNovedades ? Sparkles : Smartphone}
      titulo={verNovedades ? "Lo nuevo" : "Instala la app"}
      abierta={abierta}
      onAlternar={onAlternar}
    >
      <div className="space-y-2 text-sm pt-1">
        {verNovedades && (
          <>
            <p className={LINEA} style={texto}>
              <span style={{ ...HUECO_ICONO, color: C.champanTinta }}>
                <IconoLlamar size={18} />
                <IconoWhatsApp size={18} />
              </span>
              <span>Llama o escribe por WhatsApp a tu invitado desde su ficha.</span>
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
          </>
        )}
        {verInstalar && (
          <div className="space-y-1.5 pt-2" style={{ borderTop: verNovedades ? `1px solid ${C.line}` : "none" }}>
            <p style={{ color: C.ink }}>
              {verNovedades && <strong>Instala la app </strong>}
              <span style={{ opacity: OP.secundario }}>{verNovedades ? "(así te llegan los avisos):" : "Así te llegan los avisos:"}</span>
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
        )}
        {verNovedades && (
          <div className="flex justify-end zurdo:justify-start pt-1">
            <Boton variante="principal" onClick={onEntendido}>
              Entendido
            </Boton>
          </div>
        )}
      </div>
    </SeccionPlegable>
  );
}
