// Los gastos de Contabilidad, como una hoja de cálculo (él, v76): Fecha ·
// Concepto · Importe, una línea cada uno (norma 6), con la fila de
// escribir siempre arriba y lo último apuntado justo debajo. Al pie, el
// Total. Las reglas, en lib/gastos.js. La lista de conceptos se edita en
// su ventanita (VentanaConceptos, aquí abajo).
import { useState } from "react";
import { Plus, List } from "lucide-react";
import { C, R, T, OP, inputStyle } from "../../theme";
import { euros, parsePrecio, fechaCorta } from "../../lib/formato";
import { uid } from "../../lib/id";
import { hoy, conceptoDe, ordenarGastos, totalGastos, conceptosDe, conConcepto, sinConcepto, conPrecio, precioDe, nuevoGasto } from "../../lib/gastos";
import { TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { BotonQuitar } from "../../components/PreguntaSeguridad";

// Los anchos, una sola vez (norma 6): Fecha (lo que ocupa el calendario),
// Concepto (lo que sobre), Importe y el botón de la fila.
const COLUMNAS = "76px minmax(0, 1fr) 84px 34px";
const ALTO_FILA = 38;
// Una celda de la hoja: sin borde ni fondo propio, como los desplegables
// de la Lista; se ve el fondo de la fila. La fecha y el concepto, con la
// letra pequeña de esos desplegables: en el móvil, si no, el concepto se
// quedaba sin sitio.
const CELDA = { ...inputStyle, border: "none", background: "transparent", padding: "3px 6px", width: "100%", minWidth: 0, minHeight: 28, borderRadius: R.caja };
// En la fila de escribir, con su borde: ahí se escribe.
const CAMPO = { ...inputStyle, padding: "3px 6px", width: "100%", minWidth: 0, minHeight: 28 };
const PEQUENA = { fontSize: T.pequeno };

// Sin el SQL de la v76, la base no guarda la fecha ni la lista de conceptos.
export const faltaSqlGastos = (evento) => !evento || !("conceptosGastos" in evento);

// La fecha de una celda: a la vista, corta («29 oct», como en el boceto
// aprobado); al pulsarla, el calendario del navegador (él: «elegir a golpe
// de ratón»). El campo de fecha va encima, transparente: ocupa toda la
// celda y en el móvil abre el selector del teléfono; en el ordenador se
// le pide que abra el calendario (showPicker). Así cabe en una columna
// estrecha y al concepto le queda sitio en el móvil.
function CeldaFecha({ valor, onCambio, estilo }) {
  return (
    <span className="relative flex items-center" style={{ ...estilo, ...PEQUENA, cursor: "pointer" }} title={valor ? "Cambiar la fecha" : "Elegir la fecha"}>
      {valor ? fechaCorta(valor) : "—"}
      <input
        type="date"
        aria-label="Fecha"
        value={valor || ""}
        onChange={(e) => onCambio(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            // Sin showPicker (o sin permiso), el campo sigue ahí: se escribe.
          }
        }}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0, cursor: "pointer" }}
      />
    </span>
  );
}

// El importe de una fila: «180,00 €» a la vista; al tocarlo, el número,
// que se guarda al salir o con Intro (él: «que yo pueda corregir el de
// ese mes»).
function CeldaImporte({ valor, onGuardar }) {
  const [texto, setTexto] = useState(null);
  const guardar = () => {
    if (texto !== null && texto.trim() !== valor) onGuardar(texto.trim());
    setTexto(null);
  };
  return (
    <input
      value={texto ?? (valor ? euros(parsePrecio(valor)) : "")}
      onFocus={() => setTexto(valor)}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      aria-label="Importe"
      style={{ ...CELDA, textAlign: "right" }}
    />
  );
}

