// La nota de privacidad del tablón, en una ventana.
//
// El TEXTO no vive aquí: vive en `evento."notaPrivacidad"` y se edita
// desde Configuración → Datos del evento (permiso "Editar los datos del
// evento", elegido por el usuario el 2026-09-21 entre tres opciones —
// la nota dice su nombre, sus plazos y lo que se compromete a hacer con
// los datos de la gente, así que no es cosa de quien escribe las
// novedades). El valor por defecto está en constants.js.
//
// ⚠️ LA NOTA MANDA SOBRE LA APP. La casilla "Autorizo expresamente a que
// guarden mis datos", el respeto del Borrado total y el borrado de una
// foto de boda ya entregada existen porque este texto lo promete. Si
// alguien lo reescribe prometiendo otra cosa, la app no se entera.
//
// El HTML lo escribe el anfitrión (o un colaborador con ese permiso
// concreto), igual que las novedades y las plantillas de email: no es
// contenido de terceros.
import { C, OP, T } from "../theme";
import { ModalFlotante } from "./VentanaFlotante";
import { NOTA_PRIVACIDAD_POR_DEFECTO, TITULO_NOTA_PRIVACIDAD } from "../constants";

export function NotaPrivacidad({ evento, onCerrar }) {
  const texto = String(evento?.notaPrivacidad || "").trim() || NOTA_PRIVACIDAD_POR_DEFECTO;
  return (
    <ModalFlotante titulo={TITULO_NOTA_PRIVACIDAD} onCerrar={onCerrar} ancho={520}>
      <div
        className="text-sm"
        style={{ color: C.charcoal, lineHeight: 1.55, whiteSpace: "pre-wrap" }}
        dangerouslySetInnerHTML={{ __html: texto }}
      />
      <p className="mt-4" style={{ color: C.charcoal, opacity: OP.tenue, fontSize: T.pequeno }}>
        Esta nota se escribe por deferencia con los invitados, no por obligación: es un evento
        privado entre conocidos.
      </p>
    </ModalFlotante>
  );
}
