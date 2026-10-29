// «Nuevo invitado» (él, v77): el formulario flotante de la Lista, en vez de
// los campos que se abrían en su cabecera. Pensado sobre todo para el
// móvil en vertical (él): estrecho, dos campos por línea (norma 6) y todo
// del alto de un dedo. Apellido · Nombre, Familia · Rol, Zona · Colaborador
// y, plegado, Año · Email, como el apartado «Datos» del colaborador.
//
// Familia y Zona: el desplegable trae solo lo que ya hay, escrito como en
// la Lista; lo nuevo va fuera de esa lista, con su «＋», y la ✕ vuelve a
// ella (él). Al guardar, el formulario sigue abierto con Familia, Zona y
// Colaborador puestos, por si se sigue con otro de la misma familia. Las
// reglas, en lib/edicionInvitados.js (nuevoDesdeFormulario).
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { C, DEDO, OP, inputStyle } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Field, TextInput, ANCHO_ANIO } from "../../components/Formulario";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { BotonQuitar } from "../../components/PreguntaSeguridad";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { pideEmail } from "../../lib/invitados";
import { nombreCompleto } from "../../lib/formato";
import { ROLES_FORMULARIO, zonasDe, familiasDe, familiaNuevaPara, nuevoDesdeFormulario } from "../../lib/edicionInvitados";

const VACIO = { apellido: "", nombre: "", grupoFamiliar: "", rolFamiliar: "", zona: "", colaboradorId: "", anioNacimiento: "", email: "" };
// Todo del alto de un dedo: es para el móvil.
const CAMPO = { ...inputStyle, width: "100%", minWidth: 0, minHeight: DEDO };

