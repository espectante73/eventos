// «Repasar canciones» (él, v80): busca en Deezer cada canción distinta de la
// lista que aún no se ha buscado (de 8 en 8; cada tanda se guarda al
// momento, así cerrar a medias no pierde nada) y propone cómo dejarla
// escrita: canción y cantante, cada uno en su hueco. Él marca lo que se
// aplica, y se corrige en todas las fichas que la pidieron. Mismo modelo que
// «Importar teléfonos». Las reglas, en lib/repasoCanciones.js.
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { C, OP, R, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { FilaMarcable as Fila } from "../../components/FilaMarcable";
import { cancionesPedidas } from "../../lib/canciones";
import { cancionesDistintas, sinBuscar, consultaDe, conResultados, repasoCanciones, aplicarRepaso, minutosYSegundos, POR_TANDA } from "../../lib/repasoCanciones";

const DURACION = { fontFamily: "'IBM Plex Mono', monospace", fontSize: T.pequeno, whiteSpace: "nowrap" };

export function VentanaRepasarCanciones({ data, onCerrar }) {
  const { invitados, evento, persistInvitados, buscarCanciones, actualizarCatalogoCanciones } = data;
  const catalogo = evento?.catalogoCanciones || {};
  const distintas = cancionesDistintas(cancionesPedidas(invitados, () => null));
  const repaso = repasoCanciones(distintas, catalogo);
  // Lo que se busca al abrir: { hechas, total } mientras dura.
  const [busqueda, setBusqueda] = useState(null);
  const [error, setError] = useState("");
  // Lo que él cambia a mano; si no, una propuesta nueva va marcada y una
  // que ya descartó, no.
  const [marcas, setMarcas] = useState({});
  const [abierto, setAbierto] = useState("proponer");
  const [hecho, setHecho] = useState("");

  useEffect(() => {
    let viva = true;
    const pendientes = sinBuscar(distintas, catalogo);
    if (!pendientes.length) return undefined;
    (async () => {
      setBusqueda({ hechas: 0, total: pendientes.length });
      for (let i = 0; i < pendientes.length && viva; i += POR_TANDA) {
        const tanda = pendientes.slice(i, i + POR_TANDA);
        const r = await buscarCanciones(tanda.map((d) => consultaDe(d.cancion)));
        if (r.error) {
          if (viva) setError(`No se pudo preguntar a Deezer: ${r.error} Vuelve a abrir esta ventana para seguir donde se quedó.`);
          break;
        }
        await actualizarCatalogoCanciones((c) => conResultados(c, tanda.map((d) => d.clave), r.resultados));
        if (viva) setBusqueda({ hechas: i + tanda.length, total: pendientes.length });
      }
      if (viva) setBusqueda(null);
    })();
    return () => {
      viva = false;
    };
    // Una vez, al abrir: las que vayan apareciendo se buscan la próxima vez.
  }, []);

  const marcada = (p) => marcas[p.clave] ?? !p.descartada;
  const cuantas = repaso.proponer.filter(marcada).length;
  const aplicar = () => {
    const { invitados: siguientes, catalogo: nuevo, aviso } = aplicarRepaso(invitados, catalogo, {
      aplicar: repaso.proponer.filter(marcada).map((p) => p.clave),
      descartar: repaso.proponer.filter((p) => !marcada(p)).map((p) => p.clave),
    });
    if (siguientes !== invitados) persistInvitados(siguientes);
    actualizarCatalogoCanciones(() => nuevo);
    setMarcas({});
    setHecho(aviso);
  };

  const duracion = (segundos) => <span style={DURACION}>{segundos ? minutosYSegundos(segundos) : "—"}</span>;
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
              {duracion(p.duracion)}
            </Fila>
          )),
          "Como la tiene Deezer. Marca las que quieras corregir: se cambian en todas las fichas que la pidieron."
        )}
        {apartado(
          "bien",
          "Bien escritas",
          repaso.bien.map((b, i) => (
            <Fila key={b.clave} i={i} nombre={b.cancion}>
              {duracion(b.duracion)}
            </Fila>
          ))
        )}
        {apartado(
          "noEncontradas",
          "No encontradas",
          repaso.noEncontradas.map((n, i) => <Fila key={n.clave} i={i} nombre={n.cancion} />),
          "Corrígelas tocándolas en «Canciones para bailar»: escritas de otra forma, se vuelven a buscar."
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
  );
}
