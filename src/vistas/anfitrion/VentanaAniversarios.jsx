// Ventana "Aniversarios": el sitio donde el anfitrión carga las fotos de
// cada matrimonio (2026-09-17).
//
// ⚠️ Por qué existe, si la regla de la app es que la Lista de invitados es
// la raíz y una vista que solo reordena es un duplicado (ver CLAUDE.md): la
// ventana "Matrimonios" se quitó justo por eso -- filtrando la lista por rol
// O ya salía una fila por pareja. Esta NO es una vista de lo mismo: es una
// zona de TRABAJO para una tarea que la lista no sabe hacer, cargar ~50
// fotos a lo largo de varias semanas, mirando una por una de quién es cada
// cual. El usuario lo pidió así explícitamente después de descartar dos
// alternativas: un panel dentro de la celda de la lista ("mucho lío") y
// soltar la carpeta entera de golpe ("tengo que estar renombrando, es un
// jaleo... tengo que escogerla, ubicarla").
//
// Las fotos NO se guardan en la base, sino en el cajón cerrado
// "fotos-matrimonios" (ver lib/fotosAlmacen.js). Aquí solo se manejan rutas
// y enlaces temporales.
import { useEffect, useMemo, useState } from "react";
import { Trash2, Image as IconoImagen } from "lucide-react";
import { C } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Seal } from "../../components/Widgets";
import { matrimoniosDeInvitados } from "../../lib/matrimonios";
import { subirFotoMatrimonio, borrarFotoMatrimonio, enlacesTemporales } from "../../lib/fotosAlmacen";

const LADO_MINIATURA = 52;
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
const ANCHO_COL = LADO_MINIATURA + 16;
// Aire entre las dos columnas, con un adorno en medio (ver Separador).
const SEPARACION_COLUMNAS = 44;

