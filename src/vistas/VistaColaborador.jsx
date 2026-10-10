// Vista del colaborador: formulario de datos de cada invitado asignado,
// fila resumen en la lista, y la vista completa (pendientes/completos,
// aviso al anfitrión al terminar). Movida tal cual desde App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { useState, useEffect, useRef } from "react";
import { Bell, Calendar, Check, ChevronDown, ClipboardList, Euro, Lock, Mail, Megaphone, Send, User, UserCog, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { MenuFlotante } from "../components/MenuFlotante";
import {
  datosCompletos,
  pideDatosDeBoda,
  esMenorDeEdad,
  estadoDatos,
  familiasSinEmail,
  emailObligatorio,
  faltanObligatorios,
  fichasIncompletasDe,
  claveFamilia,
  importeEsperadoInvitado,
  resolverColaborador,
  fichaCerradaAlColaborador,
} from "../lib/invitados";
import { ordenarPorApellidoNombre, nombreCompleto } from "../lib/formato";
import { preguntaFamilia, textoPreguntaFamilia } from "../lib/familiaCobroLlegada";
import { agruparFamilias, miembrosDesdeLista } from "../lib/familiasColaborador";
import { estadoImpago, textoAvisoImpago, fechaCorta, PLAZOS_MAX } from "../lib/impagos";
import { marcarSinGuardar, haySinGuardar, PREGUNTA_DESCARTAR } from "../lib/cambiosSinGuardar";
import { requisitosActivos } from "../lib/modoPruebas";
import { construirEnlaceTablon } from "../lib/url";
import { subirFotoMatrimonio, useEnlaceFoto, CARPETA } from "../lib/fotosAlmacen";
import { usePopupWindow } from "../lib/usePopupWindow";
import { useMotorInvitaciones } from "../lib/useMotorInvitaciones";
import { PERMISOS, ETIQUETAS_PERMISOS, tienePermiso, esDeEdicion } from "../lib/permisos";
import { generarImagenCronograma } from "../lib/cronograma";
import { C, R, T, OP, DORADO } from "../theme";
import { URL_REPOSITORIO } from "../constants";
import { Stamp, BarraCompacta, UserSolido } from "../components/Widgets";
import { SectionTitle, TextInput } from "../components/Formulario";
import { ModalFlotante, VentanaFlotante } from "../components/VentanaFlotante";
import { HuecoFoto, estiloMarcoFoto } from "../components/HuecoFoto";
import { SeccionPlegable } from "../components/SeccionPlegable";
import { BotonAbrirSeccion, ESTILO_MI_CUENTA } from "../components/DesplegableSecciones";
import { CapaBarra } from "../components/BarraVentanas";
import { abrirMusica } from "../lib/ventanaMusica";
import { ICONOS_VENTANAS } from "../lib/iconosVentanas";
import { Boton, estilosBoton, EnlaceTexto } from "../components/Boton";
import { usePreguntaSeguridad } from "../components/PreguntaSeguridad";
import { Portada } from "../components/Portada";
import { VentanaNovedades } from "./anfitrion/VentanaNovedades";
import { VentanaConfigDatosEvento } from "./anfitrion/VentanaConfigDatosEvento";
import { VentanaInvitacionesColaborador } from "./VentanaInvitacionesColaborador";

// ---------- Colaborador view ----------

const ETIQUETAS_CAMPOS_INVITADO = {
  anioNacimiento: "Año de nacimiento",
  anioBoda: "Año de boda",
  email: "Email",
  cancion: "Canción",
  alergias: "Alergias",
  observaciones: "Observaciones",
  // El "no" de la canción (su casilla nace marcada): cambiarlo también se
  // guarda, y el aviso dice "Canción".
  sinCancion: "Canción",
  sinEmail: "Email",
  conservarDatos: "Autorización para guardar sus datos",
};

// La fila de cada invitado va en COLUMNAS FIJAS, no acomodándose a lo que
// mida cada nombre. Lo pidió él el 2026-09-24: con "Rodríguez, Natasha"
// la fila se deformaba y el botón de llegada acababa en otro sitio que el
// de las filas de al lado. Con las columnas fijas, todos los nombres
// empiezan en el mismo punto y todos los checks caen en la misma columna.
// La columna de la izquierda enseña lo de la RONDA en que está el
// invitado (él, v46.5): primero los datos ("datos 0 de 6"), después el pago.
// Una ronda no adelanta a la anterior, así que nunca hacen falta las dos
// a la vez, y el nombre gana el sitio que ocupaba la otra columna.
const ANCHO_PAGO = 104; // "Pago pendiente" es el rótulo más largo de esa columna
const ALTO_BOTON_FILA = 32; // manda el círculo de llegada: todos iguales (norma 4)
// Al marcar el pago, una vez o para toda la familia (él, v54).
const AVISO_CIERRE_AL_PAGAR = "Después ya no podrás cambiar sus datos ni su foto.";

// Pastilla de un dato que el colaborador SOLO MIRA: la zona y el importe.
// Una sola pieza para las dos (norma 7), pero distintas a propósito (él,
// v50.3): iguales competían por la atención.
//   - la zona: dorado claro con filete verde, un punto más de letra;
//   - el importe (`destacado`): al revés, letra dorada sobre verde, en el
//     extremo derecho. Es el dato que más se consulta.
function PastillaDato({ title, children, destacado = false }) {
  return (
    <span
      className={`${destacado ? "text-sm" : "text-base"} px-2 py-0.5 rounded font-semibold whitespace-nowrap`}
      style={
        destacado
          ? { background: C.ink, color: C.goldClaro, border: `1px solid ${C.ink}` }
          : { background: C.champanClaro, color: C.ink, border: `1px solid ${C.ink}` }
      }
      title={title}
    >
      {children}
    </span>
  );
}

// Línea suave entre apartados del formulario, sin llegar a los bordes (él,
// v52.2).
function LineaEntreApartados() {
  return <div className="mx-3" style={{ borderTop: `1px solid ${C.ink}`, opacity: OP.linea }} />;
}

// Raya vertical entre las celdas de una misma línea (él, v58.2: año |
// foto de boda | No), del mismo trazo que la línea entre apartados.
function SeparadorCeldas() {
  return <span aria-hidden="true" style={{ alignSelf: "stretch", borderLeft: `1px solid ${C.ink}`, opacity: OP.linea }} />;
}

// Las cajas de un año: justo para 4 cifras. Estrechas a propósito, para
// que la línea de Boda (año, foto y casilla) quepa en el móvil (norma 6).
const ANCHO_ANIO = 56;

// En qué apartado plegado vive cada obligatorio: "Guardar" abre ese.
const APARTADO_DE = { anioNacimiento: "datos", email: "datos", anioBoda: "boda", fotoBoda: "boda", alergias: "alergias" };

function FormularioDatos({
  invitado,
  evento,
  onGuardar,
  fotoFamiliar,
  onCambiarFotoFamiliar,
  importe,
  onCerrar,
  colaboradorVinculado,
  // La familia ha marcado que NO tiene foto de boda (casilla «No»). Es de
  // la familia, como la foto: vale para los dos.
  sinFotoBoda = false,
  onCambiarSinFotoBoda,
  // Nadie de la familia tiene email (regla: al menos uno por familia).
  familiaSinEmail = false,
}) {
  // Todo lo que se escribe se queda AQUÍ, en la pantalla, hasta pulsar
  // "Guardar" (él, v50): así "Cancelar" puede descartarlo de verdad, y
  // "Guardar" no deja subir una ficha sin sus obligatorios. Lo que no se
  // ha tocado no se manda, así que lo que puso otro colaborador (el año
  // o la foto de boda del cónyuge) no se pisa.
  const [form, setForm] = useState(invitado);
  const [foto, setFoto] = useState(fotoFamiliar || "");
  // La foto elegida espera aquí, sin subir: subirla pisaría la de la
  // familia en el almacén aunque luego se cancelara.
  const [fotoNueva, setFotoNueva] = useState(null); // { archivo, vista } | null
  const [sinFoto, setSinFoto] = useState(sinFotoBoda);
  // Tras un "Guardar" con obligatorios vacíos, se pintan en rojo (y se
  // van apagando según se rellenan).
  const [intentado, setIntentado] = useState(false);
  const formularioRef = useRef(null);
  // El campo al que llevar el cursor, en cuanto su apartado ya está abierto.
  const [enfocar, setEnfocar] = useState(null);
  useEffect(() => {
    if (!enfocar) return;
    const campo = formularioRef.current?.querySelector(`[data-campo="${enfocar}"]`);
    campo?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    campo?.querySelector("input")?.focus({ preventScroll: true });
    setEnfocar(null);
  }, [enfocar]);
  const [guardando, setGuardando] = useState(false);
  // Ninguna casilla marcada por defecto: si no se ha tocado nada, "alergias"
  // se queda vacío de verdad (no cuenta como respondido en "datos X de Y"
  // hasta que el colaborador marque algo, aunque sea "No" explícitamente).
  const parsearAlergias = (texto) => {
    const partes = (texto || "").split(",").map((s) => s.trim()).filter(Boolean);
    return {
      no: partes.includes("No"),
      gluten: partes.includes("Gluten"),
      lactosa: partes.includes("Lactosa"),
      otras: partes.find((p) => p !== "No" && p !== "Gluten" && p !== "Lactosa") || "",
    };
  };
  const [alergiaSel, setAlergiaSel] = useState(() => parsearAlergias(invitado.alergias));
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  // Seis apartados plegados, con flecha, y uno solo abierto a la vez
  // (norma 5; él, v52). Al abrir la ficha, todos cerrados.
  const [apartado, setApartado] = useState(null);
  const alternarApartado = (id) => setApartado((a) => (a === id ? null : id));
  // "Otras" en alergias: su campo solo sale marcada (un plegado dentro de otro).
  const [conOtras, setConOtras] = useState(() => Boolean(parsearAlergias(invitado.alergias).otras));
  const [errorFoto, setErrorFoto] = useState("");
  // `foto` guarda lo que va a la base: desde el 2026-09-17 una RUTA del
  // cajón "fotos-matrimonios" (antes, la foto entera en base64). Para
  // enseñarla hace falta un enlace temporal; useEnlaceFoto lo pide solo si
  // es una ruta, y deja pasar tal cual lo antiguo o un enlace pegado.
  const enlaceGuardado = useEnlaceFoto(foto);
  const enlaceFoto = fotoNueva ? fotoNueva.vista : enlaceGuardado;
  const hayFoto = Boolean(fotoNueva || foto);
  // Ver la foto en grande, y confirmar antes de quitarla: mismo trato que en
  // Aniversarios, donde borrar una foto pide confirmación.
  const [verFoto, setVerFoto] = useState(false);
  const [quitandoFoto, setQuitandoFoto] = useState(false);
  useEffect(() => setForm(invitado), [invitado.id]);
  useEffect(() => setFoto(fotoFamiliar || ""), [fotoFamiliar, invitado.id]);
  useEffect(() => setAlergiaSel(parsearAlergias(invitado.alergias)), [invitado.id]);
  // La vista previa de una foto elegida es un enlace local: se suelta al
  // cambiarla o al cerrar el formulario.
  useEffect(() => () => fotoNueva && URL.revokeObjectURL(fotoNueva.vista), [fotoNueva]);

  const elegirFoto = (file) => {
    if (!file) return;
    setErrorFoto("");
    setFotoNueva({ archivo: file, vista: URL.createObjectURL(file) });
  };
  const quitarFoto = () => {
    setFotoNueva(null);
    setFoto("");
  };

  const opcionesEmail = { familiaSinEmail, colaboradorVinculado };
  const pideEmailAqui = emailObligatorio(form, evento, opcionesEmail);
  // Para Guardar, también la foto de boda: subida o «No» (él, v58.2).
  const opcionesGuardar = { ...opcionesEmail, fotoBoda: { hay: hayFoto, sinFoto } };
  const faltan = intentado ? faltanObligatorios(form, evento, opcionesGuardar) : [];
  const datosCambiados = Object.keys(ETIQUETAS_CAMPOS_INVITADO).some(
    (campo) => (form[campo] || "") !== (invitado[campo] || "")
  );
  const hayCambios =
    datosCambiados || Boolean(fotoNueva) || foto !== (fotoFamiliar || "") || sinFoto !== sinFotoBoda;
  // Cerrar el formulario desde fuera (su X, la de la barra) también
  // pregunta si hay algo sin guardar (v61.2, lib/cambiosSinGuardar.js).
  useEffect(() => marcarSinGuardar("formulario", hayCambios), [hayCambios]);
  useEffect(() => () => marcarSinGuardar("formulario", false), []);

  const guardar = async () => {
    const pendientes = faltanObligatorios(form, evento, opcionesGuardar);
    if (pendientes.length) {
      setIntentado(true);
      // La foto, con su aviso (él, v58.2): sin él no se entendía por qué
      // no guardaba una ficha con todo lo demás relleno.
      if (pendientes.includes("fotoBoda"))
        preguntar({
          titulo: "No se puede guardar",
          texto: "Falta la foto de boda: súbela, o marca «No» si no tienen.",
          soloAviso: true,
        });
      // Foto y año, en bloque (él, v58.3).
      else if (pendientes.includes("anioBoda"))
        preguntar({
          titulo: "No se puede guardar",
          texto: "Falta el año de boda: con la foto, va su año.",
          soloAviso: true,
        });
      // Se abre el apartado del primero que falta, y la pantalla y el
      // cursor van a él (él, v50.4 y v52). Los demás laten igual.
      setApartado(APARTADO_DE[pendientes[0]]);
      setEnfocar(pendientes[0]);
      return;
    }
    let rutaFoto = foto;
    if (fotoNueva) {
      setGuardando(true);
      try {
        // Al almacén, como ORIGINAL (se guarda grande: el anfitrión la
        // pasará por la plantilla con otra IA). Mismo nombre de archivo que
        // usa Aniversarios para esta familia, así volver a subir la reemplaza.
        const familia = invitado.grupoFamiliar || invitado.apellido || "";
        rutaFoto = await subirFotoMatrimonio(fotoNueva.archivo, familia, CARPETA.BODA);
      } catch (_) {
        setErrorFoto("No se ha podido procesar la imagen. Prueba con otra.");
        setGuardando(false);
        return;
      }
    }
    if (datosCambiados) onGuardar(form);
    if (rutaFoto !== (fotoFamiliar || "")) onCambiarFotoFamiliar?.(invitado.grupoFamiliar, rutaFoto);
    if (sinFoto !== sinFotoBoda) onCambiarSinFotoBoda?.(invitado.grupoFamiliar, sinFoto);
    onCerrar();
  };

  // "Cancelar" no sube nada. Si había algo escrito, pregunta antes: lo
  // descarta (norma 9, con la fórmula de internet).
  const cancelar = () => {
    if (!hayCambios) return onCerrar();
    preguntar({
      ...PREGUNTA_DESCARTAR,
      alConfirmar: onCerrar,
      otra: { rotulo: "No" },
    });
  };

  // Un obligatorio vacío tras "Guardar": etiqueta y borde en rojo, y late
  // con el mismo latido de las fichas incompletas (.ficha-incompleta).
  // Late el APARTADO que tiene algo pendiente, también cerrado.
  const latido = (...campos) => (campos.some((c) => faltan.includes(c)) ? "ficha-incompleta rounded-lg" : undefined);
  const bordeRojo = (campo) => (faltan.includes(campo) ? { borderColor: C.wax } : {});

  const reconstruirAlergias = (sel) => {
    if (sel.no) return "No";
    const partes = [];
    if (sel.gluten) partes.push("Gluten");
    if (sel.lactosa) partes.push("Lactosa");
    if (sel.otras.trim()) partes.push(sel.otras.trim());
    return partes.join(", ");
  };

  const marcarNo = () => {
    setConOtras(false);
    const next = { no: true, gluten: false, lactosa: false, otras: "" };
    setAlergiaSel(next);
    setForm({ ...form, alergias: reconstruirAlergias(next) });
  };
  const alternarAlergia = (clave) => {
    const next = { ...alergiaSel, no: false, [clave]: !alergiaSel[clave] };
    setAlergiaSel(next);
    setForm({ ...form, alergias: reconstruirAlergias(next) });
  };
  const alternarOtras = () => {
    if (conOtras) {
      cambiarOtras("");
      setConOtras(false);
      return;
    }
    const next = { ...alergiaSel, no: false };
    setAlergiaSel(next);
    setForm({ ...form, alergias: reconstruirAlergias(next) });
    setConOtras(true);
  };
  const cambiarOtras = (valor) => {
    const texto = valor.slice(0, 15);
    const next = { ...alergiaSel, no: false, otras: texto };
    setAlergiaSel(next);
    setForm({ ...form, alergias: reconstruirAlergias(next) });
  };

  return (
    <div
      // Misma combinación que las filas de Aniversarios, a petición del
      // usuario (2026-09-17): dorado metálico de fondo y letras en verde.
      // La clase `formulario-dorado` solo existe para teñir de verde las
      // etiquetas de los campos, que Field pinta en dorado para el resto de
      // pantallas (de fondo claro) y aquí serían invisibles.
      ref={formularioRef}
      className="formulario-dorado p-4 rounded space-y-2"
      style={{
        background: DORADO.fondo,
        boxShadow: DORADO.relieve,
        border: `1px solid ${C.gold}`,
      }}
    >
      {ventanaPregunta}
      <div>
        {/* Arriba, pequeño y suelto: la familia, y el importe en el extremo
            derecho. Debajo, el nombre, más grande, con su zona (él, v50.5).
            "datos X de Y" no va aquí: ya lo dice la fila, justo encima. La
            zona es de SOLO VER: el colaborador no la cambia. */}
        <div className="text-xs flex items-center gap-3 flex-wrap" style={{ color: C.ink }}>
          <span>Familia {invitado.grupoFamiliar || form.apellido}</span>
          <span className="ml-auto">
            <PastillaDato destacado title="Importe calculado según edad y los precios de Configuración">
              € {importe.toFixed(2)}
            </PastillaDato>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className="text-lg" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
            {form.apellido}, {form.nombre}
          </span>
          <PastillaDato title="Zona del invitado. Solo la cambia el anfitrión.">
            {form.zona || "Sin zona"}
          </PastillaDato>
        </div>
      </div>
      {/* Seis apartados plegados, uno abierto a la vez (él, v52). Cerrado,
          cada uno enseña lo que tiene. El año de nacimiento va EL PRIMERO:
          de él depende si se pide email (a un menor, no). */}
      <div data-apartado="datos" className={latido("anioNacimiento", "email")}>
        <SeccionPlegable
          sencilla
          titulo={esMenorDeEdad(form, evento) ? "Año nac. *" : `Año nac. * · Email${pideEmailAqui ? " *" : ""}`}
          resumen={[form.anioNacimiento, colaboradorVinculado ? colaboradorVinculado.email : form.email].filter(Boolean).join(" · ")}
          abierta={apartado === "datos"}
          onAlternar={() => alternarApartado("datos")}
        >
          <div className="flex items-start gap-3">
            {/* Sin rótulos dentro: ya los dice el apartado (él, v52.2). */}
            <div data-campo="anioNacimiento">
              <TextInput
                value={form.anioNacimiento}
                onChange={(e) => setForm({ ...form, anioNacimiento: e.target.value })}
                placeholder="1988"
                maxLength={4}
                inputMode="numeric"
                aria-label="Año de nacimiento"
                style={{ width: ANCHO_ANIO, ...bordeRojo("anioNacimiento") }}
              />
            </div>
            {!esMenorDeEdad(form, evento) && (
              <div data-campo="email" className="flex-1 min-w-0">
                  {colaboradorVinculado ? (
                    <div>
                      <div
                        className="w-full px-2 py-1.5 rounded text-sm truncate"
                        style={{ background: C.paperDark, color: C.charcoal, opacity: OP.secundario }}
                      >
                        {colaboradorVinculado.email || "sin registrar"}
                      </div>
                      <span className="text-xs italic" style={{ color: C.ink }}>
                        Se edita en Colaboradores, no aquí.
                      </span>
                    </div>
                  ) : (
                    <TextInput
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      inputMode="email"
                      aria-label="Email"
                      className="w-full"
                      style={bordeRojo("email")}
                    />
                  )}
              </div>
            )}
          </div>
        </SeccionPlegable>
      </div>

      {/* Boda: solo a quien viene con su pareja (O o A). A los demás, ni
          se enseña (él, v52). La foto, o «No» si no tienen: Aniversarios lo
          usa, y sin ninguna de las dos no se guarda (v58.2). */}
      {pideDatosDeBoda(form) && <LineaEntreApartados />}
      {pideDatosDeBoda(form) && (
        <div data-apartado="boda" className={latido("fotoBoda", "anioBoda")}>
        <SeccionPlegable
          sencilla
          titulo="Boda"
          resumen={[form.anioBoda, hayFoto ? "con foto" : sinFoto ? "sin foto" : ""].filter(Boolean).join(" · ")}
          abierta={apartado === "boda"}
          onAlternar={() => alternarApartado("boda")}
        >
          {/* Todo en UNA línea (él, v52.1), en tres celdas separadas por
              una raya (v58.2): el año | "Foto boda" y su recuadro | «No».
              Repartidas a lo ancho, como tres ideas (él, v58.3): el año y
              el «No» se centran en lo que sobra; la foto, en medio. */}
          <div className="flex items-center py-1">
            <div data-campo="anioBoda" className="flex-1 flex justify-center">
              <TextInput
                value={form.anioBoda}
                onChange={(e) => setForm({ ...form, anioBoda: e.target.value })}
                placeholder="2015"
                maxLength={4}
                inputMode="numeric"
                aria-label="Año de boda"
                style={{ width: ANCHO_ANIO, ...bordeRojo("anioBoda") }}
              />
            </div>
            <SeparadorCeldas />
            <div data-campo="fotoBoda" className="flex items-center gap-1.5 px-2.5 flex-shrink-0">
              <span
                className="uppercase text-xs whitespace-nowrap"
                style={{ color: faltan.includes("fotoBoda") ? C.wax : "var(--etiqueta-campo)", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em" }}
              >
                Foto boda
              </span>
              {!sinFoto && (
                <HuecoFoto
                  ajustada
                  titulo="Foto de boda"
                  enlace={enlaceFoto}
                  ocupada={hayFoto}
                  subiendo={guardando && Boolean(fotoNueva)}
                  onElegir={elegirFoto}
                  onQuitar={() => setQuitandoFoto(true)}
                  onVer={() => setVerFoto(true)}
                />
              )}
            </div>
            <SeparadorCeldas />
            <div className="flex-1 flex justify-center">
              <label
                className="flex items-center gap-1 text-sm whitespace-nowrap"
                style={{ color: C.ink }}
                title={hayFoto ? "Con la foto ya puesta no se puede marcar que no tienen: quítala primero" : "No tienen foto de boda"}
              >
                <input type="checkbox" checked={sinFoto} disabled={hayFoto} onChange={() => setSinFoto(!sinFoto)} />
                No
              </label>
            </div>
          </div>
          {errorFoto && (
            <p className="text-xs" style={{ color: C.wax }}>
              {errorFoto}
            </p>
          )}
        </SeccionPlegable>
        </div>
      )}

      {/* Canción y observaciones: sin casilla "Sí" (él, v52). Vacías no
          cuentan en "datos X de Y": no son obligatorias. */}
      {[
        { campo: "cancion", titulo: "Canción", placeholder: "Título — Artista" },
        { campo: "observaciones", titulo: "Observaciones", placeholder: "Cualquier detalle adicional" },
      ].map(({ campo, titulo, placeholder }) => [
        <LineaEntreApartados key={`linea-${campo}`} />,
        <SeccionPlegable
          sencilla
          key={campo}
          titulo={titulo}
          resumen={form[campo] || ""}
          abierta={apartado === campo}
          onAlternar={() => alternarApartado(campo)}
        >
          <TextInput
            value={form[campo] || ""}
            onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
            placeholder={placeholder}
            className="w-full"
          />
        </SeccionPlegable>,
      ])}

      <LineaEntreApartados />
      <div data-apartado="alergias" className={latido("alergias")}>
        <SeccionPlegable
          sencilla
          titulo="Alergias *"
          resumen={form.alergias || ""}
          abierta={apartado === "alergias"}
          onAlternar={() => alternarApartado("alergias")}
        >
          <div data-campo="alergias" className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1 text-sm" style={{ color: C.ink }}>
              <input type="checkbox" checked={alergiaSel.no} onChange={marcarNo} />
              No
            </label>
            <label className="flex items-center gap-1 text-sm" style={{ color: C.ink }}>
              <input type="checkbox" checked={alergiaSel.gluten} onChange={() => alternarAlergia("gluten")} />
              Gluten
            </label>
            <label className="flex items-center gap-1 text-sm" style={{ color: C.ink }}>
              <input type="checkbox" checked={alergiaSel.lactosa} onChange={() => alternarAlergia("lactosa")} />
              Lactosa
            </label>
            <label className="flex items-center gap-1 text-sm" style={{ color: C.ink }}>
              <input type="checkbox" checked={conOtras} onChange={alternarOtras} />
              Otras
            </label>
            {conOtras && (
              <TextInput
                value={alergiaSel.otras}
                onChange={(e) => cambiarOtras(e.target.value)}
                placeholder="Otra (máx. 15)"
                maxLength={15}
                style={{ maxWidth: 140 }}
                autoFocus
              />
            )}
          </div>
        </SeccionPlegable>
      </div>

      {/* Permiso para conservar los datos después del evento (usuario,
          2026-09-21). Lo pide la propia nota de privacidad del tablón:
          "se eliminarán, salvo que tú autorices expresamente que los
          guarde para otra ocasión; el colaborador te lo preguntará y
          dejará constancia". La frase es la suya, palabra por palabra.
          ⚠️ DESMARCADA por defecto: un permiso que viene dado de fábrica
          no es un permiso. Y NO cuenta en "datos X de Y": es una decisión
          suya, no un dato. */}
      <LineaEntreApartados />
      <SeccionPlegable
        sencilla
        titulo="Después del evento"
        resumen={form.conservarDatos ? "Autorizado" : ""}
        abierta={apartado === "despues"}
        onAlternar={() => alternarApartado("despues")}
      >
        <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: C.ink }}>
          <input
            type="checkbox"
            checked={Boolean(form.conservarDatos)}
            onChange={(e) => setForm({ ...form, conservarDatos: e.target.checked })}
            className="flex-shrink-0 mt-0.5"
          />
          <span>
            Autorizo expresamente a que guarden mis datos
            <span className="block text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Para otra ocasión. Si no se marca, se borran a los 3 meses del evento.
            </span>
          </span>
        </label>
      </SeccionPlegable>

      {/* La única salida del formulario (él, v50): al final, donde se
          termina de rellenar, como en cualquier web. Del mismo ancho
          (norma 4) y, como en la pregunta estándar, "Cancelar" en el borde
          del lado del pulgar elegido (norma 3). */}
      {/* "* Obligatorios", al pie y sin fondo (él, v50.1), en el
          lado contrario a los botones: no gasta una línea más. */}
      <div className="flex items-center justify-between gap-2 pt-1 zurdo:flex-row-reverse">
        {/* Tras un "Guardar" con algo vacío, aquí mismo, junto al botón
            que se acaba de pulsar, y en rojo mientras falte algo (él, v50.4). */}
        {/* Abreviados para caber en UNA línea junto a los botones, también
            en el móvil (norma 6: si no cabe, se abrevia; él, v52.3). */}
        {faltan.length ? (
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: C.wax }}>
            Faltan datos
          </span>
        ) : (
          <span className="text-xs whitespace-nowrap" style={{ color: C.ink }}>
            * Obligatorios
          </span>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Boton variante="principal" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton onClick={cancelar} disabled={guardando} className="zurdo:order-first">
            Cancelar
          </Boton>
        </div>
      </div>

      {/* Foto de boda en grande, y el cambio desde ahí: igual que en
          Aniversarios. */}
      {verFoto && enlaceFoto && (
        <ModalFlotante titulo="Foto de boda" onCerrar={() => setVerFoto(false)} ancho={860}>
          <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: R.caja, overflow: "hidden", ...estiloMarcoFoto(10) }}>
            <img
              src={enlaceFoto}
              alt="Foto de boda"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>
          <label
            className="boton-3d inline-flex items-center justify-center font-medium cursor-pointer mt-3"
            style={estilosBoton("principal", "normal")}
          >
            Cambiar foto
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                e.target.value = "";
                if (!file) return;
                setVerFoto(false);
                elegirFoto(file);
              }}
            />
          </label>
        </ModalFlotante>
      )}

      {quitandoFoto && (
        <ModalFlotante
          titulo="¿Quitar la foto?"
          onCerrar={() => setQuitandoFoto(false)}
          ancho={360}
          acciones={
            <>
              <Boton
                variante="peligro"
                onClick={() => {
                  setQuitandoFoto(false);
                  quitarFoto();
                }}
              >
                Sí
              </Boton>
              <Boton onClick={() => setQuitandoFoto(false)}>No</Boton>
            </>
          }
        >
          <p className="text-sm" style={{ color: C.charcoal }}>
            Se borrará la foto de boda de la familia <b>{invitado.grupoFamiliar || invitado.apellido}</b>.
          </p>
        </ModalFlotante>
      )}
    </div>
  );
}

