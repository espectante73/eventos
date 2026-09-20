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
import { Download } from "lucide-react";
import { C, R, T, OP, S } from "../../theme";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";
import { Boton, estilosBoton } from "../../components/Boton";
import { HuecoFoto, ANCHO_COL, ALTO_MINIATURA, estiloMarcoFoto } from "../../components/HuecoFoto";
import { Seal } from "../../components/Widgets";
import { matrimoniosDeInvitados } from "../../lib/matrimonios";
import {
  subirFotoMatrimonio,
  borrarFotoMatrimonio,
  enlacesTemporales,
  esRutaAlmacen,
  bytesDeFoto,
  nombreDescargaBoda,
  faltaParaEncargo,
  hojaDeEncargo,
  matrimoniosParaEncargo,
  CARPETA,
} from "../../lib/fotosAlmacen";
import { crearZip } from "../../lib/zip";
import { descargarBlob } from "../../lib/descargas";

// Aire entre las dos columnas, con un adorno en medio (ver Separador).
const SEPARACION_COLUMNAS = 44;

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
        borderRadius: `${R.caja}px ${R.caja}px 0 0`,
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
            // Más grande y en champán (2026-09-17): sobre el fondo dorado
            // de las filas, el rombo dorado de antes desaparecía.
            width: 11,
            height: 11,
            background: C.paper,
            boxShadow: S.sutil,
            transform: "rotate(45deg)",
            borderRadius: 1, // escala-libre: es un rombo de 11px, no una caja
          }}
        />
      )}
    </div>
  );
}

