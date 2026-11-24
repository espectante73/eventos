// El cuerpo de la noticia «De dónde venimos» en el tablón (v73, él, boceto
// aprobado): las zonas de los confirmados, dos por línea y en orden
// alfabético, cada una con cuántos vienen; la del propio invitado, en
// verde; y al pie, el total.
// Tocando una zona, sus familias (v99.9, él: boceto 2, «como la invitación»):
// «Abreu: Luis y Ana», debajo de su línea y a todo lo ancho. Una abierta a la
// vez (norma 5): la tocada, en dorado. Si el servidor aún no manda las
// familias, las zonas se quedan como antes, sin abrirse.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { C, DORADO, OP } from "../theme";
import { listaConY } from "../lib/formato";
import { Cargando } from "../components/Cargando";
import { deDosEnDos, familiasDeZona, ordenarZonas, pieNinos, pieZonas } from "../lib/zonasTablon";

// Una línea del pie, en gris, con las cantidades en negrita como las de las
// zonas (v84, él): los números de `partes` son cantidades.
function LineaPie({ partes, className }) {
  return (
    <p className={`text-xs ${className}`} style={{ color: C.charcoal }}>
      {partes.map((parte, i) =>
        typeof parte === "number" ? (
          <b key={i} style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>
            {parte}
          </b>
        ) : (
          <span key={i} style={{ opacity: OP.secundario }}>
            {parte}
          </span>
        )
      )}
    </p>
  );
}

// Una zona: su nombre y cuántos vienen. Si tiene familias, se toca para
// verlas (con su flechita).
function PastillaZona({ zona, tuya, abierta, onTocar }) {
  const estilo = {
    background: abierta ? DORADO.fondo : tuya ? C.ink : C.paper,
    boxShadow: abierta ? DORADO.relieve : undefined,
    color: abierta || !tuya ? C.ink : C.paper,
    border: `1px solid ${abierta ? C.gold : tuya ? C.ink : C.line}`,
  };
  const clases = "w-full flex items-center justify-between gap-2 rounded-full px-3 py-1.5 min-w-0 text-sm";
  const cifra = <b style={{ fontFamily: "'Fraunces', serif" }}>{zona.confirmados}</b>;
  if (!onTocar) {
    return (
      <span className={clases} style={estilo}>
        <span className="truncate">{zona.zona}</span>
        {cifra}
      </span>
    );
  }
  return (
    <button type="button" onClick={onTocar} aria-expanded={abierta} className={clases} style={estilo}>
      <span className="truncate">{zona.zona}</span>
      <span className="flex items-center gap-1 flex-shrink-0">
        {cifra}
        <ChevronDown size={14} style={{ opacity: OP.secundario, transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </span>
    </button>
  );
}

// Quién viene de la zona tocada. Una línea por familia; si una muy larga no
// cabe, sigue debajo con sangría (no se corta: se perdería un nombre).
function FamiliasDeZona({ zona }) {
  return (
    <div className="mt-2 rounded-lg px-3 py-2" style={{ background: C.paper, border: `1px solid ${C.gold}` }}>
      <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: OP.secundario }}>
        Quién viene de {zona.zona}
      </p>
      <ul className="text-sm" data-familias={zona.zona}>
        {familiasDeZona(zona).map((f, i) => (
          <li key={`${f.apellido}-${i}`} className="py-0.5" style={{ color: C.charcoal, paddingLeft: "1em", textIndent: "-1em" }}>
            {f.apellido && <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: C.ink }}>{f.apellido}: </span>}
            {listaConY(f.nombres)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// `datos`: lo que da tablon_zonas ({ miZona, zonas: [{ zona, confirmados,
// familias: [{ apellido, nombres }] }] }), o null mientras llega.
export function ZonasTablon({ datos }) {
  const [abierta, setAbierta] = useState("");
  if (!datos) return <Cargando />;
  const zonas = ordenarZonas(datos.zonas || []);
  const ninos = pieNinos(datos.ninos);
  if (zonas.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
        Todavía no hay ningún confirmado.
      </p>
    );
  }
  return (
    <div>
      {deDosEnDos(zonas).map((fila, n) => (
        <div key={fila[0].zona} className={n > 0 ? "mt-2" : ""}>
          <ul className="grid grid-cols-2 gap-2">
            {fila.map((z) => (
              <li key={z.zona} data-zona={z.zona} className="min-w-0">
                <PastillaZona
                  zona={z}
                  tuya={z.zona === datos.miZona}
                  abierta={z.zona === abierta}
                  onTocar={familiasDeZona(z).length > 0 ? () => setAbierta(z.zona === abierta ? "" : z.zona) : undefined}
                />
              </li>
            ))}
          </ul>
          {fila.some((z) => z.zona === abierta) && <FamiliasDeZona zona={fila.find((z) => z.zona === abierta)} />}
        </div>
      ))}
      <LineaPie partes={pieZonas(zonas)} className="mt-3" />
      {ninos.length > 0 && <LineaPie partes={ninos} className="mt-1" />}
    </div>
  );
}
