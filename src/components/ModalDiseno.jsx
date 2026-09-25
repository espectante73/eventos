// El diseño de la app (CLAUDE.md) leído DENTRO de la app, desde
// "Mi cuenta" (usuario, 2026-09-24: "para poder consultar yo mismo").
//
// El texto se lee del propio CLAUDE.md al construir la app (`?raw`), así
// que no hay copia que se pueda quedar vieja: cada despliegue trae el
// documento del momento. Y va en su propio trozo (se carga con lazy() en
// MiCuenta.jsx): pesa lo suyo y solo se descarga al abrirlo.
//
// Todo plegado y una sola sección abierta (norma 5), con la misma pieza
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

// La Parte 1, en dos líneas: "PARTE 1 — 12 secciones" y debajo "63
// reglas que hay que obedecer siempre" (él, v46). La Parte 2, en una:
// "PARTE 2 — 10 trampas ya pagadas". Las cifras se cuentan solas.
function cabeceraDeParte(parte) {
  const [cabeza, resto = ""] = parte.titulo.split(" — ");
  const nombre = resto.charAt(0).toLowerCase() + resto.slice(1);
  const n = parte.secciones.length;
  if (nombre.startsWith("trampas")) return { titulo: `${cabeza} — ${n} ${nombre}`, debajo: null };
  return { titulo: `${cabeza} — ${n} secciones`, debajo: `${parte.reglas} ${nombre}` };
}

// La hora del último cambio del documento, en hora de Canarias. Sale de
// manual-sello.json (scripts/sellar-manual.mjs), no de la hora de
// construir la app: un despliegue sin tocar el documento no la mueve.
// Lo que subió o bajó HOY ("hoy +24", "hoy −18"): la señal de que el
// documento engorda. Sale del sello (scripts/sellar-manual.mjs), que
// cuenta por días en hora de Canarias; si hoy no se ha tocado, no sale.
export function diferenciaDeHoy(sello, ahora = new Date()) {
  const hoy = ahora.toLocaleDateString("sv-SE", { timeZone: "Atlantic/Canary" });
  const cambio = (sello.palabras ?? 0) - (sello.palabrasInicioDia ?? sello.palabras ?? 0);
  if (sello.dia !== hoy || cambio === 0) return "";
  return ` (hoy ${cambio > 0 ? "+" : "−"}${miles(Math.abs(cambio))})`;
}

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

// Una lista, y dentro de cada punto su propia lista con sangría (norma 4,
// norma 11). `start`: una lista numerada sigue desde su número real.
function Lista({ lista, dentro = false }) {
  const Etiqueta = lista.tipo;
  const estilo = lista.tipo === "ul" ? (dentro ? "list-[circle]" : "list-disc") : "list-decimal";
  return (
    <Etiqueta start={lista.tipo === "ol" ? lista.inicio : undefined} className={`${estilo} pl-5 my-2 space-y-1`}>
      {lista.items.map((item, j) => (
        <li key={j}>
          <EnLinea texto={item.texto} />
          {item.sub && <Lista lista={item.sub} dentro />}
          {item.despues && (
            <p className="mt-1">
              <EnLinea texto={item.despues} />
            </p>
          )}
        </li>
      ))}
    </Etiqueta>
  );
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
    if (b.tipo === "ul" || b.tipo === "ol") return <Lista key={i} lista={b} />;
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
        Documento para construir la app
      </p>
      {/* Los dos sellos, en UNA línea (él, v45.5: en la cabecera se partían). */}
      <div className="flex gap-2 my-2">
        {[`${miles(manual.palabras)} palabras${diferenciaDeHoy(sello)}`, cambiado].map((s) => (
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
            <div className="mt-3">
              <p style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600, fontSize: T.normal }}>
                {cabeceraDeParte(parte).titulo}
                <span className="ml-2 text-xs" style={{ fontFamily: "inherit", color: C.charcoal, opacity: OP.secundario, fontWeight: 400 }}>
                  · {miles(parte.palabras)} palabras
                </span>
              </p>
              {cabeceraDeParte(parte).debajo && (
                <p style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontSize: T.normal }}>
                  {cabeceraDeParte(parte).debajo}
                </p>
              )}
            </div>
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
