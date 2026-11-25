// «Mesas del local» (él, v101.2): cuántas mesas tiene el local de cada
// tamaño, el máximo con que trabaja Acomodación. Se abre con «Del local»
// (la ruedita), una línea por tamaño (norma 6) y, al pie, cuántos
// comensales caben como mucho. Como «Lo que cobra el local» (APagar.jsx):
// se toma al abrir (PARTE 2, 2.4) y se guarda con «Guardar». La regla, en
// lib/mesasLocal.js.
import { useState } from "react";
import { Plus } from "lucide-react";
import { C, R, OP, DEDO, inputStyle } from "../../theme";
import { TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { BotonQuitar, usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { PREGUNTA_DESCARTAR } from "../../lib/cambiosSinGuardar";
import { uid } from "../../lib/id";
import { mesasLocalDe, limpiarMesasLocal, totalDelLocal } from "../../lib/mesasLocal";

const SERIF = { fontFamily: "'Fraunces', serif", fontWeight: 700 };
const CAMPO = { ...inputStyle, padding: "3px 6px", width: "100%", minWidth: 0, minHeight: 28, textAlign: "center" };
const COLUMNAS = "minmax(0, 1fr) minmax(0, 1fr) 34px";
const ALTO_FILA = 38;
const filaDe = (fondo, extra = {}) => ({ display: "grid", gridTemplateColumns: COLUMNAS, alignItems: "center", gap: 4, height: ALTO_FILA, background: fondo, padding: "0 4px", ...extra });
const CAJA = { border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden" };

const filaVacia = () => ({ id: uid(), sitios: "", cuantas: "" });

export function VentanaMesasLocal({ evento, persistEvento, onCerrar }) {
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const [inicial] = useState(() => {
    const local = mesasLocalDe(evento);
    return local.length ? local.map((t) => ({ id: uid(), sitios: String(t.sitios), cuantas: String(t.cuantas) })) : [filaVacia()];
  });
  const [filas, setFilas] = useState(inicial);
  const [aviso, setAviso] = useState("");
  const hayCambios = JSON.stringify(filas) !== JSON.stringify(inicial);

  const cambiar = (id, cambios) => setFilas((l) => l.map((f) => (f.id === id ? { ...f, ...cambios } : f)));
  const guardar = () => {
    const { valor, aviso: motivo } = limpiarMesasLocal(filas);
    setAviso(motivo);
    if (motivo) return;
    persistEvento({ ...evento, mesasLocal: valor });
    onCerrar();
  };
  // Salir con algo escrito pregunta antes (norma 9), también por la X.
  const salir = () => (hayCambios ? preguntar({ ...PREGUNTA_DESCARTAR, alConfirmar: onCerrar, otra: { rotulo: "No" } }) : onCerrar());

  // El total, de las líneas completas.
  const total = totalDelLocal(limpiarMesasLocal(filas.filter((f) => parseInt(f.sitios, 10) > 0 && parseInt(f.cuantas, 10) > 0)).valor || []);

  return (
    <VentanaFlotante clave="mesasLocal" titulo="Mesas del local" onCerrar={salir} ancho="min(420px, calc(100vw - 48px))">
      <div className="space-y-3 text-sm">
        <div style={CAJA}>
          <div style={filaDe(C.ink, { color: C.goldClaro, ...SERIF })}>
            <span className="px-1 truncate">Sitios por mesa</span>
            <span className="px-1 truncate">Cuántas</span>
            <span />
          </div>
          {filas.map((f, i) => (
            <div key={f.id} data-tamano style={filaDe(i % 2 ? C.paperDark : C.blanco)}>
              <TextInput aria-label="Sitios por mesa" placeholder="11" inputMode="numeric" value={f.sitios} onChange={(e) => cambiar(f.id, { sitios: e.target.value })} style={CAMPO} />
              <TextInput aria-label="Cuántas mesas" placeholder="4" inputMode="numeric" value={f.cuantas} onChange={(e) => cambiar(f.id, { cuantas: e.target.value })} style={CAMPO} />
              <span className="flex justify-center">
                <BotonQuitar
                  titulo="Quitar este tamaño"
                  pregunta={{ titulo: f.sitios.trim() ? `¿Quitar las mesas de ${f.sitios.trim()}?` : "¿Quitar esta línea?", texto: "Se quita al pulsar «Guardar».", rotulo: "Sí" }}
                  onClick={() => setFilas((l) => l.filter((x) => x.id !== f.id))}
                />
              </span>
            </div>
          ))}
          {filas.length === 0 && (
            <p className="italic px-2 py-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Sin mesas: Acomodación no pone límites.
            </p>
          )}
          <div style={filaDe(C.paper, { borderTop: `2px solid ${C.ink}`, color: C.ink, ...SERIF })}>
            <span data-total className="px-1 truncate" style={{ gridColumn: "1 / 4" }}>
              Total: {total.mesas} {total.mesas === 1 ? "mesa" : "mesas"}, hasta {total.sitios} comensales
            </span>
          </div>
        </div>
        <div className="flex justify-end zurdo:justify-start">
          <Boton variante="secundario" tamano="pequeno" icono={Plus} titulo="Añadir otro tamaño de mesa" onClick={() => setFilas((l) => [...l, filaVacia()])}>
            Tamaño
          </Boton>
        </div>

        {aviso && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
        {/* Al pie, Cancelar y Guardar, iguales (normas 4 y 5); «Guardar», del lado del pulgar. */}
        <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <Boton variante="secundario" onClick={salir} style={{ minHeight: DEDO }}>
            Cancelar
          </Boton>
          <Boton variante="principal" onClick={guardar} className="zurdo:order-first" style={{ minHeight: DEDO }}>
            Guardar
          </Boton>
        </div>
        <details className="text-xs" style={{ color: C.charcoal }}>
          <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
            Cómo se usa
          </summary>
          <p className="mt-2" style={{ opacity: OP.secundario }}>
            Las mesas que tiene el local, por tamaño: es el máximo. En Acomodación ninguna mesa pasa del tamaño más grande
            ni hay más de las que tiene el local; bajar sitios, siempre se puede. Cada mesa ocupa una del local, la más
            pequeña en que cabe (una de 10, una de 11), y arriba se ve cuántas quedan libres de cada tamaño; en rojo, si
            faltan. Sin ninguna línea, Acomodación no pone límites.
          </p>
        </details>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
