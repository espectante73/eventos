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
import { matrimoniosDeInvitados } from "../../lib/matrimonios";
import { subirFotoMatrimonio, borrarFotoMatrimonio, enlacesTemporales } from "../../lib/fotosAlmacen";

const LADO_MINIATURA = 52;

// Un recuadro de foto: la miniatura si la hay, o un hueco gris. El botón de
// subir es la propia etiqueta del <input file>, así se pulsa en cualquier
// punto del recuadro.
function Hueco({ titulo, enlace, ocupada, subiendo, onElegir, onQuitar, soloLectura }) {
  const id = `foto-${titulo}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="flex items-center gap-1">
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
      {!soloLectura && ocupada && (
        <button onClick={onQuitar} title={`Quitar ${titulo}`} className="boton-3d rounded-full p-1" style={{ color: C.wax }}>
          <Trash2 size={12} />
        </button>
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
    <VentanaFlotante clave="aniversarios" titulo="Aniversarios" onCerrar={onCerrar} ancho="min(760px, calc(100vw - 48px))">
      <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: 0.75 }}>
        Una fila por matrimonio. La foto de boda la sube el colaborador en su
        formulario; la de aniversario, tú. Se guardan reducidas a 1080 y solo
        las ve quien haya entrado en la app.
      </p>
      <p className="text-sm mb-3" style={{ color: C.ink, fontFamily: "'Fraunces', serif", fontWeight: 700 }}>
        {hechas} de {matrimonios.length} hechas
      </p>

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