function FilaInvitadoColaborador({
  g,
  abierto,
  onToggleAbierto,
  onCerrarFicha,
  onGuardar,
  fotoFamiliar,
  onCambiarFotoFamiliar,
  onMarcarPagado,
  onMarcarPresente,
  // La familia entera (norma 11): pedirla y marcarla. Del almacén de datos.
  obtenerFamilia,
  marcarFamilia,
  evento,
  fotosFamiliares,
  fotosSinBoda = {},
  onCambiarSinFotoBoda,
  familiaSinEmail = false,
  colaboradorVinculado,
  // `oculta`: hay OTRA ficha abierta. En el móvil esta se esconde, para que
  // la abierta sea lo único en pantalla; en escritorio sigue viéndose la
  // lista entera, que ahí sí cabe (usuario, 2026-09-17).
  oculta,
  // `enFamilia`: dentro de su familia ya cerrada (v60). Solo el nombre, para
  // abrir su ficha: el pago y la llegada van por familia (FilaFamilia).
  enFamilia = false,
}) {
  const importe = importeEsperadoInvitado(g, evento);
  // Las preguntas en la ventana de la app, no en la del navegador (norma).
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();

  // Confirmación siempre (marcar Y quitar): con todas las filas cerradas muy
  // juntas, el pulgar puede tocar el botón de pago de un invitado equivocado
  // por error — así hay una última comprobación antes de que cuente.
  // Si hay alguien más de la familia a quien cambiar, pregunta "¿es para
  // toda la familia?", Sí o No (norma 11), y devuelve true. Si no hay nadie
  // más, false: sigue la pregunta de siempre, solo por esta persona.
  const preguntarPorLaFamilia = async (campo, valor, marcarSolo) => {
    if (!obtenerFamilia || !marcarFamilia) return false;
    const familia = await obtenerFamilia(g);
    const p = preguntaFamilia(familia, campo, valor, { evento, marcadoAbierto });
    if (p.aCambiar.length <= 1) return false;
    const titulos = {
      pagado: valor ? `¿El pago es para toda la familia ${g.apellido}?` : `¿Quitar el pago a toda la familia ${g.apellido}?`,
      presente: valor ? `¿Ha llegado toda la familia ${g.apellido}?` : `¿Quitar la llegada a toda la familia ${g.apellido}?`,
    };
    preguntar({
      titulo: titulos[campo],
      texto:
        textoPreguntaFamilia(p, campo, valor, evento) +
        (campo === "pagado" && valor ? `\n${AVISO_CIERRE_AL_PAGAR}` : ""),
      // «Sí» / «No» (él, v59.1, norma 9): la pregunta ya dice qué se hace.
      rotulo: "Sí",
      peligro: valor ? false : undefined,
      sinPrincipal: !p.puedeTodos,
      alConfirmar: () => marcarFamilia(g, campo, valor),
      otra: { rotulo: "No", alConfirmar: () => marcarSolo(g.id, valor) },
    });
    return true;
  };

  // En Modo Pruebas no se exige nada de antes (lib/modoPruebas.js).
  const exigir = requisitosActivos(evento);

  const confirmarPago = async () => {
    if (exigir && !g.pagado && !datosCompletos(g)) {
      preguntar({
        titulo: "Todavía no",
        texto: `No se puede marcar a ${nombreCompleto(g)} como pagado: faltan sus datos obligatorios (año de nacimiento y alergias).`,
        soloAviso: true,
      });
      return;
    }
    if (await preguntarPorLaFamilia("pagado", !g.pagado, onMarcarPagado)) return;
    preguntar(
      g.pagado
        ? { titulo: "¿Quitar el pago?", texto: nombreCompleto(g), rotulo: "Sí", alConfirmar: () => onMarcarPagado(g.id, false) }
        : { titulo: "¿Marcar como pagado?", texto: `${nombreCompleto(g)}\n${AVISO_CIERRE_AL_PAGAR}`, rotulo: "Sí", peligro: false, alConfirmar: () => onMarcarPagado(g.id, true) }
    );
  };

  // Pagado, la ficha ya no se abre (lib/invitados.js, fichaCerradaAlColaborador).
  // Si ya estaba abierta (la pagó el anfitrión mientras tanto) no se le
  // cierra de golpe: lo escrito se perdería sin aviso, y al guardar la base
  // lo rechaza con su motivo.
  const cerrada = fichaCerradaAlColaborador(g) && !abierto;
  const avisarCerrada = () =>
    preguntar({
      titulo: "Datos cerrados",
      texto: `${nombreCompleto(g)} ya ha pagado: sus datos quedan cerrados. Si hay que cambiar algo, díselo al anfitrión.`,
      soloAviso: true,
    });

  // Asistencia el día del evento (2026-09-06). Con confirmación, por el
  // mismo motivo que el pago: las filas van muy juntas y un dedo puede
  // marcar al de al lado -- y aquí el error es peor, porque el anfitrión
  // estaría contando como presente a alguien que no ha llegado.
  // Dos candados, los mismos que comprueba el servidor en
  // colaborador_marcar_presente: el anfitrión tiene que haber abierto el
  // marcado, y el invitado tiene que estar en regla (datos completos y
  // pagado). Aquí solo se desactiva el botón y se explica el motivo --
  // lo que de verdad lo impide es la comprobación del servidor.
  //
  // Desmarcar nunca se bloquea: un error hay que poder deshacerlo,
  // incluso con el marcado ya cerrado.
  const marcadoAbierto = Boolean(evento.asistenciaAbierta);
  const puedeTocarLlegada = g.presente || !exigir || (marcadoAbierto && datosCompletos(g) && g.pagado);
  const motivoBloqueo = !marcadoAbierto
    ? "el anfitrión todavía no ha abierto el control de llegadas"
    : !datosCompletos(g)
    ? "le faltan datos obligatorios (año de nacimiento y alergias)"
    : "todavía no ha pagado";

  const confirmarPresente = async () => {
    if (!puedeTocarLlegada) {
      preguntar({
        titulo: "Todavía no",
        texto: `No se puede marcar la llegada de ${nombreCompleto(g)}: ${motivoBloqueo}.`,
        soloAviso: true,
      });
      return;
    }
    if (await preguntarPorLaFamilia("presente", !g.presente, onMarcarPresente)) return;
    preguntar(
      g.presente
        ? { titulo: "¿Quitar la llegada?", texto: nombreCompleto(g), rotulo: "Sí", alConfirmar: () => onMarcarPresente(g.id, false) }
        : { titulo: "¿Ya está aquí?", texto: nombreCompleto(g), rotulo: "Sí", peligro: false, alConfirmar: () => onMarcarPresente(g.id, true) }
    );
  };

  // "Datos X de Y" de esta ficha, una sola vez para toda la fila.
  const sinFotoBoda = Boolean(fotosSinBoda[g.grupoFamiliar || ""]);
  const { rellenos: datosRellenos, total: datosTotal, incompleta: faltanDatos } = estadoDatos(g, {
    evento,
    foto: fotoFamiliar,
    sinFotoBoda,
    colaboradorVinculado,
  });
  // Ficha CERRADA con datos a medias (no está en N de N): fondo rojo y un
  // latido (usuario, 2026-09-19: primero "suave", luego "más rojo, más
  // latido"). Abierta no late: ya se está rellenando.
  const incompleta = !abierto && faltanDatos;

  return (
    <div
      className={`rounded ${oculta ? "hidden sm:block" : ""}${incompleta ? " ficha-incompleta" : ""}`}
      style={{
        // El tono de reposo del latido (.ficha-incompleta en index.css).
        background: incompleta ? "#F9DADF" : "#fff",
        border: `1px solid ${incompleta ? "rgba(176, 0, 32, 0.7)" : C.line}`,
      }}
    >
      <div className="flex items-center gap-2 p-3 text-sm">
        {/* Ronda 1 (faltan datos): "0 de 6", que solo se lee. Después, el
            pago. La columna se queda aunque la ficha esté abierta y el
            botón no se pinte: si desapareciera, el nombre de ESA fila
            empezaría en otro sitio que el de las demás. */}
        {!enFamilia && (
        <div className="flex-shrink-0" style={{ width: ANCHO_PAGO }}>
          {faltanDatos && exigir ? (
            <span className="flex items-center gap-1 text-xs whitespace-nowrap" style={{ color: C.wax }}>
              <Bell size={12} /> datos {datosRellenos} de {datosTotal}
            </span>
          ) : (
            !abierto && (
              <button
                onClick={confirmarPago}
                className="boton-3d rounded flex items-center justify-center w-full"
                style={{ height: ALTO_BOTON_FILA }}
              >
                {g.pagado ? (
                  <Stamp color={C.ink}>Pagado</Stamp>
                ) : (
                  <span
                    className="text-xs px-2 py-0.5 rounded whitespace-nowrap"
                    style={{ border: `1px dashed ${C.line}`, color: C.charcoal, opacity: OP.secundario }}
                  >
                    Pago pendiente
                  </span>
                )}
              </button>
            )
          )}
        </div>
        )}
        <button
          onClick={cerrada ? avisarCerrada : onToggleAbierto}
          className="boton-3d rounded px-2 flex items-center gap-2 flex-1 min-w-0"
          style={{ color: C.ink, height: ALTO_BOTON_FILA }}
        >
          {/* Si el nombre no cabe se recorta con puntos suspensivos: entero
              se lee al abrir la ficha. Nunca dos líneas (norma 6). */}
          <span className="truncate" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
            {g.apellido}, {g.nombre}
          </span>
          <span className="text-xs flex-shrink-0 ml-auto" style={{ color: C.gold }}>
            {cerrada ? <Lock size={12} aria-label="Datos cerrados" /> : abierto ? "▾" : "▸"}
          </span>
        </button>
        {/* El check de llegada cierra la fila, SIEMPRE en la misma columna
            (él, 2026-09-24) -- así se marca sin desplegar el formulario,
            que es como se va a usar el día del evento: de pie, recibiendo
            gente. Este no se invierte con la mano izquierda, como el resto
            de las filas de listas (ver CLAUDE.md, "Lo que NO se invierte"). */}
        {/* El check, solo con los datos completos: antes no se puede usar
            (salvo en Modo Pruebas). */}
        {!enFamilia && (!faltanDatos || !exigir) && (
        <button
          onClick={confirmarPresente}
          title={
            g.presente
              ? `${nombreCompleto(g)} ya está — toca para quitarlo`
              : puedeTocarLlegada
                ? `Marcar que ${nombreCompleto(g)} ha llegado`
                : `No se puede: ${motivoBloqueo}`
          }
          className="boton-3d flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: ALTO_BOTON_FILA,
            height: ALTO_BOTON_FILA,
            border: `2px solid ${g.presente ? C.ink : C.line}`,
            background: g.presente ? C.ink : "transparent",
            color: g.presente ? C.paper : C.line,
            opacity: puedeTocarLlegada ? 1 : OP.apagado,
            cursor: puedeTocarLlegada ? "pointer" : "not-allowed",
          }}
        >
          <Check size={18} strokeWidth={3} />
        </button>
        )}
      </div>
      {abierto && (
        // Verde detrás de la tarjeta dorada, misma idea que el cuerpo de la
        // ventana Aniversarios.
        <div className="p-3 pt-0" style={{ background: C.ink }}>
          <FormularioDatos
            invitado={g}
            evento={evento}
            onGuardar={onGuardar}
            fotoFamiliar={fotosFamiliares[g.grupoFamiliar || ""]}
            onCambiarFotoFamiliar={onCambiarFotoFamiliar}
            importe={importe}
            onCerrar={onCerrarFicha}
            colaboradorVinculado={colaboradorVinculado}
            sinFotoBoda={sinFotoBoda}
            onCambiarSinFotoBoda={onCambiarSinFotoBoda}
            familiaSinEmail={familiaSinEmail}
          />
        </div>
      )}
      {ventanaPregunta}
    </div>
  );
}

