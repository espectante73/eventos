// «Mesas y acomodación» (él, v74.6): la ventana Mesas y la de «Repartir
// familias», en una sola. En su ventana propia («que ocupe la pantalla y
// verlo en grande»; en el Mac, una ventana del sistema, como la Lista). A
// la izquierda, «Sin mesa»; a la derecha, una columna por mesa. Arriba de
// cada mesa, sus controles (− / + sitios, Vaciar, quitarla) y
// debajo «Mesa 3 · 5/9»; llena, un recuadro grueso alrededor. Cada familia,
// con el nombre de su «O» y cuántos son; se arrastra a otra columna o, en
// el móvil, se toca la familia y luego la mesa. Una familia no entra donde
// no cabe: se queda donde estaba y se dice cuántos sitios quedan.
//
// Qué se guarda y cuándo: las mesas y sus sitios, AL MOMENTO (son el
// mobiliario); sentar, Vaciar y Auto-asignar, en la PRUEBA, que vive en
// VistaAnfitrion (sobrevive a cerrar la ventana) y no toca la Lista hasta
// «Aplicar a la Lista». «Plano de mesas» (él), un botón que lo abre aquí.
//
// «Memorias» (él, v75): Acomodación 1, 2 y 3, una foto de todo (mesas,
// sitios, plano y quién se sienta dónde). Cargar una la pone como prueba,
// mesas incluidas: mientras está cargada, también las mesas son prueba.
import { useState } from "react";
import { Check, AlertTriangle, Plus, Minus, Bookmark, Map as IconoPlano } from "lucide-react";
import { C, OP, R, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { RecuadroCifras } from "../../components/Widgets";
import { PlanoMesas } from "../../components/PlanoMesas";
import { BotonQuitar, usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { MenuFlotante } from "../../components/MenuFlotante";
import { cuentaConfirmacion } from "../../lib/invitados";
import { nombreCompleto, fechaCorta, horaCorta } from "../../lib/formato";
import { PREGUNTA_DESCARTAR } from "../../lib/cambiosSinGuardar";
import {
  conBorrador,
  borradorDesde,
  familiasParaRepartir,
  moverFamilia,
  vaciarMesaEnBorrador,
  autoAsignarEnBorrador,
  aplicarBorrador,
  familiasQueCambian,
  ocupacion,
  MEMORIAS,
  PRUEBA_VACIA,
  memoriaDesde,
  conMemoria,
  cargarMemoria,
} from "../../lib/repartoMesas";

// El ancho de una columna, una sola vez (norma 6): 224 px = `sm:w-56` de
// «Sin mesa», que en el móvil va arriba, a todo lo ancho.
const ANCHO_COLUMNA = 224;
// El recuadro de una mesa llena (él: «un recuadro más grueso alrededor…
// que sea visual»), y desde la v74.8 relleno del mismo color. Está
// siempre, transparente, para que llenarse no la mueva de sitio.
const GROSOR_RECUADRO = 3;

function Familia({ familia, cogida, onCoger }) {
  // Sin confirmar todavía: sombreada hasta que confirmen (él, v74.2); su
  // sitio, reservado. Con parte sin confirmar: «2+1».
  const nadieConfirmado = familia.sinConfirmar === familia.cuantos;
  const cifra = familia.sinConfirmar && !nadieConfirmado ? `${familia.cuantos - familia.sinConfirmar}+${familia.sinConfirmar}` : familia.cuantos;
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", familia.representante.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onCoger(familia.representante.id)}
      data-familia={familia.nombre}
      aria-pressed={cogida}
      className="boton-3d w-full flex items-center justify-between gap-2 rounded px-3 py-1.5 mb-1.5 text-sm text-left"
      // Con los colores de la mesa invertidos (él, v74.1): dorado con letra
      // verde, para no confundir una familia con la cabecera de una mesa.
      // Cogida (en el móvil), con el borde verde.
      style={{
        background: C.goldClaro,
        color: C.ink,
        border: `2px ${nadieConfirmado ? "dashed" : "solid"} ${cogida ? C.ink : C.gold}`,
        opacity: nadieConfirmado && !cogida ? OP.tenue : 1,
        cursor: "grab",
      }}
      title={
        familia.sinConfirmar
          ? `${familia.sinConfirmar === 1 ? "1 sin confirmar" : `${familia.sinConfirmar} sin confirmar`}: su sitio queda reservado. Arrástrala a otra mesa, o tócala y luego toca la mesa`
          : "Arrástrala a otra mesa, o tócala y luego toca la mesa"
      }
    >
      <span className="truncate">{familia.nombre}</span>
      <span className="flex items-center gap-1.5 flex-shrink-0">
        {/* Alergias o intolerancias: en la familia que las tiene, no en la
            mesa (él, v74.9: «solo donde aplique»). Quién y qué, al pasar
            por encima. */}
        {familia.conAlergia.length > 0 && (
          <span
            title={`Alergias o intolerancias: ${familia.conAlergia.map((g) => `${nombreCompleto(g)} (${g.alergias.trim()})`).join("; ")}`}
            aria-label="Alergias o intolerancias"
            style={{ color: C.wax }}
          >
            <AlertTriangle size={14} aria-hidden />
          </span>
        )}
        <b style={{ fontFamily: "'Fraunces', serif" }}>{cifra}</b>
      </span>
    </button>
  );
}

// Una columna donde se sueltan familias: «Sin mesa» o una mesa. `cabecera`,
// lo de arriba; `llena`, el color de la mesa llena: recuadro y relleno
// sólido (él, v74.8: «el recuadro no es suficiente»).
function Columna({ nombre, cabecera, llena, familias, cogida, onCoger, onSoltar }) {
  const [encima, setEncima] = useState(false);
  return (
    <div
      data-columna={nombre}
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault();
        setEncima(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onSoltar(id);
      }}
      // Con una familia cogida (el móvil), tocar la columna la deja aquí;
      // tocar los controles de la mesa, no.
      onClick={(e) => {
        if (cogida && !e.target.closest("[data-familia], [data-controles]")) onSoltar(cogida);
      }}
      className="p-1.5"
      style={{
        borderRadius: R.caja,
        border: `${GROSOR_RECUADRO}px solid ${llena || "transparent"}`,
        background: llena || (encima || cogida ? C.paperDark : "transparent"),
        cursor: cogida ? "pointer" : undefined,
      }}
    >
      {cabecera}
      {familias.map((f) => (
        <Familia key={f.clave} familia={f} cogida={cogida === f.representante.id} onCoger={onCoger} />
      ))}
    </div>
  );
}

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");
const CIFRA = { fontFamily: "'IBM Plex Mono', monospace", fontSize: T.pequeno };
// «28 oct a las 10:15», en la hora de quien mira («sv-SE» da el día local
// como AAAA-MM-DD, lo que espera fechaCorta).
const cuandoSeGuardo = (iso) => `${fechaCorta(new Date(iso).toLocaleDateString("sv-SE"))} a las ${horaCorta(iso)}`;

