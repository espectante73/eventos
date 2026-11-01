// «Importar teléfonos» (él, v78.2): los teléfonos de los invitados, desde
// el archivo que exporta Contactos, en vez de escribir 140 números.
// Estrecha y con lo justo (él: «ventanas no muy anchas, simplificar»).
// El archivo se lee aquí y no sale del ordenador; nada se guarda sin pasar
// por la lista de repaso. Las reglas, en lib/importarTelefonos.js.
import { useRef, useState } from "react";
import { Contact, Check } from "lucide-react";
import { C, OP, R, T } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { nombreCompleto } from "../../lib/formato";
import { telefonoParaVer } from "../../lib/telefono";
import { leerVCard, repasoTelefonos, ponerTelefonos } from "../../lib/importarTelefonos";

const ALTO_FILA = 34;
const NUMERO = { fontFamily: "'IBM Plex Mono', monospace", fontSize: T.pequeno, whiteSpace: "nowrap" };
const DESPLEGABLE = { fontSize: T.pequeno, border: `1px solid ${C.line}`, borderRadius: R.caja, background: C.blanco, padding: "2px 4px", maxWidth: 150 };

// Una línea por invitado (norma 6): casilla, nombre y número.
function Fila({ i, marcada, onMarcar, nombre, nota, children }) {
  return (
    <label className="flex items-center gap-2 px-2 text-sm" style={{ height: ALTO_FILA, background: i % 2 ? C.paperDark : C.blanco, cursor: onMarcar ? "pointer" : undefined }}>
      {onMarcar ? <input type="checkbox" checked={marcada} onChange={(e) => onMarcar(e.target.checked)} style={{ accentColor: C.ink }} /> : <span style={{ width: 13 }} />}
      <span className="flex-1 min-w-0 truncate" title={nota ? `${nombre} · ${nota}` : nombre}>
        {nombre}
        {nota && <span style={{ color: C.charcoal, opacity: OP.secundario, fontSize: T.pequeno }}> · {nota}</span>}
      </span>
      {children}
    </label>
  );
}

