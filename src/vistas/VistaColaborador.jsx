// Vista del colaborador: formulario de datos de cada invitado asignado,
// fila resumen en la lista, y la vista completa (pendientes/completos,
// aviso al anfitrión al terminar). Movida tal cual desde App.jsx en el
// reparto del 2026-08-08 (ver CLAUDE.md).
import { useState, useEffect, useRef } from "react";
import { Bell, Calendar, Check, ChevronDown, ClipboardList, Euro, Mail, Megaphone, Send, User, UserCog } from "lucide-react";
import { supabase } from "../supabaseClient";
import { MenuFlotante } from "../components/MenuFlotante";
import {
  datosCompletos,
  contarDatosRellenados,
  totalDatosInvitado,
  pideDatosDeBoda,
  esMenorDeEdad,
  conEmailDeColaborador,
  estadoDatos,
  eligeOpcional,
  familiasSinEmail,
  avisoFamiliaSinEmail,
  claveFamilia,
  importeEsperadoInvitado,
  resolverColaborador,
} from "../lib/invitados";
import { ordenarPorApellidoNombre, nombreCompleto } from "../lib/formato";
import { construirEnlaceTablon } from "../lib/url";
import { subirFotoMatrimonio, useEnlaceFoto, CARPETA } from "../lib/fotosAlmacen";
import { usePopupWindow } from "../lib/usePopupWindow";
import { useMotorInvitaciones } from "../lib/useMotorInvitaciones";
import { PERMISOS, ETIQUETAS_PERMISOS, tienePermiso, esDeEdicion } from "../lib/permisos";
import { generarImagenCronograma } from "../lib/cronograma";
import { C, R, T, OP, DORADO } from "../theme";
import { URL_REPOSITORIO } from "../constants";
import { Seal, Stamp, BarraCompacta, UserSolido } from "../components/Widgets";
import { SectionTitle, Field, TextInput } from "../components/Formulario";
import { ModalFlotante, VentanaFlotante } from "../components/VentanaFlotante";
import { HuecoFoto, estiloMarcoFoto } from "../components/HuecoFoto";
import { SeccionPlegable } from "../components/SeccionPlegable";
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
const ANCHO_PAGO = 104; // "Pago pendiente" es el rótulo más largo de esa columna
const ANCHO_DATOS = 100; // "datos 11 de 11" es el más largo de esta
const ALTO_BOTON_FILA = 32; // manda el círculo de llegada: todos iguales (norma 4)

// Pastilla de un dato que el colaborador SOLO MIRA: el importe y la zona.
// Una sola pieza para las dos (norma 8): si algún día se retoca el color,
// se retoca en las dos o dejan de parecerse.
//
// Colores al revés que el resto de la cabecera (fondo dorado, letra
// verde) y un punto más de letra, a petición del usuario (2026-09-17): el
// importe es el dato que más se consulta. El dorado es más CLARO que el
// de la ficha para que se despegue, con un filete verde fino que la
// recorta sobre el dorado del formulario.
function PastillaDato({ title, children }) {
  return (
    <span
      className="text-sm px-2 py-0.5 rounded font-semibold"
      style={{ background: C.champanClaro, color: C.ink, border: `1px solid ${C.ink}` }}
      title={title}
    >
      {children}
    </span>
  );
}

