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
//
// v84.7 (él): arriba, buscar a uno que YA está en la lista, confirmado o
// no, y editarlo en este mismo formulario: sale con lo suyo puesto y se
// toca solo el dato que falte. Guardar cambia solo lo tocado, con las
// reglas de la Lista (editarDesdeFormulario). La ✕ del buscador vuelve a
// «Nuevo invitado»; con algo a medio escribir, «¿Descartar los cambios?».
//
// v87.1 (él): «que pueda completar el resto de datos que pide el
// formulario». Canciones, Observaciones, Alergias y «Después del evento»,
// plegados y en el orden de la ficha del colaborador; alergias y la
// autorización, con su misma pieza (components/CamposFicha.jsx). Como allí,
// un solo apartado abierto a la vez (norma 5).
//
// v87.4 (él): en la Lista y en la Portada se llama «Formulario» (antes
// «Añadir»: ya también busca, confirma y corrige), y busca por colaborador.
import { useEffect, useMemo, useState } from "react";
import { Plus, Check } from "lucide-react";
import { C, DEDO, OP, R, inputStyle } from "../../theme";
import { ModalFlotante, VentanaFlotante } from "../../components/VentanaFlotante";
import { Field, TextInput, Desplegable, ElegirSiNo, ANCHO_ANIO } from "../../components/Formulario";
import { Boton, estilosBoton } from "../../components/Boton";
import { LineaAviso } from "../../components/LineaAviso";
import { BotonQuitar, usePreguntaSeguridad } from "../../components/PreguntaSeguridad";
import { SeccionPlegable } from "../../components/SeccionPlegable";
import { HuecoFoto, estiloMarcoFoto } from "../../components/HuecoFoto";
import { BuscadorInvitado } from "../../components/BuscadorInvitado";
import { CampoCancion } from "../../components/CampoCancion";
import { ElegirAlergias, CasillaConservarDatos } from "../../components/CamposFicha";
import { huecosCanciones, textoDeHuecos, resumenCanciones } from "../../lib/canciones";
import { pideEmail, pideDatosDeBoda } from "../../lib/invitados";
import { nombreCompleto } from "../../lib/formato";
import { telefonoParaVer } from "../../lib/telefono";
import { PREGUNTA_DESCARTAR } from "../../lib/cambiosSinGuardar";
import { subirFotoMatrimonio, useEnlaceFoto, CARPETA } from "../../lib/fotosAlmacen";
import { ROLES_FORMULARIO, zonasDe, familiasDe, familiaNuevaPara, nuevoDesdeFormulario, editarDesdeFormulario, preguntaCambioFamilia, SIN_CAMBIOS, mismaPersona, anioBodaDeLaFamilia } from "../../lib/edicionInvitados";
import { colaboradoresSinDj } from "../../lib/equipoColaboradores";

const VACIO = {
  apellido: "",
  nombre: "",
  grupoFamiliar: "",
  rolFamiliar: "",
  zona: "",
  colaboradorId: "",
  anioNacimiento: "",
  telefono: "",
  email: "",
  confirmado: false,
  anioBoda: "",
  cancion: "",
  observaciones: "",
  alergias: "",
  conservarDatos: false,
};

// El formulario con lo que ya tiene alguien de la lista (v84.7). El año de
// boda que le falte, el de su familia, como al añadir.
const fichaDe = (g, invitados) => ({
  apellido: g.apellido || "",
  nombre: g.nombre || "",
  grupoFamiliar: g.grupoFamiliar || "",
  rolFamiliar: g.rolFamiliar || "",
  zona: g.zona || "",
  colaboradorId: g.colaboradorId || "",
  anioNacimiento: String(g.anioNacimiento ?? ""),
  telefono: g.telefono ? telefonoParaVer(g.telefono) : "",
  email: g.email || "",
  confirmado: Boolean(g.confirmado),
  anioBoda: String(g.anioBoda || (pideDatosDeBoda(g) ? anioBodaDeLaFamilia(invitados, g.grupoFamiliar) : "") || ""),
  cancion: g.cancion || "",
  observaciones: g.observaciones || "",
  alergias: g.alergias || "",
  conservarDatos: Boolean(g.conservarDatos),
});
// En «Buscar por colaborador», los que nadie atiende todavía.
const SIN_COLABORADOR = "sin-colaborador";
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
          <Desplegable aria-label={nombre} value={valor} onChange={(e) => onValor(e.target.value)} style={{ ...CAMPO, color: valor ? C.charcoal : C.line }}>
            <option value="">{vacio}</option>
            {opciones.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Desplegable>
          <Boton variante="secundario" icono={Plus} titulo={`${nombre} nueva`} onClick={onNuevo} style={{ minHeight: DEDO, minWidth: DEDO }} />
        </>
      )}
    </div>
  );
}