export function VentanaAniversarios({ data, onCerrar }) {
  const {
    invitados,
    evento,
    fotosFamiliares,
    fotosAniversario,
    fotosBodaFinal,
    fotosSinBoda,
    persistFotosAniversario,
    persistFotosBodaFinal,
  } = data;
  const [enlaces, setEnlaces] = useState({});
  // Al CAMBIAR una foto la ruta no cambia (el nombre de archivo es estable a
  // propósito), así que el efecto de abajo no se enteraría y el navegador
  // seguiría enseñando la vieja desde su caché. Este contador fuerza a pedir
  // enlaces nuevos, que llevan otra firma y por tanto otra dirección.
  const [recargaEnlaces, setRecargaEnlaces] = useState(0);
  const [subiendo, setSubiendo] = useState("");
  const [error, setError] = useState("");
  // Foto pendiente de quitar: { matrimonio, tipo }. Borra el archivo del
  // almacén de verdad, así que pide confirmación (usuario, 2026-09-17).
  const [porQuitar, setPorQuitar] = useState(null);
  // Foto abierta en grande: { matrimonio, tipo: "boda" | "aniversario", cual }.
  // En boda, `cual` es "final" (con plantilla) u "original" (colaborador).
  const [enGrande, setEnGrande] = useState(null);
  // Descarga de originales: null, o { sinAnio: [...] } esperando confirmar.
  const [avisoDescarga, setAvisoDescarga] = useState(null);
  const [descargando, setDescargando] = useState(false);

  const matrimonios = useMemo(
    () => matrimoniosDeInvitados(invitados, evento?.fecha),
    [invitados, evento?.fecha]
  );

  // Las dos fotos que gestiona el anfitrión desde aquí. La original de boda
  // no está: esa la sube el colaborador y aquí solo se mira y se descarga.
  const TIPOS = {
    aniversario: { mapa: fotosAniversario, guardar: persistFotosAniversario, carpeta: CARPETA.ANIVERSARIO, nombre: "de aniversario" },
    bodaFinal: { mapa: fotosBodaFinal, guardar: persistFotosBodaFinal, carpeta: CARPETA.BODA_FINAL, nombre: "de boda con plantilla" },
  };

  // Los enlaces del cajón cerrado caducan, así que se piden al abrir la
  // ventana y cada vez que cambia alguna ruta -- no se guardan en la base.
  const rutas = useMemo(
    () =>
      matrimonios
        .flatMap((m) => [fotosAniversario?.[m.familia], fotosBodaFinal?.[m.familia], fotosFamiliares?.[m.familia]])
        .filter(esRutaAlmacen),
    [matrimonios, fotosAniversario, fotosBodaFinal, fotosFamiliares]
  );
  useEffect(() => {
    let cancelado = false;
    enlacesTemporales(rutas).then((mapa) => {
      if (!cancelado) setEnlaces(mapa);
    });
    return () => {
      cancelado = true;
    };
  }, [rutas.join("|"), recargaEnlaces]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lo que va en el <img> para un valor guardado: enlace temporal si es una
  // ruta del cajón; tal cual si es una foto antigua en base64 o un enlace.
  const verFoto = (valor) => (esRutaAlmacen(valor) ? enlaces[valor] || "" : valor || "");

  const faltanAniversario = matrimonios.filter((m) => !fotosAniversario?.[m.familia]).length;
  // Los que no tienen foto de boda (marcado por el colaborador) no tienen
  // nada que montar: no cuentan como "falta la plantilla".
  const faltanPlantilla = matrimonios.filter((m) => !fotosBodaFinal?.[m.familia] && !fotosSinBoda?.[m.familia]).length;

  const subir = async (tipo, familia, file) => {
    const t = TIPOS[tipo];
    setError("");
    setSubiendo(`${tipo}:${familia}`);
    try {
      const ruta = await subirFotoMatrimonio(file, familia, t.carpeta);
      await t.guardar({ ...(t.mapa || {}), [familia]: ruta });
      setRecargaEnlaces((n) => n + 1);
    } catch (e) {
      setError(`No se pudo subir la foto ${t.nombre} de ${familia}. ${e?.message || ""}`.trim());
    }
    setSubiendo("");
  };

  const quitar = async (tipo, familia) => {
    const t = TIPOS[tipo];
    setError("");
    setSubiendo(`${tipo}:${familia}`);
    try {
      await borrarFotoMatrimonio(t.mapa?.[familia]);
      await t.guardar({ ...(t.mapa || {}), [familia]: "" });
    } catch (e) {
      setError(`No se pudo quitar la foto ${t.nombre} de ${familia}. ${e?.message || ""}`.trim());
    }
    setSubiendo("");
  };

  // Descarga en UN solo ZIP las ORIGINALES de boda que han subido los
  // colaboradores, cada una con "Familia - Esposo y Esposa - año.jpg", para
  // pasarlas por la plantilla con otra IA (usuario, 2026-09-17: un ZIP
  // porque Safari bloquea decenas de descargas seguidas).
  const conOriginal = matrimonios.filter((m) => fotosFamiliares?.[m.familia]);
  // La hoja de encargo solo se entrega con TODOS los datos recogidos: con un
  // año a medias la instrucción saldría mal y el error se repetiría en las
  // 48 (regla del usuario, 2026-09-17).
  const paraEncargo = matrimoniosParaEncargo(matrimonios, fotosSinBoda);
  const falta = faltaParaEncargo(paraEncargo, fotosFamiliares);
  const pedirDescarga = () => {
    setError("");
    if (conOriginal.length === 0) {
      setError("Todavía no hay fotos de boda subidas por los colaboradores.");
      return;
    }
    if (!falta.completo) setAvisoDescarga(falta);
    else descargarOriginales();
  };
  const descargarOriginales = async () => {
    setAvisoDescarga(null);
    setDescargando(true);
    const archivos = [];
    const fallidas = [];
    const usados = new Set();
    await Promise.all(
      conOriginal.map(async (m) => {
        const valor = fotosFamiliares[m.familia];
        try {
          const datos = await bytesDeFoto(valor, enlaces[valor]);
          let nombre = nombreDescargaBoda(m);
          // Dos matrimonios con la misma familia, nombres y año: no pisar.
          for (let i = 2; usados.has(nombre); i++) nombre = nombreDescargaBoda(m).replace(/\.jpg$/, ` (${i}).jpg`);
          usados.add(nombre);
          archivos.push({ nombre, datos });
        } catch (_) {
          fallidas.push(m.familia);
        }
      })
    );
    if (archivos.length > 0) {
      archivos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      if (falta.completo) {
        archivos.unshift({
          nombre: "Hoja de encargo.txt",
          datos: new TextEncoder().encode(hojaDeEncargo(paraEncargo)),
        });
      }
      descargarBlob("Fotos de boda originales.zip", new Blob([crearZip(archivos)], { type: "application/zip" }));
    }
    if (fallidas.length > 0) setError(`No se pudieron descargar ${fallidas.length}: ${fallidas.join(", ")}.`);
    setDescargando(false);
  };

  const accionesCabecera = (
    <Boton
      variante="secundario"
      oscuro
      icono={Download}
      titulo="Descargar en un solo archivo las fotos de boda originales, con su nombre y año"
      onClick={pedirDescarga}
      disabled={descargando}
    >
      {descargando ? "Preparando…" : "Originales"}
    </Boton>
  );

  const nombreMatrimonio = (m) => `${m.familia} — ${m.esposo.nombre} y ${m.esposa.nombre}`;

  return (
    <VentanaFlotante
      clave="aniversarios"
      titulo="Aniversarios"
      onCerrar={onCerrar}
      ancho="min(760px, calc(100vw - 48px))"
      extra={accionesCabecera}
      // Verde de la app debajo de las filas doradas, a petición del usuario
      // (2026-09-17): sobre marfil, el dorado quedaba apagado.
      fondoCuerpo={C.ink}
    >
      {/* Cabecera de columnas con el MISMO aspecto que la de la Lista de
          invitados (C.ink, filete dorado, una banda por columna), pegada al
          borde de arriba del cuerpo. Inmovilizada al desplazar: el cuerpo
          lleva p-4, así que márgenes negativos y `top: -16` (confirmado en
          pantalla real). 24px a los lados = 16 del cuerpo + 8 de cada fila. */}
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
          {/* En Boda el sello cuenta las que faltan por montar en la
              plantilla; en Aniv., las fotos de aniversario que faltan. */}
          <BandaCabecera aviso={faltanPlantilla}>Boda</BandaCabecera>
          <Separador adorno={false} />
          <BandaCabecera aviso={faltanAniversario}>Aniv.</BandaCabecera>
        </div>
      )}

      {error && (
        <p className="text-xs mb-2" style={{ color: C.avisoFondo }}>
          ⚠ {error}
        </p>
      )}

      {matrimonios.length === 0 && (
        <p className="text-sm italic" style={{ color: C.goldClaro, opacity: OP.secundario }}>
          Todavía no hay matrimonios: se forman marcando a alguien como esposo (O)
          y a su pareja como esposa (A) dentro de la misma familia.
        </p>
      )}

      {/* 10px entre filas: sobre el verde, las filas doradas se leían como
          un solo bloque. */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        {matrimonios.map((m) => {
          const original = fotosFamiliares?.[m.familia] || "";
          const final = fotosBodaFinal?.[m.familia] || "";
          const aniversario = fotosAniversario?.[m.familia] || "";
          return (
            <div
              key={m.clave}
              className="flex items-center gap-3 px-2 py-1 rounded"
              style={{
                // Dorado metálico con brillo en diagonal y canto (2026-09-17).
                background: "linear-gradient(135deg, #B8893F 0%, #E6C77F 38%, #D4AE5E 62%, #A97D34 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,244,214,0.55), inset 0 -1px 0 rgba(90,62,20,0.35), 0 2px 6px rgba(0,0,0,0.35)",
                minHeight: ALTO_MINIATURA + 10,
              }}
            >
              <div className="flex-1 min-w-0">
                {/* Una sola línea por fila: si no cabe se recorta. Fraunces,
                    la letra de los títulos de la app. */}
                <div
                  className="whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ color: C.ink, fontFamily: "'Fraunces', serif", fontSize: T.destacado }}
                >
                  <b>{m.familia}</b> — {m.esposo.nombre} y {m.esposa.nombre}
                </div>
                <div className="text-xs whitespace-nowrap" style={{ color: C.ink, opacity: OP.secundario }}>
                  {m.anioBoda || "sin año"}
                  {m.aniversario != null && ` · ${m.aniversario} años`}
                </div>
              </div>
              {/* Columna Boda: enseña la terminada (con plantilla) si ya está;
                  si no, la original del colaborador con la marca "sin
                  plantilla". La papelera solo quita la terminada: la
                  original es del colaborador y se conserva. */}
              <HuecoFoto
                titulo="Boda"
                enlace={verFoto(final || original)}
                ocupada={Boolean(final)}
                soloLectura={!final}
                // "No tienen": el colaborador marcó que ese matrimonio no
                // tiene foto de boda. Así se sabe que no falta, que no hay.
                marca={!final && original ? "Sin plantilla" : !original && fotosSinBoda?.[m.familia] ? "No tienen" : ""}
                subiendo={subiendo === `bodaFinal:${m.familia}`}
                onQuitar={() => setPorQuitar({ matrimonio: m, tipo: "bodaFinal" })}
                onVer={() => setEnGrande({ matrimonio: m, tipo: "boda", cual: final ? "final" : "original" })}
              />
              <Separador />
              <HuecoFoto
                titulo="Aniversario"
                enlace={verFoto(aniversario)}
                ocupada={Boolean(aniversario)}
                subiendo={subiendo === `aniversario:${m.familia}`}
                onElegir={(file) => subir("aniversario", m.familia, file)}
                onQuitar={() => setPorQuitar({ matrimonio: m, tipo: "aniversario" })}
                onVer={() => setEnGrande({ matrimonio: m, tipo: "aniversario" })}
              />
            </div>
          );
        })}
      </div>

      {/* Vista en grande, en 16:9 como en la pantalla del local. */}
      {enGrande &&
        (() => {
          const m = enGrande.matrimonio;
          const esBoda = enGrande.tipo === "boda";
          const original = fotosFamiliares?.[m.familia] || "";
          const final = fotosBodaFinal?.[m.familia] || "";
          const valor = esBoda ? (enGrande.cual === "final" ? final : original) : fotosAniversario?.[m.familia];
          const tipoSubida = esBoda ? "bodaFinal" : "aniversario";
          const idInput = `aniversarios-subir-${tipoSubida}`;
          const titulo = esBoda
            ? `Boda (${enGrande.cual === "final" ? "con plantilla" : "original"}) — ${m.esposo.nombre} y ${m.esposa.nombre}`
            : `Aniversario — ${m.esposo.nombre} y ${m.esposa.nombre}`;
          const textoSubir = esBoda ? (final ? "Cambiar con plantilla" : "Subir con plantilla") : "Cambiar foto";
          return (
            <ModalFlotante
              titulo={titulo}
              onCerrar={() => setEnGrande(null)}
              ancho={960}
              acciones={
                <>
                  {/* Es un <label> y no un <Boton>: tiene que disparar el
                      <input type="file"> de al lado. Se le clava el mismo
                      aspecto con estilosBoton para que no desafine. */}
                  <label
                    htmlFor={idInput}
                    className="boton-3d inline-flex items-center justify-center font-medium cursor-pointer"
                    style={estilosBoton("principal", "normal")}
                  >
                    {textoSubir}
                  </label>
                  <input
                    id={idInput}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      e.target.value = "";
                      if (!file) return;
                      setEnGrande(null);
                      subir(tipoSubida, m.familia, file);
                    }}
                  />
                  {/* Comparar la original con la montada, sin salir. */}
                  {esBoda && final && original && (
                    <Boton onClick={() => setEnGrande({ ...enGrande, cual: enGrande.cual === "final" ? "original" : "final" })}>
                      {enGrande.cual === "final" ? "Ver original" : "Ver con plantilla"}
                    </Boton>
                  )}
                </>
              }
            >
              <div
                style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: R.caja, overflow: "hidden", ...estiloMarcoFoto(10) }}
              >
                <img
                  src={verFoto(valor)}
                  alt={titulo}
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </div>
            </ModalFlotante>
          );
        })()}

      {porQuitar && (
        <ModalFlotante
          titulo="¿Quitar la foto?"
          onCerrar={() => setPorQuitar(null)}
          // La mitad del ancho normal: es una pregunta de una línea.
          ancho={360}
          acciones={
            <>
              <Boton
                variante="peligro"
                onClick={() => {
                  const { matrimonio, tipo } = porQuitar;
                  setPorQuitar(null);
                  quitar(tipo, matrimonio.familia);
                }}
              >
                Sí, quitarla
              </Boton>
              <Boton onClick={() => setPorQuitar(null)}>Cancelar</Boton>
            </>
          }
        >
          <p className="text-sm" style={{ color: C.charcoal }}>
            Se borrará la foto {TIPOS[porQuitar.tipo].nombre} de <b>{nombreMatrimonio(porQuitar.matrimonio)}</b>.
            {porQuitar.tipo === "bodaFinal" && " La original se conserva."}
          </p>
        </ModalFlotante>
      )}

      {avisoDescarga && (
        <ModalFlotante
          titulo="Faltan datos por recoger"
          onCerrar={() => setAvisoDescarga(null)}
          ancho={460}
          acciones={
            <>
              <Boton variante="principal" onClick={descargarOriginales}>
                Descargar solo las fotos
              </Boton>
              <Boton onClick={() => setAvisoDescarga(null)}>Cancelar</Boton>
            </>
          }
        >
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            La hoja de encargo no se puede preparar todavía: llevaría instrucciones
            incompletas y ese fallo se repetiría en todas las fotos.
          </p>
          {avisoDescarga.sinAnio.length > 0 && (
            <>
              <p className="text-sm font-medium" style={{ color: C.ink }}>
                Sin año de boda ({avisoDescarga.sinAnio.length}):
              </p>
              <ul className="text-sm list-disc pl-5 mb-3" style={{ color: C.charcoal }}>
                {avisoDescarga.sinAnio.slice(0, 8).map((m) => (
                  <li key={m.clave}>{nombreMatrimonio(m)}</li>
                ))}
                {avisoDescarga.sinAnio.length > 8 && <li>…y {avisoDescarga.sinAnio.length - 8} más.</li>}
              </ul>
            </>
          )}
          {avisoDescarga.sinFoto.length > 0 && (
            <>
              <p className="text-sm font-medium" style={{ color: C.ink }}>
                Sin foto de boda ({avisoDescarga.sinFoto.length}):
              </p>
              <ul className="text-sm list-disc pl-5" style={{ color: C.charcoal }}>
                {avisoDescarga.sinFoto.slice(0, 8).map((m) => (
                  <li key={m.clave}>{nombreMatrimonio(m)}</li>
                ))}
                {avisoDescarga.sinFoto.length > 8 && <li>…y {avisoDescarga.sinFoto.length - 8} más.</li>}
              </ul>
            </>
          )}
        </ModalFlotante>
      )}

    </VentanaFlotante>
  );
}
