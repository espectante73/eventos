// «A pagar», en Contabilidad (él, v88): lo que entra (recaudado + propinas)
// frente a lo que sale a cada acreedor —el local, el DJ y sus gastos— y lo
// que sobra o falta. Como una hoja de cálculo: una línea por concepto (norma
// 6). Los precios del local se escriben en su ventanita (VentanaLocal, aquí
// abajo); lo del DJ, en su propia línea. Las cuentas, en lib/aPagar.js.
import { useState } from "react";
import { Plus, Receipt, Utensils } from "lucide-react";
import { C, R, T, OP, DEDO, inputStyle } from "../../theme";
import { euros, parsePrecio } from "../../lib/formato";
import { uid } from "../../lib/id";
import { aPagarDe, faltaSqlAPagar, precioPorPersona, limpiarLocal, conDj, personasDelLocal, cuentaDelLocal } from "../../lib/aPagar";
import { PREGUNTA_DESCARTAR } from "../../lib/cambiosSinGuardar";
import { TextInput } from "../../components/Formulario";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { BotonQuitar, usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { CeldaImporte } from "./GastosHoja";

// Los anchos, una sola vez (norma 6).
const COLUMNAS = "minmax(0, 1fr) 110px";
const ALTO_FILA = 34;
const SERIF = { fontFamily: "'Fraunces', serif", fontWeight: 700 };
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const fila = (fondo, extra = {}) => ({ display: "grid", gridTemplateColumns: COLUMNAS, alignItems: "center", height: ALTO_FILA, background: fondo, ...extra });

// Una línea: el concepto a la izquierda y el importe a la derecha. `detalle`,
// una línea de desglose (más pequeña, metida y en gris).
function Linea({ concepto, importe, detalle = false, fondo = C.blanco, estilo }) {
  const gris = detalle ? { opacity: OP.secundario } : undefined;
  return (
    <div style={fila(fondo, { ...(detalle ? { fontSize: T.pequeno, color: C.charcoal } : {}), ...estilo })}>
      <span className={`truncate ${detalle ? "pl-5 pr-2" : "px-2"}`} style={gris}>
        {concepto}
      </span>
      <span className="px-2 text-right truncate" style={gris}>
        {importe}
      </span>
    </div>
  );
}

// La cabecera de cada bloque, como la de la hoja de Gastos.
const Cabecera = ({ children }) => (
  <div style={fila(C.ink, { color: C.goldClaro, ...SERIF })}>
    <span className="px-2 truncate">{children}</span>
    <span />
  </div>
);

// La línea del total de cada bloque, como el Total de la hoja de Gastos.
const Total = ({ concepto, importe }) => <Linea concepto={concepto} importe={importe} fondo={C.paper} estilo={{ borderTop: `2px solid ${C.ink}`, color: C.ink, ...SERIF }} />;

export function APagarHoja({ data, resumen, recaudado, propinas, onLocal, onCuentaLocal }) {
  const { evento, persistEvento } = data;
  const faltaSql = faltaSqlAPagar(evento);
  const [aviso, setAviso] = useState("");
  const { personas, local, tusGastos, entra, sale, diferencia } = resumen;
  const guardado = aPagarDe(evento);

  const guardarDj = (texto) => {
    const { valor, aviso: motivo } = conDj(evento?.aPagar, texto);
    setAviso(motivo);
    if (!motivo) persistEvento({ ...evento, aPagar: valor });
  };

  return (
    <div className="mt-2">
      {/* Los dos del local, iguales (norma 4): su cuenta, para enseñársela
          al pagarle (v93.1), y sus precios. */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Boton variante="secundario" icono={Receipt} titulo="Lo que se le debe al local, para enseñárselo al pagarle" onClick={onCuentaLocal}>
          Cuenta del local
        </Boton>
        <Boton variante="secundario" icono={Utensils} disabled={faltaSql} titulo={faltaSql ? "Falta subir el SQL de la versión 88" : "Lo que cobra el local por persona, y lo demás del local"} onClick={onLocal}>
          Precios del local
        </Boton>
      </div>
      {faltaSql && <LineaAviso className="text-xs mb-2">Falta subir el SQL de la versión 88: hasta entonces no se guardan los precios del local ni lo del DJ.</LineaAviso>}
      {aviso && <LineaAviso className="text-sm mb-2">{aviso}</LineaAviso>}

      <div className="text-sm" style={{ border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden" }}>
        <Cabecera>Entra</Cabecera>
        <Linea concepto="Recaudado" importe={euros(recaudado)} />
        <Linea concepto="Propinas" importe={euros(propinas)} fondo={C.paperDark} />
        <Total concepto="Total que entra" importe={euros(entra)} />

        <Cabecera>Sale</Cabecera>
        <Linea concepto="Local" importe={euros(local.total)} />
        {guardado.partidas.length === 0 ? (
          <Linea detalle concepto="Sin precios todavía" importe="" />
        ) : (
          <>
            <Linea detalle concepto={`${plural(personas.adulto, "adulto", "adultos")} × ${euros(local.porPersona.adulto)}`} importe={euros(local.adultos)} />
            {(personas.nino > 0 || local.porPersona.nino > 0) && <Linea detalle concepto={`${plural(personas.nino, "niño", "niños")} × ${euros(local.porPersona.nino)}`} importe={euros(local.ninos)} />}
            {personas.bebe > 0 && <Linea detalle concepto={plural(personas.bebe, "bebé", "bebés")} importe="gratis" />}
          </>
        )}
        {local.otros > 0 && <Linea detalle concepto="Otros del local" importe={euros(local.otros)} />}
        <div style={fila(C.paperDark)}>
          <span className="px-2 truncate">DJ</span>
          <span className="px-1">
            <CeldaImporte campo etiqueta="Lo que cobra el DJ" placeholder="Escribe" valor={guardado.dj} onGuardar={guardarDj} />
          </span>
        </div>
        <Linea concepto="Tus gastos" importe={euros(tusGastos)} />
        <Total concepto="Total que sale" importe={euros(sale)} />

        {/* Lo que queda: verde si sobra, rosado si falta (los del Balance). */}
        <Linea
          concepto={diferencia >= 0 ? "Sobran" : "Faltan"}
          importe={euros(Math.abs(diferencia))}
          fondo={diferencia >= 0 ? C.okFondo : C.cuidadoFondo}
          estilo={{ borderTop: `2px solid ${C.ink}`, color: C.ink, ...SERIF, fontSize: T.destacado }}
        />
      </div>
      {personas.sinAnio > 0 && (
        <p className="text-xs mt-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
          {plural(personas.sinAnio, "persona sin año de nacimiento: cuenta", "personas sin año de nacimiento: cuentan")} como adulto en el local.
        </p>
      )}
      {/* La ayuda, al pie y plegada (norma 5). */}
      <details className="text-xs mt-3" style={{ color: C.charcoal }}>
        <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
          Cómo se calcula
        </summary>
        <p className="mt-2" style={{ opacity: OP.secundario }}>
          Entra lo ya recaudado y las propinas. Sale lo del local (los confirmados de la Lista, el DJ también, por lo que cobra el local por persona, más lo demás del local), lo del DJ y la suma de tu hoja de Gastos. El precio de la entrada de los invitados no cambia nada de esto: solo se comparten las edades.
        </p>
      </details>
    </div>
  );
}

// ---------- La cuenta del local ----------

// Las edades de cada tramo, de Datos evento: «de 4 a 7 años», «hasta 3 años».
function edadesDeTramos(evento) {
  const desde = parseInt(evento?.edadNinoDesde, 10);
  const hasta = parseInt(evento?.edadNinoHasta, 10);
  if (isNaN(desde) || isNaN(hasta)) return { nino: "", bebe: "" };
  return { nino: ` (de ${desde} a ${hasta - 1} años)`, bebe: ` (hasta ${desde - 1} años)` };
}

// Lo que se le debe al local, para enseñárselo al pagarle (él, v93.1): en su
// propia ventana, sin lo recaudado ni nada más de la Contabilidad. Las
// personas y, por cada partida (cóctel, cena, tarta…), sus adultos y sus
// niños, como en «A pagar»; al pie, el total.
export function VentanaCuentaLocal({ data, onCerrar }) {
  const { evento, invitados } = data;
  const personas = personasDelLocal(invitados, evento);
  const cuenta = cuentaDelLocal(aPagarDe(evento), personas);
  const edades = edadesDeTramos(evento);
  return (
    <VentanaFlotante clave="cuentaLocal" titulo="Cuenta del local" onCerrar={onCerrar} ancho="min(400px, calc(100vw - 48px))">
      <div className="text-sm" style={CAJA}>
        <Cabecera>Personas</Cabecera>
        <Linea concepto="Adultos" importe={personas.adulto} />
        <Linea concepto={`Niños${edades.nino}`} importe={personas.nino} fondo={C.paperDark} />
        {personas.bebe > 0 && <Linea concepto={`Bebés${edades.bebe}`} importe={`${personas.bebe} · gratis`} />}

        <Cabecera>Servicios</Cabecera>
        {cuenta.partidas.length === 0 && <Linea detalle concepto="Sin precios todavía: ponlos en «Precios del local»." importe="" />}
        {cuenta.partidas.map((p, i) => (
          <div key={p.id} style={{ background: i % 2 ? C.paperDark : C.blanco }}>
            <Linea concepto={p.concepto} importe={euros(p.total)} fondo="transparent" estilo={{ fontWeight: 600 }} />
            <Linea detalle concepto={`${plural(personas.adulto, "adulto", "adultos")} × ${euros(p.adulto)}`} importe={euros(p.adultos)} fondo="transparent" />
            {(personas.nino > 0 || p.nino > 0) && (
              <Linea detalle concepto={`${plural(personas.nino, "niño", "niños")} × ${euros(p.nino)}`} importe={euros(p.ninos)} fondo="transparent" />
            )}
          </div>
        ))}
        {cuenta.otros.map((o, i) => (
          <Linea key={o.id} concepto={o.concepto} importe={euros(o.importe)} fondo={(cuenta.partidas.length + i) % 2 ? C.paperDark : C.blanco} />
        ))}
        <Total concepto="Total a pagar al local" importe={euros(cuenta.total)} />
      </div>
      {personas.sinAnio > 0 && (
        <p className="text-xs mt-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
          {plural(personas.sinAnio, "persona sin año de nacimiento: cuenta", "personas sin año de nacimiento: cuentan")} como adulto.
        </p>
      )}
    </VentanaFlotante>
  );
}

// ---------- La ventanita «Lo que cobra el local» ----------

const CAMPO = { ...inputStyle, padding: "3px 6px", width: "100%", minWidth: 0, minHeight: 28 };
const COLUMNAS_PARTIDA = "minmax(0, 1fr) 70px 70px 34px";
const COLUMNAS_OTRO = "minmax(0, 1fr) 96px 34px";
const ALTO_FILA_VENTANA = 38;
const filaDe = (columnas, fondo, extra = {}) => ({ display: "grid", gridTemplateColumns: columnas, alignItems: "center", gap: 4, height: ALTO_FILA_VENTANA, background: fondo, padding: "0 4px", ...extra });
const cabeceraDe = (columnas) => filaDe(columnas, C.ink, { color: C.goldClaro, ...SERIF });
const pieDe = (columnas) => filaDe(columnas, C.paper, { borderTop: `2px solid ${C.ink}`, color: C.ink, ...SERIF });
const CAJA = { border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden" };

const partidaVacia = () => ({ id: uid(), concepto: "", adulto: "", nino: "" });
const otroVacio = () => ({ id: uid(), concepto: "", importe: "" });

// Las edades, de Datos evento: «Niño, de 4 a 7 años; hasta los 3, gratis».
function textoEdades(evento) {
  const desde = parseInt(evento?.edadNinoDesde, 10);
  const hasta = parseInt(evento?.edadNinoHasta, 10);
  if (isNaN(desde) || isNaN(hasta)) return "";
  return `Niño, de ${desde} a ${hasta - 1} años; hasta los ${desde - 1}, gratis.`;
}

export function VentanaLocal({ data, onCerrar }) {
  const { evento, persistEvento } = data;
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  // Se toma una vez al abrir (PARTE 2, 2.4) y se guarda con «Guardar».
  const [inicial] = useState(() => {
    const a = aPagarDe(evento);
    return { partidas: a.partidas.length ? a.partidas : [partidaVacia()], otros: a.otros };
  });
  const [borrador, setBorrador] = useState(inicial);
  const [aviso, setAviso] = useState("");
  const hayCambios = JSON.stringify(borrador) !== JSON.stringify(inicial);

  const cambiar = (lista, id, cambios) => setBorrador((b) => ({ ...b, [lista]: b[lista].map((x) => (x.id === id ? { ...x, ...cambios } : x)) }));
  const anadir = (lista, nueva) => setBorrador((b) => ({ ...b, [lista]: [...b[lista], nueva] }));
  const quitar = (lista, id) => setBorrador((b) => ({ ...b, [lista]: b[lista].filter((x) => x.id !== id) }));

  const guardar = () => {
    const { valor, aviso: motivo } = limpiarLocal(borrador, evento?.aPagar);
    setAviso(motivo);
    if (motivo) return;
    persistEvento({ ...evento, aPagar: valor });
    onCerrar();
  };
  // Salir con algo escrito pregunta antes (norma 9), también por la X.
  const salir = () => (hayCambios ? preguntar({ ...PREGUNTA_DESCARTAR, alConfirmar: onCerrar, otra: { rotulo: "No" } }) : onCerrar());

  const porPersona = precioPorPersona(borrador.partidas);
  const totalOtros = borrador.otros.reduce((s, o) => s + parsePrecio(o.importe), 0);
  const quitarFila = (lista, x) => (
    <BotonQuitar
      titulo="Quitar esta línea"
      pregunta={{ titulo: x.concepto.trim() ? `¿Quitar «${x.concepto.trim()}»?` : "¿Quitar esta línea?", texto: "Se quita al pulsar «Guardar».", rotulo: "Sí" }}
      onClick={() => quitar(lista, x.id)}
    />
  );

  return (
    <VentanaFlotante clave="precioLocal" titulo="Lo que cobra el local" onCerrar={salir} ancho="min(420px, calc(100vw - 48px))">
      <div className="space-y-3 text-sm">
        {/* Por persona: cada partida con su precio de adulto y de niño. */}
        <div style={CAJA}>
          <div style={cabeceraDe(COLUMNAS_PARTIDA)}>
            <span className="px-1 truncate">Por persona</span>
            <span className="text-right truncate">Adulto</span>
            <span className="text-right truncate">Niño</span>
            <span />
          </div>
          {borrador.partidas.map((p, i) => (
            <div key={p.id} style={filaDe(COLUMNAS_PARTIDA, i % 2 ? C.paperDark : C.blanco)}>
              <TextInput aria-label="Partida" placeholder="Menú, cóctel…" value={p.concepto} onChange={(e) => cambiar("partidas", p.id, { concepto: e.target.value })} style={CAMPO} />
              <TextInput aria-label="Precio adulto" placeholder="€" inputMode="decimal" value={p.adulto} onChange={(e) => cambiar("partidas", p.id, { adulto: e.target.value })} style={{ ...CAMPO, textAlign: "right" }} />
              <TextInput aria-label="Precio niño" placeholder="€" inputMode="decimal" value={p.nino} onChange={(e) => cambiar("partidas", p.id, { nino: e.target.value })} style={{ ...CAMPO, textAlign: "right" }} />
              <span className="flex justify-center">{quitarFila("partidas", p)}</span>
            </div>
          ))}
          <div style={pieDe(COLUMNAS_PARTIDA)}>
            <span className="px-1 truncate">Total</span>
            <span className="text-right truncate">{euros(porPersona.adulto)}</span>
            <span className="text-right truncate">{euros(porPersona.nino)}</span>
            <span />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 zurdo:flex-row-reverse">
          <span className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
            {textoEdades(evento)}
          </span>
          <Boton variante="secundario" tamano="pequeno" icono={Plus} titulo="Añadir una partida" onClick={() => anadir("partidas", partidaVacia())}>
            Partida
          </Boton>
        </div>

        {/* Lo demás del local, a mano: un importe cada uno. */}
        <div style={CAJA}>
          <div style={cabeceraDe(COLUMNAS_OTRO)}>
            <span className="px-1 truncate">Otros del local</span>
            <span className="text-right truncate">Importe</span>
            <span />
          </div>
          {borrador.otros.map((o, i) => (
            <div key={o.id} style={filaDe(COLUMNAS_OTRO, i % 2 ? C.paperDark : C.blanco)}>
              <TextInput aria-label="Otro del local" placeholder="Montaje, horas extra…" value={o.concepto} onChange={(e) => cambiar("otros", o.id, { concepto: e.target.value })} style={CAMPO} />
              <TextInput aria-label="Importe" placeholder="€" inputMode="decimal" value={o.importe} onChange={(e) => cambiar("otros", o.id, { importe: e.target.value })} style={{ ...CAMPO, textAlign: "right" }} />
              <span className="flex justify-center">{quitarFila("otros", o)}</span>
            </div>
          ))}
          {borrador.otros.length === 0 && (
            <p className="italic px-2 py-2" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Nada más, de momento.
            </p>
          )}
          <div style={pieDe(COLUMNAS_OTRO)}>
            <span className="px-1 truncate">Total</span>
            <span className="text-right truncate">{euros(totalOtros)}</span>
            <span />
          </div>
        </div>
        <div className="flex justify-end zurdo:justify-start">
          <Boton variante="secundario" tamano="pequeno" icono={Plus} titulo="Añadir otro gasto del local" onClick={() => anadir("otros", otroVacio())}>
            Otro
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
            Cada partida es lo que cobra el local por cada persona (menú, cóctel, tarta…), con su precio de adulto y de niño; si a los niños les cobra lo mismo, se repite el número. Las personas no se escriben: las cuenta la app con los confirmados de la Lista, con las edades de Datos evento. Lo que no va por persona, en «Otros del local».
          </p>
        </details>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
