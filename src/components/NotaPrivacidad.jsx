// La nota de privacidad del tablón, escrita por el usuario (Benito
// Fariña) y cerrada con él el 2026-09-21.
//
// ⚠️ ESTE ARCHIVO ES EL TEXTO. No hay otra copia: `textos/nota-privacidad-tablon.md`
// solo guarda la historia de las decisiones y apunta aquí. Dos copias de
// un mismo texto derivan siempre (ya pasó con los rojos y con los
// tamaños de letra).
//
// ⚠️ LA NOTA MANDA SOBRE LA APP, no al revés. La casilla "Autorizo
// expresamente a que guarden mis datos" (v39.2) y el respeto del Borrado
// total existen porque este texto lo promete. Igual que "se borra si
// cambian de idea" con la foto de boda. Al tocar una frase de aquí, hay
// que comprobar que la app la siga cumpliendo.
//
// ⚠️ Trato: TÚ en singular, USTEDES en plural. Nunca "vosotros" (ver
// CLAUDE.md). Y TODO en tercera persona: "el anfitrión", "se guarda" --
// decisión expresa suya, nada de "yo" ni "guardo".
//
// Contexto, para quien lo lea dentro de meses: el RGPD NO le aplica
// (art. 2.2.c, actividad exclusivamente personal o doméstica). Esta nota
// es deferencia con sus amigos, no una obligación legal.
import { C, OP, T } from "../theme";
import { ModalFlotante } from "./VentanaFlotante";

function Parrafo({ titulo, children }) {
  return (
    <p className="text-sm mb-3" style={{ color: C.charcoal, lineHeight: 1.55 }}>
      {titulo && <b style={{ color: C.ink }}>{titulo}</b>}
      {titulo && " "}
      {children}
    </p>
  );
}

export function NotaPrivacidad({ onCerrar }) {
  return (
    <ModalFlotante titulo="Tus datos, en claro" onCerrar={onCerrar} ancho={520}>
      <Parrafo>
        Los datos que le diste a tu colaborador los gestiona Benito Fariña, el anfitrión, para
        organizar este evento. Es un evento privado, sin ánimo de lucro: el pago de la entrada es
        únicamente para cubrir los gastos de organización y para pagar los servicios de los
        profesionales contratados.
      </Parrafo>
      <Parrafo titulo="Qué se guarda:">
        tu nombre y apellidos, tu zona, si has pagado, tu mesa y si llegaste el día del evento, tu
        email, tu año de nacimiento, tu año de boda, una canción, alergias y observaciones. De los
        matrimonios invitados, la foto de su boda.
      </Parrafo>
      <Parrafo titulo="Para qué:">
        para saber cuántos invitados vienen, cómo sentarles, avisarles de las novedades, mandarles
        la invitación y que la cocina tenga en cuenta las alergias.
      </Parrafo>
      <Parrafo titulo="Las alergias">
        se piden solo para la cocina: si prefieres no decirlas, no pasa nada.
      </Parrafo>
      <Parrafo titulo="Quién lo ve:">
        el anfitrión y el colaborador que te atiende. Ningún colaborador ve los invitados de otro.
      </Parrafo>
      <Parrafo titulo="Dónde están los datos:">
        en servicios que trabajan por encargo del anfitrión (la base de datos, la web y el envío de
        correos). No se venden, no se ceden a terceros con fines comerciales ni se usan para
        publicidad.
      </Parrafo>
      <Parrafo titulo="Cuánto tiempo:">
        hasta 3 meses después del evento. Después se eliminarán, salvo que tú autorices expresamente
        que se guarden para otra ocasión. En ese caso, el colaborador te lo preguntará y dejará
        constancia de tu autorización.
      </Parrafo>
      <Parrafo titulo="Las fotos de boda:">
        en «Las bodas de todos» se verán las bodas de todos en sus fotos de boda. Esa es la razón
        por la que se piden: para mostrarlas. Si prefieren que la suya no se vea, basta con no
        darla, y si ya la dieron y cambian de idea, díganselo al colaborador y se borra.
      </Parrafo>
      <Parrafo titulo="Al entrar en este tablón">
        se guarda tu nombre y un código del aparato desde el que entras, solo para detectar accesos
        raros. No se guarda tu dirección de internet.
      </Parrafo>
      <p className="text-sm" style={{ color: C.charcoal, lineHeight: 1.55 }}>
        <b style={{ color: C.ink }}>Lo que puedes pedir:</b> gestionar tus datos a través del
        colaborador y él se los trasladará al anfitrión.
      </p>
      <p className="mt-4" style={{ color: C.charcoal, opacity: OP.tenue, fontSize: T.pequeno }}>
        Esta nota se escribe por deferencia con los invitados, no por obligación: es un evento
        privado entre conocidos.
      </p>
    </ModalFlotante>
  );
}
