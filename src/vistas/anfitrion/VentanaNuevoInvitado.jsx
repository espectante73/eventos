// «Nuevo invitado» (él, v77): el formulario flotante de la Lista, en vez de
// los campos que se abrían en su cabecera. Pensado sobre todo para el
// móvil en vertical (él): estrecho, dos campos por línea (norma 6) y todo
// del alto de un dedo. Apellido · Nombre, Familia · Rol, Zona · Colaborador
// y, plegado, Año · Teléfono · Email, como el apartado «Datos» del
// colaborador (el teléfono, v78).
//
// Familia y Zona: el desplegable trae solo lo que ya hay, escrito como en
// la Lista; lo nuevo va fuera de esa lista, con su «＋», y la ✕ vuelve a
// ella (él). Al guardar, el formulario sigue abierto con Familia, Zona y
// Colaborador puestos, por si se sigue con otro de la misma familia. Las
// reglas, en lib/edicionInvitados.js (nuevoDesdeFormulario).
//
// v81.3 (él): «Confirmado» Sí / No, y, al esposo o la esposa, la «Boda»:
// su año y la foto, por si se la adelantan al anfitrión. Son de la pareja:
// el año que ya tiene la familia sale puesto (y la base lo iguala), y la
// foto que ya tiene se enseña. La foto se sube igual que en la ficha del
// colaborador (lib/fotosAlmacen.js).
import { useEffect, useState } from "react";
import { Plus, Check } from "lucide-react";
import { C, DEDO, OP, inputStyle } from "../../theme";
import { VentanaFlotante } from "../../components/VentanaFlotante";
import { Field, TextInput, ANCHO_ANIO } from "../../components/Formulario";
import { Boton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { BotonQuitar } from "../../components/PreguntaSeguridad";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { HuecoFoto } from "../../components/HuecoFoto";
import { pideEmail, pideDatosDeBoda } from "../../lib/invitados";
import { nombreCompleto } from "../../lib/formato";
import { subirFotoMatrimonio, useEnlaceFoto, CARPETA } from "../../lib/fotosAlmacen";
import { ROLES_FORMULARIO, zonasDe, familiasDe, familiaNuevaPara, nuevoDesdeFormulario, anioBodaDeLaFamilia } from "../../lib/edicionInvitados";

const VACIO = { apellido: "", nombre: "", grupoFamiliar: "", rolFamiliar: "", zona: "", colaboradorId: "", anioNacimiento: "", telefono: "", email: "", confirmado: false, anioBoda: "" };
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
  const { invitados, colaboradores, evento, persistInvitados, fotosFamiliares = {}, persistFotosFamiliares } = data;
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
  // Al elegir familia o rol, el esposo o la esposa trae el año de boda que
  // ya tenga su familia (v81.3).
  const ponerConBoda = (campo) => (valor) =>
    setFicha((f) => {
      const g = { ...f, [campo]: valor };
      return pideDatosDeBoda(g) && !g.anioBoda ? { ...g, anioBoda: anioBodaDeLaFamilia(invitados, g.grupoFamiliar) } : g;
    });
  const [verBoda, setVerBoda] = useState(false);
  // La foto elegida espera aquí y se sube al guardar, como en la ficha.
  const [fotoNueva, setFotoNueva] = useState(null); // { archivo, vista } | null
  const [subiendo, setSubiendo] = useState(false);
  useEffect(() => () => fotoNueva && URL.revokeObjectURL(fotoNueva.vista), [fotoNueva]);
  const fotoFamilia = fotosFamiliares[ficha.grupoFamiliar] || "";
  const enlaceFamilia = useEnlaceFoto(fotoFamilia);

  const guardar = async () => {
    const { invitados: siguiente, aviso: motivo } = nuevoDesdeFormulario(invitados, ficha, { familiaNueva, zonaNueva, evento });
    if (siguiente === invitados) {
      setAviso(motivo);
      setGuardado("");
      return;
    }
    const nuevo = siguiente.at(-1);
    // La foto primero: si no se puede subir, no se guarda nada y se dice.
    let ruta = "";
    if (fotoNueva && pideDatosDeBoda(nuevo) && !fotoFamilia) {
      setSubiendo(true);
      try {
        ruta = await subirFotoMatrimonio(fotoNueva.archivo, nuevo.grupoFamiliar, CARPETA.BODA);
      } catch (_) {
        setSubiendo(false);
        setAviso("No se ha podido procesar la foto de boda. Prueba con otra.");
        return;
      }
      setSubiendo(false);
    }
    persistInvitados(siguiente);
    if (ruta) persistFotosFamiliares?.({ ...fotosFamiliares, [nuevo.grupoFamiliar]: ruta });
    setAviso(motivo);
    setGuardado(`Guardado: ${nombreCompleto(nuevo)}.`);
    // Lo de la familia se queda para el siguiente; lo nuevo ya está en la lista.
    setFicha({ ...VACIO, grupoFamiliar: nuevo.grupoFamiliar, zona: nuevo.zona, colaboradorId: nuevo.colaboradorId || "", confirmado: nuevo.confirmado });
    setFotoNueva(null);
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
              onValor={ponerConBoda("grupoFamiliar")}
              // Empieza con el apellido (él): «Pacheco01», o el siguiente libre.
              onNuevo={() => {
                setFamiliaNueva(true);
                ponerConBoda("grupoFamiliar")(familiaNuevaPara(invitados, ficha.apellido));
              }}
              onLista={() => {
                setFamiliaNueva(false);
                poner("grupoFamiliar")("");
              }}
            />
          </Field>
          <Field label="Rol">
            <select aria-label="Rol" value={ficha.rolFamiliar} onChange={(e) => ponerConBoda("rolFamiliar")(e.target.value)} style={{ ...CAMPO, color: ficha.rolFamiliar ? C.charcoal : C.line }}>
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

        {/* Confirmado (v81.3): Sí / No, iguales (norma 4); No, de entrada. */}
        <div className="flex items-center gap-2">
          <span className="text-sm flex-shrink-0" style={{ color: C.charcoal }}>
            Confirmado
          </span>
          <div className="grid grid-cols-2 gap-2 flex-1" role="radiogroup" aria-label="Confirmado">
            {[
              [true, "Sí"],
              [false, "No"],
            ].map(([valor, rotulo]) => (
              <Boton
                key={rotulo}
                variante={ficha.confirmado === valor ? "principal" : "secundario"}
                role="radio"
                aria-checked={ficha.confirmado === valor}
                onClick={() => poner("confirmado")(valor)}
                style={{ minHeight: DEDO }}
              >
                {rotulo}
              </Boton>
            ))}
          </div>
        </div>

        {/* Año, teléfono y email, plegados: como el apartado «Datos» del
            colaborador. Año y teléfono en una línea; el email, debajo. */}
        <SeccionPlegable
          sencilla
          titulo={conEmail ? "Año nac. · Tel. · Email" : "Año nac."}
          resumen={[ficha.anioNacimiento, conEmail && ficha.telefono, conEmail && ficha.email].filter(Boolean).join(" · ")}
          abierta={verDatos}
          onAlternar={() => setVerDatos((v) => !v)}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TextInput aria-label="Año de nacimiento" value={ficha.anioNacimiento} onChange={(e) => poner("anioNacimiento")(e.target.value)} placeholder="1988" maxLength={4} inputMode="numeric" style={{ ...CAMPO, width: ANCHO_ANIO, flexShrink: 0 }} />
              {conEmail && <TextInput aria-label="Teléfono" value={ficha.telefono} onChange={(e) => poner("telefono")(e.target.value)} placeholder="612 34 56 78" inputMode="tel" autoComplete="off" style={CAMPO} />}
            </div>
            {conEmail && <TextInput aria-label="Email" value={ficha.email} onChange={(e) => poner("email")(e.target.value)} placeholder="correo@ejemplo.com" inputMode="email" autoComplete="off" style={CAMPO} />}
          </div>
        </SeccionPlegable>

        {/* Boda (v81.3): solo al esposo o la esposa. El año y la foto, en
            una línea (norma 6), como en la ficha del colaborador. */}
        {pideDatosDeBoda(ficha) && (
          <SeccionPlegable
            sencilla
            titulo="Boda"
            resumen={[ficha.anioBoda, fotoFamilia || fotoNueva ? "con foto" : ""].filter(Boolean).join(" · ")}
            abierta={verBoda}
            onAlternar={() => setVerBoda((v) => !v)}
          >
            <div className="flex items-center gap-3">
              <TextInput aria-label="Año de boda" value={ficha.anioBoda} onChange={(e) => poner("anioBoda")(e.target.value)} placeholder="2010" maxLength={4} inputMode="numeric" style={{ ...CAMPO, width: ANCHO_ANIO, flexShrink: 0 }} />
              <span className="uppercase text-xs whitespace-nowrap" style={{ color: "var(--etiqueta-campo)", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em" }}>
                Foto boda
              </span>
              {fotoFamilia ? (
                <>
                  <HuecoFoto ajustada soloLectura titulo="Foto de boda" enlace={enlaceFamilia} ocupada />
                  <span className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
                    Ya la tienen
                  </span>
                </>
              ) : (
                <HuecoFoto
                  ajustada
                  titulo="Foto de boda"
                  enlace={fotoNueva?.vista || ""}
                  ocupada={Boolean(fotoNueva)}
                  subiendo={subiendo}
                  onElegir={(archivo) => setFotoNueva({ archivo, vista: URL.createObjectURL(archivo) })}
                  onQuitar={() => setFotoNueva(null)}
                />
              )}
            </div>
          </SeccionPlegable>
        )}

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
          <Boton variante="principal" onClick={guardar} disabled={subiendo} className="zurdo:order-first" style={{ minHeight: DEDO }}>
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
