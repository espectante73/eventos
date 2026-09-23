// Miniatura de una foto de matrimonio, compartida por la ventana
// Aniversarios y el formulario del colaborador (2026-09-17: el usuario pidió
// "que se vea igual que en Aniversarios, tocando encima y que permita
// preview"). Antes el formulario tenía su propio botón "Subir foto" y una
// miniatura cuadrada de 32px: dos maneras distintas de hacer lo mismo.
import { Image as IconoImagen } from "lucide-react";
import { C, R, T, OP } from "../theme";
import { BotonQuitar } from "./PreguntaSeguridad";

// El marco de TODAS las fotos de matrimonio: las miniaturas y las vistas en
// grande (Aniversarios y el formulario del colaborador). Pedido por el
// usuario el 2026-09-19: el verde de antes las hacía oscuras y poco
// atractivas; fondo champán, una línea dorada muy muy fina y aire entre la
// línea y la foto, como un paspartú. El champán es el del tema "Champán"
// de la Música (lib/temasMusica.js), ya aprobado, no uno nuevo.
// Una sola pieza: quien enseñe una de estas fotos usa esto, no su copia.
// El champán vive en la paleta (theme.js). Se reexporta porque varios
// archivos ya lo importaban de aquí.
export const CHAMPAN = C.champan;
export function estiloMarcoFoto(aire) {
  return {
    background: `linear-gradient(178deg, ${C.champan} 0%, ${C.champanHondo} 100%)`,
    border: `0.5px solid ${C.gold}`,
    padding: aire,
  };
}
const AIRE_MINIATURA = 5;

// Miniatura en 16:9, la forma de la pantalla del local (2026-09-17, a
// petición del usuario: "realmente es así como se van a mostrar"). Así, al
// subir una foto se ve ya cómo va a quedar proyectada.
// 59: la línea (0.5px) y el aire (5px) comen 11px de cada lado, y así la
// foto de dentro sigue en 16:9 (85x48).
export const ALTO_MINIATURA = 59;
export const ANCHO_MINIATURA = 96;
// Anchos fijos de las dos columnas de foto. Hacen falta para que los
// títulos "Boda" y "Aniversario" de la cabecera caigan justo encima de su
// recuadro: la de aniversario lleva a veces el botón de la papelera y la
// de boda nunca, así que sin un ancho fijo cada fila se descuadraría.
// ⚠️ Las dos columnas miden EXACTAMENTE lo mismo. En la primera versión la
// de aniversario era más ancha para dejar sitio al botón de la papelera, y
// el usuario lo cazó en una captura: "ANIV." no caía centrado como "BODA".
// La papelera pasó a ir encima de la miniatura (absoluta), así que ya no
// ocupa sitio y las dos columnas vuelven a ser gemelas.
// Algo más ancha que la miniatura: la cabecera pinta una banda por columna
// (como la Lista de invitados) y "ANIV." en negrita no cabía en 52px.
export const ANCHO_COL = ANCHO_MINIATURA + 12;

// Un recuadro de foto: la miniatura si la hay, o un hueco gris. El botón de
// subir es la propia etiqueta del <input file>, así se pulsa en cualquier
// punto del recuadro.
export function HuecoFoto({ titulo, enlace, ocupada, subiendo, onElegir, onQuitar, onVer, soloLectura, marca }) {
  const id = `foto-${titulo}-${Math.random().toString(36).slice(2, 8)}`;
  // Qué hace pinchar el recuadro (2026-09-17, a petición del usuario):
  //   - con foto ya visible -> la abre en grande (onVer); cambiarla se hace
  //     desde esa vista, no desde aquí.
  //   - vacío y editable -> elige archivo y la sube, como siempre.
  //   - vacío y de solo lectura (boda sin subir), o foto aún cargando su
  //     enlace -> no hace nada.
  const accion = enlace ? "ver" : !soloLectura && !ocupada ? "subir" : "nada";
  const Etiqueta = accion === "ver" ? "button" : accion === "subir" ? "label" : "div";
  return (
    <div className="flex justify-center" style={{ width: ANCHO_COL, flexShrink: 0 }}>
    <div className="relative" style={{ width: ANCHO_MINIATURA, height: ALTO_MINIATURA }}>
      <Etiqueta
        {...(accion === "ver" ? { type: "button", onClick: onVer } : {})}
        {...(accion === "subir" ? { htmlFor: id } : {})}
        title={accion === "ver" ? `${titulo} — ver en grande` : accion === "subir" ? `${titulo} — pulsa para subirla` : titulo}
        // Relieve de botón (.boton-3d) en todo lo que se puede pinchar: el
        // hueco de subir y cualquier foto que se pueda ver en grande. El de
        // boda vacío se queda plano: ahí pinchar no hace nada.
        className={`flex items-center justify-center rounded overflow-hidden${accion === "nada" ? "" : " boton-3d"}`}
        style={{
          width: ANCHO_MINIATURA,
          height: ALTO_MINIATURA,
          // Marco champán, línea dorada finísima y aire hasta la foto.
          // Vacío y sin nada que hacer (boda sin subir): el mismo champán,
          // apagado, para que se note que ahí no se pulsa.
          ...estiloMarcoFoto(AIRE_MINIATURA),
          ...(!enlace && soloLectura ? { opacity: OP.tenue } : {}),
          cursor: accion === "ver" ? "zoom-in" : accion === "subir" ? "pointer" : "default",
          ...(subiendo ? { opacity: OP.tenue } : {}),
          flexShrink: 0,
        }}
      >
        {enlace ? (
          <img
            src={enlace}
            alt={titulo}
            // "contain" y no "cover": si alguna foto no llega en 16:9 se ve
            // ENTERA con bandas, como aviso, en vez de recortarse sin avisar.
            // Si no llega en 16:9, las bandas salen en champán y no en verde.
            style={{ width: "100%", height: "100%", objectFit: "contain", background: CHAMPAN }}
          />
        ) : (
          <IconoImagen size={18} style={{ color: "#7A5C24", opacity: soloLectura ? OP.tenue : OP.secundario }} />
        )}
      </Etiqueta>
      {/* Aviso sobre la propia miniatura. Lo usa la columna Boda para "falta
          la plantilla": se ve la original del colaborador, pero todavía no
          la versión montada que irá a la pantalla. */}
      {marca && (
        <span
          className="absolute left-0 right-0 text-center uppercase pointer-events-none"
          style={{
            bottom: 4,
            fontSize: T.micro,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "#fff",
            background: "rgba(140,47,57,0.88)",
            margin: "0 4px",
            borderRadius: R.caja,
            lineHeight: "12px",
          }}
        >
          {marca}
        </span>
      )}
      {accion === "subir" && (
        <input
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            e.target.value = "";
            if (file) onElegir(file);
          }}
        />
      )}
      {/* Encima de la esquina de la miniatura, no al lado: así la columna
          mide siempre lo mismo haya foto o no, y los títulos de arriba
          siguen cayendo centrados. */}
      {!soloLectura && ocupada && (
        // yaPregunta: Aniversarios y el formulario del colaborador enseñan su
        // propia pregunta, con el nombre del matrimonio.
        <BotonQuitar
          borrar
          yaPregunta
          titulo={`Quitar ${titulo}`}
          onClick={onQuitar}
          style={{ position: "absolute", top: -8, right: -8 }}
        />
      )}
    </div>
    </div>
  );
}