function FormularioDatos({
  invitado,
  evento,
  onGuardar,
  fotoFamiliar,
  onCambiarFotoFamiliar,
  importe,
  onCerrar,
  colaboradorVinculado,
  // La familia ha marcado que NO tiene foto de boda (casilla "Sí"
  // desmarcada). Es de la familia, como la foto: vale para los dos.
  sinFotoBoda = false,
  onCambiarSinFotoBoda,
  // Nadie de la familia tiene email (regla: al menos uno por familia).
  familiaSinEmail = false,
}) {
  const [form, setForm] = useState(invitado);
  const [foto, setFoto] = useState(fotoFamiliar || "");
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
  // Canción y observaciones: casilla "Sí" (usuario, 2026-09-19). Sin marcar
  // es "no": plegada y fuera de la cuenta de datos. Nace marcada solo si ya
  // hay texto guardado.
  // Canción: marcada por defecto, salvo que se haya guardado que no
  // (`sinCancion`). Observaciones: solo si ya tiene texto. Mismo criterio
  // que la cuenta (eligeOpcional, lib/invitados.js).
  const opcionalesDe = (g) => ({
    cancion: eligeOpcional(g, "cancion"),
    observaciones: eligeOpcional(g, "observaciones"),
    email: eligeOpcional(g, "email"),
  });
  const [abiertos, setAbiertos] = useState(() => opcionalesDe(invitado));
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();
  // Desmarcar con algo escrito borra lo escrito: por eso pregunta antes.
  // Los que nacen marcados guardan su "no" aparte (canción, email); las
  // observaciones, con quedarse vacías.
  const CAMPO_NO = { cancion: "sinCancion", email: "sinEmail" };
  const alternarOpcional = (campo) => {
    const campoNo = CAMPO_NO[campo];
    if (!abiertos[campo]) {
      setAbiertos({ ...abiertos, [campo]: true });
      // Vuelve a pedirse: se guarda su "sí".
      if (campoNo && form[campoNo]) {
        const nuevo = { ...form, [campoNo]: false };
        setForm(nuevo);
        revisarYGuardar(nuevo);
      }
      return;
    }
    const cerrar = () => {
      setAbiertos((a) => ({ ...a, [campo]: false }));
      const nuevo = { ...form, [campo]: "", ...(campoNo ? { [campoNo]: true } : {}) };
      if (JSON.stringify(nuevo) === JSON.stringify(form)) return;
      setForm(nuevo);
      revisarYGuardar(nuevo);
    };
    if (String(form[campo] || "").trim() === "") cerrar();
    else
      preguntar({
        titulo: { cancion: "¿Quitar la canción?", email: "¿Quitar el email?" }[campo] || "¿Quitar las observaciones?",
        texto: form[campo],
        rotulo: "Sí, quitar",
        alConfirmar: cerrar,
      });
  };
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  // `foto` guarda lo que va a la base: desde el 2026-09-17 una RUTA del
  // cajón "fotos-matrimonios" (antes, la foto entera en base64). Para
  // enseñarla hace falta un enlace temporal; useEnlaceFoto lo pide solo si
  // es una ruta, y deja pasar tal cual lo antiguo o un enlace pegado.
  const enlaceFoto = useEnlaceFoto(foto);
  // Ver la foto en grande, y confirmar antes de quitarla: mismo trato que en
  // Aniversarios, donde borrar una foto pide confirmación.
  const [verFoto, setVerFoto] = useState(false);
  const [quitandoFoto, setQuitandoFoto] = useState(false);
  const [aviso, setAviso] = useState("");
  const avisoTimeout = useRef(null);
  useEffect(() => setForm(invitado), [invitado.id]);
  useEffect(() => setFoto(fotoFamiliar || ""), [fotoFamiliar, invitado.id]);
  useEffect(() => setAlergiaSel(parsearAlergias(invitado.alergias)), [invitado.id]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setAbiertos(opcionalesDe(invitado)), [invitado.id]);
  useEffect(() => () => clearTimeout(avisoTimeout.current), []);

  const mostrarAviso = (texto) => {
    setAviso(texto);
    clearTimeout(avisoTimeout.current);
    avisoTimeout.current = setTimeout(() => setAviso(""), 3000);
  };

  // Cada campo se guarda solo al salir de él (igual que el resto de la
  // app) — sin botón "Guardar". El aviso dice exactamente qué campo(s)
  // cambiaron, o "Sin cambios" si el valor era el mismo de antes.
  const revisarYGuardar = (formActualizado) => {
    const cambiados = Object.keys(ETIQUETAS_CAMPOS_INVITADO).filter(
      (campo) => (formActualizado[campo] || "") !== (invitado[campo] || "")
    );
    if (cambiados.length === 0) {
      mostrarAviso("Sin cambios.");
      return;
    }
    onGuardar(formActualizado);
    mostrarAviso(`Guardado: ${cambiados.map((c) => ETIQUETAS_CAMPOS_INVITADO[c]).join(", ")}.`);
  };

  const guardarFoto = (nuevaFoto) => {
    if ((nuevaFoto || "") === (fotoFamiliar || "")) {
      mostrarAviso("Sin cambios.");
      return;
    }
    if (onCambiarFotoFamiliar) onCambiarFotoFamiliar(invitado.grupoFamiliar, nuevaFoto);
    mostrarAviso(nuevaFoto ? "Guardado: foto familiar." : "Foto familiar eliminada.");
  };

  const subirArchivoFoto = async (file) => {
    if (!file) return;
    setErrorFoto("");
    setSubiendoFoto(true);
    try {
      // Al almacén, como ORIGINAL (se guarda grande: el anfitrión la pasará
      // por la plantilla con otra IA). Mismo nombre de archivo que usa
      // Aniversarios para esta familia, así volver a subir la reemplaza.
      const familia = invitado.grupoFamiliar || invitado.apellido || "";
      const ruta = await subirFotoMatrimonio(file, familia, CARPETA.BODA);
      setFoto(ruta);
      guardarFoto(ruta);
    } catch (_) {
      setErrorFoto("No se ha podido procesar la imagen. Prueba con otra o pega un enlace.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const reconstruirAlergias = (sel) => {
    if (sel.no) return "No";
    const partes = [];
    if (sel.gluten) partes.push("Gluten");
    if (sel.lactosa) partes.push("Lactosa");
    if (sel.otras.trim()) partes.push(sel.otras.trim());
    return partes.join(", ");
  };

  const marcarNo = () => {
    const next = { no: true, gluten: false, lactosa: false, otras: "" };
    setAlergiaSel(next);
    const actualizado = { ...form, alergias: reconstruirAlergias(next) };
    setForm(actualizado);
    revisarYGuardar(actualizado);
  };
  const alternarAlergia = (clave) => {
    const next = { ...alergiaSel, no: false, [clave]: !alergiaSel[clave] };
    setAlergiaSel(next);
    const actualizado = { ...form, alergias: reconstruirAlergias(next) };
    setForm(actualizado);
    revisarYGuardar(actualizado);
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
      className="formulario-dorado p-4 rounded space-y-3"
      style={{
        background: DORADO.fondo,
        boxShadow: DORADO.relieve,
        border: `1px solid ${C.gold}`,
      }}
    >
      {ventanaPregunta}
      {/* Fondo propio (antes el rojo iba directo sobre el verde oscuro
          del formulario -- poco legible, rojo sobre verde oscuro) -- a
          petición del usuario. */}
      <p
        className="text-xs font-bold inline-block px-2 py-1 rounded"
        style={{ color: C.wax, background: C.paper }}
      >
        * campos obligatorios (año nacimiento y alergias)
      </p>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
            {form.apellido}, {form.nombre}
          </span>
          <span className="text-xs" style={{ color: C.ink }}>
            datos {contarDatosRellenados(conEmailDeColaborador(form, colaboradorVinculado), foto, evento, { ...abiertos, fotoBoda: !sinFotoBoda })} de{" "}
            {totalDatosInvitado(form, evento, { ...abiertos, fotoBoda: !sinFotoBoda })}
          </span>
          <PastillaDato title="Importe calculado según edad y los precios de Configuración">
            € {importe.toFixed(2)}
          </PastillaDato>
          {/* Borde dorado (antes el débil de boton-verde-solido) para que
              se distinga del propio fondo verde del formulario, a
              petición del usuario. */}
          <button
            onClick={onCerrar}
            // Con la mano izquierda (lib/mano.js), delante del nombre.
            className="boton-3d boton-verde-solido ml-auto zurdo:ml-0 zurdo:order-first px-4 py-2 rounded-full text-sm font-semibold"
            style={{ border: `1px solid ${C.goldClaro}` }}
          >
            Cerrar
          </button>
        </div>
        {/* La zona, resaltada con la misma pastilla que el importe (usuario,
            2026-09-24). Es de SOLO VER: el colaborador no la cambia. Aquí
            abajo y no arriba, para no empujar el botón Cerrar a otra línea
            en el móvil. */}
        <div className="text-xs mt-1 flex items-center gap-2 flex-wrap" style={{ color: C.ink }}>
          <span>Familia {invitado.grupoFamiliar || form.apellido}</span>
          <PastillaDato title="Zona del invitado. Solo la cambia el anfitrión.">
            {form.zona || "Sin zona"}
          </PastillaDato>
        </div>
      </div>
      {aviso && (
        <span
          className="inline-block text-xs px-2 py-0.5 rounded"
          style={{ background: C.ink, color: C.paper }}
        >
          {aviso}
        </span>
      )}
      {/* El año de nacimiento va EL PRIMERO, antes del email (a petición
          del usuario, 2026-09-17). Es el dato del que dependen los demás:
          si la persona es menor, el email ni se pide. Con el email arriba,
          el formulario empezaba preguntando algo que a veces sobra. */}
      <Field label="Año nac. *">
        <TextInput
          value={form.anioNacimiento}
          onChange={(e) => setForm({ ...form, anioNacimiento: e.target.value })}
          onBlur={() => revisarYGuardar(form)}
          placeholder="1988"
          maxLength={4}
          style={{ width: 90 }}
        />
      </Field>
      <Field label="Email">
        {colaboradorVinculado ? (
          <div>
            <div
              className="w-full px-2 py-1.5 rounded text-sm"
              style={{ background: C.paperDark, color: C.charcoal, opacity: OP.secundario }}
            >
              {colaboradorVinculado.email || "sin registrar"}
            </div>
            <span className="text-xs italic" style={{ color: C.ink }}>
              Se edita en Colaboradores, no aquí.
            </span>
          </div>
        ) : esMenorDeEdad(form, evento) ? (
          <div>
            <div
              className="w-full px-2 py-1.5 rounded text-sm"
              style={{ background: C.paperDark, color: C.charcoal, opacity: OP.secundario }}
            >
              {form.email || "—"}
            </div>
            <span className="text-xs italic" style={{ color: C.ink }}>
              Solo pedimos email a mayores de edad.
            </span>
          </div>
        ) : (
          // Casilla "Sí" marcada por defecto (usuario, 2026-09-19), salvo
          // para quien viene solo (S): ahí el email es obligatorio y no hay
          // casilla.
          <div>
            {form.rolFamiliar !== "suelto" && (
              <label className="flex items-center gap-1 text-sm mb-1" style={{ color: C.ink }}>
                <input type="checkbox" checked={abiertos.email} onChange={() => alternarOpcional("email")} />
                Sí
              </label>
            )}
            {abiertos.email ? (
              <TextInput
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => revisarYGuardar(form)}
                placeholder={form.rolFamiliar === "suelto" ? "Obligatorio: viene solo" : "correo@ejemplo.com"}
                className="w-full"
              />
            ) : (
              <span className="text-xs italic" style={{ color: C.ink }}>
                No da email.
              </span>
            )}
          </div>
        )}
        {/* Al menos un email por familia. QUIÉN sale del aviso (depende de
            si esta persona es cónyuge, viene sola o es menor); QUE falte lo
            decide la base, que ve a la familia entera aunque la lleven dos
            colaboradores. */}
        {familiaSinEmail && (
          <p
            className="text-xs font-bold inline-block px-2 py-1 rounded mt-1"
            style={{ color: C.wax, background: C.paper }}
          >
            {avisoFamiliaSinEmail(form, evento)}
          </p>
        )}
      </Field>
      <div>
        {/* gap-6 (antes 3): el botón de subir foto quedaba pegado al año de
            boda -- a petición del usuario, 2026-09-17. */}
        <div className="flex items-start gap-10 flex-wrap">
          {pideDatosDeBoda(form) ? (
            <>
          <Field label="Año boda">
            <TextInput
              value={form.anioBoda}
              onChange={(e) => setForm({ ...form, anioBoda: e.target.value })}
              onBlur={() => revisarYGuardar(form)}
              placeholder="2015"
              maxLength={4}
              style={{ width: 90 }}
            />
          </Field>
          <Field label="Foto boda">
            {/* Casilla "Sí", MARCADA por defecto (usuario, 2026-09-19): lo
                normal es que haya foto. Desmarcada = ese matrimonio no tiene,
                la foto deja de contar en "datos X de Y" y Aniversarios lo
                enseña. Con la foto ya puesta no se puede desmarcar: primero
                hay que quitarla. */}
            <label
              className="flex items-center gap-1 text-sm mb-1"
              style={{ color: C.ink }}
              title={foto ? "Con la foto ya puesta no se puede marcar que no tienen: quítala primero" : undefined}
            >
              <input
                type="checkbox"
                checked={!sinFotoBoda}
                disabled={Boolean(foto)}
                onChange={() => onCambiarSinFotoBoda?.(invitado.grupoFamiliar, !sinFotoBoda)}
              />
              Sí
            </label>
            {sinFotoBoda ? (
              <span className="text-xs italic" style={{ color: C.ink }}>
                No tienen foto de boda.
              </span>
            ) : (
            <>
            {/* La misma pieza que la ventana Aniversarios (HuecoFoto): 16:9,
                se toca para subir, y con foto ya puesta se abre en grande.
                Antes había aquí un botón "Subir foto" y una miniatura
                cuadrada de 32px: otra forma de hacer lo mismo. Unificado a
                petición del usuario, 2026-09-17. */}
            <HuecoFoto
              titulo="Foto de boda"
              enlace={enlaceFoto}
              ocupada={Boolean(foto)}
              subiendo={subiendoFoto}
              onElegir={subirArchivoFoto}
              onQuitar={() => setQuitandoFoto(true)}
              onVer={() => setVerFoto(true)}
            />
            {errorFoto && (
              <p className="text-xs" style={{ color: C.wax }}>
                {errorFoto}
              </p>
            )}
            </>
            )}
          </Field>
            </>
          ) : (
            /* Ni esposo ni esposa: el año de boda y la foto de boda no
               aplican. Se deja el hueco con el motivo, en vez de que el
               campo desaparezca sin explicación -- si no, parece que
               falta algo o que la app se ha roto. */
            <Field label="Boda">
              <div
                className="px-2 py-1.5 rounded text-sm"
                style={{ background: C.paperDark, color: C.charcoal, opacity: OP.secundario }}
              >
                No aplica
              </div>
              <span className="text-xs italic" style={{ color: C.ink }}>
                El año y la foto de boda solo se piden a quien viene con su pareja.
              </span>
            </Field>
          )}
        </div>
      </div>
      {/* Canción y observaciones: casilla "Sí", con el mismo aspecto que
          las de alergias de aquí abajo. Sin marcar = "no": no cuenta en
          "datos X de Y". Marcada, aparece el campo y cuenta. */}
      {[
        { campo: "cancion", titulo: "Canción", placeholder: "Título — Artista" },
        { campo: "observaciones", titulo: "Observaciones", placeholder: "Cualquier detalle adicional" },
      ].map(({ campo, titulo, placeholder }) => (
        <div key={campo}>
          <span
            className="text-xs uppercase block mb-1"
            style={{ color: C.ink, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {titulo}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1 text-sm" style={{ color: C.ink }}>
              <input type="checkbox" checked={abiertos[campo]} onChange={() => alternarOpcional(campo)} />
              Sí
            </label>
            {abiertos[campo] && (
              <TextInput
                value={form[campo] || ""}
                onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                onBlur={() => revisarYGuardar(form)}
                placeholder={placeholder}
                className="flex-1"
                style={{ minWidth: 160 }}
                autoFocus={!String(form[campo] || "").trim()}
              />
            )}
          </div>
        </div>
      ))}
      <div>
        <span
          className="text-xs uppercase block mb-1"
          style={{ color: C.ink, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Alergias *
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 text-sm" style={{ color: C.ink }}>
            <input type="checkbox" checked={alergiaSel.no} onChange={marcarNo} />
            No
          </label>
          <label className="flex items-center gap-1 text-sm" style={{ color: C.ink }}>
            <input
              type="checkbox"
              checked={alergiaSel.gluten}
              onChange={() => alternarAlergia("gluten")}
            />
            Gluten
          </label>
          <label className="flex items-center gap-1 text-sm" style={{ color: C.ink }}>
            <input
              type="checkbox"
              checked={alergiaSel.lactosa}
              onChange={() => alternarAlergia("lactosa")}
            />
            Lactosa
          </label>
          <TextInput
            value={alergiaSel.otras}
            onChange={(e) => cambiarOtras(e.target.value)}
            onBlur={() => revisarYGuardar(form)}
            placeholder="Otra (máx. 15)"
            maxLength={15}
            style={{ maxWidth: 140 }}
          />
        </div>
      </div>

      {/* Permiso para conservar los datos después del evento (usuario,
          2026-09-21). Lo pide la propia nota de privacidad del tablón:
          "se eliminarán, salvo que tú autorices expresamente que los
          guarde para otra ocasión; el colaborador te lo preguntará y
          dejará constancia". La frase es la suya, palabra por palabra
          ("autorizo expresamente"): esto es la constancia de una
          autorización, no una preferencia.
          ⚠️ DESMARCADA por defecto, a diferencia de canción o foto de
          boda: un permiso que viene dado de fábrica no es un permiso.
          Tiene que marcarlo quien contesta, no quien rellena.
          ⚠️ Y NO cuenta en "datos X de Y": no es un dato del invitado,
          es una decisión suya. Si contara, una ficha parecería
          incompleta por no haber dicho que sí. */}
      <div>
        <span
          className="text-xs uppercase block mb-1"
          style={{ color: C.ink, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Después del evento
        </span>
        <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: C.ink }}>
          <input
            type="checkbox"
            checked={Boolean(form.conservarDatos)}
            onChange={(e) => {
              const siguiente = { ...form, conservarDatos: e.target.checked };
              setForm(siguiente);
              revisarYGuardar(siguiente);
            }}
            className="flex-shrink-0 mt-0.5"
          />
          <span>
            Autorizo expresamente a que guarden mis datos
            <span className="block text-xs" style={{ color: C.charcoal, opacity: OP.secundario }}>
              Para otra ocasión. Si no se marca, se borran a los 3 meses del evento.
            </span>
          </span>
        </label>
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
            {subiendoFoto ? "Procesando…" : "Cambiar foto"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={subiendoFoto}
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                e.target.value = "";
                if (!file) return;
                setVerFoto(false);
                subirArchivoFoto(file);
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
                  setFoto("");
                  guardarFoto("");
                }}
              >
                Sí, quitarla
              </Boton>
              <Boton onClick={() => setQuitandoFoto(false)}>Cancelar</Boton>
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
  onGuardar,
  fotoFamiliar,
  onCambiarFotoFamiliar,
  onMarcarPagado,
  onMarcarPresente,
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
}) {
  const importe = importeEsperadoInvitado(g, evento);
  // Las preguntas en la ventana de la app, no en la del navegador (norma).
  const { preguntar, ventanaPregunta } = usePreguntaSeguridad();

  // Confirmación siempre (marcar Y quitar): con todas las filas cerradas muy
  // juntas, el pulgar puede tocar el botón de pago de un invitado equivocado
  // por error — así hay una última comprobación antes de que cuente.
  const confirmarPago = () => {
    if (!g.pagado && !datosCompletos(g)) {
      preguntar({
        titulo: "Todavía no",
        texto: `No se puede marcar a ${nombreCompleto(g)} como pagado: faltan sus datos obligatorios (año de nacimiento y alergias).`,
        soloAviso: true,
      });
      return;
    }
    preguntar(
      g.pagado
        ? { titulo: "¿Quitar el pago?", texto: nombreCompleto(g), rotulo: "Sí, quitarlo", alConfirmar: () => onMarcarPagado(g.id, false) }
        : { titulo: "¿Marcar como pagado?", texto: nombreCompleto(g), rotulo: "Sí, pagado", peligro: false, alConfirmar: () => onMarcarPagado(g.id, true) }
    );
  };

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
  const puedeTocarLlegada = g.presente || (marcadoAbierto && datosCompletos(g) && g.pagado);
  const motivoBloqueo = !marcadoAbierto
    ? "el anfitrión todavía no ha abierto el control de llegadas"
    : !datosCompletos(g)
    ? "le faltan datos obligatorios (año de nacimiento y alergias)"
    : "todavía no ha pagado";

  const confirmarPresente = () => {
    if (!puedeTocarLlegada) {
      preguntar({
        titulo: "Todavía no",
        texto: `No se puede marcar la llegada de ${nombreCompleto(g)}: ${motivoBloqueo}.`,
        soloAviso: true,
      });
      return;
    }
    preguntar(
      g.presente
        ? { titulo: "¿Quitar la llegada?", texto: nombreCompleto(g), rotulo: "Sí, quitarla", alConfirmar: () => onMarcarPresente(g.id, false) }
        : { titulo: "¿Ya está aquí?", texto: nombreCompleto(g), rotulo: "Sí, ha llegado", peligro: false, alConfirmar: () => onMarcarPresente(g.id, true) }
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
        {/* La columna del pago se queda aunque la ficha esté abierta y el
            botón no se pinte: si desapareciera, el nombre de ESA fila
            empezaría en otro sitio que el de las demás. */}
        <div className="flex-shrink-0" style={{ width: ANCHO_PAGO }}>
          {!abierto && (
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
          )}
        </div>
        {/* Los dos estados (al día / le faltan datos) eran dos copias de la
            misma línea; con un ancho fijo de por medio serían dos sitios
            donde cambiarlo (norma 8). */}
        <span
          className="flex items-center gap-1 text-xs flex-shrink-0 whitespace-nowrap"
          style={{
            width: ANCHO_DATOS,
            color: faltanDatos ? C.wax : C.ink,
            opacity: faltanDatos ? 1 : OP.secundario,
          }}
        >
          {faltanDatos ? <Bell size={12} /> : <Check size={12} />} datos {datosRellenos} de {datosTotal}
        </span>
        <button
          onClick={onToggleAbierto}
          className="boton-3d rounded px-2 flex items-center gap-2 flex-1 min-w-0"
          style={{ color: C.ink, height: ALTO_BOTON_FILA }}
        >
          {/* Si el nombre no cabe se recorta con puntos suspensivos: entero
              se lee al abrir la ficha. Nunca dos líneas (norma 7). */}
          <span className="truncate" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
            {g.apellido}, {g.nombre}
          </span>
          <span className="text-xs flex-shrink-0 ml-auto" style={{ color: C.gold }}>
            {abierto ? "▾" : "▸"}
          </span>
        </button>
        {/* El check de llegada cierra la fila, SIEMPRE en la misma columna
            (él, 2026-09-24) -- así se marca sin desplegar el formulario,
            que es como se va a usar el día del evento: de pie, recibiendo
            gente. Este no se invierte con la mano izquierda, como el resto
            de las filas de listas (ver CLAUDE.md, "Lo que NO se invierte"). */}
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
            onCerrar={onToggleAbierto}
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

export function VistaColaborador({ data, colaboradorId, esAnfitrionOriginal, setRol, anfitrionToken, onCerrarSesion }) {
  const { colaboradores, invitados, persistInvitados, fotosFamiliares, persistFotosFamiliares, fotosSinBoda, persistFotosSinBoda, evento, ordenFamiliares, tokenTablon } = data;
  // Familias sin ningún email: el colaborador lo recibe de la base; el
  // anfitrión (vista previa "Formularios") lo calcula con la lista entera.
  const familiasSinEmailAhora = data.esAnfitrion
    ? familiasSinEmail(invitados, colaboradores)
    : new Set(data.familiasSinEmailServidor || []);
  const enlaceTablon = construirEnlaceTablon(evento.urlPublica, tokenTablon);
  const colaborador = colaboradores.find((c) => c.id === colaboradorId);
  // Avisos en la ventana de la app, no en la del navegador (norma 12).
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
  const puedeVerMapaSitio = tienePermiso(colaborador, PERMISOS.MAPA_SITIO_VER);
  const puedeVerRepositorio = tienePermiso(colaborador, PERMISOS.REPOSITORIO_VER);
  const [ventanaDatosEventoAbierta, setVentanaDatosEventoAbierta] = useState(false);
  const [ventanaInvitacionesAbierta, setVentanaInvitacionesAbierta] = useState(false);
  const motorInvitaciones = useMotorInvitaciones(data);

  // Pantalla de inicio: la misma Portada que ve el anfitrión (sin sus 3
  // recuadros de estadísticas, que no viven aquí sino en VistaAnfitrion.jsx),
  // con un único botón "Abrir formulario" en vez del desplegable "Abrir
  // sección…" -- a petición del usuario, 2026-08-18. Todo lo que antes iba
  // siempre visible (resumen + listas de invitados) pasa a esta ventana,
  // que se abre con ese botón.
  const [formularioAbierto, setFormularioAbierto] = useState(false);
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
  const incompletaDe = (g) =>
    estadoDatos(g, {
      evento,
      foto: fotosFamiliares[g.grupoFamiliar || ""],
      sinFotoBoda: Boolean(fotosSinBoda?.[g.grupoFamiliar || ""]),
      colaboradorVinculado: colaboradores.find((c) => c.invitadoId === g.id),
    }).incompleta;
  const esPendiente = (g) => (g.id === abiertoId ? pendienteAlAbrir : incompletaDe(g));
  const pendientes = confirmados.filter(esPendiente);
  const completos = confirmados.filter((g) => !esPendiente(g));
  const pagados = confirmados.filter((g) => g.pagado);
  const noPagados = confirmados.filter((g) => !g.pagado);

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
  const fichaAbierta = Boolean(abiertoId) && abiertoId !== "perfil" && abiertoId !== "cuentas";

  const toggleAbierto = (g) =>
    setAbiertoId((actual) => {
      if (actual === g.id) return null;
      setPendienteAlAbrir(incompletaDe(g));
      return g.id;
    });

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

  // Bloqueado por el anfitrión durante el Modo Pruebas (ver
  // colaborador_puede_actuar en schema.sql) -- los guardados que intente
  // ya se deshacen solos en pantalla (persistInvitados), pero sin este
  // aviso el mensaje de error genérico ("¿sigue asignado a ti este
  // invitado?") confundiría más de lo que explica.
  const bloqueadoEnPruebas = Boolean(evento.modoPruebasActivo) && colaborador.habilitadoEnPruebas === false;

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
      {bloqueadoEnPruebas && (
        <div className="p-4 rounded text-sm font-semibold" style={{ background: C.peligro, color: "#fff" }}>
          🧪 El anfitrión ha activado el Modo Pruebas y te ha dejado fuera por ahora: no podrás
          guardar datos, marcar pagos ni confirmar nada hasta que lo desactive.
        </div>
      )}
      {/* El aviso de permisos. El usuario lo quiere mantener (2026-09-21):
          es lo primero que se ve y ahí se entera uno de lo que puede
          hacer. Dos partes distintas a propósito:
            - la frase de "permisos de edición", solo si los hay -- los
              que dejan mirar no son responsabilidad de nadie;
            - y el LINK al proyecto, que es el permiso y el acceso a la
              vez. Antes se anunciaba aquí y el botón estaba escondido en
              "Mi cuenta", así que había que buscarlo.
          (Aquí hubo un rodeo: primero se puso con relieve, y dos días
          después la norma 13 se reescribió para decir que un link va
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
               Norma 13: es un LINK, así que va subrayado y sin
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
          aparte en VistaAnfitrion.jsx, no aquí). En vez del desplegable
          "Abrir sección…" (editable+toggle, que no se pasan aquí a
          propósito), un único botón que abre el formulario -- a petición
          del usuario, 2026-08-18. */}
      <Portada
        evento={evento}
        onCerrarSesion={onCerrarSesion}
        enlaceTablon={enlaceTablon}
        mostrarMapaSitio={puedeVerMapaSitio}
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
            {puedeEditarNovedades && (
              <button
                onClick={abrirNovedades}
                className="boton-3d boton-flotante-imagen cristal-difuminado flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
                title="Permiso especial concedido por el anfitrión: editar el texto de las novedades"
              >
                <Megaphone size={16} /> Editar Novedades
              </button>
            )}
            {puedeEditarDatosEvento && (
              <button
                onClick={() => setVentanaDatosEventoAbierta(true)}
                className="boton-3d boton-flotante-imagen cristal-difuminado flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
                title="Permiso especial concedido por el anfitrión: editar los datos del evento, textos de email incluidos"
              >
                <Calendar size={16} /> Datos evento
              </button>
            )}
            {puedeEnviarInvitaciones && (
              <button
                onClick={() => setVentanaInvitacionesAbierta(true)}
                className="boton-3d boton-flotante-imagen cristal-difuminado flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
                title="Permiso especial concedido por el anfitrión: enviar invitaciones a confirmados y pagados"
              >
                <Send size={16} /> Invitaciones
              </button>
            )}
            <button
              onClick={() => setFormularioAbierto(true)}
              className="boton-3d boton-flotante-imagen cristal-difuminado flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
            >
              Abrir formulario
              <Seal count={pendientes.length} late />
            </button>
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

      {formularioAbierto && (
        <VentanaFlotante
          clave="formulario-colaborador"
          titulo={colaborador.nombre}
          onCerrar={() => setFormularioAbierto(false)}
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
              onAlternar={() => setAbiertoId((a) => (a === "perfil" ? null : "perfil"))}
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
              titulo="Estado de cuentas"
              resumen={`Pendiente ${formatoEuro(importePendiente)}`}
              abierta={abiertoId === "cuentas"}
              onAlternar={() => setAbiertoId((a) => (a === "cuentas" ? null : "cuentas"))}
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
              {ordenarPorApellidoNombre(pendientes).map((g) => (
                <FilaInvitadoColaborador
                  key={g.id}
                  g={g}
                  abierto={abiertoId === g.id}
                  onToggleAbierto={() => toggleAbierto(g)}
                  onGuardar={guardar}
                  fotoFamiliar={fotosFamiliares[g.grupoFamiliar || ""]}
                  onCambiarFotoFamiliar={cambiarFotoFamiliar}
                  onMarcarPagado={marcarPagado}
                  onMarcarPresente={marcarPresente}
                  evento={evento}
                  fotosFamiliares={fotosFamiliares}
                  fotosSinBoda={fotosSinBoda || {}}
                  onCambiarSinFotoBoda={cambiarSinFotoBoda}
                  familiaSinEmail={familiasSinEmailAhora.has(claveFamilia(g))}
                  colaboradorVinculado={colaboradores.find((c) => c.invitadoId === g.id)}
                  oculta={fichaAbierta && abiertoId !== g.id}
                />
              ))}
              {pendientes.length === 0 && !fichaAbierta && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
                  Ninguna ficha incompleta.
                </p>
              )}
            </div>
          </section>

          <section className={`mt-8 ${fichaAbierta ? "mt-2" : ""}`}>
            <div className={fichaAbierta ? "hidden sm:block" : ""}>
              <SectionTitle icon={Check}>Invitados COMPLETADOS</SectionTitle>
            </div>
            <div className="space-y-2">
              {ordenarPorApellidoNombre(completos).map((g) => (
                <FilaInvitadoColaborador
                  key={g.id}
                  g={g}
                  abierto={abiertoId === g.id}
                  onToggleAbierto={() => toggleAbierto(g)}
                  onGuardar={guardar}
                  fotoFamiliar={fotosFamiliares[g.grupoFamiliar || ""]}
                  onCambiarFotoFamiliar={cambiarFotoFamiliar}
                  onMarcarPagado={marcarPagado}
                  onMarcarPresente={marcarPresente}
                  evento={evento}
                  fotosFamiliares={fotosFamiliares}
                  fotosSinBoda={fotosSinBoda || {}}
                  onCambiarSinFotoBoda={cambiarSinFotoBoda}
                  familiaSinEmail={familiasSinEmailAhora.has(claveFamilia(g))}
                  colaboradorVinculado={colaboradores.find((c) => c.invitadoId === g.id)}
                  oculta={fichaAbierta && abiertoId !== g.id}
                />
              ))}
              {completos.length === 0 && !fichaAbierta && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: OP.secundario }}>
                  Todavía ningún invitado con datos completos.
                </p>
              )}
            </div>
          </section>
        </VentanaFlotante>
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