export function VentanaImportarTelefonos({ data, onCerrar }) {
  const { invitados, evento, persistInvitados } = data;
  const archivoRef = useRef(null);
  const [leidos, setLeidos] = useState(null); // cuántos contactos trae el archivo
  const [repaso, setRepaso] = useState(null);
  // Lo que se va a guardar: { idInvitado: número }. Los nuevos, ya marcados.
  const [elegidos, setElegidos] = useState({});
  const [abierto, setAbierto] = useState("nuevos");
  const [aviso, setAviso] = useState("");
  const [guardado, setGuardado] = useState("");

  const leer = async (archivo) => {
    if (!archivo) return;
    setAviso("");
    const contactos = leerVCard(await archivo.text());
    if (!contactos.length) {
      setAviso("En ese archivo no hay contactos con teléfono. ¿Es el que exportaste de Contactos?");
      return;
    }
    const r = repasoTelefonos(invitados, contactos, evento);
    setLeidos(contactos.length);
    setRepaso(r);
    setElegidos(Object.fromEntries(r.nuevos.map((x) => [x.invitado.id, x.opciones[0].numero])));
  };
  const marcar = (id, numero) => setElegidos((e) => {
    const siguiente = { ...e };
    if (numero) siguiente[id] = numero;
    else delete siguiente[id];
    return siguiente;
  });
  const cuantos = Object.keys(elegidos).length;
  const guardar = () => {
    const { invitados: siguiente, aviso: texto } = ponerTelefonos(invitados, elegidos);
    if (siguiente !== invitados) persistInvitados(siguiente);
    setGuardado(texto);
  };

  // Un número a elegir entre los del contacto (si tiene más de uno).
  const numeroDe = (x) =>
    x.opciones.length > 1 ? (
      <select aria-label={`Teléfono de ${nombreCompleto(x.invitado)}`} value={elegidos[x.invitado.id] || x.opciones[0].numero} onChange={(e) => marcar(x.invitado.id, e.target.value)} onClick={(e) => e.stopPropagation()} style={DESPLEGABLE}>
        {x.opciones.map((t) => (
          <option key={t.numero} value={t.numero}>
            {telefonoParaVer(t.numero)} · {t.tipo}
          </option>
        ))}
      </select>
    ) : (
      <span style={NUMERO}>{telefonoParaVer(x.opciones[0].numero)}</span>
    );

  const apartado = (id, titulo, resumen, filas) => (
    <SeccionPlegable sencilla titulo={titulo} resumen={resumen} abierta={abierto === id} onAlternar={() => setAbierto((a) => (a === id ? null : id))}>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: R.caja, overflow: "hidden", maxHeight: "40vh", overflowY: "auto" }}>{filas}</div>
    </SeccionPlegable>
  );

  return (
    <VentanaFlotante clave="importarTelefonos" titulo="Importar teléfonos" onCerrar={onCerrar} ancho="min(420px, calc(100vw - 48px))">
      {!repaso ? (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: C.charcoal }}>
            Elige el archivo exportado de Contactos. Se lee aquí: solo nombres y teléfonos.
          </p>
          <input ref={archivoRef} type="file" accept=".vcf,text/vcard,text/x-vcard" aria-label="Archivo de contactos" className="hidden" onChange={(e) => leer(e.target.files?.[0])} />
          <Boton variante="principal" icono={Contact} onClick={() => archivoRef.current?.click()}>
            Elegir archivo
          </Boton>
          {aviso && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
          <details className="text-xs" style={{ color: C.charcoal }}>
            <summary className="cursor-pointer select-none" style={{ opacity: OP.secundario }}>
              Cómo sacar el archivo
            </summary>
            <p className="mt-2" style={{ opacity: OP.secundario }}>
              En el Mac, Contactos → ⌘A → Archivo → Exportar → Exportar vCard. Al terminar, se puede borrar.
            </p>
          </details>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
            {leidos} contactos leídos.
          </p>
          {apartado(
            "nuevos",
            "Nuevos",
            String(repaso.nuevos.length),
            repaso.nuevos.map((x, i) => (
              <Fila key={x.invitado.id} i={i} nombre={nombreCompleto(x.invitado)} marcada={Boolean(elegidos[x.invitado.id])} onMarcar={(si) => marcar(x.invitado.id, si ? x.opciones[0].numero : null)}>
                {numeroDe(x)}
              </Fila>
            ))
          )}
          {apartado(
            "distintos",
            "Distintos",
            String(repaso.distintos.length),
            repaso.distintos.map((x, i) => (
              <Fila key={x.invitado.id} i={i} nombre={nombreCompleto(x.invitado)} nota={`ahora ${telefonoParaVer(x.actual)}`} marcada={Boolean(elegidos[x.invitado.id])} onMarcar={(si) => marcar(x.invitado.id, si ? x.opciones[0].numero : null)}>
                {numeroDe(x)}
              </Fila>
            ))
          )}
          {apartado(
            "dudosos",
            "Dudosos",
            String(repaso.dudosos.length),
            repaso.dudosos.map((x, i) => (
              <Fila key={x.invitado.id} i={i} nombre={nombreCompleto(x.invitado)}>
                <select aria-label={`Contacto de ${nombreCompleto(x.invitado)}`} value={elegidos[x.invitado.id] || ""} onChange={(e) => marcar(x.invitado.id, e.target.value)} style={DESPLEGABLE}>
                  <option value="">Ninguno</option>
                  {x.candidatos.map((c) => (
                    <option key={c.numero} value={c.numero}>
                      {c.texto} · {telefonoParaVer(c.numero)}
                    </option>
                  ))}
                </select>
              </Fila>
            ))
          )}
          {apartado(
            "yaEstan",
            "Ya están",
            String(repaso.yaEstan.length),
            repaso.yaEstan.map((x, i) => (
              <Fila key={x.invitado.id} i={i} nombre={nombreCompleto(x.invitado)}>
                <span style={NUMERO}>{telefonoParaVer(x.numero)}</span>
              </Fila>
            ))
          )}
          {apartado(
            "sinEncontrar",
            "Sin encontrar",
            String(repaso.sinEncontrar.length),
            repaso.sinEncontrar.map((x, i) => <Fila key={x.invitado.id} i={i} nombre={nombreCompleto(x.invitado)} />)
          )}

          {guardado && (
            <p className="text-sm flex items-center gap-1.5" style={{ color: C.ink }}>
              <Check size={16} aria-hidden /> {guardado}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
            <Boton variante="secundario" onClick={onCerrar}>
              {guardado ? "Cerrar" : "Cancelar"}
            </Boton>
            <Boton variante="principal" className="zurdo:order-first" disabled={!cuantos || Boolean(guardado)} onClick={guardar}>
              Guardar {cuantos}
            </Boton>
          </div>
        </div>
      )}
    </VentanaFlotante>
  );
}