// Un desplegable con «＋» al lado para lo nuevo; con lo nuevo, un campo de
// escribir y la ✕ para volver a la lista. Una sola pieza para Familia y Zona.
function ElegirONuevo({ nombre, opciones, vacio, valor, nuevo, onValor, onNuevo, onLista }) {
  return (
    <div className="flex items-center gap-1.5">
      {nuevo ? (
        <>
          <TextInput aria-label={`${nombre} nueva`} value={valor} onChange={(e) => onValor(e.target.value)} placeholder={`Escribe la ${nombre.toLowerCase()}`} autoFocus style={CAMPO} />
          <BotonQuitar titulo="Volver a la lista" yaPregunta onClick={onLista} />
        </>
      ) : (
        <>
          <select aria-label={nombre} value={valor} onChange={(e) => onValor(e.target.value)} style={{ ...CAMPO, color: valor ? C.charcoal : C.line }}>
            <option value="">{vacio}</option>
            {opciones.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <Boton variante="secundario" icono={Plus} titulo={`${nombre} nueva`} onClick={onNuevo} style={{ minHeight: DEDO, minWidth: DEDO }} />
        </>
      )}
    </div>
  );
}

export function VentanaNuevoInvitado({ data, onCerrar }) {
  const { invitados, colaboradores, evento, persistInvitados } = data;
  const familias = familiasDe(invitados);
  const zonas = zonasDe(invitados);
  const [ficha, setFicha] = useState(VACIO);
  // Sin familias todavía, se empieza escribiendo la primera.
  const [familiaNueva, setFamiliaNueva] = useState(familias.length === 0);
  const [zonaNueva, setZonaNueva] = useState(false);
  const [verDatos, setVerDatos] = useState(false);
  const [aviso, setAviso] = useState("");
  const [guardado, setGuardado] = useState("");
  const poner = (campo) => (valor) => setFicha((f) => ({ ...f, [campo]: valor }));

  const guardar = () => {
    const { invitados: siguiente, aviso: motivo } = nuevoDesdeFormulario(invitados, ficha, { familiaNueva, zonaNueva, evento });
    if (siguiente === invitados) {
      setAviso(motivo);
      setGuardado("");
      return;
    }
    persistInvitados(siguiente);
    const nuevo = siguiente.at(-1);
    setAviso(motivo);
    setGuardado(`Guardado: ${nombreCompleto(nuevo)}.`);
    // Lo de la familia se queda para el siguiente; lo nuevo ya está en la lista.
    setFicha({ ...VACIO, grupoFamiliar: nuevo.grupoFamiliar, zona: nuevo.zona, colaboradorId: nuevo.colaboradorId || "" });
    setFamiliaNueva(false);
    setZonaNueva(false);
  };

  const conEmail = pideEmail({ anioNacimiento: ficha.anioNacimiento }, evento);

  return (
    <VentanaFlotante clave="nuevoInvitado" titulo="Nuevo invitado" onCerrar={onCerrar} ancho="min(440px, calc(100vw - 48px))">
      <div className="space-y-3" onKeyDown={(e) => e.key === "Enter" && e.target.tagName === "INPUT" && guardar()}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Apellido *">
            <TextInput aria-label="Apellido" value={ficha.apellido} onChange={(e) => poner("apellido")(e.target.value)} autoComplete="off" style={CAMPO} />
          </Field>
          <Field label="Nombre *">
            <TextInput aria-label="Nombre" value={ficha.nombre} onChange={(e) => poner("nombre")(e.target.value)} autoComplete="off" style={CAMPO} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label={familiaNueva ? "Familia nueva *" : "Familia *"}>
            <ElegirONuevo
              nombre="Familia"
              opciones={familias}
              vacio="Elegir"
              valor={ficha.grupoFamiliar}
              nuevo={familiaNueva}
              onValor={poner("grupoFamiliar")}
              // Empieza con el apellido (él): «Pacheco01», o el siguiente libre.
              onNuevo={() => {
                setFamiliaNueva(true);
                poner("grupoFamiliar")(familiaNuevaPara(invitados, ficha.apellido));
              }}
              onLista={() => {
                setFamiliaNueva(false);
                poner("grupoFamiliar")("");
              }}
            />
          </Field>
          <Field label="Rol">
            <select aria-label="Rol" value={ficha.rolFamiliar} onChange={(e) => poner("rolFamiliar")(e.target.value)} style={{ ...CAMPO, color: ficha.rolFamiliar ? C.charcoal : C.line }}>
              <option value="">Sin rol</option>
              {ROLES_FORMULARIO.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.texto}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label={zonaNueva ? "Zona nueva" : "Zona"}>
            <ElegirONuevo
              nombre="Zona"
              opciones={zonas}
              vacio="Sin zona"
              valor={ficha.zona}
              nuevo={zonaNueva}
              onValor={poner("zona")}
              onNuevo={() => {
                setZonaNueva(true);
                poner("zona")("");
              }}
              onLista={() => {
                setZonaNueva(false);
                poner("zona")("");
              }}
            />
          </Field>
          <Field label="Colaborador">
            <select aria-label="Colaborador" value={ficha.colaboradorId} onChange={(e) => poner("colaboradorId")(e.target.value)} style={{ ...CAMPO, color: ficha.colaboradorId ? C.charcoal : C.line }}>
              <option value="">Sin asignar</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Año y email, plegados: como el apartado «Datos» del colaborador. */}
        <SeccionPlegable
          sencilla
          titulo={conEmail ? "Año nac. · Email" : "Año nac."}
          resumen={[ficha.anioNacimiento, conEmail && ficha.email].filter(Boolean).join(" · ")}
          abierta={verDatos}
          onAlternar={() => setVerDatos((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <TextInput aria-label="Año de nacimiento" value={ficha.anioNacimiento} onChange={(e) => poner("anioNacimiento")(e.target.value)} placeholder="1988" maxLength={4} inputMode="numeric" style={{ ...CAMPO, width: ANCHO_ANIO, flexShrink: 0 }} />
            {conEmail && <TextInput aria-label="Email" value={ficha.email} onChange={(e) => poner("email")(e.target.value)} placeholder="correo@ejemplo.com" inputMode="email" autoComplete="off" style={CAMPO} />}
          </div>
        </SeccionPlegable>

        {aviso && <LineaAviso className="text-sm">{aviso}</LineaAviso>}
        {guardado && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: C.ink }}>
            <Check size={16} aria-hidden /> {guardado}
          </p>
        )}

        {/* Al pie, Cancelar y Guardar, iguales (normas 4 y 5). */}
        {/* «Guardar», del lado del pulgar: a la derecha, o a la izquierda con esa mano. */}
        <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <Boton variante="secundario" onClick={onCerrar} style={{ minHeight: DEDO }}>
            {guardado ? "Cerrar" : "Cancelar"}
          </Boton>
          <Boton variante="principal" onClick={guardar} className="zurdo:order-first" style={{ minHeight: DEDO }}>
            Guardar
          </Boton>
        </div>
        <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
          * Obligatorios. Lo demás lo puede completar su colaborador.
        </p>
      </div>
    </VentanaFlotante>
  );
}
