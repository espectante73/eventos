// Acreditar por QR en la entrada (él, v83.2): lo que se abre al leer con el
// móvil el QR de una invitación (?acreditar=<código>). «¿Vienen todos?»; con
// «No», se elige quiénes. Pensada para dos o más móviles a la vez: todo se
// guarda en la base, y si otro ya la ha leído sale «Ya acreditados». Quién
// puede y qué se comprueba, en acreditar_marcar; qué se enseña, en lib/acreditar.js.
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { C, DEDO, OP, R, S, T } from "../theme";
import { Boton, EnlaceTexto } from "../components/Boton";
import { Stamp } from "../components/Widgets";
import { LineaAviso } from "../components/LineaAviso";
import { nombreCompleto } from "../lib/formato";
import { MOTIVOS_ACREDITAR, motivoDeLectura, pantallaInicial, seleccionInicial, sePuedeMarcar, textoMesas } from "../lib/acreditar";
import { useCanalAsistencia } from "../lib/useCanalAsistencia";
import { codigoAcreditarDe } from "../lib/url";
import { LectorQr } from "../components/LectorQr";

function Pagina({ titulo, children }) {
  return (
    <div className="min-h-screen flex items-start justify-center p-4" style={{ background: C.paper, fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full rounded-lg overflow-hidden mt-6" style={{ maxWidth: 380, background: C.paper, boxShadow: S.flotante }}>
        <div className="panel-flotante-cristal rounded-t-lg px-4 py-3">
          <h1 className="text-lg" style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700 }}>
            {titulo}
          </h1>
        </div>
        <div className="p-4 space-y-3 text-sm" style={{ color: C.charcoal }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Sin sesión: quien lee su propio QR, o un acomodador que aún no ha entrado.
export function AcreditarSinSesion({ onEntrar }) {
  return (
    <Pagina titulo="Las Bodas de todos">
      <p style={{ color: C.ink }}>Esta invitación se enseña en la entrada: allí la leerán.</p>
      <EnlaceTexto className="py-2" onClick={onEntrar}>
        Soy del equipo: entrar
      </EnlaceTexto>
    </Pagina>
  );
}

export function VistaAcreditar({ codigo: codigoInicial }) {
  // El de la familia que hay en pantalla: el del enlace que abrió esto o el
  // último leído con la cámara de la página (v83.8).
  const [codigo, setCodigo] = useState(codigoInicial);
  const [datos, setDatos] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [modo, setModo] = useState("");
  const [marcados, setMarcados] = useState(new Set());
  const [guardando, setGuardando] = useState(false);
  const [modoAntes, setModoAntes] = useState("");
  const [avisoLector, setAvisoLector] = useState("");
  const { avisarLlegada } = useCanalAsistencia();

  const abrirFamilia = (d) => {
    setMotivo("");
    setDatos(d);
    setMarcados(seleccionInicial(d));
    setModo(pantallaInicial(d));
  };

  useEffect(() => {
    supabase.rpc("acreditar_familia", { p_codigo: codigoInicial }).then(({ data, error }) => {
      const fallo = motivoDeLectura(data, error);
      if (fallo) setMotivo(fallo);
      else abrirFamilia(data);
    });
  }, [codigoInicial]);

  const abrirLector = () => {
    setModoAntes(modo);
    setAvisoLector("");
    setModo("leer");
  };

  // Lo leído con la cámara de la página. Lo que no vale se dice y se sigue
  // leyendo; lo que vale abre su familia, y al cambiar de pantalla la cámara
  // se apaga sola.
  const leido = async (texto) => {
    const nuevo = codigoAcreditarDe(texto);
    if (!nuevo) return setAvisoLector(MOTIVOS_ACREDITAR.codigo);
    const { data, error } = await supabase.rpc("acreditar_familia", { p_codigo: nuevo });
    const fallo = motivoDeLectura(data, error);
    if (fallo) return setAvisoLector(fallo);
    setCodigo(nuevo);
    abrirFamilia(data);
  };

  const guardar = async (ids) => {
    setGuardando(true);
    const { data, error } = await supabase.rpc("acreditar_marcar", { p_codigo: codigo, p_ids: ids });
    setGuardando(false);
    // Con un motivo (cerrada, sin pagar) se queda donde estaba, para verlo.
    if (data?.error) return setMotivo(MOTIVOS_ACREDITAR[data.error] || MOTIVOS_ACREDITAR.codigo);
    if (error || !data) return setMotivo("No se ha podido guardar. Comprueba la conexión y vuelve a intentarlo.");
    // El marcador grande y la Lista se enteran al momento, como con
    // cualquier otra forma de marcar una llegada; sin esto, solo al volver a
    // preguntar a la base (v83.5). Lo que dice la base, también al corregir.
    (data.miembros || []).forEach((x) => avisarLlegada(x.id, Boolean(x.presente)));
    setMotivo("");
    setDatos(data);
    setMarcados(seleccionInicial(data));
    setModo("hecho");
  };

  if (modo === "leer") {
    return (
      <Pagina titulo="Leer QR">
        <Boton variante="secundario" onClick={() => setModo(modoAntes)} style={{ minHeight: DEDO, width: "100%" }}>
          Cancelar
        </Boton>
        <LectorQr onTexto={leido} />
        {avisoLector && <LineaAviso className="text-sm">{avisoLector}</LineaAviso>}
      </Pagina>
    );
  }

  // Desde cualquier pantalla se puede pasar a otro QR: un QR equivocado o una
  // familia que no puede entrar no dejan al acomodador sin seguir.
  const leerOtro = (
    <Boton variante="secundario" onClick={abrirLector} style={{ minHeight: DEDO, width: "100%" }}>
      Leer otro QR
    </Boton>
  );

  if (!datos) {
    return (
      <Pagina titulo="Acreditación">
        {motivo ? (
          <>
            <LineaAviso className="text-sm">{motivo}</LineaAviso>
            {leerOtro}
          </>
        ) : (
          <p>Leyendo…</p>
        )}
      </Pagina>
    );
  }

  const { familia, miembros, abierta, exigir } = datos;
  const total = miembros.length;
  const dentro = miembros.filter((m) => m.presente).length;
  const mesas = textoMesas(miembros);
  const dato = { color: C.ink, fontWeight: 600 };
  const aviso = motivo && <LineaAviso className="text-sm">{motivo}</LineaAviso>;
  const alternar = (id) =>
    setMarcados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

  if (modo === "hecho") {
    return (
      <Pagina titulo={familia}>
        <div className="flex justify-center py-1">
          <Stamp color={C.ink}>{dentro === total ? "Ya acreditados" : "Acreditados"}</Stamp>
        </div>
        <p className="text-center" style={dato}>
          {dentro} de {total} · {mesas}
        </p>
        {aviso}
        <Boton variante="principal" onClick={abrirLector} style={{ minHeight: DEDO, width: "100%" }}>
          Leer el siguiente QR
        </Boton>
        <Boton variante="secundario" onClick={() => setModo("elegir")} style={{ minHeight: DEDO, width: "100%" }}>
          Corregir
        </Boton>
      </Pagina>
    );
  }

  if (exigir && !abierta) {
    return (
      <Pagina titulo={familia}>
        <p style={dato}>
          {total} {total === 1 ? "invitado" : "invitados"} · {mesas}
        </p>
        <LineaAviso className="text-sm">{MOTIVOS_ACREDITAR.cerrada}</LineaAviso>
        {leerOtro}
      </Pagina>
    );
  }

  if (modo === "pregunta") {
    return (
      <Pagina titulo={familia}>
        <p style={dato}>
          {total} {total === 1 ? "invitado" : "invitados"} · {mesas}
        </p>
        <p style={{ ...dato, fontSize: T.destacado }}>{total === 1 ? "¿Viene?" : "¿Vienen todos?"}</p>
        {aviso}
        <div className="grid grid-cols-2 gap-2">
          <Boton variante="secundario" disabled={guardando} onClick={() => setModo("elegir")} style={{ minHeight: DEDO }}>
            No
          </Boton>
          <Boton variante="principal" disabled={guardando} onClick={() => guardar(miembros.map((m) => m.id))} className="zurdo:order-first" style={{ minHeight: DEDO }}>
            Sí
          </Boton>
        </div>
        {leerOtro}
      </Pagina>
    );
  }

  return (
    <Pagina titulo={familia}>
      <p style={dato}>
        {marcados.size} de {total} · {mesas}
      </p>
      <div className="space-y-2">
        {miembros.map((m) => {
          const puede = sePuedeMarcar(m, datos);
          const viene = marcados.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              disabled={!puede}
              aria-pressed={viene}
              onClick={() => alternar(m.id)}
              className="boton-3d w-full flex items-center justify-between px-3"
              style={{ background: C.blanco, border: `1px solid ${C.line}`, borderRadius: R.caja, minHeight: DEDO, opacity: puede ? 1 : OP.tenue }}
            >
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: C.ink }}>
                {nombreCompleto(m)}
                {!puede && <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: T.pequeno }}> · falta el pago o sus datos</span>}
              </span>
              <span style={{ color: viene ? C.ink : C.wax }}>{viene ? <Check size={20} aria-label="Viene" /> : <X size={20} aria-label="No viene" />}</span>
            </button>
          );
        })}
      </div>
      {aviso}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Boton variante="secundario" disabled={guardando} onClick={() => setModo(pantallaInicial(datos) === "hecho" ? "hecho" : "pregunta")} style={{ minHeight: DEDO }}>
          Cancelar
        </Boton>
        <Boton variante="principal" disabled={guardando || (marcados.size === 0 && dentro === 0)} onClick={() => guardar([...marcados])} className="zurdo:order-first" style={{ minHeight: DEDO }}>
          Guardar
        </Boton>
      </div>
      {leerOtro}
    </Pagina>
  );
}