// El desplegable de conceptos de una celda. Si el gasto trae uno que ya no
// está en la lista, se añade como opción: nunca se enseña vacío lo que no lo es.
function OpcionesConcepto({ conceptos, actual }) {
  const nombres = conceptos.map((c) => c.nombre);
  return (
    <>
      {actual && !nombres.includes(actual) && <option value={actual}>{actual}</option>}
      {nombres.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </>
  );
}

export function GastosHoja({ data, onConceptos }) {
  const { evento, gastos, persistGastos } = data;
  const faltaSql = faltaSqlGastos(evento);
  const conceptos = conceptosDe(evento?.conceptosGastos, gastos);
  const [nueva, setNueva] = useState({ fecha: hoy(), concepto: "", importe: "" });
  const [aviso, setAviso] = useState("");
  const filas = ordenarGastos(gastos);

  // Elegir un concepto con precio fijo pone el importe (se puede cambiar).
  const elegirConcepto = (concepto) => setNueva((n) => ({ ...n, concepto, importe: precioDe(conceptos, concepto) || n.importe }));
  // La fecha se queda: si se apuntan varios del mismo día, no hay que volver a elegirla.
  const apuntar = () => {
    const { gasto, aviso: motivo } = nuevoGasto(nueva, uid());
    setAviso(motivo);
    if (!gasto) return;
    persistGastos([gasto, ...gastos]);
    setNueva((n) => ({ ...n, concepto: "", importe: "" }));
  };
  const cambiar = (id, cambios) => persistGastos(gastos.map((g) => (g.id === id ? { ...g, ...cambios } : g)));
  const quitar = (id) => persistGastos(gastos.filter((g) => g.id !== id));

  const fila = (fondo, extra = {}) => ({ display: "grid", gridTemplateColumns: COLUMNAS, alignItems: "center", height: ALTO_FILA, background: fondo, ...extra });

  return (
    <div className="mt-2">
      <div className="flex items-center justify-end zurdo:justify-start mb-2">
        <Boton variante="secundario" icono={List} disabled={faltaSql} titulo={faltaSql ? "Falta subir el SQL de la versión 76" : "Añadir o quitar conceptos, con su precio si es fijo"} onClick={onConceptos}>
          Conceptos
        </Boton>
      </div>
      {faltaSql && <LineaAviso className="text-xs mb-2">Falta subir el SQL de la versión 76: hasta entonces no se guardan la fecha ni los conceptos.</LineaAviso>}
      {aviso && <LineaAviso className="text-sm mb-2">{aviso}</LineaAviso>}

      <div className="text-sm" style={{ border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden" }}>
        <div style={fila(C.ink, { height: 34, color: C.goldClaro, fontFamily: "'Fraunces', serif", fontWeight: 700 })}>
          <span className="px-2 truncate">Fecha</span>
          <span className="px-2 truncate">Concepto</span>
          <span className="px-2 truncate text-right">Importe</span>
          <span />
        </div>

        {/* La fila de escribir, siempre arriba: crema y con raya dorada. */}
        <div style={fila(C.papelPlano, { borderBottom: `2px solid ${C.gold}` })}>
          <span className="px-1">
            <CeldaFecha valor={nueva.fecha} onCambio={(fecha) => setNueva((n) => ({ ...n, fecha }))} estilo={CAMPO} />
          </span>
          <span className="px-1">
            <select aria-label="Concepto" value={nueva.concepto} onChange={(e) => elegirConcepto(e.target.value)} style={{ ...CAMPO, ...PEQUENA, color: nueva.concepto ? C.charcoal : C.line }}>
              <option value="">Concepto</option>
              <OpcionesConcepto conceptos={conceptos} />
            </select>
          </span>
          <span className="px-1">
            <TextInput
              aria-label="Importe"
              placeholder="Importe"
              inputMode="decimal"
              value={nueva.importe}
              onChange={(e) => setNueva((n) => ({ ...n, importe: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && apuntar()}
              style={{ ...CAMPO, textAlign: "right" }}
            />
          </span>
          <span className="flex justify-center">
            <Boton variante="principal" tamano="pequeno" icono={Plus} titulo="Apuntar el gasto" disabled={faltaSql} onClick={apuntar} />
          </span>
        </div>

        {filas.map((g, i) => (
          <div key={g.id} style={fila(i % 2 ? C.paperDark : C.blanco)}>
            <span className="px-1">
              <CeldaFecha valor={g.fecha} onCambio={(fecha) => cambiar(g.id, { fecha })} estilo={CELDA} />
            </span>
            <span className="px-1">
              <select aria-label="Concepto" value={conceptoDe(g)} onChange={(e) => cambiar(g.id, { concepto: e.target.value })} style={{ ...CELDA, ...PEQUENA }}>
                <OpcionesConcepto conceptos={conceptos} actual={conceptoDe(g)} />
              </select>
            </span>
            <span className="px-1">
              <CeldaImporte valor={g.importe} onGuardar={(importe) => cambiar(g.id, { importe })} />
            </span>
            <span className="flex justify-center">
              <BotonQuitar
                titulo="Quitar este gasto"
                pregunta={{
                  titulo: "¿Quitar este gasto?",
                  texto: [conceptoDe(g), g.importe && euros(parsePrecio(g.importe))].filter(Boolean).join(" · ") || "Gasto sin concepto.",
                  rotulo: "Sí",
                }}
                onClick={() => quitar(g.id)}
              />
            </span>
          </div>
        ))}
        {gastos.length === 0 && (
          <p className="text-sm italic px-2 py-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Todavía no hay gastos apuntados.
          </p>
        )}

        {/* Al pie, el Total, como el SUMA de una hoja de cálculo. */}
        <div style={fila(C.paper, { borderTop: `2px solid ${C.ink}`, color: C.ink, fontFamily: "'Fraunces', serif", fontWeight: 700 })}>
          <span className="px-2">Total</span>
          <span />
          <span className="px-2 text-right">{euros(totalGastos(gastos))}</span>
          <span />
        </div>
      </div>
    </div>
  );
}

// La lista de conceptos (él, v76: «un lugar donde yo pueda poner los
// conceptos y solo elegirlos»), cada uno con su precio si es fijo. Quitar
// uno no cambia los gastos ya apuntados.
export function VentanaConceptos({ data, onCerrar }) {
  const { evento, gastos, persistEvento } = data;
  const conceptos = conceptosDe(evento?.conceptosGastos, gastos);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [aviso, setAviso] = useState("");
  const guardar = (lista) => persistEvento({ ...evento, conceptosGastos: lista });

  const anadir = () => {
    const { conceptos: siguiente, aviso: motivo } = conConcepto(conceptos, nombre, precio);
    setAviso(motivo);
    if (motivo) return;
    guardar(siguiente);
    setNombre("");
    setPrecio("");
  };

  return (
    <VentanaFlotante clave="conceptosGastos" titulo="Conceptos" onCerrar={onCerrar} ancho="min(400px, calc(100vw - 48px))">
      <div className="flex items-center gap-2 mb-2">
        <TextInput aria-label="Nuevo concepto" placeholder="Nuevo concepto" value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && anadir()} style={{ flex: 1, minWidth: 0 }} />
        <TextInput aria-label="Precio fijo" placeholder="Precio fijo" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} onKeyDown={(e) => e.key === "Enter" && anadir()} style={{ width: 96, textAlign: "right" }} />
        <Boton variante="principal" tamano="pequeno" icono={Plus} titulo="Añadir el concepto" onClick={anadir} />
      </div>
      {aviso && <LineaAviso className="text-sm mb-2">{aviso}</LineaAviso>}
      <div className="text-sm" style={{ border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden" }}>
        {conceptos.map((c, i) => (
          <div key={c.nombre} className="flex items-center gap-2 px-2" style={{ height: ALTO_FILA, background: i % 2 ? C.paperDark : C.blanco }}>
            <span className="flex-1 truncate">{c.nombre}</span>
            <CeldaPrecio valor={c.precio} onGuardar={(p) => guardar(conPrecio(conceptos, c.nombre, p))} />
            <BotonQuitar
              titulo="Quitar este concepto"
              pregunta={{ titulo: `¿Quitar «${c.nombre}» de la lista?`, texto: "Los gastos ya apuntados con este concepto no cambian.", rotulo: "Sí" }}
              onClick={() => guardar(sinConcepto(conceptos, c.nombre))}
            />
          </div>
        ))}
        {conceptos.length === 0 && (
          <p className="text-sm italic px-2 py-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Todavía no hay conceptos.
          </p>
        )}
      </div>
      {/* La ayuda, al pie y plegada (norma 5). */}
      <details className="text-xs mt-3" style={{ color: C.charcoal }}>
        <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
          Cómo se usa
        </summary>
        <p className="mt-2" style={{ opacity: OP.secundario }}>
          Con precio fijo (una suscripción), al elegir el concepto en la hoja el importe se pone solo; si un mes cambia, se corrige en la fila de ese gasto.
        </p>
      </details>
    </VentanaFlotante>
  );
}

// El precio fijo de un concepto, editable en su fila; se guarda al salir.
function CeldaPrecio({ valor, onGuardar }) {
  const [texto, setTexto] = useState(null);
  return (
    <input
      aria-label="Precio fijo"
      placeholder="—"
      inputMode="decimal"
      value={texto ?? valor}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => {
        if (texto !== null && texto.trim() !== valor) onGuardar(texto);
        setTexto(null);
      }}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      style={{ ...CELDA, width: 96, textAlign: "right" }}
    />
  );
}
