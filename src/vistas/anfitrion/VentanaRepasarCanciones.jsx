// «Repasar canciones» (él, v80): busca en Deezer cada canción distinta de la
// lista que aún no se ha buscado (de 8 en 8; cada tanda se guarda al
// momento, así cerrar a medias no pierde nada) y propone cómo dejarla
// escrita: canción y cantante, cada uno en su hueco. Él marca lo que se
// aplica, y se corrige en todas las fichas que la pidieron. Mismo modelo que
// «Importar teléfonos». Las reglas, en lib/repasoCanciones.js.
//
// Desde aquí también se corrige a mano (el lápiz de cada fila, v80.1): la
// que Deezer no encontró o cuya propuesta no sirve, en todas sus
// peticiones. Escrita de otra forma, se vuelve a buscar sola.
import { useEffect, useRef, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { C, OP, R, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { FilaMarcable as Fila } from "../../components/FilaMarcable";
import { VentanaCorregirCancion } from "./VentanaCorregirCancion";
import { EscucharCancion } from "../../components/EscucharCancion";
import { consultaDeFila } from "../../lib/escuchar";
import { cancionesPedidas } from "../../lib/canciones";
import { cancionesDistintas, sinBuscar, consultaDe, conResultados, repasoCanciones, aplicarRepaso, fueraDjTrasRepaso, minutosYSegundos, POR_TANDA } from "../../lib/repasoCanciones";

const DURACION = { fontFamily: "'IBM Plex Mono', monospace", fontSize: T.pequeno, whiteSpace: "nowrap" };

export function VentanaRepasarCanciones({ data, onCerrar }) {
  const { invitados, evento, persistInvitados, buscarCanciones, actualizarCatalogoCanciones, persistCancionesFueraDj } = data;
  const catalogo = evento?.catalogoCanciones || {};
  const distintas = cancionesDistintas(cancionesPedidas(invitados, () => null));
  const repaso = repasoCanciones(distintas, catalogo);
  // Lo que se está buscando: { hechas, total } mientras dura.
  const [busqueda, setBusqueda] = useState(null);
  // La canción que se corrige a mano: su clave.
  const [corrigiendo, setCorrigiendo] = useState(null);
  const [error, setError] = useState("");
  // Lo que él cambia a mano; si no, una propuesta nueva va marcada y una
  // que ya descartó, no.
  const [marcas, setMarcas] = useState({});
  const [abierto, setAbierto] = useState("proponer");
  const [hecho, setHecho] = useState("");

  // Busca lo que falte: al abrir y cada vez que aparece una canción nueva
  // (una corregida a mano es otra canción). Lee siempre lo último (`ahora`),
  // y cada canción se intenta una vez por ventana: si Deezer falló, se
  // vuelve a intentar al abrirla otra vez.
  const ahora = useRef({});
  ahora.current = { distintas, catalogo };
  const buscando = useRef(false);
  const intentadas = useRef(new Set());
  const viva = useRef(true);
  useEffect(() => {
    viva.current = true;
    return () => {
      viva.current = false;
    };
  }, []);
  // Una canción, tal como está escrita (si se corrige, es otra búsqueda).
  const intento = (d) => `${d.clave}|${consultaDe(d.cancion)}`;
  const pendientes = () => sinBuscar(ahora.current.distintas, ahora.current.catalogo).filter((d) => !intentadas.current.has(intento(d)));
  const clavesPendientes = pendientes().map(intento).join("·");
  useEffect(() => {
    if (!clavesPendientes || buscando.current) return;
    buscando.current = true;
    (async () => {
      let hechas = 0;
      for (let tanda = pendientes().slice(0, POR_TANDA); tanda.length && viva.current; tanda = pendientes().slice(0, POR_TANDA)) {
        setBusqueda({ hechas, total: hechas + pendientes().length });
        tanda.forEach((d) => intentadas.current.add(intento(d)));
        const r = await buscarCanciones(tanda.map((d) => consultaDe(d.cancion)));
        if (r.error) {
          if (viva.current) setError(`No se pudo preguntar a Deezer: ${r.error} Vuelve a abrir esta ventana para seguir donde se quedó.`);
          break;
        }
        await actualizarCatalogoCanciones((c) => conResultados(c, tanda, r.resultados));
        hechas += tanda.length;
      }
      buscando.current = false;
      if (viva.current) setBusqueda(null);
    })();
  }, [clavesPendientes]);

  const marcada = (p) => marcas[p.clave] ?? !p.descartada;
  const cuantas = repaso.proponer.filter(marcada).length;
  const aplicar = () => {
    const aplicadas = repaso.proponer.filter(marcada).map((p) => p.clave);
    const { invitados: siguientes, catalogo: nuevo, aviso } = aplicarRepaso(invitados, catalogo, {
      aplicar: aplicadas,
      descartar: repaso.proponer.filter((p) => !marcada(p)).map((p) => p.clave),
    });
    if (siguientes !== invitados) persistInvitados(siguientes);
    actualizarCatalogoCanciones(() => nuevo);
    persistCancionesFueraDj((lista) => fueraDjTrasRepaso(lista, catalogo, aplicadas));
    setMarcas({});
    setHecho(aviso);
  };

  // Al final de cada fila: su duración, el ▶ para escucharla (v81.1) y el
  // lápiz para escribirla a mano.
  const final = (d, segundos) => (
    <>
      {segundos !== undefined && <span style={DURACION}>{segundos ? minutosYSegundos(segundos) : "—"}</span>}
      <EscucharCancion consulta={consultaDeFila(d, catalogo)} buscar={data.buscarParaEscuchar} />
      <Boton variante="secundario" tamano="pequeno" icono={Pencil} titulo="Corregir a mano" onClick={() => setCorrigiendo(d.clave)} />
    </>
  );
  const apartado = (id, titulo, filas, ayuda) => (
    <SeccionPlegable sencilla titulo={titulo} resumen={String(filas.length)} abierta={abierto === id} onAlternar={() => setAbierto((a) => (a === id ? null : id))}>
      {ayuda && (
        <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: OP.secundario }}>
          {ayuda}
        </p>
      )}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden", maxHeight: "40vh", overflowY: "auto" }}>{filas}</div>
    </SeccionPlegable>
  );

  return (
    <>
    <VentanaFlotante clave="repasarCanciones" titulo="Repasar canciones" onCerrar={onCerrar} ancho="min(440px, calc(100vw - 48px))">
      <div className="space-y-2">
        <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
          {busqueda ? `Buscando en Deezer… ${busqueda.hechas} de ${busqueda.total}` : `${distintas.length} canciones distintas, comparadas con Deezer.`}
        </p>
        {error && <LineaAviso className="text-sm">{error}</LineaAviso>}
        {apartado(
          "proponer",
          "Para corregir",
          repaso.proponer.map((p, i) => (
            <Fila key={p.clave} i={i} nombre={p.propuesta} nota={`escrita «${p.cancion}»`} marcada={marcada(p)} onMarcar={(si) => setMarcas((m) => ({ ...m, [p.clave]: si }))}>
              {final(p, p.duracion)}
            </Fila>
          )),
          "Como la tiene Deezer. Marca las que quieras corregir: se cambian en todas las fichas que la pidieron."
        )}
        {apartado(
          "bien",
          "Bien escritas",
          repaso.bien.map((b, i) => (
            <Fila key={b.clave} i={i} nombre={b.cancion}>
              {final(b, b.duracion)}
            </Fila>
          ))
        )}
        {apartado(
          "noEncontradas",
          "No encontradas",
          repaso.noEncontradas.map((n, i) => (
            <Fila key={n.clave} i={i} nombre={n.cancion}>
              {final(n)}
            </Fila>
          )),
          "Corrígelas con el lápiz: escritas de otra forma, se vuelven a buscar. En la lista salen en rojo."
        )}

        {hecho && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: C.ink }}>
            <Check size={16} aria-hidden /> {hecho}
          </p>
        )}
        {/* Al pie, Cerrar y Aplicar, iguales (normas 4 y 5); «Aplicar», del lado del pulgar. */}
        <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <Boton variante="secundario" onClick={onCerrar}>
            Cerrar
          </Boton>
          <Boton variante="principal" className="zurdo:order-first" disabled={!cuantas || Boolean(busqueda)} onClick={aplicar}>
            Corregir {cuantas}
          </Boton>
        </div>
      </div>
    </VentanaFlotante>
    {/* Fuera de esta ventana, no dentro: una flotante dentro de otra queda
        recortada por ella. */}
    {corrigiendo && <VentanaCorregirCancion data={data} peticion={{ clave: corrigiendo }} onCerrar={() => setCorrigiendo(null)} />}
    </>
  );
}