// ---------- La fila de una FAMILIA (él, v60) ----------
// Con los datos de la familia cerrados, cobrar y acreditar van por familia:
// una fila con el pago (o el sello), su nombre y la llegada. Un toque
// pregunta «¿todos?», Sí o No; con «No» se abre para elegir quién. Las
// mismas columnas que la fila de invitado (ANCHO_PAGO, ALTO_BOTON_FILA).
// Tocar el nombre la abre: sus miembros, y cada uno de los suyos abre su
// ficha mientras no haya pagado (renderMiembro).
// El que no paga con su familia (él, v61): se pregunta si va a ir a la
// fiesta; con «Sí», su aviso en rojo bajo la fila hasta que pague. Tocarlo,
// en cualquier momento, deja acreditar el pago o cambiar la respuesta
// (v61.1, lib/impagos.js).
const TEXTO_IMPAGO =
  "Sí: queda su pago pendiente una semana; si no paga, te volveremos a preguntar.\nNo: queda como «No asiste» y deja libre su sitio en la mesa.";
const TEXTO_SIN_PLAZOS = `Ya no quedan plazos (${PLAZOS_MAX} semanas): solo se puede marcar «No asiste».`;
const sinCentimos = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function FilaFamilia({ familia, evento, marcarFamilia, marcarMiembros, responderImpago, abierta, onAlternar, renderMiembro, oculta }) {
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  // Eligiendo a quién: { campo, valor, cambian: [...], marcados: Set }.
  const [eligiendo, setEligiendo] = useState(null);
  const rep = familia.representante;
  const exigir = requisitosActivos(evento);
  const marcadoAbierto = Boolean(evento.asistenciaAbierta);
  const uno = familia.miembros.length === 1;

  const preguntarTodos = (campo, valor) => {
    if (!rep) return;
    if (campo === "presente" && valor && exigir && !marcadoAbierto) {
      preguntar({ titulo: "Todavía no", texto: "El anfitrión todavía no ha abierto el control de llegadas.", soloAviso: true });
      return;
    }
    const p = preguntaFamilia(familia.miembros, campo, valor, { evento, marcadoAbierto });
    const quien = uno ? nombreCompleto(familia.miembros[0]) : `los ${familia.etiqueta}`;
    const titulos = {
      pagado: valor ? (uno ? `¿Ha pagado ${quien}?` : `¿Pagan todos ${quien}?`) : `¿Quitar el pago a ${uno ? quien : `toda la familia ${familia.etiqueta}`}?`,
      presente: valor ? (uno ? `¿Ha llegado ${quien}?` : `¿Han llegado todos ${quien}?`) : `¿Quitar la llegada a ${uno ? quien : `toda la familia ${familia.etiqueta}`}?`,
    };
    preguntar({
      titulo: titulos[campo],
      texto: textoPreguntaFamilia(p, campo, valor, evento) + (campo === "pagado" && valor ? `\n${AVISO_CIERRE_AL_PAGAR}` : ""),
      rotulo: "Sí",
      peligro: valor ? false : undefined,
      sinPrincipal: !p.puedeTodos,
      alConfirmar: () => marcarFamilia(rep, campo, valor),
      // «No» con uno solo es no hacer nada; con varios, elegir quién.
      ...(uno
        ? {}
        : {
            otra: {
              rotulo: "No",
              alConfirmar: () => {
                const bloqueados = new Set(p.bloqueados.map((b) => b.m.id));
                const cambian = p.aCambiar.filter((m) => !bloqueados.has(m.id));
                setEligiendo({ campo, valor, cambian, bloqueados, marcados: new Set(cambian.map((m) => m.id)) });
                if (!abierta) onAlternar();
              },
            },
          }),
    });
  };

  const alternarMarcado = (id) =>
    setEligiendo((e) => {
      const marcados = new Set(e.marcados);
      if (marcados.has(id)) marcados.delete(id);
      else marcados.add(id);
      return { ...e, marcados };
    });

  // «¿Va a ir a la fiesta?», uno detrás de otro. La ✕ salta al siguiente.
  // Con su plazo en curso, «Sí» lo deja como está: no gasta otro plazo.
  const preguntarImpago = ([m, ...resto]) => {
    if (!m) return;
    const e = estadoImpago(m);
    const enCurso = e && !e.vencido;
    const sinPlazos = !enCurso && (Number(m.plazosPago) || 0) >= PLAZOS_MAX;
    const responder = (va) => async () => {
      if (!(va && enCurso)) await responderImpago(rep, m.id, va);
      preguntarImpago(resto);
    };
    preguntar({
      titulo: `¿${nombreCompleto(m)} va a ir a la fiesta?`,
      texto: sinPlazos
        ? TEXTO_SIN_PLAZOS
        : enCurso
          ? `Sí: sigue con su pago pendiente hasta el ${fechaCorta(e.hasta)}.\nNo: queda como «No asiste» y deja libre su sitio en la mesa.`
          : TEXTO_IMPAGO,
      rotulo: "Sí",
      peligro: false,
      sinPrincipal: sinPlazos,
      alConfirmar: responder(true),
      otra: { rotulo: "No", alConfirmar: responder(false) },
      alCancelar: () => preguntarImpago(resto),
    });
  };

  const guardarEleccion = async () => {
    const { campo, valor, cambian, marcados } = eligiendo;
    const ids = [...marcados];
    if (ids.length) await marcarMiembros(rep, ids, campo, valor);
    setEligiendo(null);
    // Al cobrar, por los que no pagan; quien tiene su plazo en curso, no.
    if (campo === "pagado" && valor && responderImpago) {
      preguntarImpago(cambian.filter((m) => !marcados.has(m.id) && !(estadoImpago(m) && !estadoImpago(m).vencido)));
    }
  };

  // Tocar su aviso: primero «¿Ha pagado?»; con «No», «¿Va a ir?».
  const atenderImpago = (m) => {
    const p = preguntaFamilia([m], "pagado", true, { evento, marcadoAbierto });
    preguntar({
      titulo: `¿Ha pagado ${nombreCompleto(m)}?`,
      texto: `${textoPreguntaFamilia(p, "pagado", true, evento)}\n${AVISO_CIERRE_AL_PAGAR}`,
      rotulo: "Sí",
      peligro: false,
      sinPrincipal: !p.puedeTodos,
      alConfirmar: () => marcarMiembros(rep, [m.id], "pagado", true),
      otra: { rotulo: "No", alConfirmar: () => preguntarImpago([m]) },
    });
  };

  const impagos = familia.miembros.filter((m) => estadoImpago(m));

  const totalElegido = eligiendo?.campo === "pagado" && eligiendo.valor
    ? familia.miembros.filter((m) => eligiendo.marcados.has(m.id)).reduce((s, m) => s + importeEsperadoInvitado(m, evento), 0)
    : null;

  return (
    <div className={`rounded ${oculta ? "hidden sm:block" : ""}`} style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 p-3 text-sm">
        <div className="flex-shrink-0" style={{ width: ANCHO_PAGO }}>
          <button
            onClick={() => preguntarTodos("pagado", !familia.todosPagados)}
            className="boton-3d rounded flex items-center justify-center w-full"
            style={{ height: ALTO_BOTON_FILA }}
          >
            {familia.todosPagados ? (
              <Stamp color={C.ink}>Pagado</Stamp>
            ) : (
              <span
                className="text-xs px-2 py-0.5 rounded whitespace-nowrap"
                style={{ border: `1px dashed ${C.line}`, color: C.charcoal }}
              >
                Pago · {sinCentimos(familia.totalPorPagar)}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={onAlternar}
          className="boton-3d rounded px-2 flex items-center gap-2 flex-1 min-w-0"
          style={{ color: C.ink, height: ALTO_BOTON_FILA }}
        >
          <span className="truncate" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
            {familia.etiqueta}
          </span>
          <span className="text-xs flex-shrink-0" style={{ color: C.charcoal, opacity: OP.secundario }}>
            {familia.miembros.length}
          </span>
          <span className="text-xs flex-shrink-0 ml-auto" style={{ color: C.gold }}>
            {abierta ? "▾" : "▸"}
          </span>
        </button>
        {/* La llegada de la familia, en la misma columna que la de cada
            invitado: así se marca sin abrir nada, de pie y recibiendo. */}
        <button
          onClick={() => preguntarTodos("presente", !familia.todosPresentes)}
          title={familia.todosPresentes ? "Han llegado todos — toca para quitarlo" : "Marcar la llegada de la familia"}
          className="boton-3d flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: ALTO_BOTON_FILA,
            height: ALTO_BOTON_FILA,
            border: `2px solid ${familia.todosPresentes ? C.ink : C.line}`,
            background: familia.todosPresentes ? C.ink : "transparent",
            color: familia.todosPresentes ? C.paper : C.line,
          }}
        >
          <Check size={18} strokeWidth={3} />
        </button>
      </div>

      {impagos.map((m) => (
        // Vencido, en negrita: hay que volver a preguntar.
        <button
          key={m.id}
          onClick={() => atenderImpago(m)}
          className="boton-3d flex items-center gap-2 w-full px-3 text-xs text-left"
          style={{
            background: C.avisoFondo,
            color: C.peligro,
            height: ALTO_BOTON_FILA,
            fontWeight: estadoImpago(m).vencido ? 600 : undefined,
          }}
        >
          <span className="truncate">⚠ {textoAvisoImpago(m)}</span>
        </button>
      ))}

      {eligiendo && (
        // Elegir quién: cada uno con su ✓ o ✕, la cuenta arriba, y al pie
        // «Guardar» y «Cancelar» (norma 5).
        <div className="px-3 pb-3 pt-2" style={{ background: C.ink, color: C.paper }}>
          <div className="flex items-center justify-between text-xs mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.goldClaro }}>
            <span>{totalElegido !== null ? sinCentimos(totalElegido) : ""}</span>
            <span>
              {eligiendo.marcados.size} de {eligiendo.cambian.length}
            </span>
          </div>
          {familia.miembros.map((m) => {
            const cambia = eligiendo.cambian.some((x) => x.id === m.id);
            const marcado = eligiendo.marcados.has(m.id);
            return (
              <div key={m.id} className="flex items-center justify-between gap-2 py-1.5" style={{ borderBottom: `1px solid ${C.gold}33` }}>
                <span className="truncate" style={{ opacity: cambia ? 1 : OP.tenue }}>{nombreCompleto(m)}</span>
                <button
                  onClick={() => cambia && alternarMarcado(m.id)}
                  disabled={!cambia}
                  aria-pressed={marcado}
                  aria-label={`${nombreCompleto(m)}: ${marcado ? "sí" : "no"}`}
                  className="boton-3d flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: ALTO_BOTON_FILA,
                    height: ALTO_BOTON_FILA,
                    background: !cambia ? "transparent" : marcado ? C.goldClaro : C.peligro,
                    color: !cambia ? C.goldClaro : marcado ? C.ink : "#fff",
                    border: !cambia ? `1px solid ${C.gold}` : "none",
                    opacity: cambia ? 1 : OP.tenue,
                  }}
                >
                  {marcado || !cambia ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                </button>
              </div>
            );
          })}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Boton variante="principal" oscuro onClick={guardarEleccion}>
              Guardar
            </Boton>
            <Boton oscuro onClick={() => setEligiendo(null)} className="zurdo:order-first">
              Cancelar
            </Boton>
          </div>
        </div>
      )}

      {abierta && !eligiendo && (
        <div className="px-3 pb-3 space-y-2">
          {familia.miembros.map((m) =>
            m.esMio ? (
              renderMiembro(m.id)
            ) : (
              // Lo lleva otro colaborador: se ve, pero su ficha no es suya.
              <div key={m.id} className="px-2 text-sm truncate" style={{ color: C.charcoal, opacity: OP.secundario }}>
                {nombreCompleto(m)}
              </div>
            )
          )}
        </div>
      )}
      {ventanaPregunta}
    </div>
  );
}