// Un recuadro de foto: la miniatura si la hay, o un hueco gris. El botón de
// subir es la propia etiqueta del <input file>, así se pulsa en cualquier
// punto del recuadro.
function Hueco({ titulo, enlace, ocupada, subiendo, onElegir, onQuitar, soloLectura }) {
  const id = `foto-${titulo}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="flex justify-center" style={{ width: ANCHO_COL, flexShrink: 0 }}>
    <div className="relative" style={{ width: LADO_MINIATURA, height: LADO_MINIATURA }}>
      <label
        htmlFor={soloLectura ? undefined : id}
        title={soloLectura ? titulo : `${titulo} — pulsa para ${ocupada ? "cambiarla" : "subirla"}`}
        className="flex items-center justify-center rounded overflow-hidden"
        style={{
          width: LADO_MINIATURA,
          height: LADO_MINIATURA,
          border: `1px solid ${ocupada ? C.line : C.charcoal}`,
          background: ocupada ? C.paper : C.paperDark,
          cursor: soloLectura ? "default" : "pointer",
          opacity: subiendo ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        {enlace ? (
          <img src={enlace} alt={titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <IconoImagen size={18} style={{ color: C.charcoal, opacity: 0.45 }} />
        )}
      </label>
      {!soloLectura && (
        <input
          id={id}
          type="file"
          accept="image/*"
          className="hidden"
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
        <button
          onClick={onQuitar}
          title={`Quitar ${titulo}`}
          className="boton-3d rounded-full absolute flex items-center justify-center"
          style={{ top: -6, right: -6, width: 19, height: 19, background: C.wax, color: "#fff" }}
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
    </div>
  );
}

// Una columna de la cabecera: misma banda clara con esquinas redondeadas
// arriba que la Lista de invitados (tintaColumnaCabecera en
// SeccionInvitados.jsx), para que se vea que la columna baja hasta las filas.
function BandaCabecera({ children, aviso = 0 }) {
  return (
    <div
      className="relative flex items-center justify-center text-sm font-bold uppercase py-2"
      style={{
        width: ANCHO_COL,
        flexShrink: 0,
        color: C.goldClaro,
        background: "rgba(255,255,255,0.07)",
        borderRadius: "6px 6px 0 0",
      }}
    >
      {children}
      {/* El mismo sello rojo con número que avisa de los invitados sin
          atender de cada colaborador (Seal, en ColaboradorCard). Aquí
          cuenta las fotos de aniversario que FALTAN, y como Seal no pinta
          nada con 0, desaparece solo cuando están todas. Sustituye a los
          cuatro recuadros de resumen de la v30.5, a petición del usuario. */}
      {aviso > 0 && (
        <span className="absolute" style={{ top: -6, right: -8 }}>
          <Seal count={aviso} size={20} />
        </span>
      )}
    </div>
  );
}

// El adorno entre las dos columnas: un rombo pequeño en dorado. Pedido por
// el usuario ("alguna figura, algo sencillo que adorne... una pequeña
// separación"). Ocupa una columna propia de ancho fijo, así que la
// cabecera y las filas se alinean solas sin cuentas.
function Separador({ adorno = true }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: SEPARACION_COLUMNAS, flexShrink: 0, alignSelf: "stretch" }}
    >
      {adorno && (
        <div
          style={{
            width: 7,
            height: 7,
            background: C.gold,
            opacity: 0.55,
            transform: "rotate(45deg)",
            borderRadius: 1,
          }}
        />
      )}
    </div>
  );
}

export function VentanaAniversarios({ data, onCerrar }) {
  const { invitados, evento, fotosFamiliares, fotosAniversario, persistFotosAniversario } = data;
  const [enlaces, setEnlaces] = useState({});
  const [subiendo, setSubiendo] = useState("");
  const [error, setError] = useState("");

  const matrimonios = useMemo(
    () => matrimoniosDeInvitados(invitados, evento?.fecha),
    [invitados, evento?.fecha]
  );

  // Los enlaces del cajón cerrado caducan, así que se piden al abrir la
  // ventana y cada vez que cambia alguna ruta -- no se guardan en la base.
  const rutas = useMemo(
    () => matrimonios.map((m) => fotosAniversario?.[m.familia]).filter(Boolean),
    [matrimonios, fotosAniversario]
  );
  useEffect(() => {
    let cancelado = false;
    enlacesTemporales(rutas).then((mapa) => {
      if (!cancelado) setEnlaces(mapa);
    });
    return () => {
      cancelado = true;
    };
  }, [rutas.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const hechas = matrimonios.filter((m) => fotosAniversario?.[m.familia]).length;
  const faltan = matrimonios.length - hechas;

  const subir = async (familia, file) => {
    setError("");
    setSubiendo(familia);
    try {
      const ruta = await subirFotoMatrimonio(file, familia, "aniversario");
      await persistFotosAniversario({ ...(fotosAniversario || {}), [familia]: ruta });
    } catch (e) {
      setError(`No se pudo subir la foto de ${familia}. ${e?.message || ""}`.trim());
    }
    setSubiendo("");
  };

  const quitar = async (familia) => {
    setError("");
    setSubiendo(familia);
    try {
      await borrarFotoMatrimonio(fotosAniversario?.[familia]);
      await persistFotosAniversario({ ...(fotosAniversario || {}), [familia]: "" });
    } catch (e) {
      setError(`No se pudo quitar la foto de ${familia}. ${e?.message || ""}`.trim());
    }
    setSubiendo("");
  };

  return (
    <VentanaFlotante
      clave="aniversarios"
      titulo="Aniversarios"
      onCerrar={onCerrar}
      ancho="min(760px, calc(100vw - 48px))"
    >
      {/* Cabecera de columnas con el MISMO aspecto que la de la Lista de
          invitados (C.ink, filete dorado, una banda por columna), pegada al
          borde de arriba del cuerpo para que se lea como la cabecera de la
          propia tabla. El usuario lo señaló con la lista delante: la primera
          versión era un rótulo gris suelto, separado de las filas.
          Inmovilizada al desplazar. El cuerpo de VentanaFlotante lleva p-4:
          los márgenes negativos la estiran de borde a borde, y `top: -16`
          la pega arriba del todo en vez de dejar esos 16px de hueco. Lleva
          los mismos 24px a los lados (16 del cuerpo + 8 de cada fila) para
          que las columnas caigan sobre las de las filas. */}
      {matrimonios.length > 0 && (
        <div
          className="flex gap-3"
          style={{
            position: "sticky",
            top: -16,
            zIndex: 2,
            background: C.ink,
            borderBottom: `1px solid ${C.gold}`,
            margin: "-16px -16px 8px",
            padding: "8px 24px 0",
            alignItems: "stretch",
          }}
        >
          <div
            className="flex-1 flex items-center text-sm font-bold uppercase pb-2"
            style={{ color: C.goldClaro }}
          >
            Matrimonio
          </div>
          <BandaCabecera>Boda</BandaCabecera>
          <Separador adorno={false} />
          <BandaCabecera aviso={faltan}>Aniv.</BandaCabecera>
        </div>
      )}

      {error && (
        <p className="text-xs mb-2" style={{ color: C.wax }}>
          ⚠ {error}
        </p>
      )}

      {matrimonios.length === 0 && (
        <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
          Todavía no hay matrimonios: se forman marcando a alguien como esposo (O)
          y a su pareja como esposa (A) dentro de la misma familia.
        </p>
      )}

      <div className="flex flex-col gap-1">
        {matrimonios.map((m) => (
          <div
            key={m.clave}
            className="flex items-center gap-3 px-2 py-1 rounded"
            style={{ background: C.paperDark, minHeight: LADO_MINIATURA + 10 }}
          >
            <div className="flex-1 min-w-0">
              {/* Una sola línea por fila, como el resto de tablas de la app:
                  si no cabe se recorta, nunca se parte en dos. */}
              <div className="text-sm whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: C.ink }}>
                {/* Los dos nombres, no solo el del cabeza de familia: a
                    petición del usuario, 2026-09-17 ("Benito y Meritxell").
                    Sigue siendo una sola línea -- si no cabe, se recorta. */}
                <b>{m.familia}</b> — {m.esposo.nombre} y {m.esposa.nombre}
              </div>
              <div className="text-xs whitespace-nowrap" style={{ color: C.charcoal, opacity: 0.7 }}>
                {m.anioBoda || "sin año"}
                {m.aniversario != null && ` · ${m.aniversario} años`}
              </div>
            </div>
            <Hueco
              titulo="Boda"
              enlace={fotosFamiliares?.[m.familia] || ""}
              ocupada={Boolean(fotosFamiliares?.[m.familia])}
              soloLectura
            />
            <Separador />
            <Hueco
              titulo="Aniversario"
              enlace={enlaces[fotosAniversario?.[m.familia]] || ""}
              ocupada={Boolean(fotosAniversario?.[m.familia])}
              subiendo={subiendo === m.familia}
              onElegir={(file) => subir(m.familia, file)}
              onQuitar={() => quitar(m.familia)}
            />
          </div>
        ))}
      </div>
    </VentanaFlotante>
  );
}
