// «Van juntos» (él, v101.1, boceto aprobado): las familias que viajan juntas
// y se sientan juntas, sin hacerlas una familia (él: «no quiero vincularlos
// por apellidos»). Se abre desde Acomodación. Arriba, los grupos, una línea
// cada uno (norma 6) con su X para separarlos; debajo, elegir una familia
// «con» otra y «Juntar». La regla, en lib/repartoMesas.js (juntarFamilias):
// la marca se guarda al momento; si hay que sentarlas juntas, va a la prueba.
import { useState } from "react";
import { Link2 } from "lucide-react";
import { C, OP } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { Desplegable } from "../../components/Formulario";
import { LineaAviso } from "../../components/LineaAviso";
import { BotonQuitar } from "../../components/PreguntaSeguridad";
import { ALTO_FILA_MARCABLE } from "../../components/FilaMarcable";
import { listaConY } from "../../lib/formato";

// La marca de un grupo: la cadena y su número. La misma en la ventana y en
// cada familia de las mesas (norma 7).
export function MarcaJuntos({ numero }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold flex-shrink-0" title={`Van juntos (grupo ${numero})`} aria-label={`Van juntos, grupo ${numero}`} style={{ color: C.ink }}>
      <Link2 size={14} aria-hidden />
      {numero}
    </span>
  );
}

// `familias`: las de Acomodación (familiasParaRepartir); `grupos`, los de
// gruposJuntos. `onJuntar(idA, idB)` devuelve el aviso ("" si se juntaron).
export function VentanaVanJuntos({ familias, grupos, onJuntar, onSeparar, onCerrar }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [aviso, setAviso] = useState("");
  const [hecho, setHecho] = useState("");
  const ordenadas = [...familias].sort((x, y) => x.nombre.localeCompare(y.nombre, "es"));
  const nombreDe = (id) => familias.find((f) => f.representante.id === id)?.nombre || "";
  const juntar = () => {
    const motivo = onJuntar(a, b);
    setAviso(motivo);
    setHecho(motivo ? "" : `Van juntos: ${nombreDe(a)} y ${nombreDe(b)}.`);
    if (!motivo) {
      setA("");
      setB("");
    }
  };
  const opciones = (otra) =>
    ordenadas
      .filter((f) => f.representante.id !== otra)
      .map((f) => (
        <option key={f.clave} value={f.representante.id}>
          {f.nombre}
        </option>
      ));
  return (
    <VentanaFlotante clave="vanJuntos" titulo="Van juntos" onCerrar={onCerrar} ancho="min(440px, calc(100vw - 48px))">
      <div className="space-y-3 text-sm">
        {grupos.length === 0 ? (
          <p className="italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Todavía no hay familias que vayan juntas.
          </p>
        ) : (
          <div className="rounded overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            {grupos.map((grupo, i) => {
              const nombres = grupo.familias.map((f) => f.nombre);
              return (
                <div key={grupo.id} data-grupo={grupo.numero} className="flex items-center gap-2 px-2" style={{ height: ALTO_FILA_MARCABLE, background: i % 2 ? C.paperDark : C.blanco }}>
                  <MarcaJuntos numero={grupo.numero} />
                  <span className="flex-1 min-w-0 truncate" title={nombres.join(" · ")}>
                    {nombres.join(" · ")}
                  </span>
                  <BotonQuitar
                    titulo="Separarlas"
                    pregunta={{ titulo: "¿Separarlas?", texto: `${listaConY(nombres)} dejan de ir juntos. Nadie cambia de mesa.`, rotulo: "Sí" }}
                    onClick={() => {
                      setAviso("");
                      setHecho("");
                      onSeparar(grupo.id);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
        {/* Una familia «con» otra, en una línea (norma 6). */}
        <div className="flex items-center gap-2">
          <Desplegable value={a} onChange={(e) => setA(e.target.value)} aria-label="La familia que va">
            <option value="">Familia…</option>
            {opciones(b)}
          </Desplegable>
          <span className="flex-shrink-0">con</span>
          <Desplegable value={b} onChange={(e) => setB(e.target.value)} aria-label="Con qué familia va">
            <option value="">Familia…</option>
            {opciones(a)}
          </Desplegable>
        </div>
        {aviso && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
        {hecho && (
          <LineaAviso tipo="ok" className="text-sm">
            {hecho}
          </LineaAviso>
        )}
        <div className="flex justify-end zurdo:justify-start">
          <Boton variante="principal" icono={Link2} disabled={!a || !b} onClick={juntar}>
            Juntar
          </Boton>
        </div>
        <details className="text-xs" style={{ color: C.charcoal }}>
          <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
            Cómo se usa
          </summary>
          <p className="mt-2" style={{ opacity: OP.secundario }}>
            Solo para sentarlas juntas: la invitación, el pago y las fotos siguen siendo de cada familia. Si la segunda ya tiene
            mesa, la primera se sienta con ella (en la prueba); si no caben, no se juntan y se dice. Al mover una, va todo el
            grupo, y «Auto-asignar» las sienta juntas. La X las separa: nadie cambia de mesa.
          </p>
        </details>
      </div>
    </VentanaFlotante>
  );
}