export function VentanaMesas({ data, prueba, setPrueba, onCerrar, fijo }) {
  const { invitados, evento, persistInvitados, persistMesas, persistEvento } = data;
  const { borrador } = prueba;
  // Las mesas que se ven: las de la memoria cargada o, si no hay, las de verdad.
  const mesas = prueba.mesas ?? data.mesas;
  // Sin la columna en la base (falta subir el SQL de la v75), no hay memorias.
  const memorias = evento?.acomodaciones;
  const [cogida, setCogida] = useState(null);
  const [aviso, setAviso] = useState("");
  const [avisosAuto, setAvisosAuto] = useState([]);
  const [guardado, setGuardado] = useState("");
  const [verPlano, setVerPlano] = useState(false);
  // Los no confirmados salen SIEMPRE, sombreados hasta que confirmen, y se
  // sientan como los demás (él, v74.2: «para cuadrar con tiempo»). Su
  // sitio queda reservado y cuenta en la mesa; «No asiste» lo libera.
  const conSinConfirmar = true;
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();

  const vista = conBorrador(invitados, borrador);
  const confirmacion = cuentaConfirmacion(invitados);
  const familias = familiasParaRepartir(vista, { conSinConfirmar });
  const sinMesa = familias.filter((f) => f.mesa == null).sort(porNombre);
  const cambian = familiasQueCambian(invitados, borrador);
  const hayPrueba = cambian > 0 || prueba.mesas != null;
  const ordenadas = [...mesas].sort((a, b) => a.numero - b.numero);
  const cambiar = (cambios) => setPrueba((p) => ({ ...p, ...cambios, sucia: true }));
  const setBorrador = (siguiente) => cambiar({ borrador: siguiente });

  const limpiarAvisos = () => {
    setAviso("");
    setAvisosAuto([]);
    setGuardado("");
  };

  // ---------- La prueba ----------
  const soltar = (idRepresentante, numero) => {
    setCogida(null);
    limpiarAvisos();
    const { borrador: siguiente, aviso: motivo } = moverFamilia(invitados, borrador, idRepresentante, numero, mesas, { conSinConfirmar });
    setAviso(motivo);
    if (!motivo) setBorrador(siguiente);
  };
  const coger = (id) => {
    setAviso("");
    setCogida((actual) => (actual === id ? null : id));
  };
  // Vaciar va a la prueba: no pregunta, se deshace con «Descartar».
  const vaciar = (numero) => {
    limpiarAvisos();
    setBorrador(vaciarMesaEnBorrador(invitados, borrador, numero));
  };
  const autoAsignar = () => {
    limpiarAvisos();
    const { borrador: siguiente, avisos } = autoAsignarEnBorrador(invitados, borrador, mesas);
    setBorrador(siguiente);
    setAvisosAuto(avisos);
  };
  // Al aplicar, la prueba pasa a la Lista y los botones se apagan: se dice
  // aquí que está guardado (norma 9), o parecería que no ha hecho nada.
  // Con una memoria cargada, también sus mesas; quien quedara en una mesa
  // que ya no existe, sin mesa.
  const aplicar = () => {
    if (prueba.mesas) persistMesas(prueba.mesas);
    const numeros = new Set(mesas.map((m) => m.numero));
    persistInvitados(aplicarBorrador(invitados, borrador).map((g) => (g.mesa != null && !numeros.has(g.mesa) ? { ...g, mesa: null } : g)));
    limpiarAvisos();
    setGuardado(
      prueba.cargada
        ? `Guardado en la Lista: Acomodación ${prueba.cargada}.`
        : `Guardado en la Lista: ${cambian === 1 ? "1 familia cambia" : `${cambian} familias cambian`} de mesa.`
    );
    setPrueba(PRUEBA_VACIA);
  };
  const descartar = () => preguntar({ ...PREGUNTA_DESCARTAR, peligro: false, alConfirmar: () => setPrueba(PRUEBA_VACIA) });

  // ---------- Las memorias ----------
  const guardarEn = (numero) => {
    const hacer = () => {
      persistEvento({ ...evento, acomodaciones: conMemoria(memorias, memoriaDesde(vista, mesas, numero)) });
      setPrueba((p) => ({ ...p, cargada: numero, sucia: false }));
      limpiarAvisos();
      setGuardado(`Guardada en Acomodación ${numero}.`);
    };
    const yaHabia = memorias.find((m) => m.numero === numero);
    if (!yaHabia) return hacer();
    preguntar({
      titulo: `¿Sustituir la Acomodación ${numero}?`,
      texto: `Se guardó el ${cuandoSeGuardo(yaHabia.guardadaEl)}. Se cambia por lo que se ve ahora.`,
      rotulo: "Sí",
      peligro: false,
      alConfirmar: hacer,
    });
  };
  const cargar = (memoria) => {
    const hacer = () => {
      const { mesas: suyas, borrador: suyo, aviso: nota } = cargarMemoria(invitados, memoria);
      setPrueba({ borrador: suyo, mesas: suyas, cargada: memoria.numero, sucia: false });
      limpiarAvisos();
      setAviso(nota);
    };
    // Lo que se ha tocado desde la última carga o guardado se perdería.
    if (prueba.sucia && hayPrueba) preguntar({ ...PREGUNTA_DESCARTAR, peligro: false, alConfirmar: hacer });
    else hacer();
  };
  const opcionesMemorias = [
    ...(memorias?.length
      ? memorias.map((m) => ({ id: `cargar-${m.numero}`, etiqueta: `Acomodación ${m.numero}`, marcado: prueba.cargada === m.numero, onClick: () => cargar(m) }))
      : [{ id: "ninguna", encabezado: "Ninguna guardada" }]),
    { id: "guardar", etiqueta: "Guardar", submenu: MEMORIAS.map((n) => ({ id: `guardar-${n}`, etiqueta: `Acomodación ${n}`, onClick: () => guardarEn(n) })) },
  ];

  // ---------- Las mesas: al momento (con una memoria cargada, en la prueba) ----------
  const cambiarMesas = (siguientes) => (prueba.mesas ? cambiar({ mesas: siguientes }) : persistMesas(siguientes));
  const anadirMesa = () => {
    const siguiente = mesas.reduce((max, m) => Math.max(max, m.numero), 0) + 1;
    cambiarMesas([...mesas, { numero: siguiente, capacidad: 10 }]);
  };
  const cambiarSitios = (numero, capacidad) => cambiarMesas(mesas.map((m) => (m.numero === numero ? { ...m, capacidad } : m)));
  // Quien estaba en ella se queda sin mesa, en la Lista y en la prueba; no
  // se borra a nadie.
  const quitarMesa = (numero) => {
    const sinEsaMesa = (lista) => lista.map((g) => (g.mesa === numero ? { ...g, mesa: null } : g));
    if (prueba.mesas) {
      cambiar({ mesas: mesas.filter((m) => m.numero !== numero), borrador: borradorDesde(invitados, sinEsaMesa(vista)) });
      return;
    }
    const lista = sinEsaMesa(invitados);
    if (invitados.some((g) => g.mesa === numero)) persistInvitados(lista);
    persistMesas(mesas.filter((m) => m.numero !== numero));
    setBorrador(borradorDesde(lista, sinEsaMesa(conBorrador(lista, borrador))));
  };

  const cabeceraMesa = (m, ocupados) => {
    return (
      <div className="rounded px-2 py-1.5 mb-2" style={{ background: C.ink, color: C.goldClaro }}>
        {/* Arriba, los controles (él, v74.6); debajo, «Mesa 3 · 5/9». Las
            alergias, en cada familia (v74.9). */}
        <div data-controles className="flex items-center justify-between gap-1">
          <span className="flex items-center gap-1" title={`${m.capacidad} sitios`}>
            <Boton
              variante="secundario"
              oscuro
              tamano="pequeno"
              icono={Minus}
              titulo={m.capacidad <= ocupados ? "Está llena: saca antes a alguien" : "Un sitio menos"}
              disabled={m.capacidad <= Math.max(ocupados, 1)}
              onClick={() => cambiarSitios(m.numero, m.capacidad - 1)}
            />
            <span style={CIFRA}>{m.capacidad}</span>
            <Boton variante="secundario" oscuro tamano="pequeno" icono={Plus} titulo="Un sitio más" onClick={() => cambiarSitios(m.numero, m.capacidad + 1)} />
          </span>
          <Boton variante="secundario" oscuro tamano="pequeno" titulo="Deja sus familias sin mesa, en la prueba" disabled={ocupados === 0} onClick={() => vaciar(m.numero)}>
            Vaciar
          </Boton>
          <BotonQuitar
            titulo="Quitar esta mesa"
            pregunta={{
              titulo: `¿Quitar la mesa ${m.numero}?`,
              texto: ocupados > 0 ? `Tiene ${ocupados} invitado${ocupados !== 1 ? "s" : ""}: volverán a quedar sin mesa. No se borra a nadie.` : "Está vacía.",
              rotulo: "Sí",
            }}
            onClick={() => quitarMesa(m.numero)}
          />
        </div>
        {/* Una línea dorada fina entre los dos, sin llegar al borde (él, v74.8). */}
        <div className="mx-2 my-1.5" style={{ borderTop: `1px solid ${C.gold}` }} />
        <div className="flex items-baseline justify-center gap-2 font-semibold">
          Mesa {m.numero}
          <span className="px-1 rounded" style={{ ...CIFRA, ...(ocupados > m.capacidad ? { background: C.peligro, color: C.blanco } : {}) }}>
            {ocupados}/{m.capacidad}
          </span>
        </div>
      </div>
    );
  };

  return (
    <VentanaFlotante
      clave="mesas"
      titulo="Mesas y acomodación"
      onCerrar={onCerrar}
      fijo={fijo}
      llena
      ancho="min(1400px, calc(100vw - 48px))"
      // Arriba, cuántos confirmados y cuántos sin confirmar (él, v74.3), con
      // el recuadro y la cuenta de la Lista: dicen siempre lo mismo.
      extra={
        <RecuadroCifras
          cifras={[
            { label: "Confirmados", value: confirmacion.confirmados },
            { label: "Sin confirmar", value: confirmacion.sinConfirmar },
          ]}
        />
      }
    >
      <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: C.paperDark, color: C.charcoal }}>
            {!hayPrueba
              ? "PRUEBA · sin cambios"
              : prueba.cargada
                ? `PRUEBA · Acomodación ${prueba.cargada}${prueba.sucia ? " con cambios" : ""}, aún sin aplicar`
                : `PRUEBA · ${cambian} ${cambian === 1 ? "familia cambia" : "familias cambian"} de mesa, aún sin guardar`}
          </span>
          <span className="flex-1" />
          {/* Los cuatro, del mismo ancho (norma 4); en el móvil, dos y dos. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
            <Boton variante="secundario" icono={IconoPlano} aria-pressed={verPlano} onClick={() => setVerPlano((v) => !v)}>
              {verPlano ? "Ver las mesas" : "Plano de mesas"}
            </Boton>
            <Boton variante="secundario" titulo="Propone un reparto de las familias confirmadas, en la prueba: se repasa y se aplica" disabled={verPlano} onClick={autoAsignar}>
              Auto-asignar
            </Boton>
            <Boton variante="secundario" icono={Plus} onClick={anadirMesa}>
              Añadir mesa
            </Boton>
            {/* Las memorias, en el desplegable de toda la app (él, v75). */}
            <MenuFlotante
              anchor="bottom-left"
              opciones={opcionesMemorias}
              render={({ ref, toggle }) => (
                <Boton
                  ref={ref}
                  variante="secundario"
                  icono={Bookmark}
                  className="w-full"
                  disabled={!memorias}
                  titulo={memorias ? "Guardar la acomodación de ahora, o cargar una guardada" : "Falta subir el SQL de la versión 75"}
                  onClick={toggle}
                >
                  Memorias
                </Boton>
              )}
            />
          </div>
        </div>
        {aviso && <LineaAviso className="text-sm mb-2">{aviso}</LineaAviso>}
        {avisosAuto.map((a) => (
          <LineaAviso key={a.familia} className="text-sm mb-1">
            Familia {a.familia}: {a.motivo}
          </LineaAviso>
        ))}
        {guardado && (
          <p className="text-sm mb-2 flex items-center gap-1.5" style={{ color: C.ink }}>
            <Check size={16} aria-hidden /> {guardado}
          </p>
        )}

        {verPlano ? (
          // El plano, de lo que se ve en pantalla, como el resto de la ventana:
          // con una memoria cargada, sus mesas, y moverlas es parte de la prueba.
          <div className="overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
            <PlanoMesas data={{ ...data, mesas, persistMesas: cambiarMesas }} ocupacionMesa={(numero) => ocupacion(vista, numero)} />
          </div>
        ) : (
          // En el Mac, «Sin mesa» a la izquierda y cada parte con su propia
          // barra; en el móvil no caben juntas: «Sin mesa» arriba, las mesas
          // debajo (una por fila) y una sola barra para todo.
          <div className="flex flex-col sm:flex-row gap-3 overflow-y-auto sm:overflow-visible" style={{ flex: 1, minHeight: 0 }}>
            <div className="w-full sm:w-56 flex-shrink-0 sm:overflow-y-auto">
              <Columna
                nombre="Sin mesa"
                cabecera={
                  <div
                    className="flex items-baseline justify-center gap-2 rounded px-2 py-1.5 mb-2 font-semibold"
                    style={{ background: C.paperDark, color: C.ink, border: `2px dashed ${C.line}` }}
                  >
                    Sin mesa <span style={CIFRA}>· {sinMesa.length}</span>
                  </div>
                }
                familias={sinMesa}
                cogida={cogida}
                onCoger={coger}
                onSoltar={(id) => soltar(id, null)}
              />
            </div>
            <div
              className="grid gap-3 content-start sm:flex-1 sm:min-h-0 sm:overflow-y-auto"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${ANCHO_COLUMNA}px, 1fr))` }}
            >
              {ordenadas.map((m) => {
                const ocupados = ocupacion(vista, m.numero);
                return (
                  <Columna
                    key={m.numero}
                    nombre={`Mesa ${m.numero}`}
                    cabecera={cabeceraMesa(m, ocupados)}
                    llena={ocupados > m.capacidad ? C.peligro : ocupados === m.capacidad ? C.gold : null}
                    familias={familias.filter((f) => f.mesa === m.numero).sort(porNombre)}
                    cogida={cogida}
                    onCoger={coger}
                    onSoltar={(id) => soltar(id, m.numero)}
                  />
                );
              })}
              {mesas.length === 0 && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
                  Todavía no hay mesas: pulsa «Añadir mesa» para crear la primera.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap justify-end zurdo:flex-row-reverse mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          {/* La ayuda, al pie y plegada (norma 5); en el móvil, en su línea. */}
          <details className="text-xs w-full sm:w-auto mr-auto zurdo:mr-0 zurdo:ml-auto" style={{ color: C.charcoal }}>
            <summary className="cursor-pointer select-none whitespace-nowrap" style={{ opacity: OP.secundario }}>
              Cómo se usa
            </summary>
            <p className="mt-2" style={{ opacity: OP.secundario }}>
              Arrastra cada familia a su mesa; en el móvil, tócala y luego toca la mesa. Sombreadas, las que aún no han
              confirmado: su sitio queda reservado. Sentar, Vaciar y Auto-asignar son una prueba hasta «Aplicar a la
              Lista»; las mesas y sus sitios se guardan al momento.
            </p>
          </details>
          <Boton variante="secundario" onClick={descartar} disabled={!hayPrueba}>
            Descartar
          </Boton>
          <Boton variante="principal" onClick={aplicar} disabled={!hayPrueba}>
            Aplicar a la Lista
          </Boton>
        </div>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
