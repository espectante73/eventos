// Contactar con un invitado (él, v78): llamarle o escribirle por WhatsApp
// desde el panel del colaborador. Boceto aprobado: el auricular con flecha,
// RELLENO, y el número, en negrita, los dos en dorado oscuro (champán
// tinta), del lado del pulgar; WhatsApp, su icono SÓLIDO en su verde, al
// otro lado. Llamar es la preferencia: queda al alcance del pulgar.
import { useEffect } from "react";
import { C, R, T, DEDO, DORADO } from "../theme";
import { ClipboardList, Music, Wallet, MessageCircle, KeyRound } from "lucide-react";
import { telefonoParaVer, enlaceLlamar, enlaceWhatsApp, enlaceWhatsAppDirecto, abrirWhatsApp } from "../lib/telefono";
import { esAparatoTactil } from "../lib/mano";
import { MenuFlotante } from "./MenuFlotante";

// El auricular con su flecha: relleno; la flecha, trazada (relleno se
// vería como un triángulo). El dibujo, el de lucide (PhoneOutgoing).
export function IconoLlamar({ size = 24 }) {
  const trazo = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="currentColor"
        {...trazo}
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      />
      <polyline fill="none" {...trazo} points="22 8 22 2 16 2" />
      <line {...trazo} x1="16" x2="22" y1="8" y2="2" />
    </svg>
  );
}

// El icono de WhatsApp, sólido, como se ve en los móviles: el globo en su
// verde y el auricular en blanco. Es su marca: así se reconoce sin texto.
export function IconoWhatsApp({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12.05" cy="11.9" r="11.2" fill={C.whatsapp} />
      <path fill={C.whatsapp} d="M.06 24l1.69-6.16 5.6 3.9z" />
      <path
        fill={C.blanco}
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
      />
    </svg>
  );
}

// En la fila de la lista: el auricular, del tamaño del círculo de la
// llegada (`lado`). Llama sin abrir la ficha.
export function BotonLlamar({ telefono, nombre, lado }) {
  return (
    <a
      href={enlaceLlamar(telefono)}
      aria-label={`Llamar a ${nombre}`}
      title={`Llamar a ${nombre} · ${telefonoParaVer(telefono)}`}
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: lado, height: lado, color: C.champanTinta }}
      onClick={(e) => e.stopPropagation()}
    >
      <IconoLlamar />
    </a>
  );
}

// Cada mensaje del menú de WhatsApp, con su icono (v82.4). El enlace
// personal al tablón (v85.2, él), además, con los colores al revés: dorado
// con letra verde, para que se distinga.
const ICONO_MENSAJE = { datos: ClipboardList, musica: Music, pagos: Wallet, enlace: KeyRound };
const ESTILO_MENSAJE = { enlace: { fondo: DORADO.fondo, color: C.ink } };

// El icono de WhatsApp, una sola pieza para la ficha abierta y para la fila
// de la lista (v85.2, él: «en la misma línea donde está el icono del
// teléfono cabe el del WhatsApp»; con la familia pagada la ficha ya no se
// abre y no se llegaba a los mensajes). `mensajes` (v82.4,
// lib/mensajesWhatsapp.js): si le toca alguno, abre un menú con ellos y
// «Mensaje libre»; elegido, se abre ya escrito. Sin ninguno, el chat
// directo: en el móvil, el enlace propio de WhatsApp y en la misma ventana
// (sin dejar una en blanco al volver, v82.7). `lado`: su cuadrado.
// `onMenu(abierto)`: avisa al abrir y al cerrar su menú, para que la fila
// de esa persona se marque y se vea a quién va el mensaje (v85.2, él).
export function BotonWhatsapp({ telefono, nombre, mensajes = [], lado = DEDO, onMenu }) {
  const abrir = (texto) => abrirWhatsApp({ telefono, mensaje: texto });
  const tactil = esAparatoTactil();
  const caja = { minWidth: lado, minHeight: lado, flexShrink: 0 };
  if (mensajes.length === 0) {
    return (
      <a
        href={tactil ? enlaceWhatsAppDirecto(telefono) : enlaceWhatsApp(telefono)}
        {...(tactil ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        aria-label={`Escribir a ${nombre} por WhatsApp`}
        title="WhatsApp"
        className="flex items-center justify-center"
        style={caja}
        onClick={(e) => e.stopPropagation()}
      >
        <IconoWhatsApp />
      </a>
    );
  }
  return (
    <MenuFlotante
      anchor="bottom-left"
      opciones={[
        ...mensajes.map((m) => ({ id: m.id, etiqueta: m.etiqueta, icono: ICONO_MENSAJE[m.id] || MessageCircle, ...ESTILO_MENSAJE[m.id], onClick: () => abrir(m.texto) })),
        { id: "libre", etiqueta: "Mensaje libre", icono: MessageCircle, onClick: () => abrir("") },
      ]}
      render={({ ref, open, toggle }) => (
        <>
          <button
            ref={ref}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            aria-label={`Escribir a ${nombre} por WhatsApp`}
            aria-expanded={open}
            title="WhatsApp: elegir mensaje"
            className="flex items-center justify-center"
            style={{ ...caja, background: "none", border: "none", padding: 0 }}
          >
            <IconoWhatsApp />
          </button>
          <AvisarMenu abierto={open} onMenu={onMenu} />
        </>
      )}
    />
  );
}

// El menú vive dentro de MenuFlotante: este hueco le cuenta a la fila si
// está abierto, sin cambiar nada mientras se dibuja.
function AvisarMenu({ abierto, onMenu }) {
  useEffect(() => {
    onMenu?.(abierto);
  }, [abierto, onMenu]);
  return null;
}

// En la ficha: WhatsApp a un lado y, del lado del pulgar, el auricular y el
// número (los dos, un solo enlace para llamar). Con la mano izquierda, en
// espejo: el número pegado al borde y el auricular después.
export function LineaContacto({ telefono, nombre, mensajes = [] }) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 zurdo:flex-row-reverse" style={{ background: C.champanClaro, borderRadius: R.caja }}>
      <BotonWhatsapp telefono={telefono} nombre={nombre} mensajes={mensajes} />
      <a
        href={enlaceLlamar(telefono)}
        aria-label={`Llamar a ${nombre}`}
        className="flex items-center gap-2 ml-auto zurdo:ml-0 zurdo:mr-auto zurdo:flex-row-reverse"
        style={{ color: C.champanTinta, minHeight: DEDO, fontWeight: 700, fontSize: T.destacado }}
      >
        <IconoLlamar />
        <span style={{ textDecoration: "underline", textDecorationColor: C.gold, textUnderlineOffset: 4 }}>{telefonoParaVer(telefono)}</span>
      </a>
    </div>
  );
}