export function VentanaNuevoInvitado({ data, onCerrar }) {
  const { invitados, colaboradores, evento, mesas = [], persistInvitados, fotosFamiliares = {}, persistFotosFamiliares } = data;
  // A quién se puede asignar: todos menos el DJ (v91.1).
  const asignables = colaboradoresSinDj(colaboradores, invitados);
  const familias = familiasDe(invitados);
  const zonas = zonasDe(invitados);
  const [ficha, setFicha] = useState(VACIO);
  // A quién se está editando (v84.7); null = «Nuevo invitado». `base`, cómo
  // estaba el formulario al abrirlo: lo distinto es lo escrito sin guardar.
  const [editandoId, setEditandoId] = useState(null);
  const [base, setBase] = useState(VACIO);
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  // Sin familias todavía, se empieza escribiendo la primera.
  const [familiaNueva, setFamiliaNueva] = useState(familias.length === 0);
  const [zonaNueva, setZonaNueva] = useState(false);
  // Los apartados plegados, uno solo abierto a la vez (norma 5).
  const [apartado, setApartado] = useState(null);
  const alternar = (id) => setApartado((a) => (a === id ? null : id));
  // Las alergias guardan lo marcado dentro (CamposFicha): con otro invitado,
  // o vacío tras guardar, empiezan de nuevo.
  const [vuelta, setVuelta] = useState(0);
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
  // La foto elegida espera aquí y se sube al guardar, como en la ficha.
  const [fotoNueva, setFotoNueva] = useState(null); // { archivo, vista } | null
  const [subiendo, setSubiendo] = useState(false);
  useEffect(() => () => fotoNueva && URL.revokeObjectURL(fotoNueva.vista), [fotoNueva]);
  const fotoFamilia = fotosFamiliares[ficha.grupoFamiliar] || "";
  // Cambiada, la foto va encima de la vieja (misma ruta): la recarga pide
  // un enlace nuevo, o se seguiría viendo la de antes.
  const [recargaFoto, setRecargaFoto] = useState(0);
  const enlaceFamilia = useEnlaceFoto(fotoFamilia, recargaFoto);
  // La que ya tienen, en grande y con «Cambiar foto» (v103.4, él): pagada,
  // su colaborador ya no puede, y lo hace el anfitrión aquí.
  const [verFoto, setVerFoto] = useState(false);

  const hayCambios = JSON.stringify(ficha) !== JSON.stringify(base) || Boolean(fotoNueva);
  const empezar = (f, id) => {
    setEditandoId(id);
    setFicha(f);
    setBase(f);
    setFamiliaNueva(!id && familias.length === 0);
    setZonaNueva(false);
    setFotoNueva(null);
    setApartado(null);
    setVuelta((v) => v + 1);
    setAviso("");
    setGuardado("");
  };
  // Elegir a otro, o volver a «Nuevo» con la ✕: lo escrito sin guardar se
  // perdería, así que antes se pregunta (norma 9).
  const alBuscar = (id) => {
    const g = invitados.find((x) => x.id === id);
    const seguir = () => (g ? empezar(fichaDe(g, invitados), g.id) : empezar(VACIO, null));
    if (hayCambios) preguntar({ ...PREGUNTA_DESCARTAR, alConfirmar: seguir });
    else seguir();
  };
  // Tras el nombre, en el desplegable: si no ha confirmado, y su familia si
  // otro se llama igual.
  const repetidos = useMemo(() => new Set(invitados.filter((g) => invitados.some((x) => x.id !== g.id && mismaPersona(x, g))).map((g) => g.id)), [invitados]);
  // Buscar por colaborador (v87.4): "" todos, SIN_COLABORADOR los que nadie
  // atiende, o el id de uno. El que se está editando, siempre.
  const [filtroColaborador, setFiltroColaborador] = useState("");
  const delColaborador = (g, filtro) => (filtro === SIN_COLABORADOR ? !g.colaboradorId : g.colaboradorId === filtro);
  const cuantosDe = (filtro) => invitados.filter((g) => delColaborador(g, filtro)).length;
  const buscables = filtroColaborador ? invitados.filter((g) => g.id === editandoId || delColaborador(g, filtroColaborador)) : invitados;
  const detalleOpcion = (g) =>
    [repetidos.has(g.id) ? g.grupoFamiliar : "", g.confirmado ? "" : g.noAsiste ? "no asiste" : "sin confirmar"].filter(Boolean).join(" · ");

  // Si cambia el código de una familia con fotos o la invitación enviada,
  // antes se pregunta (v98.3, como en la Lista); con «No», nada se guarda.
  const guardar = () => {
    const { invitados: siguiente, aviso: motivo } = editandoId
      ? editarDesdeFormulario(invitados, editandoId, ficha, { familiaNueva, zonaNueva, evento, mesas })
      : nuevoDesdeFormulario(invitados, ficha, { familiaNueva, zonaNueva, evento });
    const pregunta = editandoId && siguiente !== invitados ? preguntaCambioFamilia(invitados, siguiente, editandoId, data) : null;
    if (pregunta) preguntar({ ...pregunta, rotulo: "Sí", peligro: false, alConfirmar: () => terminarGuardado(siguiente, motivo) });
    else terminarGuardado(siguiente, motivo);
  };
  const terminarGuardado = async (siguiente, motivo) => {
    const nuevo = editandoId ? siguiente.find((g) => g.id === editandoId) : siguiente.at(-1);
    const conFoto = Boolean(fotoNueva && nuevo && pideDatosDeBoda(nuevo));
    // Al editar, la foto sola también es un cambio.
    if (siguiente === invitados && !(motivo === SIN_CAMBIOS && conFoto)) {
      setAviso(motivo);
      setGuardado("");
      return;
    }
    // La foto primero: si no se puede subir, no se guarda nada y se dice.
    let ruta = "";
    if (conFoto) {
      setSubiendo(true);
      try {
        // Si ya tenían, encima de la suya (rutaParaCambiar).
        ruta = await subirFotoMatrimonio(fotoNueva.archivo, nuevo.grupoFamiliar, CARPETA.BODA, fotosFamiliares[nuevo.grupoFamiliar]);
      } catch (_) {
        setSubiendo(false);
        setAviso("No se ha podido procesar la foto de boda. Prueba con otra.");
        return;
      }
      setSubiendo(false);
    }
    if (siguiente !== invitados) persistInvitados(siguiente);
    if (ruta) {
      persistFotosFamiliares?.({ ...fotosFamiliares, [nuevo.grupoFamiliar]: ruta });
      setRecargaFoto((n) => n + 1);
    }
    setAviso(motivo === SIN_CAMBIOS ? "" : motivo);
    setGuardado(`Guardado: ${nombreCompleto(nuevo)}.`);
    // Al editar, se queda con lo ya guardado. Al añadir, lo de la familia se
    // queda para el siguiente; lo nuevo ya está en la lista.
    const siguienteFicha = editandoId
      ? fichaDe(nuevo, siguiente)
      : { ...VACIO, grupoFamiliar: nuevo.grupoFamiliar, zona: nuevo.zona, colaboradorId: nuevo.colaboradorId || "", confirmado: nuevo.confirmado };
    setFicha(siguienteFicha);
    setBase(siguienteFicha);
    setVuelta((v) => v + 1);
    setFotoNueva(null);
    setFamiliaNueva(false);
    setZonaNueva(false);
  };

  const conEmail = pideEmail({ anioNacimiento: ficha.anioNacimiento }, evento);

  return (
    <VentanaFlotante clave="nuevo-invitado" titulo={editandoId ? "Editar invitado" : "Nuevo invitado"} onCerrar={onCerrar} ancho="min(440px, calc(100vw - 48px))">
      {/* Buscar a uno que ya está (v84.7), fuera del Enter que guarda. */}
      <Field label={editandoId ? "Editando" : "Buscar en la lista"}>
        {/* Por colaborador (v87.4, él): «Elegir invitado» enseña solo los
            suyos. Editando a alguien, sobra y no sale. */}
        {!editandoId && (
          <div className="flex mb-2">
            <Desplegable
              aria-label="Buscar por colaborador"
              value={filtroColaborador}
              onChange={(e) => setFiltroColaborador(e.target.value)}
              style={{ ...CAMPO, color: filtroColaborador ? C.charcoal : C.line }}
            >
              <option value="">Todos los colaboradores</option>
              <option value={SIN_COLABORADOR}>Sin colaborador ({cuantosDe(SIN_COLABORADOR)})</option>
              {asignables.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({cuantosDe(c.id)})
                </option>
              ))}
            </Desplegable>
          </div>
        )}
        <div className="flex items-center gap-2">
          <BuscadorInvitado
            invitados={buscables}
            invitadoId={editandoId || ""}
            onSeleccionar={alBuscar}
            estilo={CAMPO}
            detalle={detalleOpcion}
            preguntaAlQuitar={null}
            placeholder="Apellido o nombre"
          />
        </div>
      </Field>
      <div className="space-y-3 mt-3" onKeyDown={(e) => e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox" && guardar()}>
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
            <Desplegable aria-label="Rol" value={ficha.rolFamiliar} onChange={(e) => ponerConBoda("rolFamiliar")(e.target.value)} style={{ ...CAMPO, color: ficha.rolFamiliar ? C.charcoal : C.line }}>
              <option value="">Sin rol</option>
              {ROLES_FORMULARIO.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.texto}
                </option>
              ))}
            </Desplegable>
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
            <Desplegable aria-label="Colaborador" value={ficha.colaboradorId} onChange={(e) => poner("colaboradorId")(e.target.value)} style={{ ...CAMPO, color: ficha.colaboradorId ? C.charcoal : C.line }}>
              <option value="">Sin asignar</option>
              {asignables.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Desplegable>
          </Field>
        </div>

        {/* Confirmado (v81.3): Sí / No en una pieza del alto de un campo, y
            con su rótulo como los demás (v81.4); No, de entrada. */}
        <Field label="Confirmado">
          <ElegirSiNo etiqueta="Confirmado" valor={ficha.confirmado} onCambiar={poner("confirmado")} alto={DEDO} />
        </Field>

        {/* Año, teléfono y email, plegados: como el apartado «Datos» del
            colaborador. Año y teléfono en una línea; el email, debajo. */}
        <SeccionPlegable
          sencilla
          titulo={conEmail ? "Año nac. · Tel. · Email" : "Año nac."}
          resumen={[ficha.anioNacimiento, conEmail && ficha.telefono, conEmail && ficha.email].filter(Boolean).join(" · ")}
          abierta={apartado === "datos"}
          onAlternar={() => alternar("datos")}
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
            abierta={apartado === "boda"}
            onAlternar={() => alternar("boda")}
          >
            {/* El año y la foto, cada uno con su rótulo como los demás campos
                (v81.4), en una línea. */}
            <div className="grid grid-cols-2 gap-2 items-start">
              <Field label="Año">
                <TextInput aria-label="Año de boda" value={ficha.anioBoda} onChange={(e) => poner("anioBoda")(e.target.value)} placeholder="2010" maxLength={4} inputMode="numeric" style={{ ...CAMPO, width: ANCHO_ANIO }} />
              </Field>
              <Field label="Foto">
              {fotoFamilia ? (
                // Tocándola, en grande con «Cambiar foto» (v103.4); la nueva
                // espera aquí y se sube al guardar, como en la ficha.
                <div className="flex items-center gap-2">
                  <HuecoFoto
                    ajustada
                    titulo="Foto de boda"
                    enlace={fotoNueva?.vista || enlaceFamilia}
                    ocupada
                    subiendo={subiendo}
                    onVer={() => setVerFoto(true)}
                  />
                  {/* Corto y en una línea (norma 6): al lado de la foto
                      solo caben unos 45 px. */}
                  <span className="text-xs whitespace-nowrap" style={{ color: fotoNueva ? C.ink : C.charcoal, opacity: fotoNueva ? 1 : OP.secundario, fontWeight: fotoNueva ? 600 : undefined }}>
                    {fotoNueva ? "Nueva" : "Ya está"}
                  </span>
                </div>
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
              </Field>
            </div>
          </SeccionPlegable>
        )}

        {/* El resto de la ficha (v87.1), en el orden del colaborador. */}
        <SeccionPlegable sencilla titulo="Canciones" resumen={resumenCanciones(ficha.cancion)} abierta={apartado === "cancion"} onAlternar={() => alternar("cancion")}>
          <div className="flex flex-col gap-2">
            {huecosCanciones(ficha.cancion).map((hueco, i, huecos) => (
              <CampoCancion
                key={i}
                numero={i + 1}
                titulo={hueco.titulo}
                artista={hueco.artista}
                buscar={data.buscarParaEscuchar}
                onCambiar={(nueva) => poner("cancion")(textoDeHuecos(huecos.map((h, j) => (j === i ? nueva : h))))}
              />
            ))}
          </div>
        </SeccionPlegable>
        <SeccionPlegable sencilla titulo="Observaciones" resumen={ficha.observaciones} abierta={apartado === "observaciones"} onAlternar={() => alternar("observaciones")}>
          <TextInput aria-label="Observaciones" value={ficha.observaciones} onChange={(e) => poner("observaciones")(e.target.value)} placeholder="Cualquier detalle adicional" autoComplete="off" style={CAMPO} />
        </SeccionPlegable>
        <SeccionPlegable sencilla titulo="Alergias" resumen={ficha.alergias} abierta={apartado === "alergias"} onAlternar={() => alternar("alergias")}>
          <ElegirAlergias key={`${editandoId || "nuevo"}-${vuelta}`} valor={ficha.alergias} onCambiar={poner("alergias")} />
        </SeccionPlegable>
        <SeccionPlegable sencilla titulo="Después del evento" resumen={ficha.conservarDatos ? "Autorizado" : ""} abierta={apartado === "despues"} onAlternar={() => alternar("despues")}>
          <CasillaConservarDatos marcada={ficha.conservarDatos} onCambiar={poner("conservarDatos")} />
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
          <Boton variante="principal" onClick={guardar} disabled={subiendo} className="zurdo:order-first" style={{ minHeight: DEDO }}>
            Guardar
          </Boton>
        </div>
        <p className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
          * Obligatorios. Lo demás lo puede completar su colaborador.
        </p>
      </div>
      {/* La foto de boda en grande, y el cambio desde ahí: como en la ficha
          del colaborador y en Aniversarios. */}
      {verFoto && (fotoNueva?.vista || enlaceFamilia) && (
        <ModalFlotante titulo="Foto de boda" onCerrar={() => setVerFoto(false)} ancho={860}>
          <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: R.caja, overflow: "hidden", ...estiloMarcoFoto(10) }}>
            <img src={fotoNueva?.vista || enlaceFamilia} alt="Foto de boda" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          </div>
          <label className="boton-3d inline-flex items-center justify-center font-medium cursor-pointer mt-3" style={estilosBoton("principal", "normal")}>
            Cambiar foto
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              data-cambiar-foto-boda
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                e.target.value = "";
                if (!file) return;
                setVerFoto(false);
                setFotoNueva({ archivo: file, vista: URL.createObjectURL(file) });
              }}
            />
          </label>
        </ModalFlotante>
      )}
      {ventanaPregunta}
    </VentanaFlotante>
  );
}