// `barra`: en el móvil, el formulario va a pantalla entera en la barra de
// ventanas (App.jsx, BarraVentanas.jsx), con su cuadradito (él, v57.1).
// `abrirMusicaDentro`: con el permiso Multimedia, Música dentro de la app
// (móvil, o si el navegador bloquea su ventana), igual que el anfitrión.
export function VistaColaborador({ data, colaboradorId, esAnfitrionOriginal, setRol, anfitrionToken, onCerrarSesion, barra, abrirMusicaDentro }) {
  const { colaboradores, invitados, persistInvitados, fotosFamiliares, persistFotosFamiliares, fotosSinBoda, persistFotosSinBoda, evento, ordenFamiliares, tokenTablon } = data;
  // Familias sin ningún email: el colaborador lo recibe de la base; el
  // anfitrión (vista previa "Formularios") lo calcula con la lista entera.
  const familiasSinEmailAhora = data.esAnfitrion
    ? familiasSinEmail(invitados, colaboradores)
    : new Set(data.familiasSinEmailServidor || []);
  const enlaceTablon = construirEnlaceTablon(evento.urlPublica, tokenTablon);
  const colaborador = colaboradores.find((c) => c.id === colaboradorId);
  // Avisos en la ventana de la app, no en la del navegador (norma 9).
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  const aviso = (titulo, texto) => preguntar({ titulo, texto, soloAviso: true });
  // Permisos extra (más allá de sus invitados asignados), concedidos por
  // el anfitrión desde la ventana Permisos -- a petición del usuario,
  // 2026-08-25, empezando por poder editar el texto de Novedades. Mismo
  // patrón de ventana emergente que usa el anfitrión (ver
  // VistaAnfitrion.jsx/usePopupWindow.js), pero con nombre de ventana
  // distinto -- por si la misma persona tuviera abiertas a la vez una
  // pestaña de anfitrión y otra de colaborador en el mismo navegador, no
  // deben compartir la misma ventana del sistema operativo.
  const puedeEditarNovedades = tienePermiso(colaborador, PERMISOS.NOVEDADES_EDITAR);
  const {
    abrir: abrirNovedades,
    actualizar: actualizarNovedades,
    abierta: novedadesAbierta,
    ventana: ventanaNovedades,
  } = usePopupWindow({ nombreVentana: "novedades-evento-colaborador", ancho: 640, alto: 800 });
  useEffect(() => {
    if (novedadesAbierta) {
      actualizarNovedades(<VentanaNovedades data={data} ventana={ventanaNovedades} soloTexto />);
    }
  }, [novedadesAbierta, actualizarNovedades, data, ventanaNovedades]);

  // Resto de permisos extra, mismo espíritu que el de arriba -- estas
  // tres son ventanas normales (VentanaFlotante dentro de la propia
  // pestaña, no una emergente): "Editar textos email" y "Editar datos
  // evento" reutilizan tal cual las ventanas del anfitrión (su
  // contenido no depende de quién las abra); "Enviar invitaciones" es
  // una versión deliberadamente más simple de la del anfitrión (ver
  // VentanaInvitacionesColaborador.jsx) que solo deja mandar a familias
  // ya confirmadas y pagadas, con una confirmación extra del dinero
  // antes de cada envío.
  const puedeEditarDatosEvento = tienePermiso(colaborador, PERMISOS.DATOS_EVENTO_EDITAR);
  const puedeEnviarInvitaciones = tienePermiso(colaborador, PERMISOS.INVITACIONES_ENVIAR);
  const puedeMultimedia = tienePermiso(colaborador, PERMISOS.MULTIMEDIA);
  const puedeVerMapaSitio = tienePermiso(colaborador, PERMISOS.MAPA_SITIO_VER);
  const puedeVerRepositorio = tienePermiso(colaborador, PERMISOS.REPOSITORIO_VER);
  const [ventanaDatosEventoAbierta, setVentanaDatosEventoAbierta] = useState(false);
  const [ventanaInvitacionesAbierta, setVentanaInvitacionesAbierta] = useState(false);
  const motorInvitaciones = useMotorInvitaciones(data);

  // Pantalla de inicio: la misma Portada que ve el anfitrión (sin sus 3
  // recuadros de estadísticas, que no viven aquí sino en VistaAnfitrion.jsx),
  // con su propio "Abrir sección…" (v51). El resumen y las listas de
  // invitados viven en "Formulario", que se abre desde ahí.
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const enBarra = Boolean(barra) && Boolean(window.matchMedia?.("(pointer: coarse) and (hover: none)")?.matches);
  const formularioVisible = enBarra ? barra.formularioEnBarra : formularioAbierto;
  const abrirFormulario = enBarra ? barra.abrirFormulario : () => setFormularioAbierto(true);
  const cerrarSinPreguntar = enBarra ? barra.cerrarFormulario : () => setFormularioAbierto(false);
  // Con una ficha a medio escribir, «¿Descartar los cambios?» antes.
  const cerrarFormulario = () =>
    haySinGuardar("formulario")
      ? preguntar({ ...PREGUNTA_DESCARTAR, alConfirmar: cerrarSinPreguntar })
      : cerrarSinPreguntar();
  const [miCuentaAbierta, setMiCuentaAbierta] = useState(false);
  const [abiertoId, setAbiertoId] = useState(null);
  // Mientras un invitado está abierto, se queda fijo en la sección donde
  // estaba al abrirlo (pendiente o completo), aunque sus datos cambien
  // mientras tanto — si no, al rellenar el año de nacimiento saltaría de
  // lista a mitad de edición, cerrando/recreando el formulario de golpe.
  const [pendienteAlAbrir, setPendienteAlAbrir] = useState(null);

  const misInvitados = invitados.filter(
    (g) => resolverColaborador(g, colaboradores)?.id === colaboradorId
  );
  // Solo confirmados: desde el 2026-08-12, colaborador_mis_invitados ya
  // no manda tentativa al navegador del colaborador (ver schema.sql) --
  // este filtro es ahora un no-op de refuerzo, no la barrera real.
  const confirmados = misInvitados.filter((g) => g.confirmado);
  // INCOMPLETA = no está en "N de N" (la misma regla que pinta la fila de
  // rojo, lib/invitados.js). Antes estas secciones solo miraban los datos
  // obligatorios (año de nacimiento y alergias), y una ficha podía estar en
  // "completados" y en rojo a la vez.
  // La misma cuenta que el sello del anfitrión cuando él también es
  // colaborador (fichasIncompletasDe, lib/invitados.js).
  const idsIncompletas = new Set(
    fichasIncompletasDe(colaboradorId, { invitados, colaboradores, evento, fotosFamiliares, fotosSinBoda }).map((g) => g.id)
  );
  const incompletaDe = (g) => idsIncompletas.has(g.id);
  const esPendiente = (g) => (g.id === abiertoId ? pendienteAlAbrir : incompletaDe(g));
  const pendientes = confirmados.filter(esPendiente);
  const completos = confirmados.filter((g) => !esPendiente(g));
  const pagados = confirmados.filter((g) => g.pagado);
  const noPagados = confirmados.filter((g) => !g.pagado);

  // ---------- Por familias (él, v60) ----------
  // Las familias con los datos cerrados se cobran y acreditan juntas; los
  // demás siguen persona a persona en «Incompletos». La familia entera,
  // también los que lleva otro colaborador, la da la base
  // (data.obtenerMisFamilias); mientras llega, la lista propia.
  const miembrosLocales = miembrosDesdeLista(invitados, colaboradorId, datosCompletos);
  const [miembrosServidor, setMiembrosServidor] = useState(null);
  const obtenerMisFamilias = data.obtenerMisFamilias;
  useEffect(() => {
    if (!obtenerMisFamilias) return undefined;
    let vivo = true;
    obtenerMisFamilias(colaboradorId).then((m) => vivo && setMiembrosServidor(m || null));
    return () => {
      vivo = false;
    };
  }, [obtenerMisFamilias, colaboradorId, invitados]);
  const familias = agruparFamilias(miembrosServidor || miembrosLocales, { fotosFamiliares, fotosSinBoda: fotosSinBoda || {}, incompletas: idsIncompletas }, evento).filter(
    (f) => f.cerrada && f.representante
  );
  const idsEnFamilia = new Set(familias.flatMap((f) => f.miembros.filter((m) => m.esMio).map((m) => m.id)));
  // La ficha abierta se queda donde estaba al abrirla, aunque al guardar su
  // familia se cierre (mismo criterio que pendienteAlAbrir).
  const [enRecogidaAlAbrir, setEnRecogidaAlAbrir] = useState(null);
  const enRecogida = confirmados.filter((g) => (g.id === abiertoId && enRecogidaAlAbrir !== null ? enRecogidaAlAbrir : !idsEnFamilia.has(g.id)));
  const [familiaAbierta, setFamiliaAbierta] = useState(null);

  // Solo confirmados: los tentativa nunca deben nombrarse al colaborador
  // (mismo criterio que el email de "Tus invitados asignados", ver
  // anfitrion_avisar_colaborador) -- no levantar sospechas sobre la
  // organización antes de tiempo.
  const gruposFamiliaresACargo = [
    ...new Set(confirmados.map((g) => g.grupoFamiliar || g.apellido).filter(Boolean)),
  ].sort();
  const familiasConInvitacion = gruposFamiliaresACargo.filter(
    (f) => ordenFamiliares[f]?.invitacionEnviada
  ).length;

  const importeEsperado = confirmados.reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
  const importeCobrado = pagados.reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
  const importePendiente = importeEsperado - importeCobrado;

  const guardar = (form) => {
    persistInvitados(invitados.map((g) => (g.id === form.id ? form : g)));
  };

  const cambiarFotoFamiliar = (grupoFamiliar, url) => {
    const clave = grupoFamiliar || "";
    if (!clave) return;
    persistFotosFamiliares({ ...fotosFamiliares, [clave]: url });
  };

  // "Esta familia no tiene foto de boda" (o sí, al volver a marcarla).
  const cambiarSinFotoBoda = (grupoFamiliar, sin) => {
    const clave = grupoFamiliar || "";
    if (!clave) return;
    persistFotosSinBoda({ ...(fotosSinBoda || {}), [clave]: sin });
  };

  const marcarPagado = (id, pagado) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, pagado } : g)));
  };

  const marcarPresente = (id, presente) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, presente } : g)));
  };

  // Una ficha de invitado abierta (no los paneles): en el móvil pasa a ser
  // la protagonista y se esconde todo lo demás -- "para ver otra cosa hay
  // que cerrarla", como pidió el usuario.
  const hayFicha = (a) => Boolean(a) && a !== "perfil" && a !== "cuentas";
  const fichaAbierta = hayFicha(abiertoId);

  // Con una ficha abierta, solo se sale por "Guardar" o "Cancelar" (v50):
  // lo escrito todavía no ha subido, y abrir otra ficha o panel lo
  // perdería sin preguntar.
  const toggleAbierto = (g) =>
    setAbiertoId((actual) => {
      if (hayFicha(actual)) return actual;
      setPendienteAlAbrir(incompletaDe(g));
      setEnRecogidaAlAbrir(!idsEnFamilia.has(g.id));
      return g.id;
    });
  const cerrarFicha = () => setAbiertoId(null);

  // El aviso al anfitrión ya no se dispara solo (eso mandaba demasiados
  // emails durante el trabajo normal) — el colaborador lo confirma él
  // mismo cuando de verdad ha terminado, y el servidor vuelve a comprobar
  // que sea cierto antes de enviar nada.
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [enviandoDatos, setEnviandoDatos] = useState(false);
  const [enviandoPagos, setEnviandoPagos] = useState(false);

  const confirmarDatosCompletos = async () => {
    // Misma regla que la sección INCOMPLETOS: con fichas en rojo no se avisa
    // de "terminado". El servidor solo comprueba los dos obligatorios; esto
    // es lo que de verdad decide.
    if (pendientes.length > 0) {
      aviso(
        "Todavía no",
        `Hay ${pendientes.length} ficha${pendientes.length !== 1 ? "s" : ""} incompleta${pendientes.length !== 1 ? "s" : ""} (en rojo, en INCOMPLETOS).`
      );
      return;
    }
    setEnviandoDatos(true);
    const { data, error } = await supabase.rpc("colaborador_confirmar_datos_completos", {
      p_colaborador_id: colaboradorId,
    });
    setEnviandoDatos(false);
    if (error) {
      aviso("No se pudo", "No se pudo avisar al anfitrión. Inténtalo de nuevo.");
      return;
    }
    if (data) aviso("Hecho", "Aviso enviado al anfitrión: datos completos.");
    else aviso("Todavía no", "Todavía faltan invitados confirmados por completar sus datos.");
  };

  const confirmarPagosCompletos = async () => {
    setEnviandoPagos(true);
    const { data, error } = await supabase.rpc("colaborador_confirmar_pagos_completos", {
      p_colaborador_id: colaboradorId,
    });
    setEnviandoPagos(false);
    if (error) {
      aviso("No se pudo", "No se pudo avisar al anfitrión. Inténtalo de nuevo.");
      return;
    }
    if (data) aviso("Hecho", "Aviso enviado al anfitrión: pagos completos.");
    else aviso("Todavía no", "Todavía faltan invitados confirmados por pagar.");
  };

  if (!colaborador) return null;

  const formatoEuro = (n) => `€ ${n.toFixed(2)}`;

  // Aviso permanente (no un aviso puntual de "algo nuevo") mientras el
  // colaborador tenga CUALQUIER permiso extra concedido -- a petición del
  // usuario, 2026-08-27: hasta ahora un permiso nuevo no generaba ningún
  // aviso real (ni email ni nada dentro de la app), así que la única
  // forma de enterarse era encontrarse el botón nuevo por casualidad. Se
  // recalcula solo de `colaborador.permisos` (mismo criterio que el resto
  // de la app: nunca una bandera fija que haya que acordarse de apagar) --
  // desaparece solo si el anfitrión le quita el permiso.
  const permisosActivos = Array.isArray(colaborador?.permisos) ? colaborador.permisos : [];
  // Solo los que dejan CAMBIAR algo. Los de vista (el mapa, el código)
  // no son responsabilidad de nadie y no pintan nada en un aviso rojo
  // -- ver la nota de los dos tipos en lib/permisos.js.
  const permisosDeEdicion = permisosActivos.filter(esDeEdicion);

  return (
    <div className="space-y-8">
      {/* El aviso de permisos. El usuario lo quiere mantener (2026-09-21):
          es lo primero que se ve y ahí se entera uno de lo que puede
          hacer. Dos partes distintas a propósito:
            - la frase de "permisos de edición", solo si los hay -- los
              que dejan mirar no son responsabilidad de nadie;
            - y el LINK al proyecto, que es el permiso y el acceso a la
              vez. Antes se anunciaba aquí y el botón estaba escondido en
              "Mi cuenta", así que había que buscarlo.
          (Aquí hubo un rodeo: primero se puso con relieve, y dos días
          después la norma 4 se reescribió para decir que un link va
          subrayado. Ahora lo está.) */}
      {(permisosDeEdicion.length > 0 || puedeVerRepositorio) && (
        <div className="p-4 rounded text-sm" style={{ background: C.peligro, color: "#fff" }}>
          {permisosDeEdicion.length > 0 && (
            <p style={{ fontWeight: 600 }}>
              🔑 Tienes permisos de edición: {permisosDeEdicion.map((p) => ETIQUETAS_PERMISOS[p] || p).join(", ")}.
            </p>
          )}
          {puedeVerRepositorio && (
            /* UNA SOLA LÍNEA, y el link es la propia frase (usuario,
               2026-09-21). Antes eran dos renglones: uno anunciaba el
               permiso y otro repetía "GitHub" en un botón aparte. El
               permiso y la forma de usarlo son la misma cosa, así que se
               dicen una sola vez.
               Norma 4: es un LINK, así que va subrayado y sin
               relieve. Al ir dentro de la frase tampoco puede irse al
               lado del pulgar -- es texto, no un acceso suelto. */
            <p style={{ fontWeight: 600 }} className={permisosDeEdicion.length > 0 ? "mt-2" : ""}>
              🔑 Tienes permiso para{" "}
              <EnlaceTexto
                href={URL_REPOSITORIO}
                enLinea
                color={C.goldClaro}
                style={{ opacity: 1 }}
                title="Abre el proyecto en otra pestaña"
              >
                ver el proyecto en GitHub
              </EnlaceTexto>
              .
            </p>
          )}
        </div>
      )}
      {/* Misma Portada que ve el anfitrión (imagen + franja fecha/hora/
          lugar en vivo) -- sin sus 3 recuadros de estadísticas (Lista
          global/Tentativa/Confirmados: esos son del evento entero, viven
          aparte en VistaAnfitrion.jsx, no aquí). Su "Abrir sección…" va en
          botonExtra, con solo sus líneas (v51). */}
      <Portada
        evento={evento}
        onCerrarSesion={onCerrarSesion}
        enlaceTablon={enlaceTablon}
        mostrarMapaSitio={puedeVerMapaSitio}
        mostrarDiseno={tienePermiso(colaborador, PERMISOS.DISENO_VER)}
        miCuenta={{ abierta: miCuentaAbierta, onCerrar: () => setMiCuentaAbierta(false) }}
        botonExtra={
          <>
            {esAnfitrionOriginal && (
              <MenuFlotante
                anchor="bottom-left"
                opciones={[
                  { id: "rol-anfitrion", etiqueta: "Anfitrión", icono: UserSolido, onClick: () => setRol(anfitrionToken) },
                  ...colaboradores
                    .filter((c) => c.id !== colaboradorId)
                    .map((c) => ({
                      id: `rol-${c.id}`,
                      etiqueta: c.nombre,
                      icono: User,
                      onClick: () => setRol(c.id),
                    })),
                ]}
                render={({ ref, toggle: abrirCerrar }) => (
                  <button
                    ref={ref}
                    onClick={abrirCerrar}
                    className="boton-3d boton-verde-solido flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                    title="Estás previsualizando como colaborador — cambia de vista aquí"
                  >
                    Cambiar vista <ChevronDown size={13} style={{ opacity: OP.secundario }} />
                  </button>
                )}
              />
            )}
            {/* Todo en un solo botón, como el del anfitrión (él, v50.6),
                con el sello de sus fichas incompletas encima: se ve con
                todo cerrado. Solo sus líneas, en orden alfabético; las de
                permiso, solo si lo tiene. */}
            <BotonAbrirSeccion
              sello={pendientes.length}
              opciones={[
                puedeEditarDatosEvento && { id: "datos-evento", etiqueta: "Datos evento", icono: Calendar, onClick: () => setVentanaDatosEventoAbierta(true) },
                { id: "formulario", etiqueta: "Formulario", icono: ICONOS_VENTANAS.formulario, onClick: abrirFormulario, sello: pendientes.length },
                puedeEnviarInvitaciones && { id: "invitaciones", etiqueta: "Invitaciones", icono: Send, onClick: () => setVentanaInvitacionesAbierta(true) },
                onCerrarSesion && { id: "mi-cuenta", etiqueta: "Mi cuenta", icono: UserCog, onClick: () => setMiCuentaAbierta(true), ...ESTILO_MI_CUENTA },
                puedeMultimedia && { id: "musica", etiqueta: "Multimedia", icono: ICONOS_VENTANAS.musicaEvento, onClick: () => abrirMusica(abrirMusicaDentro) },
                puedeEditarNovedades && { id: "novedades", etiqueta: "Novedades", icono: Megaphone, onClick: abrirNovedades },
              ].filter(Boolean)}
            />
          </>
        }
      />

      {/* Cronograma/logística del día -- se dibuja solo a partir de
          evento.cronogramaBloques (ver lib/cronograma.js). Oculto por
          defecto, solo aparece aquí si el anfitrión ha marcado "Visible
          para colaboradores" en Configuración → Cronograma. */}
      {evento.cronogramaVisibleColaboradores && Array.isArray(evento.cronogramaBloques) && evento.cronogramaBloques.length > 0 && (
        <img
          src={generarImagenCronograma(evento.cronogramaHoraInicio || "18:00", evento.cronogramaBloques)}
          alt="Cronograma del día"
          className="w-full rounded-lg"
        />
      )}

      {ventanaDatosEventoAbierta && (
        <VentanaConfigDatosEvento data={data} onCerrar={() => setVentanaDatosEventoAbierta(false)} />
      )}
      {ventanaInvitacionesAbierta && (
        <VentanaInvitacionesColaborador
          motor={motorInvitaciones}
          onCerrar={() => setVentanaInvitacionesAbierta(false)}
        />
      )}

      {formularioVisible && (
        <CapaBarra activa={enBarra} delante={barra?.delante === "formulario"} arriba={barra?.arriba || 0} marco>
        <VentanaFlotante
          clave="formulario-colaborador"
          titulo={colaborador.nombre}
          onCerrar={cerrarFormulario}
          fijo={enBarra}
          pantallaEntera={enBarra}
        >
          {/* Todo plegado al abrir y solo una cosa abierta a la vez, como en
              Novedades -- filosofía única de la app, a petición del usuario
              (2026-09-17). El mismo `abiertoId` sirve para estos dos paneles
              y para la ficha de cada invitado, así que abrir una cierra las
              demás sin lógica aparte. */}
          <div className={`space-y-2 ${fichaAbierta ? "hidden sm:block" : ""}`}>
            <SeccionPlegable
              icono={UserCog}
              titulo="Tus datos"
              resumen={`${gruposFamiliaresACargo.length} familia${gruposFamiliaresACargo.length === 1 ? "" : "s"}`}
              abierta={abiertoId === "perfil"}
              onAlternar={() => setAbiertoId((a) => (hayFicha(a) ? a : a === "perfil" ? null : "perfil"))}
            >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
                FAMILIAS CONFIRMADAS:{" "}
                {gruposFamiliaresACargo.length > 0
                  ? gruposFamiliaresACargo.join(", ")
                  : "ninguno"}
              </div>
              {/* Si ya tiene email registrado, no hace falta decir nada aquí
                  -- el aviso es solo para cuando falta, a petición del
                  usuario (antes se mostraba siempre, con el email delante). */}
              {!colaborador.email && (
                <div className="text-xs mt-1" style={{ color: C.wax }}>
                  Sin email de contacto{" "}
                  <span className="italic" style={{ opacity: OP.secundario }}>
                    (solo lo puede cambiar el anfitrión)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recuadro más compacto (a petición del usuario): menos margen/
              padding alrededor y letra más pequeña que antes -- mismos
              datos, menos alto ocupado. */}
          {/* 2 filas de 3 recuadros (a petición del usuario): los 5 datos +
              un 6º recuadro con las 3 barras de porcentaje dentro, todos
              del mismo tamaño/estilo -- antes las barras iban aparte,
              debajo, en su propia sección. Textos más cortos (Pendiente,
              Importe total, Cobrado) para que quepan cómodos en un
              recuadro más pequeño. */}
            </SeccionPlegable>

            <SeccionPlegable
              icono={Euro}
              titulo="Contabilidad"
              resumen={`Pendiente ${formatoEuro(importePendiente)}`}
              abierta={abiertoId === "cuentas"}
              onAlternar={() => setAbiertoId((a) => (hayFicha(a) ? a : a === "cuentas" ? null : "cuentas"))}
            >
          <div
            className="grid grid-cols-3 gap-1.5 mt-2 pt-2"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            {/* Orden: fila 1 los 3 importes (dinero), fila 2 las cantidades
                (No pagados/Pagados) + porcentajes -- a petición del
                usuario. Texto arriba, número/importe debajo en las 6.
                Cobrado y Pendiente conservan su fondo de color propio
                (verde/rojo) con letra blanca. */}
            <div className="h-full rounded p-2 text-center" style={{ background: C.paperDark }}>
              <div className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>Importe total</div>
              <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: T.normal }}>
                {formatoEuro(importeEsperado)}
              </div>
            </div>
            <div className="h-full rounded p-2 text-center" style={{ background: C.ink }}>
              <div className="text-xs" style={{ color: "#fff", opacity: OP.secundario }}>Cobrado</div>
              <div style={{ fontFamily: "'Fraunces', serif", color: "#fff", fontWeight: 700, fontSize: T.normal }}>
                {formatoEuro(importeCobrado)}
              </div>
            </div>
            <div className="h-full rounded p-2 text-center" style={{ background: C.wax }}>
              <div className="text-xs" style={{ color: "#fff", opacity: OP.secundario }}>Pendiente</div>
              <div style={{ fontFamily: "'Fraunces', serif", color: "#fff", fontWeight: 700, fontSize: T.normal }}>
                {formatoEuro(importePendiente)}
              </div>
            </div>
            {/* Solo el número se centra en el hueco que le queda -- el
                título se queda arriba, a la misma altura que el resto de
                tarjetas (antes centraba el bloque entero, y el título
                también bajaba). Dígito algo más grande (18px, no 15px). */}
            <div className="h-full rounded p-2 flex flex-col text-center" style={{ background: C.paperDark }}>
              <div className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>No pagados</div>
              <div className="flex-1 flex items-center justify-center" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: T.destacado, marginTop: -2 }}>
                {noPagados.length}
              </div>
            </div>
            <div className="h-full rounded p-2 flex flex-col text-center" style={{ background: C.paperDark }}>
              <div className="text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>Pagados</div>
              <div className="flex-1 flex items-center justify-center" style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: T.destacado, marginTop: -2 }}>
                {pagados.length}
              </div>
            </div>
            <div className="h-full rounded p-2 flex flex-col justify-center" style={{ background: C.paperDark }}>
              <BarraCompacta icono={ClipboardList} completado={completos.length} total={confirmados.length} color={C.ink} />
              <BarraCompacta icono={Euro} completado={pagados.length} total={confirmados.length} color={C.gold} />
              <BarraCompacta icono={Mail} completado={familiasConInvitacion} total={gruposFamiliaresACargo.length} color={C.wax} />
            </div>
          </div>
            </SeccionPlegable>
          </div>

          <section className={`mt-8 ${fichaAbierta ? "mt-2" : ""}`}>
            <div className={`flex items-center justify-between mb-4 pb-2 ${fichaAbierta ? "hidden sm:flex" : ""}`} style={{ borderBottom: `1.5px solid ${C.line}` }}>
              <h2
                className="flex items-center gap-2 text-xl"
                style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}
              >
                <Bell size={18} strokeWidth={2} />
                Invitados INCOMPLETOS {pendientes.length > 0 && `(${pendientes.length})`}
              </h2>
              <button
                onClick={() => setMostrarConfirmar(true)}
                className="boton-3d boton-verde-solido px-4 py-2 rounded-full text-sm font-semibold"
              >
                Datos completos
              </button>
            </div>
            <div className="space-y-2">
              {ordenarPorApellidoNombre(enRecogida).map((g) => (
                <FilaInvitadoColaborador
                  key={g.id}
                  g={g}
                  abierto={abiertoId === g.id}
                  onToggleAbierto={() => toggleAbierto(g)}
                  onCerrarFicha={cerrarFicha}
                  onGuardar={guardar}
                  fotoFamiliar={fotosFamiliares[g.grupoFamiliar || ""]}
                  onCambiarFotoFamiliar={cambiarFotoFamiliar}
                  onMarcarPagado={marcarPagado}
                  onMarcarPresente={marcarPresente}
                  obtenerFamilia={data.obtenerFamilia}
                  marcarFamilia={data.marcarFamilia}
                  evento={evento}
                  fotosFamiliares={fotosFamiliares}
                  fotosSinBoda={fotosSinBoda || {}}
                  onCambiarSinFotoBoda={cambiarSinFotoBoda}
                  familiaSinEmail={familiasSinEmailAhora.has(claveFamilia(g))}
                  colaboradorVinculado={colaboradores.find((c) => c.invitadoId === g.id)}
                  oculta={fichaAbierta && abiertoId !== g.id}
                />
              ))}
              {enRecogida.length === 0 && !fichaAbierta && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
                  Ninguna ficha incompleta.
                </p>
              )}
            </div>
          </section>

          {/* Con los datos cerrados, por FAMILIAS (él, v60): cobrar y
              acreditar van por familia; la ficha de cada uno se abre desde
              su familia mientras no haya pagado. */}
          <section className={`mt-8 ${fichaAbierta ? "mt-2" : ""}`}>
            <div className={fichaAbierta ? "hidden sm:block" : ""}>
              <SectionTitle icon={Check}>Familias</SectionTitle>
            </div>
            <div className="space-y-2">
              {familias.map((f) => (
                <FilaFamilia
                  key={f.clave}
                  familia={f}
                  evento={evento}
                  marcarFamilia={data.marcarFamilia}
                  marcarMiembros={data.marcarMiembros}
                  responderImpago={data.responderImpago}
                  abierta={familiaAbierta === f.clave || f.miembros.some((m) => m.id === abiertoId)}
                  onAlternar={() => setFamiliaAbierta((a) => (a === f.clave ? null : f.clave))}
                  oculta={fichaAbierta && !f.miembros.some((m) => m.id === abiertoId)}
                  renderMiembro={(id) => {
                    const g = confirmados.find((x) => x.id === id);
                    return g ? (
                      <FilaInvitadoColaborador
                        key={g.id}
                        enFamilia
                        g={g}
                  abierto={abiertoId === g.id}
                  onToggleAbierto={() => toggleAbierto(g)}
                  onCerrarFicha={cerrarFicha}
                  onGuardar={guardar}
                  fotoFamiliar={fotosFamiliares[g.grupoFamiliar || ""]}
                  onCambiarFotoFamiliar={cambiarFotoFamiliar}
                  onMarcarPagado={marcarPagado}
                  onMarcarPresente={marcarPresente}
                  obtenerFamilia={data.obtenerFamilia}
                  marcarFamilia={data.marcarFamilia}
                  evento={evento}
                  fotosFamiliares={fotosFamiliares}
                  fotosSinBoda={fotosSinBoda || {}}
                  onCambiarSinFotoBoda={cambiarSinFotoBoda}
                  familiaSinEmail={familiasSinEmailAhora.has(claveFamilia(g))}
                  colaboradorVinculado={colaboradores.find((c) => c.invitadoId === g.id)}
                        oculta={fichaAbierta && abiertoId !== g.id}
                      />
                    ) : null;
                  }}
                />
              ))}
              {familias.length === 0 && !fichaAbierta && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
                  Todavía ninguna familia con los datos completos.
                </p>
              )}
            </div>
          </section>
        </VentanaFlotante>
        </CapaBarra>
      )}

      {ventanaPregunta}
      {mostrarConfirmar && (
        <ModalFlotante titulo="¿Has terminado tu trabajo?" onCerrar={() => setMostrarConfirmar(false)}>
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            Revisa el resumen antes de avisar al anfitrión — solo se envía el aviso si de verdad
            está todo completo. Solo cuentan tus invitados ya confirmados.
          </p>
          <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
            <li>Invitados confirmados: {confirmados.length}</li>
            <li>Con datos completos: {completos.length} de {confirmados.length}</li>
            <li>Con el pago hecho: {pagados.length} de {confirmados.length}</li>
          </ul>
          <div className="space-y-2">
            <button
              onClick={confirmarDatosCompletos}
              disabled={enviandoDatos}
              className={
                "w-full px-3 py-2 rounded-full text-sm font-medium" +
                (pendientes.length === 0 && confirmados.length > 0 ? " boton-3d boton-verde-solido" : "")
              }
              style={
                pendientes.length === 0 && confirmados.length > 0
                  ? undefined
                  : { background: C.line, color: C.charcoal }
              }
            >
              {enviandoDatos ? "Enviando…" : "Confirmar datos completos y avisar"}
            </button>
            <button
              onClick={confirmarPagosCompletos}
              disabled={enviandoPagos}
              className={
                "w-full px-3 py-2 rounded-full text-sm font-medium" +
                (noPagados.length === 0 && confirmados.length > 0 ? " boton-3d boton-verde-solido" : "")
              }
              style={
                noPagados.length === 0 && confirmados.length > 0
                  ? undefined
                  : { background: C.line, color: C.charcoal }
              }
            >
              {enviandoPagos ? "Enviando…" : "Confirmar pagos completos y avisar"}
            </button>
          </div>
        </ModalFlotante>
      )}
    </div>
  );
}
