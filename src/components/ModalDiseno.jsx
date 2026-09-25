// El diseño de la app (CLAUDE.md) leído DENTRO de la app, desde
// "Mi cuenta" (usuario, 2026-09-24: "para poder consultar yo mismo").
//
// El texto se lee del propio CLAUDE.md al construir la app (`?raw`), así
// que no hay copia que se pueda quedar vieja: cada despliegue trae el
// documento del momento. Y va en su propio trozo (se carga con lazy() en
// MiCuenta.jsx): pesa lo suyo y solo se descarga al abrirlo.
//
// Todo plegado y una sola sección abierta (norma 6), con la misma pieza
// que el resto de la app (SeccionPlegable). El resumen de cada una es lo
// que pesa: así se ve de un vistazo dónde está el grueso.
import { useState } from "react";
import textoDiseno from "../../CLAUDE.md?raw";
import { C, R, T, OP } from "../theme";
import { ModalFlotante } from "./VentanaFlotante";
import { SeccionPlegable } from "./SeccionPlegable";
import { partirManual, bloques, trozosEnLinea } from "../lib/manual";
import sello from "../lib/manual-sello.json";

const manual = partirManual(textoDiseno);
const miles = (n) => n.toLocaleString("es-ES");

// La hora del último cambio del documento, en hora de Canarias. Sale de
// manual-sello.json (scripts/sellar-manual.mjs), no de la hora de
// construir la app: un despliegue sin tocar el documento no la mueve.
const cambiado = new Date(sello.cambiado).toLocaleString("es-ES", {
  timeZone: "Atlantic/Canary",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function EnLinea({ texto }) {
  return trozosEnLinea(texto).map((t, i) => {
    if (t.tipo === "negrita") return <b key={i} style={{ color: C.ink }}>{t.texto}</b>;
    if (t.tipo === "cursiva") return <i key={i}>{t.texto}</i>;
    if (t.tipo === "codigo")
      return (
        <code key={i} style={{ background: C.paperDark, padding: "0 4px", borderRadius: R.caja, fontSize: T.pequeno }}>
          {t.texto}
        </code>
      );
    return <span key={i}>{t.texto}</span>;
  });
}

function Texto({ texto }) {
  return bloques(texto).map((b, i) => {
    if (b.tipo === "titulo")
      return (
        <p key={i} className="font-semibold mt-3 mb-1" style={{ color: C.ink }}>
          <EnLinea texto={b.texto} />
        </p>
      );
    if (b.tipo === "codigo")
      return (
        <pre
          key={i}
          className="p-2 my-2 overflow-x-auto whitespace-pre"
          style={{ background: C.ink, color: C.paper, borderRadius: R.caja, fontSize: T.pequeno }}
        >
          {b.texto}
        </pre>
      );
    if (b.tipo === "ul" || b.tipo === "ol") {
      const Lista = b.tipo;
      return (
        <Lista key={i} className={`${b.tipo === "ul" ? "list-disc" : "list-decimal"} pl-5 my-2 space-y-1`}>
          {b.items.map((item, j) => (
            <li key={j}>
              <EnLinea texto={item} />
            </li>
          ))}
        </Lista>
      );
    }
    return (
      <p key={i} className="my-2">
        <EnLinea texto={b.texto} />
      </p>
    );
  });
}

export default function ModalDiseno({ onCerrar }) {
  // Una sola abierta: la clave de la que está abierta, o ninguna.
  const [abierta, setAbierta] = useState(null);
  const alternar = (clave) => setAbierta((a) => (a === clave ? null : clave));

  return (
    <ModalFlotante titulo="Diseño de la app" onCerrar={onCerrar}>
      <p style={{ color: C.ink, fontSize: T.destacado, fontWeight: 700 }}>
        El documento con el que se construye la app.
      </p>
      {/* Los dos sellos, en UNA línea (él, v45.5: en la cabecera se partían). */}
      <div className="flex gap-2 my-2">
        {[`${miles(manual.palabras)} palabras`, cambiado].map((s) => (
          <span
            key={s}
            className="px-2.5 py-0.5 whitespace-nowrap"
            style={{
              background: C.ink,
              color: C.goldClaro,
              border: `1px solid ${C.gold}`,
              borderRadius: R.redondo,
              fontSize: T.pequeno,
            }}
          >
            {s}
          </span>
        ))}
      </div>
      <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: OP.secundario }}>
        Se actualiza solo con cada versión.
      </p>
      <div className="flex flex-col gap-2 text-sm" style={{ color: C.charcoal }}>
        <SeccionPlegable
          titulo="Cómo está ordenado este archivo"
          resumen={`${miles(manual.encabezado.palabras)} palabras`}
          abierta={abierta === "encabezado"}
          onAlternar={() => alternar("encabezado")}
        >
          <Texto texto={manual.encabezado.texto} />
        </SeccionPlegable>
        {manual.partes.map((parte) => (
          <div key={parte.titulo} className="flex flex-col gap-2">
            <p className="mt-3" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600, fontSize: T.normal }}>
              {parte.titulo}
              <span className="ml-2 text-xs" style={{ fontFamily: "inherit", color: C.charcoal, opacity: OP.secundario, fontWeight: 400 }}>
                {parte.secciones.length} · {miles(parte.palabras)} palabras
              </span>
            </p>
            {parte.secciones.map((s) => (
              <SeccionPlegable
                key={s.num}
                titulo={`${s.num} ${s.titulo}`}
                resumen={`${miles(s.palabras)} palabras`}
                abierta={abierta === s.num}
                onAlternar={() => alternar(s.num)}
              >
                <Texto texto={s.texto} />
              </SeccionPlegable>
            ))}
          </div>
        ))}
      </div>
    </ModalFlotante>
  );
}
