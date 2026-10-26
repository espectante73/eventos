// «Repartir familias» (él, v74): probar el reparto de mesas moviendo
// familias enteras, en su ventana propia («que ocupe la pantalla y verlo
// en grande»; en el Mac, una ventana del sistema, como la Lista). A la
// izquierda, «Sin mesa»; a la derecha, una columna por mesa con «Mesa 6 ·
// 7/9» (ocupados de los que caben). Cada familia, con el nombre de su «O»
// y cuántos son. Se arrastra a otra columna o, en el móvil, se toca la
// familia y luego la mesa. Una familia no entra donde no cabe: se queda
// donde estaba y se dice cuántos sitios quedan (lib/repartoMesas.js).
//
// Es una PRUEBA: el borrador vive en VistaAnfitrion (sobrevive a cerrar la
// ventana) y nada cambia en la Lista hasta «Aplicar a la Lista».
import { useState } from "react";
import { Check } from "lucide-react";
import { C, OP, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { RecuadroCifras } from "../../components/Widgets";
import { cuentaConfirmacion } from "../../lib/invitados";
import { usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { PREGUNTA_DESCARTAR } from "../../lib/cambiosSinGuardar";
import { conBorrador, familiasParaRepartir, moverFamilia, aplicarBorrador, familiasQueCambian, ocupacion } from "../../lib/repartoMesas";

// El ancho de una columna, una sola vez (norma 6): 224 px = `sm:w-56` de
// «Sin mesa», que en el móvil va arriba, a todo lo ancho.
const ANCHO_COLUMNA = 224;

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
      <b style={{ fontFamily: "'Fraunces', serif" }}>{cifra}</b>
    </button>
  );
}

function Columna({ titulo, cifra, pasada, sinMesa, familias, cogida, onCoger, onSoltar }) {
  const [encima, setEncima] = useState(false);
  return (
    <div
      data-columna={titulo}
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
      // Con una familia cogida (el móvil), tocar la columna la deja aquí.
      onClick={(e) => {
        if (cogida && !e.target.closest("[data-familia]")) onSoltar(cogida);
      }}
      className="rounded p-1.5"
      style={{
        width: sinMesa ? "100%" : undefined,
        background: encima || cogida ? C.paperDark : "transparent",
        cursor: cogida ? "pointer" : undefined,
      }}
    >
      <div
        className="flex items-baseline justify-center gap-2 rounded px-2 py-1.5 mb-2 font-semibold"
        style={{
          background: sinMesa ? C.paperDark : C.ink,
          color: sinMesa ? C.ink : C.goldClaro,
          border: `2px ${sinMesa ? "dashed" : "solid"} ${pasada ? C.peligro : sinMesa ? C.line : C.ink}`,
        }}
      >
        {titulo}
        <span
          className="px-1 rounded"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: T.pequeno,
            ...(pasada ? { background: C.peligro, color: C.blanco } : {}),
          }}
        >
          {cifra}
        </span>
      </div>
      {familias.map((f) => (
        <Familia key={f.clave} familia={f} cogida={cogida === f.representante.id} onCoger={onCoger} />
      ))}
    </div>
  );
}

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");

export function VentanaRepartoMesas({ data, borrador, setBorrador, onCerrar, fijo }) {
  const { invitados, mesas, persistInvitados } = data;
  const [cogida, setCogida] = useState(null);
  const [aviso, setAviso] = useState("");
  const [guardado, setGuardado] = useState("");
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

  const soltar = (idRepresentante, numero) => {
    setCogida(null);
    const { borrador: siguiente, aviso: motivo } = moverFamilia(invitados, borrador, idRepresentante, numero, mesas, { conSinConfirmar });
    setAviso(motivo);
    setGuardado("");
    if (!motivo) setBorrador(siguiente);
  };
  const coger = (id) => {
    setAviso("");
    setCogida((actual) => (actual === id ? null : id));
  };
  // Al aplicar, la prueba pasa a la Lista y los botones se apagan: se dice
  // aquí que está guardado (norma 9), o parecería que no ha hecho nada.
  const aplicar = () => {
    persistInvitados(aplicarBorrador(invitados, borrador));
    setGuardado(`Guardado en la Lista: ${cambian === 1 ? "1 familia cambia" : `${cambian} familias cambian`} de mesa.`);
    setBorrador({});
  };
  const descartar = () =>
    preguntar({ ...PREGUNTA_DESCARTAR, peligro: false, alConfirmar: () => setBorrador({}) });

  return (
    <VentanaFlotante
      clave="repartoMesas"
      titulo="Repartir familias"
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
            {cambian === 0 ? "PRUEBA · sin cambios" : `PRUEBA · ${cambian} ${cambian === 1 ? "familia cambia" : "familias cambian"} de mesa, aún sin guardar`}
          </span>
          <span className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
            Arrastra cada familia a su mesa; en el móvil, tócala y luego toca la mesa. Sombreadas, las que aún no han confirmado.
          </span>
        </div>
        {aviso && <LineaAviso className="text-sm mb-2">{aviso}</LineaAviso>}
        {guardado && (
          <p className="text-sm mb-2 flex items-center gap-1.5" style={{ color: C.ink }}>
            <Check size={16} aria-hidden /> {guardado}
          </p>
        )}

        {/* En el Mac, «Sin mesa» a la izquierda y cada parte con su propia
            barra; en el móvil no caben juntas: «Sin mesa» arriba, las mesas
            debajo (una por fila) y una sola barra para todo. */}
        <div className="flex flex-col sm:flex-row gap-3 overflow-y-auto sm:overflow-visible" style={{ flex: 1, minHeight: 0 }}>
          <div className="w-full sm:w-56 flex-shrink-0 sm:overflow-y-auto">
            <Columna
              titulo="Sin mesa"
              cifra={`· ${sinMesa.length}`}
              sinMesa
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
            {[...mesas]
              .sort((a, b) => a.numero - b.numero)
              .map((m) => {
                const ocupados = ocupacion(vista, m.numero);
                return (
                  <Columna
                    key={m.numero}
                    titulo={`Mesa ${m.numero}`}
                    cifra={`${ocupados}/${m.capacidad}`}
                    pasada={ocupados > m.capacidad}
                    familias={familias.filter((f) => f.mesa === m.numero).sort(porNombre)}
                    cogida={cogida}
                    onCoger={coger}
                    onSoltar={(id) => soltar(id, m.numero)}
                  />
                );
              })}
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end zurdo:flex-row-reverse mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <Boton variante="secundario" onClick={descartar} disabled={cambian === 0}>
            Descartar
          </Boton>
          <Boton variante="principal" onClick={aplicar} disabled={cambian === 0}>
            Aplicar a la Lista
          </Boton>
        </div>
      </div>
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
