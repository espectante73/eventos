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
// Con la invitación enviada, la mesa de esa familia queda fija (él, v83.1):
// candado, no se arrastra, y «Vaciar», «Auto-asignar» y las memorias la
// respetan. Tocarla abre la salvaguarda, VentanaCambiarMesa.
//
// Con ratón, una mesa se arrastra por su cabecera sobre otra (él, v83): ocupa
// su lugar y todas se renumeran, en la PRUEBA, llevándose a su gente.
//
// «Memorias» (él, v75): Acomodación 1, 2 y 3, una foto de todo (mesas,
// sitios, plano y quién se sienta dónde). Cargar una la pone como prueba,
// mesas incluidas: mientras está cargada, también las mesas son prueba.
import { useLayoutEffect, useRef, useState } from "react";
import { Check, AlertTriangle, Lock, LockOpen, Plus, Minus, Bookmark, ChevronDown, ChevronUp, Map as IconoPlano } from "lucide-react";
import { C, OP, R, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { RecuadroCifras, CirculoMesa } from "../../components/Widgets";
import { PlanoMesas } from "../../components/PlanoMesas";
import { BotonQuitar, usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { MenuFlotante } from "../../components/MenuFlotante";
import { cuentaConfirmacion, esDj, confirmadosSinMesa } from "../../lib/invitados";
import { RecuadroSiNo } from "../../components/RecuadroSiNo";
import { MarcaDj } from "../../components/MarcaDj";
import { esAparatoTactil } from "../../lib/mano";
import { VentanaCambiarMesa } from "./VentanaCambiarMesa";
import { nombreCompleto, fechaYHora } from "../../lib/formato";
import { PREGUNTA_DESCARTAR } from "../../lib/cambiosSinGuardar";
import { alergiasUniformes } from "../../lib/alergias";
import {
  conBorrador,
  borradorDesde,
  familiasParaRepartir,
  moverFamilia,
  moverMesa,
  fijosEnMesa,
  vaciarMesaEnBorrador,
  vaciarTodasEnBorrador,
  autoAsignarEnBorrador,
  aplicarBorrador,
  familiasQueCambian,
  ocupacion,
  MEMORIAS,
  PRUEBA_VACIA,
  memoriaDesde,
  conMemoria,
  cargarMemoria,
  quitarMesaRenumerando,
  cifraFamilia,
  anchoColumnas,
} from "../../lib/repartoMesas";

// El ancho de los recuadros, uno para todos (norma 6), el del nombre más
// largo (él, v98.7; `anchoColumnas`). Nunca menos de lo que pide la
// cabecera de una mesa (las sillas, el círculo y «Vaciar»), y lo que suman
// márgenes y bordes de la pastilla (px-3, borde 2, hueco 2) y del recuadro
// (p-1.5, borde 3), con un poco de holgura.
const ANCHO_MINIMO = 212;
const MEDIDAS_PASTILLA = { icono: 20, fijo: 24 + 4 + 8 + 12 + 2 * 3 + 6, minimo: ANCHO_MINIMO };
// «Sin mesa» plegada o no (él, v98.7), en este aparato.
const CLAVE_SIN_MESA_PLEGADA = "acomodacion-sin-mesa-plegada";
// Lo que lleva una mesa al arrastrarla (v83), para no confundirla con una
// familia: las dos se sueltan en la misma columna.
const MESA_ARRASTRADA = "mesa:";
// El recuadro de una mesa llena (él: «un recuadro más grueso alrededor…
// que sea visual»), y desde la v74.8 relleno del mismo color. Está
// siempre, transparente, para que llenarse no la mueva de sitio.
const GROSOR_RECUADRO = 3;

function Familia({ familia, cogida, onCoger }) {
  // Sin confirmar todavía: sombreada hasta que confirmen (él, v74.2); su
  // sitio, reservado. Con parte sin confirmar: «2+1».
  const nadieConfirmado = familia.sinConfirmar === familia.cuantos;
  const cifra = cifraFamilia(familia);
  // El DJ contratado se localiza de un vistazo (él, v84.2): en blanco y en
  // negrita, con sus auriculares. Verde no: es la cabecera de una mesa.
  const dj = esDj(familia.representante);
  return (
    <button
      type="button"
      draggable={!familia.fija}
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
        background: dj ? C.blanco : C.goldClaro,
        color: C.ink,
        border: `2px ${nadieConfirmado ? "dashed" : "solid"} ${cogida ? C.ink : C.gold}`,
        opacity: nadieConfirmado && !cogida ? OP.tenue : 1,
        cursor: familia.fija ? "pointer" : "grab",
      }}
      title={
        familia.fija
          ? `Ya tiene su invitación con la mesa ${familia.mesa}: su mesa queda fija. Tócala si hubiera que cambiarla`
          : familia.sinConfirmar
          ? `${familia.sinConfirmar === 1 ? "1 sin confirmar" : `${familia.sinConfirmar} sin confirmar`}: su sitio queda reservado. Arrástrala a otra mesa, o tócala y luego toca la mesa`
          : "Arrástrala a otra mesa, o tócala y luego toca la mesa"
      }
    >
      <span className="truncate" style={dj ? { fontWeight: 700 } : undefined}>
        <MarcaDj persona={familia.representante} />
        {familia.nombre}
      </span>
      <span className="flex items-center gap-1.5 flex-shrink-0">
        {familia.fija && <Lock size={13} aria-label="Mesa fija: invitación enviada" />}
        {/* Alergias o intolerancias: en la familia que las tiene, no en la
            mesa (él, v74.9: «solo donde aplique»). Quién y qué, al pasar
            por encima. */}
        {familia.conAlergia.length > 0 && (
          <span
            title={`Alergias o intolerancias: ${familia.conAlergia.map((g) => `${nombreCompleto(g)} (${alergiasUniformes(g.alergias)})`).join("; ")}`}
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
// sólido (él, v74.8: «el recuadro no es suficiente»). `onSoltarMesa`: otra
// mesa soltada encima, para cambiarlas de orden (v83).
function Columna({ nombre, cabecera, llena, familias, cogida, onCoger, onSoltar, onSoltarMesa }) {
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
        const dato = e.dataTransfer.getData("text/plain");
        if (dato.startsWith(MESA_ARRASTRADA)) onSoltarMesa?.(Number(dato.slice(MESA_ARRASTRADA.length)));
        else if (dato) onSoltar(dato);
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

// «Acomodación terminada» (él, v90.7): el candado del envío de invitaciones.
// Mientras diga «No», ni él ni ningún colaborador puede enviar una
// (lib/invitados.js, envioInvitacionesBloqueado). Abrirlo pregunta antes,
// con las cifras de lo que aún falta; cerrarlo otra vez, no.
function AcomodacionTerminada({ evento, invitados, hayPrueba, persistEvento, preguntar }) {
  const terminada = Boolean(evento?.acomodacionTerminada);
  const sinMesa = confirmadosSinMesa(invitados);
  const cambiar = (si) => {
    if (si === terminada) return;
    if (!si) return persistEvento({ ...evento, acomodacionTerminada: false });
    preguntar({
      titulo: "¿Acomodación terminada?",
      texto:
        "Desde ahora se podrán enviar las invitaciones, con la mesa que tenga cada familia en la Lista." +
        (sinMesa > 0 ? ` ${sinMesa === 1 ? "Queda 1 confirmado" : `Quedan ${sinMesa} confirmados`} sin mesa: su familia no la recibirá hasta tenerla.` : "") +
        (hayPrueba ? " Hay una prueba sin aplicar: las invitaciones llevan las mesas de la Lista, no las de la prueba." : ""),
      rotulo: "Sí",
      peligro: false,
      alConfirmar: () => persistEvento({ ...evento, acomodacionTerminada: true }),
    });
  };
  return (
    <RecuadroSiNo
      titulo="Acomodación terminada"
      valor={terminada}
      onCambiar={cambiar}
      icono={terminada ? LockOpen : Lock}
      nota={terminada ? "Ya se pueden enviar las invitaciones." : "Mientras diga «No», no se envía ninguna invitación."}
    />
  );
}

export function VentanaMesas({ data, prueba, setPrueba, onCerrar, fijo }) {
  const { invitados, evento, persistInvitados, persistMesas, persistEvento, ordenFamiliares } = data;
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
  // La familia con la mesa fija que se va a cambiar (su «O»), o null.
  const [cambiandoMesa, setCambiandoMesa] = useState(null);
  // Los no confirmados salen SIEMPRE, sombreados hasta que confirmen, y se
  // sientan como los demás (él, v74.2: «para cuadrar con tiempo»). Su
  // sitio queda reservado y cuenta en la mesa; «No asiste» lo libera.
  const conSinConfirmar = true;
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();

  const vista = conBorrador(invitados, borrador);
  const confirmacion = cuentaConfirmacion(invitados);
  const familias = familiasParaRepartir(vista, { conSinConfirmar, ordenFamiliares });
  const sinMesa = familias.filter((f) => f.mesa == null).sort(porNombre);

  // El ancho del nombre más largo (v98.7): se mide con un texto escondido,
  // con la letra de verdad de la pastilla. Sin medidas (las pruebas), el mínimo.
  const medidorRef = useRef(null);
  const [ancho, setAncho] = useState(ANCHO_MINIMO);
  useLayoutEffect(() => {
    const span = medidorRef.current;
    if (!span) return;
    const medir = (texto, estilo) => {
      Object.assign(span.style, estilo);
      span.textContent = texto;
      return span.getBoundingClientRect().width;
    };
    const nuevo = anchoColumnas(familias, {
      ...MEDIDAS_PASTILLA,
      medirNombre: (t, negrita) => medir(t, { fontFamily: "", fontWeight: negrita ? "700" : "400" }),
      medirCifra: (t) => medir(t, { fontFamily: "'Fraunces', serif", fontWeight: "700" }),
    });
    span.textContent = "";
    setAncho(nuevo);
  });

  const [sinMesaPlegada, setSinMesaPlegada] = useState(() => {
    try {
      return window.localStorage.getItem(CLAVE_SIN_MESA_PLEGADA) === "1";
    } catch {
      return false;
    }
  });
  const plegarSinMesa = () =>
    setSinMesaPlegada((p) => {
      try {
        window.localStorage.setItem(CLAVE_SIN_MESA_PLEGADA, p ? "0" : "1");
      } catch {
        // Sin almacenamiento: se pliega solo esta vez.
      }
      return !p;
    });
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
    const { borrador: siguiente, aviso: motivo } = moverFamilia(invitados, borrador, idRepresentante, numero, mesas, { conSinConfirmar, ordenFamiliares });
    setAviso(motivo);
    if (!motivo) setBorrador(siguiente);
  };
  // Una mesa soltada sobre otra (v83): ocupa su lugar y todas se renumeran.
  const soltarMesa = (desde, hasta) => {
    limpiarAvisos();
    const { aviso: motivo, ...siguiente } = moverMesa(invitados, borrador, mesas, desde, hasta, ordenFamiliares);
    setAviso(motivo);
    if (siguiente.mesas !== mesas) cambiar(siguiente);
  };
  const coger = (id) => {
    setAviso("");
    // Con la mesa fija, tocarla es ir a la salvaguarda, que actúa sobre la
    // Lista de verdad: con una prueba a medias, primero hay que cerrarla.
    if (familias.find((f) => f.representante.id === id)?.fija) {
      setCogida(null);
      if (hayPrueba) setAviso("Esa familia ya tiene su invitación. Para cambiarle la mesa, antes aplica o descarta la prueba.");
      else setCambiandoMesa(id);
      return;
    }
    setCogida((actual) => (actual === id ? null : id));
  };
  // Vaciar va a la prueba: no pregunta, se deshace con «Descartar».
  const vaciar = (numero) => {
    limpiarAvisos();
    setBorrador(vaciarMesaEnBorrador(invitados, borrador, numero, ordenFamiliares));
  };
  // «Vaciar mesas» (él, v75.1): todas a la vez; mueve a todo el mundo,
  // así que pregunta antes. Las mesas se quedan.
  const sentados = mesas.reduce((total, m) => total + ocupacion(vista, m.numero) - fijosEnMesa(vista, m.numero, ordenFamiliares), 0);
  const vaciarTodas = () =>
    preguntar({
      titulo: "¿Vaciar todas las mesas?",
      texto: `${sentados === 1 ? "1 invitado pasa" : `${sentados} invitados pasan`} a «Sin mesa», en la prueba. Las mesas se quedan; «Descartar» lo deshace.`,
      rotulo: "Sí",
      peligro: false,
      alConfirmar: () => {
        limpiarAvisos();
        setBorrador(vaciarTodasEnBorrador(invitados, borrador, ordenFamiliares));
      },
    });
  const autoAsignar = () => {
    limpiarAvisos();
    const { borrador: siguiente, avisos } = autoAsignarEnBorrador(invitados, borrador, mesas);
    setBorrador(siguiente);
    setAvisosAuto(avisos);
  };
  // Al aplicar, la prueba pasa a la Lista y los botones se apagan: se dice
  // aquí que está guardado (norma 9), o parecería que no ha hecho nada.
  // Con una memoria cargada, también sus mesas; quien quedara en una mesa
  // que ya no existe, sin mesa. Primero las mesas, y esperando: un invitado
  // no puede apuntar a un número que todavía no existe (v83).
  const aplicar = async () => {
    if (prueba.mesas && (await persistMesas(prueba.mesas))) return;
    const numeros = new Set(mesas.map((m) => m.numero));
    persistInvitados(aplicarBorrador(invitados, borrador, ordenFamiliares).map((g) => (g.mesa != null && !numeros.has(g.mesa) ? { ...g, mesa: null } : g)));
    limpiarAvisos();
    setGuardado(
      prueba.cargada
        ? `Guardado en la Lista: Acomodación ${prueba.cargada}.`
        : cambian === 0
          ? "Guardado: las mesas, en su nuevo orden."
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
      texto: `Se guardó el ${fechaYHora(yaHabia.guardadaEl)}. Se cambia por lo que se ve ahora.`,
      rotulo: "Sí",
      peligro: false,
      alConfirmar: hacer,
    });
  };
  const cargar = (memoria) => {
    const hacer = () => {
      const { mesas: suyas, borrador: suyo, aviso: nota } = cargarMemoria(invitados, memoria, { ordenFamiliares, mesasReales: data.mesas });
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
  // se borra a nadie. Las demás quedan 1, 2, 3…, cada una con su gente (él,
  // v98.4), con la regla de lib/repartoMesas.js.
  const quitarMesa = async (numero) => {
    limpiarAvisos();
    if (prueba.mesas) {
      const { invitados: enLaPrueba, mesas: siguientes, aviso: motivo } = quitarMesaRenumerando(vista, mesas, numero, ordenFamiliares);
      if (motivo) return setAviso(motivo);
      return cambiar({ mesas: siguientes, borrador: borradorDesde(invitados, enLaPrueba) });
    }
    const { invitados: lista, mesas: siguientes, aviso: motivo } = quitarMesaRenumerando(invitados, mesas, numero, ordenFamiliares);
    if (motivo) return setAviso(motivo);
    // Primero las mesas, y esperando: un invitado no puede apuntar a un
    // número que todavía no existe (como al aplicar).
    if (await persistMesas(siguientes)) return;
    if (lista.some((g, k) => g !== invitados[k])) persistInvitados(lista);
    // La prueba a medias, con los números nuevos.
    if (Object.keys(borrador).length) setBorrador(borradorDesde(lista, quitarMesaRenumerando(vista, mesas, numero, ordenFamiliares).invitados));
  };

  // Con ratón, la cabecera entera se arrastra (él, v83); en el móvil, no.
  const arrastrarMesas = !esAparatoTactil();
  const cabeceraMesa = (m, ocupados) => {
    const fijos = fijosEnMesa(vista, m.numero, ordenFamiliares);
    return (
      <div
        data-cabecera-mesa={m.numero}
        draggable={arrastrarMesas}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", `${MESA_ARRASTRADA}${m.numero}`);
          e.dataTransfer.effectAllowed = "move";
        }}
        title={arrastrarMesas ? "Arrástrala sobre otra mesa para cambiar el orden: se renumeran solas" : undefined}
        className="rounded px-2 py-1.5 mb-2"
        style={{ background: C.ink, color: C.goldClaro, cursor: arrastrarMesas ? "grab" : undefined }}
      >
        {/* En una sola fila (él, v98.5-98.6): en el centro del recuadro, el
            número en su círculo dorado, grande, el de las tarjetas; a un
            lado las sillas en vertical (poner arriba, quitar abajo) con la
            cuenta «sentados/sitios» entre las dos; al otro, quitar la mesa y
            debajo «Vaciar». Los dos lados, del mismo ancho (flex-1), para que
            el círculo quede en medio. Sin la raya dorada. Las alergias, en
            cada familia (v74.9). */}
        <div data-controles className="flex items-center gap-1 zurdo:flex-row-reverse">
          <span className="flex-1 flex justify-start zurdo:justify-end">
            <span className="flex flex-col items-center gap-0.5">
              <Boton variante="secundario" oscuro tamano="pequeno" icono={Plus} titulo="Un sitio más" onClick={() => cambiarSitios(m.numero, m.capacidad + 1)} />
              <span
                className="px-1 rounded"
                title={`${ocupados} sentados de ${m.capacidad} sitios`}
                style={{ ...CIFRA, ...(ocupados > m.capacidad ? { background: C.peligro, color: C.blanco } : {}) }}
              >
                {ocupados}/{m.capacidad}
              </span>
              <Boton
                variante="secundario"
                oscuro
                tamano="pequeno"
                icono={Minus}
                titulo={m.capacidad <= ocupados ? "Está llena: saca antes a alguien" : "Un sitio menos"}
                disabled={m.capacidad <= Math.max(ocupados, 1)}
                onClick={() => cambiarSitios(m.numero, m.capacidad - 1)}
              />
            </span>
          </span>
          <CirculoMesa numero={m.numero} tamano={72} letra={T.gigante} />
          <span className="flex-1 flex flex-col items-end gap-1 zurdo:items-start">
            <BotonQuitar
              titulo={fijos > 0 ? "Tiene familias con su invitación enviada: no se puede quitar" : "Quitar esta mesa"}
              disabled={fijos > 0}
              pregunta={{
                titulo: `¿Quitar la mesa ${m.numero}?`,
                texto:
                  (ocupados > 0 ? `Tiene ${ocupados} invitado${ocupados !== 1 ? "s" : ""}: volverán a quedar sin mesa. No se borra a nadie.` : "Está vacía.") +
                  (ordenadas.filter((x) => x.numero !== m.numero).some((x, k) => x.numero !== k + 1) ? " Las demás quedan 1, 2, 3…, cada una con su gente." : ""),
                rotulo: "Sí",
              }}
              onClick={() => quitarMesa(m.numero)}
            />
            <Boton variante="secundario" oscuro tamano="pequeno" titulo="Deja sus familias sin mesa, en la prueba; las que ya tienen su invitación se quedan" disabled={ocupados - fijos <= 0} onClick={() => vaciar(m.numero)}>
              Vaciar
            </Boton>
          </span>
        </div>
      </div>
    );
  };

  const familiaCambiando = cambiandoMesa ? familias.find((f) => f.representante.id === cambiandoMesa) : null;

  return (
    <>
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
        <AcomodacionTerminada evento={evento} invitados={invitados} hayPrueba={hayPrueba} persistEvento={persistEvento} preguntar={preguntar} />
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: C.paperDark, color: C.charcoal }}>
            {!hayPrueba
              ? "PRUEBA · sin cambios"
              : prueba.cargada
                ? `PRUEBA · Acomodación ${prueba.cargada}${prueba.sucia ? " con cambios" : ""}, aún sin aplicar`
                : cambian === 0
                  ? "PRUEBA · mesas en otro orden, aún sin guardar"
                  : `PRUEBA · ${cambian} ${cambian === 1 ? "familia cambia" : "familias cambian"} de mesa, aún sin guardar`}
          </span>
          <span className="flex-1" />
          {/* Los cuatro, del mismo ancho (norma 4); en el móvil, dos y dos. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
            <Boton variante="secundario" icono={IconoPlano} aria-pressed={verPlano} onClick={() => setVerPlano((v) => !v)}>
              {verPlano ? "Ver las mesas" : "Plano de mesas"}
            </Boton>
            <Boton variante="secundario" titulo="Propone un reparto de todas las familias, también las que aún no han confirmado (nunca los «No asiste»), en la prueba: se repasa y se aplica" disabled={verPlano} onClick={autoAsignar}>
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

        {/* El medidor del nombre más largo (v98.7): escondido, con la letra de las pastillas. */}
        <span ref={medidorRef} aria-hidden className="text-sm" style={{ position: "absolute", left: 0, top: 0, visibility: "hidden", whiteSpace: "nowrap", pointerEvents: "none" }} />
        {verPlano ? (
          // El plano, de lo que se ve en pantalla, como el resto de la ventana:
          // con una memoria cargada, sus mesas, y moverlas es parte de la prueba.
          // Sin desplazar aquí (v94.2): lo que se desliza es el plano, dentro
          // de su marco; su línea de mandos se queda quieta arriba.
          <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
            <PlanoMesas data={{ ...data, mesas, persistMesas: cambiarMesas }} ocupacionMesa={(numero) => ocupacion(vista, numero)} />
          </div>
        ) : (
          // En el Mac, «Sin mesa» a la izquierda y cada parte con su propia
          // barra; en el móvil no caben juntas: «Sin mesa» arriba, las mesas
          // debajo (una por fila) y una sola barra para todo.
          <div className="flex flex-col sm:flex-row gap-3 overflow-y-auto sm:overflow-visible" style={{ flex: 1, minHeight: 0 }}>
            {/* Del mismo ancho que las mesas; en el móvil, centrada como ellas. */}
            <div className="flex-shrink-0 mx-auto sm:mx-0 sm:overflow-y-auto" style={{ width: ancho, maxWidth: "100%" }}>
              <Columna
                nombre="Sin mesa"
                cabecera={
                  // Como la cabecera de una mesa: arriba, su botón («Vaciar
                  // mesas», él, v75.1: aquí es adonde van todos); debajo, el título.
                  <div className="rounded px-2 py-1.5 mb-2" style={{ background: C.paperDark, color: C.ink, border: `2px dashed ${C.line}` }}>
                    <div data-controles className="flex justify-center">
                      <Boton variante="secundario" tamano="pequeno" titulo="Deja todas las mesas vacías, en la prueba; las mesas se quedan" disabled={sentados === 0} onClick={vaciarTodas}>
                        Vaciar mesas
                      </Boton>
                    </div>
                    <div className="mx-2 my-1.5" style={{ borderTop: `1px solid ${C.gold}` }} />
                    {/* Plegable (él, v98.7): plegada, solo esta cabecera, y
                        se sigue pudiendo soltar familias en ella. La flecha,
                        del lado del pulgar; el título, en el centro. */}
                    <div className="flex items-center gap-2 font-semibold zurdo:flex-row-reverse">
                      <span className="flex-1" />
                      <span>
                        Sin mesa <span style={CIFRA}>· {sinMesa.length}</span>
                      </span>
                      <span data-controles className="flex-1 flex justify-end zurdo:justify-start">
                        <Boton
                          variante="secundario"
                          tamano="pequeno"
                          icono={sinMesaPlegada ? ChevronDown : ChevronUp}
                          titulo={sinMesaPlegada ? "Desplegar «Sin mesa»" : "Plegar «Sin mesa»"}
                          aria-expanded={!sinMesaPlegada}
                          onClick={plegarSinMesa}
                        />
                      </span>
                    </div>
                  </div>
                }
                familias={sinMesaPlegada ? [] : sinMesa}
                cogida={cogida}
                onCoger={coger}
                onSoltar={(id) => soltar(id, null)}
              />
            </div>
            <div
              className="grid gap-3 content-start justify-center sm:justify-start sm:flex-1 sm:min-h-0 sm:overflow-y-auto"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(0, ${ancho}px))` }}
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
                    onSoltarMesa={(desde) => soltarMesa(desde, m.numero)}
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
              Lista»; las mesas y sus sitios se guardan al momento. Con candado, las familias que ya tienen su invitación: su mesa queda fija; tócalas si hubiera que cambiarla. Con el ratón, arrastra una mesa por su cabecera sobre otra para cambiar el orden: se renumeran solas, también en la prueba. Al quitar una, las demás se corren y quedan 1, 2, 3…
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
    {familiaCambiando && <VentanaCambiarMesa data={data} familia={familiaCambiando} onCerrar={() => setCambiandoMesa(null)} />}
    </>
  );
}
