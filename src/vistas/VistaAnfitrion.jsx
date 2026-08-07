// Vista completa del anfitrión: todas las ventanas de gestión (Colaboradores,
// Mesas, Plano, Avisos, Estado de cuentas, Configuración, Invitaciones,
// Zona de Reinicio...). Movida tal cual desde App.jsx en el reparto del
// 2026-08-08 (ver CLAUDE.md) — sigue siendo un único componente grande;
// dividir su interior es un cambio aparte, deliberadamente pospuesto (ver
// CLAUDE.md, Fase 4).
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  X,
  Plus,
  Mail,
  Music,
  AlertTriangle,
  Users,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Bell,
  Trash2,
  Cake,
  Heart,
  DollarSign,
  Image as ImageIcon,
  Copy,
  Pencil,
  Repeat,
  Printer,
  MoreVertical,
} from "lucide-react";
import { formatearFecha, ordenarPorApellidoNombre, parsePrecio, listaConY } from "../lib/formato";
import {
  datosCompletos,
  CAMPOS_DATOS_INVITADO,
  TOTAL_DATOS_INVITADO,
  contarDatosRellenados,
  tieneAlergiaReal,
  calcularEdad,
  edadPromedio,
  importeEsperadoInvitado,
  resolverColaborador,
  parseImport,
} from "../lib/invitados";
import { getRolFromUrl, buildLink } from "../lib/url";
import {
  descargarCSV,
  descargarJSON,
  redimensionarImagenArchivo,
  guardarArchivoInvitacion,
  obtenerCarpetaInvitaciones,
  leerHandleCarpeta,
} from "../lib/descargas";
import { generarInvitacionImagen } from "../lib/imagenInvitacion";
import { C, inputStyle } from "../theme";
import { VERSION_APP } from "../constants";
import { Seal, Stamp, ProgresoBar, EncabezadoOrdenable, GrupoFamiliarInput } from "../components/Widgets";
import { ModalFlotante, VentanaFlotante } from "../components/VentanaFlotante";
import { SectionTitle, Field, TextInput } from "../components/Formulario";
import { Portada } from "../components/Portada";
import { MesaRedonda, MesaPlano } from "../components/Mesas";
import { BuscadorInvitado } from "../components/BuscadorInvitado";
import { ColaboradorCard } from "../components/ColaboradorCard";
import { uid } from "../lib/id";

// Cada parte de Configuración es su propia ventana flotante independiente
// (igual que Mesas, Avisos...), abierta desde el desplegable "SECCIÓN" en
// la cabecera de la ventana "Configuración" — que en sí misma no muestra
// nada más que ese desplegable.
const SECCIONES_CONFIGURACION = [
  { id: "config-datos-evento", etiqueta: "Datos del evento" },
  { id: "config-precios", etiqueta: "Precios" },
  { id: "config-url-web", etiqueta: "URL web" },
  { id: "config-email-anfitrion", etiqueta: "Email anfitrión" },
  { id: "config-plantillas-email", etiqueta: "Texto emails" },
  { id: "config-zona-reinicio", etiqueta: "Reinicios" },
  { id: "config-zona-peligro", etiqueta: "Borrado total" },
];

// Versiones anteriores ya cerradas (números enteros completos): un resumen
// breve por versión mayor, en vez de listar cada sub-versión — ocupa menos
// espacio en la sección "Versiones".
const RESUMEN_VERSIONES_ANTERIORES = [
  {
    version: "5",
    cambios:
      'Enlace del anfitrión cerrado con token secreto. Avisos automáticos por email (Resend) para asignación de invitados, datos completos y pagos completos, y envío de la invitación (con imagen adjunta) a cada familia, todo con vista previa y confirmación explícita — nunca disparado solo. Formulario del colaborador rediseñado para móvil. Cuadrícula de calibración para posicionar fecha/hora/lugar sobre la imagen de la invitación. Zona de Reinicio para limpiar datos de pruebas sin borrar invitados ni colaboradores.',
  },
  {
    version: "4",
    cambios:
      "Migración a una web real: los datos ya no viven en un Artifact sino en una base de datos compartida (Supabase), con web propia (Vite) desplegada automáticamente desde GitHub. El aislamiento entre colaboradores (cada uno solo ve sus invitados asignados) se cumple en el propio servidor, no solo en la pantalla.",
  },
  {
    version: "3",
    cambios:
      "Los campos de edición se movieron a Configuración; portada solo lectura con la fecha en formato largo.",
  },
  {
    version: "2",
    cambios:
      "Cobro automático por edad y precios, invitación generada con plantilla vertical (Familia/Mesa/PAGADO integrado), alergias con selectores dedicados y aviso en mesa, BORRAR TODO en Configuración, y encabezados sin flecha.",
  },
  {
    version: "1",
    cambios:
      "Primera versión estable: tabla ordenable, imagen de cabecera incrustada, enlaces de colaborador vía URL pública, foto de boda por familia, y límite de capacidad respetado en mesas.",
  },
];

// A partir de la 6.0, "cambios" es una lista de párrafos cortos (uno por
// área mejorada) en vez de un único bloque de texto largo — más fácil de
// leer de un vistazo.
const HISTORIAL_VERSIONES = [
  {
    version: "6.0",
    cambios: [
      'Mesas: ahora se dibujan redondas con sillas alrededor (su número sigue a la capacidad), la cantidad de mesas es libre (añadir/quitar, sin el límite fijo de 15), y "Vaciar mesa" desasigna a todos sus invitados de golpe sin borrar a nadie.',
      "Plano de mesas: nueva sección con un lienzo donde cada mesa se arrastra a la posición que quieras (se guarda sola), con botón de impresión preparado para papel A2.",
      "Estado de cuentas: nueva sección con lo recaudado y pendiente de cobro calculados solos a partir de los pagos de invitados, más una lista editable de gastos (incluye también los costes de la propia app, como el dominio o la suscripción) y el balance resultante.",
      'Navegación: las secciones (Mesas, Configuración, Avisos...) dejan de estar apiladas en una página larga y pasan a abrirse como ventanas flotantes movibles y redimensionables, accesibles desde un único desplegable ordenado alfabéticamente. El cambio entre Anfitrión y colaboradores se redujo a una sola barra táctil, pensada para el pulgar en móvil.',
      "Portada: el botón para cambiar la imagen (poco visible sobre algunas fotos) se quita de encima de la portada; ahora se edita desde Configuración, junto con el resto de datos del evento.",
      "Imágenes: la imagen de portada y la de la plantilla de invitación se suben ahora como archivo desde el dispositivo, en vez de pegar una URL — igual que ya funcionaba la foto de boda.",
      "Email del colaborador: se edita en un solo sitio (Colaboradores); se quita el duplicado de Configuración, y en el formulario de datos del invitado aparece ensombrecido (solo lectura) cuando ese invitado es también un colaborador.",
      "Configuración: la ventana pasa a ser solo un desplegable \"SECCIÓN\" — cada parte (Precios, URL web, Email anfitrión, Texto emails, Reinicios, Borrado total...) se abre en su propia ventana independiente, igual que Mesas o Avisos.",
      "Ventanas: cualquiera pasa a primer plano en cuanto se toca, en vez de quedarse algunas ancladas por encima de las demás.",
      "Solidez: BORRAR TODO descarga ahora la misma copia de seguridad automática que ya tenían los reinicios. Y si guardar algo falla (sin conexión, fallo del servidor), la pantalla deja de mostrar el cambio como si se hubiera guardado — se deshace solo en vez de mentir hasta que recargues. Además, si algo revienta al pintar la pantalla, ahora se ve un aviso con botón de recargar en vez de quedarse todo en blanco sin explicación.",
      "Emails, tras la primera prueba real: la tentativa ya no bloquea avisar al anfitrión ni aparece nombrada en el email al colaborador (evita preguntas antes de tiempo); \"He terminado mi trabajo\" se movió a la derecha; y en Colaboradores hay un botón \"Probar\" para confirmar al momento que un email está bien escrito, en vez de descubrirlo días después.",
      "Corrige que los modales de confirmación (REINICIAR, \"¿has terminado?\"...) podían abrirse ocultos detrás de una ventana ya abierta un rato, por quedarse con un z-index fijo mientras las ventanas ya lo tenían dinámico.",
      "Avisos: panel con el total pendiente de datos (solo confirmados) e invitaciones, y el historial de emails enviados ahora se filtra por 3 tipos (Asignados, Datos, Invitación) y se ordena por Fecha, Tipo o Email.",
      "Corrige que BORRAR TODO y los reinicios no llegaban a aplicarse desde el móvil: la descarga automática de la copia de seguridad se disparaba antes de la acción real, y en algunos navegadores móviles eso podía interrumpirla antes de completarse. Ahora la copia se descarga después de que la acción ya haya terminado.",
      "Se probó y se revirtió: confirmar en el momento si Resend acepta un envío. Esperar esa respuesta dentro de la misma función podía agotar el tiempo máximo de una consulta y cancelar el envío entero, no solo la confirmación — enviar_email vuelve a ser \"disparar y no esperar\", que es lo fiable.",
      "Solidez de fondo: avisoPendiente e invitacionEnviada dejan de fijarse a mano en cada función y se recalculan solos según el estado real. Además, cada sesión (la tuya, la de cada colaborador) vuelve a pedir los datos sola cada minuto, para no quedarse con una copia vieja si otra persona cambia algo mientras tanto.",
      "Emails: la confirmación ✓/✗/? vuelve al historial de Avisos, esta vez bien separada del envío — enviar_email() solo guarda dónde mirar la respuesta más tarde, y una comprobación aparte (que nunca espera ni puede bloquear nada) la va resolviendo sola con el refresco de cada minuto.",
    ],
  },
];


export function VistaAnfitrion({ data }) {
  const { evento, colaboradores, invitados, mesas, fotosFamiliares, persistEvento, persistColaboradores, persistInvitados, persistMesas, persistFotosFamiliares, avisarColaborador, probarEmailColaborador, avisosEnviados, ordenFamiliares, persistOrdenFamiliares, enviarInvitacionFamilia, resetearAvisos, resetearPorInvitados, gastos, persistGastos } = data;

  const [nuevoColab, setNuevoColab] = useState({ invitadoId: "" });
  const [nuevoInvitado, setNuevoInvitado] = useState({ nombre: "", apellido: "", zona: "", grupoFamiliar: "" });
  const [textoImport, setTextoImport] = useState("");
  const [mostrarImport, setMostrarImport] = useState(false);
  const [mostrarAnadir, setMostrarAnadir] = useState(false);
  const [orden, setOrden] = useState({ columna: "invitado", direccion: "asc" });

  // "avisoPendiente" vive en el servidor (columna en invitados), no solo
  // en memoria — así no se pierde el rastro si cancelas o cierras la
  // pestaña. Al cerrar la tabla, si queda alguien pendiente, se pregunta.
  const [mostrarResumenAsignacion, setMostrarResumenAsignacion] = useState(false);
  const [enviandoAvisosAsignacion, setEnviandoAvisosAsignacion] = useState(false);
  // El aviso pendiente vive por invitado (avisoPendiente en invitados), no
  // por colaborador — así se sabe exactamente cuáles son los nuevos. Los
  // que siguen en tentativa no cuentan: no se nombran en el email al
  // colaborador (ver anfitrion_avisar_colaborador), así que preguntar aquí
  // "¿avisar ya?" por un tentativa mandaría un aviso sin contenido.
  const invitadosPendientesDe = (colaboradorId) =>
    invitados.filter((g) => g.colaboradorId === colaboradorId && g.avisoPendiente && g.confirmado);
  const colaboradoresPendientes = colaboradores.filter(
    (c) => invitadosPendientesDe(c.id).length > 0
  );
  // Total de confirmados con datos pendientes de avisar, sin desglosar por
  // colaborador — para el panel resumen de Avisos. La tentativa nunca cuenta
  // aquí (mismo motivo que arriba).
  const datosConfirmadosPendientes = invitados.filter(
    (g) => g.avisoPendiente && g.confirmado
  ).length;
  const [filtroTipoAviso, setFiltroTipoAviso] = useState("todos"); // "todos" | "asignados" | "datos" | "invitacion"
  const [ordenAvisos, setOrdenAvisos] = useState({ columna: "fecha", direccion: "desc" });
  const cambiarOrdenAvisos = (columna) => {
    setOrdenAvisos((o) =>
      o.columna === columna
        ? { columna, direccion: o.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: "asc" }
    );
  };

  // Antes de mandar un aviso individual ("Avisar ahora"), se enseña el
  // mensaje exacto que se va a enviar y se pide confirmar — con opción de
  // ir directo a editar la plantilla si algo no convence.
  const [avisoPreview, setAvisoPreview] = useState(null); // { id, nombre } | null
  const [enviandoAvisoPreview, setEnviandoAvisoPreview] = useState(false);

  const confirmarEnvioAvisoPreview = async () => {
    if (!avisoPreview) return;
    setEnviandoAvisoPreview(true);
    await avisarColaborador(avisoPreview.id);
    setEnviandoAvisoPreview(false);
    setAvisoPreview(null);
  };

  const irAEditarAsignacion = () => {
    if (avisoPreview) {
      setFiltros((f) => ({ ...f, colaboradorId: avisoPreview.id }));
    }
    setAvisoPreview(null);
    setAbierto((a) => ({ ...a, invitados: true, avisos: false }));
  };

  const cambiarOrden = (columna) => {
    setOrden((o) =>
      o.columna === columna
        ? { columna, direccion: o.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: "asc" }
    );
  };
  const [filtros, setFiltros] = useState({
    texto: "",
    grupoFamiliar: "",
    zona: "",
    colaboradorId: "",
    mesa: "",
    confirmado: "",
    datos: "",
    pagado: "",
  });

  const idsYaColaboradores = new Set(colaboradores.map((c) => c.invitadoId).filter(Boolean));
  const invitadosDisponiblesParaColaborador = invitados.filter((g) => !idsYaColaboradores.has(g.id));

  const agregarColaborador = () => {
    if (!nuevoColab.invitadoId) return;

    const inv = invitados.find((g) => g.id === nuevoColab.invitadoId);
    if (!inv) return;
    const nombreFinal = `${inv.apellido}, ${inv.nombre}`.trim();

    persistColaboradores([
      ...colaboradores,
      { id: uid(), nombre: nombreFinal, invitadoId: nuevoColab.invitadoId, email: "" },
    ]);
    setNuevoColab({ invitadoId: "" });
  };

  const eliminarColaborador = (id) => {
    persistColaboradores(colaboradores.filter((c) => c.id !== id));
  };

  const cambiarEmailColaborador = (id, email) => {
    persistColaboradores(colaboradores.map((c) => (c.id === id ? { ...c, email } : c)));
  };

  // ---------- Estado de cuentas (gastos) ----------
  // "importe" se guarda tal cual se escribe (texto), igual que precioAdulto/
  // precioNino del evento — se convierte a número solo al sumar
  // (parsePrecio), nunca en cada pulsación. Convertirlo a número al momento
  // borraba la coma decimal a medio escribir (9,18 acababa siendo 918).
  // La lista de gastos empieza plegada: al abrir la sección solo se ven los
  // 4 recuadros (recaudado/pendiente/gastos/balance).
  const [mostrarListaGastos, setMostrarListaGastos] = useState(false);

  const agregarGasto = () => {
    persistGastos([
      ...gastos,
      { id: uid(), concepto: "", categoria: "", importe: "", pagado: false },
    ]);
  };

  const cambiarGasto = (id, campo, valor) => {
    persistGastos(gastos.map((g) => (g.id === id ? { ...g, [campo]: valor } : g)));
  };

  const eliminarGasto = (id) => {
    persistGastos(gastos.filter((g) => g.id !== id));
  };

  // Relevo: un nuevo colaborador toma el relevo del anterior. Los invitados ya
  // asignados (y sus datos ya recopilados) pasan al nuevo sin perder nada.
  const relevarColaborador = (idAnterior, { invitadoId, nombreNuevo }) => {
    const anterior = colaboradores.find((c) => c.id === idAnterior);
    if (!anterior) return;

    let invitadoIdFinal = invitadoId;
    let nombreFinal = nombreNuevo;
    let invitadosSiguientes = invitados;

    if (invitadoIdFinal) {
      const inv = invitados.find((g) => g.id === invitadoIdFinal);
      if (inv) nombreFinal = `${inv.apellido}, ${inv.nombre}`.trim();
    } else if (nombreFinal) {
      const [apellido = "", nombre = ""] = nombreFinal.split(",").map((s) => s.trim());
      const nuevoInvitadoObj = {
        id: uid(),
        nombre,
        apellido,
        zona: "",
        confirmado: false,
        colaboradorId: null,
        grupoFamiliar: apellido || nombre,
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      };
      invitadoIdFinal = nuevoInvitadoObj.id;
      invitadosSiguientes = [...invitados, nuevoInvitadoObj];
    } else {
      return;
    }

    const nuevoId = uid();
    persistColaboradores(
      colaboradores
        .filter((c) => c.id !== idAnterior)
        .concat({ id: nuevoId, nombre: nombreFinal, invitadoId: invitadoIdFinal, email: "" })
    );
    persistInvitados(
      invitadosSiguientes.map((g) =>
        g.colaboradorId === idAnterior ? { ...g, colaboradorId: nuevoId } : g
      )
    );
  };

  const agregarInvitado = () => {
    if (
      !nuevoInvitado.nombre.trim() ||
      !nuevoInvitado.apellido.trim() ||
      !nuevoInvitado.grupoFamiliar.trim()
    )
      return;
    persistInvitados([
      ...invitados,
      {
        id: uid(),
        nombre: nuevoInvitado.nombre.trim(),
        apellido: nuevoInvitado.apellido.trim(),
        zona: nuevoInvitado.zona.trim(),
        confirmado: false,
        colaboradorId: null,
        grupoFamiliar: nuevoInvitado.grupoFamiliar.trim(),
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      },
    ]);
    setNuevoInvitado({ nombre: "", apellido: "", zona: "", grupoFamiliar: "" });
  };

  const asignarColaborador = (id, colaboradorId) => {
    const nuevoId = colaboradorId || null;
    persistInvitados(
      invitados.map((g) => (g.id === id ? { ...g, colaboradorId: nuevoId } : g))
    );
  };

  const intentarCerrarInvitados = () => {
    if (abierto.invitados && colaboradoresPendientes.length > 0) {
      setMostrarResumenAsignacion(true);
      return;
    }
    toggle("invitados");
  };

  const enviarAvisosAsignacion = async () => {
    setEnviandoAvisosAsignacion(true);
    for (const c of colaboradoresPendientes) {
      await avisarColaborador(c.id);
    }
    setEnviandoAvisosAsignacion(false);
    setMostrarResumenAsignacion(false);
    toggle("invitados");
  };

  const cancelarAvisosAsignacion = () => {
    setMostrarResumenAsignacion(false);
    toggle("invitados");
  };

  const asignarGrupoFamiliar = (id, grupoFamiliar) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, grupoFamiliar } : g)));
  };

  const asignarApellido = (id, apellido) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, apellido } : g)));
  };

  const asignarNombre = (id, nombre) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, nombre } : g)));
  };

  const asignarZona = (id, zona) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, zona } : g)));
  };

  const asignarEmailInvitado = (id, email) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, email } : g)));
  };

  const ocupacionMesa = (numero) =>
    invitados.filter((g) => g.mesa === numero && g.confirmado).length;

  const asignarMesa = (id, mesaValue) => {
    const numero = mesaValue ? Number(mesaValue) : null;
    if (numero) {
      const mesa = mesas.find((m) => m.numero === numero);
      const invitadoActual = invitados.find((g) => g.id === id);
      const yaEnEstaMesa = invitadoActual && invitadoActual.mesa === numero;
      if (mesa && !yaEnEstaMesa && ocupacionMesa(numero) >= mesa.capacidad) {
        window.alert(`La mesa ${numero} ya está completa (${mesa.capacidad}/${mesa.capacidad}).`);
        return;
      }
    }
    persistInvitados(
      invitados.map((g) => (g.id === id ? { ...g, mesa: numero } : g))
    );
  };

  const cambiarCapacidadMesa = (numero, capacidad) => {
    persistMesas(
      mesas.map((m) => (m.numero === numero ? { ...m, capacidad: Number(capacidad) || 0 } : m))
    );
  };

  const anadirMesa = () => {
    const siguiente = mesas.reduce((max, m) => Math.max(max, m.numero), 0) + 1;
    persistMesas([...mesas, { numero: siguiente, capacidad: 10 }]);
  };

  const eliminarMesa = (numero) => {
    const afectados = invitados.filter((g) => g.mesa === numero);
    if (afectados.length > 0) {
      const confirmar = window.confirm(
        `La mesa ${numero} tiene ${afectados.length} invitado(s) asignado(s). Al eliminarla, ` +
          `vuelven a quedar sin mesa (no se borra a nadie). ¿Continuar?`
      );
      if (!confirmar) return;
      persistInvitados(
        invitados.map((g) => (g.mesa === numero ? { ...g, mesa: null } : g))
      );
    }
    persistMesas(mesas.filter((m) => m.numero !== numero));
  };

  const vaciarMesa = (numero) => {
    const afectados = invitados.filter((g) => g.mesa === numero);
    if (afectados.length === 0) return;
    const confirmar = window.confirm(
      `Vaciar la mesa ${numero}: ${afectados.length} invitado(s) volverán a quedar sin mesa ` +
        `(no se borra a nadie). ¿Continuar?`
    );
    if (!confirmar) return;
    persistInvitados(invitados.map((g) => (g.mesa === numero ? { ...g, mesa: null } : g)));
  };

  // Posición por defecto en rejilla para las mesas que todavía no se han
  // arrastrado a mano en el plano (posX/posY a null).
  const posicionPorDefecto = (indice, total) => {
    const columnas = Math.max(1, Math.ceil(Math.sqrt(total)));
    const filas = Math.max(1, Math.ceil(total / columnas));
    const col = indice % columnas;
    const fila = Math.floor(indice / columnas);
    return {
      posX: ((col + 0.5) / columnas) * 100,
      posY: ((fila + 0.5) / filas) * 100,
    };
  };

  const moverMesaPlano = (numero, posX, posY) => {
    persistMesas(
      mesas.map((m) => (m.numero === numero ? { ...m, posX, posY } : m))
    );
  };

  // Auto-asignación de mesas: nunca reparte un grupo familiar entre varias
  // mesas por su cuenta. Si parte del grupo ya está sentada a mano, intenta
  // completar el resto en esa misma mesa; si no cabe entero (ahí o en
  // cualquier otra), no toca nada y genera un aviso para que el Anfitrión lo
  // resuelva a mano (subiendo capacidad, moviendo gente, etc.).
  const autoAsignarMesas = () => {
    const nuevos = invitados.map((g) => ({ ...g }));
    const ocupacion = {};
    mesas.forEach((m) => {
      ocupacion[m.numero] = nuevos.filter((g) => g.mesa === m.numero && g.confirmado).length;
    });

    const gruposMap = {};
    nuevos.forEach((g) => {
      if (g.confirmado) {
        const key = (g.grupoFamiliar || g.apellido || g.id).trim().toLowerCase();
        (gruposMap[key] = gruposMap[key] || []).push(g);
      }
    });

    const avisos = [];

    // Los grupos con más gente sin sentar van primero, para que no se queden
    // sin hueco por culpa de familias pequeñas que se adelantaron.
    const gruposOrdenados = Object.values(gruposMap).sort(
      (a, b) => b.filter((g) => !g.mesa).length - a.filter((g) => !g.mesa).length
    );

    gruposOrdenados.forEach((grupo) => {
      const sinMesa = grupo.filter((g) => !g.mesa);
      if (sinMesa.length === 0) return;

      const nombreGrupo = grupo[0].grupoFamiliar || grupo[0].apellido || "(sin nombre)";
      const mesasYaUsadas = [...new Set(grupo.filter((g) => g.mesa).map((g) => g.mesa))];

      if (mesasYaUsadas.length > 1) {
        avisos.push({
          grupo: nombreGrupo,
          motivo: `ya está repartida a mano entre las mesas ${mesasYaUsadas.join(
            ", "
          )} — revísalo si no era intencional`,
        });
        return;
      }

      const mesaObjetivo =
        mesasYaUsadas.length === 1 ? mesas.find((m) => m.numero === mesasYaUsadas[0]) : null;

      if (mesaObjetivo) {
        const hueco = mesaObjetivo.capacidad - (ocupacion[mesaObjetivo.numero] || 0);
        if (hueco >= sinMesa.length) {
          sinMesa.forEach((g) => {
            g.mesa = mesaObjetivo.numero;
          });
          ocupacion[mesaObjetivo.numero] = (ocupacion[mesaObjetivo.numero] || 0) + sinMesa.length;
        } else {
          avisos.push({
            grupo: nombreGrupo,
            motivo: `no caben ${sinMesa.length} persona${
              sinMesa.length !== 1 ? "s" : ""
            } más en la Mesa ${mesaObjetivo.numero} (solo ${Math.max(
              hueco,
              0
            )} libres) — se han dejado sin mesa`,
          });
        }
        return;
      }

      const mesaElegida = mesas.find(
        (m) => m.capacidad - (ocupacion[m.numero] || 0) >= sinMesa.length
      );
      if (mesaElegida) {
        sinMesa.forEach((g) => {
          g.mesa = mesaElegida.numero;
        });
        ocupacion[mesaElegida.numero] = (ocupacion[mesaElegida.numero] || 0) + sinMesa.length;
      } else {
        avisos.push({
          grupo: nombreGrupo,
          motivo: `ninguna mesa tiene ${sinMesa.length} hueco${
            sinMesa.length !== 1 ? "s" : ""
          } libres juntos — se han dejado sin mesa`,
        });
      }
    });

    persistInvitados(nuevos);
    setAvisosMesas(avisos);
    setPanelFlotante(avisos.length > 0 ? "avisosMesas" : null);
  };

  const importarInvitados = () => {
    const filas = parseImport(textoImport, colaboradores);
    if (filas.length === 0) return;
    const nuevos = filas.map((r) => ({
      id: uid(),
      nombre: r.nombre,
      apellido: r.apellido,
      zona: r.zona,
      confirmado: false,
      colaboradorId: r.colaboradorId,
      grupoFamiliar: r.grupoFamiliar,
      mesa: null,
      anioNacimiento: "",
      anioBoda: "",
      email: "",
      cancion: "",
      alergias: "",
        observaciones: "",
        pagado: false,
    }));
    persistInvitados([...invitados, ...nuevos]);
    setTextoImport("");
  };

  const toggleConfirmar = (id) => {
    persistInvitados(
      invitados.map((g) =>
        g.id === id ? { ...g, confirmado: !g.confirmado } : g
      )
    );
  };

  const eliminarInvitado = (id) => {
    persistInvitados(invitados.filter((g) => g.id !== id));
  };

  const borrarTodoElContenido = () => {
    const aviso = "¡ADVERTENCIA SE BORRARÁ TODO EL CONTENIDO DE LA APLICACIÓN!";
    const primera = window.confirm(`${aviso}\n\nEvento, colaboradores, invitados, mesas y fotos — todo. Esta acción no se puede deshacer.\n\n¿Quieres continuar?`);
    if (!primera) return;
    const segunda = window.confirm(`${aviso}\n\nÚltima confirmación: se borrará TODO de verdad. ¿Confirmas definitivamente?`);
    if (!segunda) return;
    // El contenido del backup se captura YA (antes de borrar nada), pero
    // el DISPARO de la descarga se deja para el final, después de lanzar
    // el borrado — en móvil (sobre todo iOS), un <a download> hacia un
    // blob: puede navegar la propia pestaña en vez de descargar sin más;
    // si eso pasara antes de esta llamada, la página se recargaría y el
    // borrado ni siquiera llegaría a intentarse.
    const datosBackup = JSON.parse(exportarTodo());
    persistEvento({
      nombre: "",
      fecha: "",
      hora: "",
      precio: "",
      imagen: "/cabecera-defecto.jpg",
      imagenInvitacion: "/invitacion-defecto.jpg",
      lugar: "",
      direccion: "",
      precioAdulto: "",
      precioNino: "",
      edadNinoDesde: "2",
      edadNinoHasta: "12",
      urlPublica: "",
      ocultarTituloEnImagen: true,
      emailAnfitrion: "",
      plantillaAsignacion:
        "Hola,<br><br>Tienes invitados nuevos asignados.<br>Entra en tu enlace cuando puedas para revisarlos y completar sus datos." +
        '<p style="color:#B00020;font-weight:700;text-transform:uppercase;font-family:Georgia,serif;margin-top:14px;">' +
        "Si ya has rellenado los datos de los nuevos que adjunto en este email, ignora este aviso." +
        "</p>",
      plantillaDatosCompletados:
        "Hola,<br><br><b>{colaborador}</b> ha completado los datos de todos sus invitados asignados.",
      plantillaPagoRegistrado:
        "Hola,<br><br><b>{colaborador}</b> ha completado todos los pagos de sus invitados asignados.",
      plantillaInvitacionFamilia:
        "Hola,<br><br>Aquí tienes tu invitación. ¡Os esperamos con muchas ganas!",
    });
    persistColaboradores([]);
    persistInvitados([]);
    persistMesas([]);
    persistFotosFamiliares({});
    descargarJSON(`backup-antes-de-borrar-todo-${Date.now()}.json`, datosBackup);
  };

  // ---------- Zona de reinicio (por secciones, sin tocar a los invitados) ----------
  // ---------- Reinicio "por invitados": colaborador -> alcance -> categoría ----------
  const CATEGORIAS_RESET = {
    datos: {
      titulo: "Datos del invitado",
      familiar: false,
      descripcion: "Vacía año nacimiento, año de boda, email, canción, alergias y observaciones.",
    },
    pago: {
      titulo: "Pago",
      familiar: false,
      descripcion: 'Vuelve a "no pagado".',
    },
    mesa: {
      titulo: "Mesa",
      familiar: false,
      descripcion: 'Quita la mesa asignada (vuelve a "sin mesa").',
    },
    asignacion: {
      titulo: "Asignación de colaborador",
      familiar: false,
      descripcion:
        'Quita la asignación de colaborador (vuelve a "sin asignar"). Ni el invitado ni el colaborador se borran.',
    },
    foto: {
      titulo: "Foto familiar",
      familiar: true,
      descripcion: "Borra la foto guardada de la familia.",
    },
    invitacion: {
      titulo: "Invitación",
      familiar: true,
      descripcion: 'Pone a cero el aviso de "invitación enviada" de la familia.',
    },
  };
  // Cualquier reinicio que toque invitados limpia también su aviso
  // pendiente — si la asignación o el dato era de prueba, el aviso que
  // generó también lo era (se aplica siempre en el propio RPC).

  const [rColaborador, setRColaborador] = useState(""); // "" = todos los colaboradores
  const [rAlcance, setRAlcance] = useState("todos"); // "todos" | "familia" | "invitado"
  const [rFamiliaClave, setRFamiliaClave] = useState("");
  const [rInvitadoId, setRInvitadoId] = useState("");
  const [rCategoria, setRCategoria] = useState("");
  const [rPalabra, setRPalabra] = useState("");
  const [rEjecutando, setREjecutando] = useState(false);
  const [rMostrarConfirmar, setRMostrarConfirmar] = useState(false);

  const invitadosParaReset = rColaborador
    ? invitados.filter((g) => g.colaboradorId === rColaborador)
    : invitados;

  const familiasParaReset = (() => {
    const vistos = new Map();
    invitadosParaReset.forEach((g) => {
      const clave = g.grupoFamiliar || g.apellido || g.id;
      if (!vistos.has(clave)) vistos.set(clave, g.apellido || clave);
    });
    return Array.from(vistos.entries()).map(([clave, etiqueta]) => ({ clave, etiqueta }));
  })();

  const invitadoIdsParaReset = (() => {
    if (rAlcance === "invitado") return rInvitadoId ? [rInvitadoId] : [];
    if (rAlcance === "familia") {
      if (!rFamiliaClave) return [];
      return invitadosParaReset
        .filter((g) => (g.grupoFamiliar || g.apellido || g.id) === rFamiliaClave)
        .map((g) => g.id);
    }
    return invitadosParaReset.map((g) => g.id);
  })();

  const confirmarResetPorInvitados = async () => {
    if (rPalabra.trim().toUpperCase() !== "REINICIAR") return;
    if (invitadoIdsParaReset.length === 0 || !rCategoria) return;
    setREjecutando(true);
    // El contenido se captura ya (antes de resetear), pero la descarga se
    // dispara después de que el reinicio termine de verdad — en móvil, un
    // <a download> puede navegar la pestaña en vez de descargar sin más;
    // si eso pasara antes del await de abajo, el reinicio ni se llegaría
    // a intentar (visto en pruebas reales: en el móvil no se aplicaba).
    const datosBackup = JSON.parse(exportarTodo());
    await resetearPorInvitados(invitadoIdsParaReset, rCategoria);
    descargarJSON(`backup-antes-de-reiniciar-${rCategoria}-${Date.now()}.json`, datosBackup);
    setREjecutando(false);
    setRMostrarConfirmar(false);
    setRPalabra("");
    setRCategoria("");
  };

  // ---------- Reinicio de avisos (historial global, sin vínculo a invitado/colaborador) ----------
  const [reinicioAvisosPendiente, setReinicioAvisosPendiente] = useState(false);
  const [palabraAvisos, setPalabraAvisos] = useState("");
  const [reiniciandoAvisos, setReiniciandoAvisos] = useState(false);

  const confirmarReinicioAvisos = async () => {
    if (palabraAvisos.trim().toUpperCase() !== "AVISOS") return;
    setReiniciandoAvisos(true);
    // Mismo motivo que en confirmarResetPorInvitados: capturar antes,
    // descargar después de que la acción real ya haya terminado.
    const datosBackup = JSON.parse(exportarTodo());
    await resetearAvisos();
    descargarJSON(`backup-antes-de-reiniciar-avisos-${Date.now()}.json`, datosBackup);
    setReiniciandoAvisos(false);
    setReinicioAvisosPendiente(false);
    setPalabraAvisos("");
  };

  const exportarTodo = () => {
    const datos = {
      version: 1,
      evento,
      mesas,
      fotosFamiliares,
      colaboradores: colaboradores.map((c) => ({
        nombre: c.nombre,
        email: c.email || "",
      })),
      invitados: ordenarPorApellidoNombre(invitados).map((g) => {
        const col = resolverColaborador(g, colaboradores);
        return {
          grupoFamiliar: g.grupoFamiliar || g.apellido || "",
          apellido: g.apellido || "",
          nombre: g.nombre || "",
          zona: g.zona || "",
          confirmado: Boolean(g.confirmado),
          colaboradorNombre: col ? col.nombre : "",
          mesa: g.mesa || null,
          anioNacimiento: g.anioNacimiento || "",
          anioBoda: g.anioBoda || "",
          email: g.email || "",
          cancion: g.cancion || "",
          alergias: g.alergias || "",
          observaciones: g.observaciones || "",
          pagado: Boolean(g.pagado),
        };
      }),
    };
    return JSON.stringify(datos, null, 2);
  };

  const restaurarTodo = () => {
    let datos;
    try {
      datos = JSON.parse(textoRestaurar);
    } catch (_) {
      // No es JSON: puede ser el formato antiguo de "solo invitados" (separado
      // por tabulaciones). Lo intentamos como alternativa antes de rendirnos.
      const filas = parseImport(textoRestaurar, colaboradores);
      if (filas.length === 0) {
        window.alert(
          "No he podido leer ese texto. Pega el contenido que generó \"Exportar todo\" (o, si es una copia antigua de solo invitados, en el formato Grupo familiar, Apellido, Nombre, Colaborador, Zona)."
        );
        return;
      }
      const ok = window.confirm(
        `Esto es un formato antiguo: solo recuperaré los ${filas.length} invitados (nombre, apellido, zona, grupo familiar y colaborador si coincide el nombre). El evento, las mesas y los datos de colaborador/año/email/etc. de cada invitado NO se restauran con este formato. ¿Continuar?`
      );
      if (!ok) return;
      const nuevos = filas.map((r) => ({
        id: uid(),
        nombre: r.nombre,
        apellido: r.apellido,
        zona: r.zona,
        confirmado: false,
        colaboradorId: r.colaboradorId,
        grupoFamiliar: r.grupoFamiliar,
        mesa: null,
        anioNacimiento: "",
        anioBoda: "",
        email: "",
        cancion: "",
        alergias: "",
        observaciones: "",
        pagado: false,
      }));
      persistInvitados([...invitados, ...nuevos]);
      setTextoRestaurar("");
      setMostrarRestaurar(false);
      return;
    }

    // 1) Invitados primero, con ids nuevos (los antiguos ya no sirven).
    const nuevosInvitados = (datos.invitados || []).map((r) => ({
      id: uid(),
      nombre: r.nombre || "",
      apellido: r.apellido || "",
      zona: r.zona || "",
      confirmado: Boolean(r.confirmado),
      colaboradorId: null,
      grupoFamiliar: r.grupoFamiliar || r.apellido || "",
      mesa: r.mesa || null,
      anioNacimiento: r.anioNacimiento || "",
      anioBoda: r.anioBoda || "",
      email: r.email || "",
      cancion: r.cancion || "",
      alergias: r.alergias || "",
      observaciones: r.observaciones || "",
      pagado: Boolean(r.pagado),
      _colaboradorNombreTmp: r.colaboradorNombre || "",
    }));

    // 2) Colaboradores, enlazados al invitado que coincide en apellido y nombre.
    const nuevosColaboradores = (datos.colaboradores || []).map((c) => {
      const [ap, no] = (c.nombre || "").split(",").map((s) => s.trim());
      const match = nuevosInvitados.find((g) => g.apellido === ap && g.nombre === no);
      return {
        id: uid(),
        nombre: c.nombre || "",
        invitadoId: match ? match.id : null,
        email: c.email || "",
      };
    });

    // 3) Resolver el colaborador asignado a cada invitado, y limpiar el campo temporal.
    const invitadosFinal = nuevosInvitados.map((g) => {
      const { _colaboradorNombreTmp, ...resto } = g;
      if (_colaboradorNombreTmp) {
        const col = nuevosColaboradores.find((c) => c.nombre === _colaboradorNombreTmp);
        resto.colaboradorId = col ? col.id : null;
      }
      return resto;
    });

    const eventoRestaurado = datos.evento || evento;
    if (!eventoRestaurado.imagen) eventoRestaurado.imagen = "/cabecera-defecto.jpg";
    if (!eventoRestaurado.imagenInvitacion) eventoRestaurado.imagenInvitacion = "/invitacion-defecto.jpg";
    persistEvento(eventoRestaurado);
    if (datos.mesas) persistMesas(datos.mesas);
    if (datos.fotosFamiliares) persistFotosFamiliares(datos.fotosFamiliares);
    persistColaboradores(nuevosColaboradores);
    persistInvitados(invitadosFinal);
    setTextoRestaurar("");
    setMostrarRestaurar(false);
  };

  const total = invitados.length;
  const confirmadosCount = invitados.filter((g) => g.confirmado).length;
  const tentativaCount = total - confirmadosCount;

  const [abierto, setAbierto] = useState({
    copiaSeguridad: false,
    progreso: false,
    colaboradores: false,
    mesas: false,
    plano: false,
    invitados: false,
    configuracion: false,
    invitaciones: false,
    cuentas: false,
    versiones: false,
    avisos: false,
  });
  const toggle = (clave) => setAbierto((a) => ({ ...a, [clave]: !a[clave] }));
  const [mostrarPeligro, setMostrarPeligro] = useState(false);
  // null | "tabla" | "canciones" | "alergias" | "avisosMesas" — controla la
  // ventana flotante; independiente de qué secciones estén plegadas.
  const [panelFlotante, setPanelFlotante] = useState(null);
  const [avisosMesas, setAvisosMesas] = useState([]);
  const lienzoPlanoRef = useRef(null);

  const imprimirPanelActivo = () => {
    setTimeout(() => {
      try {
        window.print();
      } catch (_) {
        // Bloqueado por el navegador: el usuario puede usar Cmd/Ctrl+P a mano.
      }
    }, 60);
  };

  const exportarPanelActivoCSV = () => {
    if (panelFlotante === "tabla") {
      const filas = invitadosOrdenados.map((g) => {
        const col = resolverColaborador(g, colaboradores);
        return [
          `${g.apellido}, ${g.nombre}`,
          g.grupoFamiliar || g.apellido || "",
          g.zona || "",
          col ? col.nombre : "",
          g.mesa ?? "",
          g.confirmado ? "Sí" : "Tentativa",
          g.confirmado ? (g.pagado ? "Sí" : "No") : "",
        ];
      });
      descargarCSV(
        `invitados-${evento.nombre || "evento"}.csv`,
        ["Invitado", "Grupo familiar", "Zona", "Colaborador", "Mesa", "Confirmado", "Pagado"],
        filas
      );
    } else if (panelFlotante === "canciones") {
      const filas = ordenarPorApellidoNombre(
        invitados.filter((g) => g.cancion && g.cancion.trim())
      ).map((g) => [`${g.apellido}, ${g.nombre}`, calcularEdad(g.anioNacimiento, evento) ?? "", g.cancion]);
      descargarCSV(`canciones-${evento.nombre || "evento"}.csv`, ["Invitado", "Edad", "Canción"], filas);
    } else if (panelFlotante === "alergias") {
      const filas = ordenarPorApellidoNombre(invitados.filter(tieneAlergiaReal)).map((g) => [
        `${g.apellido}, ${g.nombre}`,
        g.mesa ?? "",
        g.alergias,
      ]);
      descargarCSV(`alergias-${evento.nombre || "evento"}.csv`, ["Invitado", "Mesa", "Alergia"], filas);
    }
  };

  // Si el anfitrión reordenó los nombres a mano (p.ej. esposo primero),
  // se respeta ese orden; los que falten en él (recién confirmados) van
  // al final, en su orden normal.
  const ordenarConfirmados = (confirmados, ordenIds) => {
    if (!ordenIds || ordenIds.length === 0) return confirmados;
    const porId = Object.fromEntries(confirmados.map((m) => [m.id, m]));
    const ordenados = ordenIds.map((id) => porId[id]).filter(Boolean);
    const idsOrdenados = new Set(ordenIds);
    const resto = confirmados.filter((m) => !idsOrdenados.has(m.id));
    return [...ordenados, ...resto];
  };

  const familiasListasParaInvitacion = (() => {
    const grupos = {};
    invitados.forEach((g) => {
      const clave = g.grupoFamiliar || g.apellido || g.id;
      (grupos[clave] = grupos[clave] || []).push(g);
    });
    return Object.entries(grupos)
      .map(([clave, miembros]) => {
        const confirmados = ordenarConfirmados(
          miembros.filter((m) => m.confirmado),
          ordenFamiliares[clave]?.orden
        );
        const apellido = miembros[0].apellido || clave;
        return {
          clave,
          apellido,
          confirmados,
          invitacionEnviada: Boolean(ordenFamiliares[clave]?.invitacionEnviada),
          invitacionEnviadaEn: ordenFamiliares[clave]?.invitacionEnviadaEn || null,
          listaParaInvitacion:
            confirmados.length > 0 &&
            confirmados.every((m) => m.pagado) &&
            confirmados.every((m) => m.mesa),
        };
      })
      .filter((f) => f.listaParaInvitacion);
  })();

  const moverNombreFamilia = (familia, invitadoId, direccion) => {
    const ids = familia.confirmados.map((m) => m.id);
    const idx = ids.indexOf(invitadoId);
    const nuevoIdx = idx + direccion;
    if (nuevoIdx < 0 || nuevoIdx >= ids.length) return;
    const nuevosIds = [...ids];
    [nuevosIds[idx], nuevosIds[nuevoIdx]] = [nuevosIds[nuevoIdx], nuevosIds[idx]];
    persistOrdenFamiliares({
      ...ordenFamiliares,
      [familia.clave]: { ...ordenFamiliares[familia.clave], orden: nuevosIds },
    });
  };

  const marcarInvitacionEnviada = (clave) => {
    persistOrdenFamiliares({
      ...ordenFamiliares,
      [clave]: {
        ...ordenFamiliares[clave],
        invitacionEnviada: true,
        invitacionEnviadaEn: new Date().toISOString(),
      },
    });
  };

  const [descargando, setDescargando] = useState(null);
  const [nombreCarpetaInvitaciones, setNombreCarpetaInvitaciones] = useState(null);
  const [subiendoPlantillaInvitacion, setSubiendoPlantillaInvitacion] = useState(false);
  const [errorPlantillaInvitacion, setErrorPlantillaInvitacion] = useState("");

  const onSeleccionarArchivoPlantillaInvitacion = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErrorPlantillaInvitacion("");
    setSubiendoPlantillaInvitacion(true);
    try {
      // Plantilla más grande que una foto normal (maxDim mayor): es el
      // fondo completo de la invitación, necesita quedar nítido.
      const dataUrl = await redimensionarImagenArchivo(file, 2000, 0.88);
      persistEvento({ ...evento, imagenInvitacion: dataUrl });
    } catch (_) {
      setErrorPlantillaInvitacion("No se ha podido procesar la imagen. Prueba con otra.");
    } finally {
      setSubiendoPlantillaInvitacion(false);
    }
  };

  const [subiendoImagenPortada, setSubiendoImagenPortada] = useState(false);
  const [errorImagenPortada, setErrorImagenPortada] = useState("");

  const onSeleccionarArchivoImagenPortada = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErrorImagenPortada("");
    setSubiendoImagenPortada(true);
    try {
      const dataUrl = await redimensionarImagenArchivo(file);
      persistEvento({ ...evento, imagen: dataUrl });
    } catch (_) {
      setErrorImagenPortada("No se ha podido procesar la imagen. Prueba con otra.");
    } finally {
      setSubiendoImagenPortada(false);
    }
  };

  useEffect(() => {
    if (!window.showDirectoryPicker) return;
    leerHandleCarpeta()
      .then((handle) => setNombreCarpetaInvitaciones(handle ? handle.name : null))
      .catch(() => {});
  }, []);

  const [modoCalibracion, setModoCalibracion] = useState(false);

  const generarImagenParaFamilia = async (familia, mostrarCuadricula = modoCalibracion) => {
    // Fraunces tiene que estar realmente cargada antes de dibujar en el
    // canvas — si no, el navegador la ignora en silencio y usa una por
    // defecto sin avisar.
    try {
      await document.fonts.load("bold 40px 'Fraunces'");
    } catch (_) {
      // Si falla la carga, se sigue igualmente con la fuente de reserva.
    }
    const nombres = familia.confirmados.map((m) => m.nombre);
    const cantidad = familia.confirmados.length;
    const mesas = [...new Set(familia.confirmados.map((m) => m.mesa).filter(Boolean))];
    const mesaTexto =
      mesas.length === 1
        ? `Mesa ${mesas[0]} · ${cantidad} ${cantidad === 1 ? "invitado" : "invitados"}`
        : mesas.length > 1
        ? `Mesas ${mesas.join(", ")} · ${cantidad} ${cantidad === 1 ? "invitado" : "invitados"}`
        : `${cantidad} ${cantidad === 1 ? "invitado" : "invitados"}`;
    return generarInvitacionImagen(evento, familia.apellido, nombres, mesaTexto, mostrarCuadricula);
  };

  const descargarInvitacion = async (familia) => {
    setDescargando(familia.clave);
    const dataUrl = await generarImagenParaFamilia(familia);
    setDescargando(null);
    if (!dataUrl) {
      window.alert(
        "No se ha podido generar la imagen, probablemente porque la URL de la imagen del evento no permite descargarla desde otro origen. Prueba con otra imagen alojada en un servicio que sí lo permita, o quita la URL para usar el fondo por defecto."
      );
      return;
    }
    const nombreArchivo = `${evento.nombre || "evento"}_${familia.clave}.png`.replace(/[\\/:*?"<>|]/g, "-");
    await guardarArchivoInvitacion(dataUrl, nombreArchivo);
  };

  const [previewInvitacion, setPreviewInvitacion] = useState(null); // { familia, dataUrl, destinatario } | null
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);

  const abrirPreviewInvitacion = async (familia) => {
    const destinatario = familia.confirmados[0];
    if (!destinatario?.email) {
      window.alert(
        `No se puede enviar todavía: ${destinatario?.nombre || "la primera persona del orden"} ` +
          `no tiene email guardado. Rellénalo (aquí mismo, en la lista de nombres) o cambia el orden de la familia.`
      );
      return;
    }
    setDescargando(familia.clave);
    const dataUrl = await generarImagenParaFamilia(familia);
    setDescargando(null);
    if (!dataUrl) {
      window.alert(
        "No se ha podido generar la imagen, probablemente porque la URL de la imagen del evento no permite descargarla desde otro origen. Prueba con otra imagen alojada en un servicio que sí lo permita, o quita la URL para usar el fondo por defecto."
      );
      return;
    }
    setPreviewInvitacion({ familia, dataUrl, destinatario });
  };

  const confirmarEnvioInvitacion = async () => {
    if (!previewInvitacion) return;
    setEnviandoInvitacion(true);
    const base64 = previewInvitacion.dataUrl.split(",")[1] || "";
    const ok = await enviarInvitacionFamilia(
      previewInvitacion.destinatario.email,
      `Tu invitación — ${evento.nombre || "evento"}`,
      evento.plantillaInvitacionFamilia || "",
      base64
    );
    setEnviandoInvitacion(false);
    if (ok) {
      marcarInvitacionEnviada(previewInvitacion.familia.clave);
      window.alert(`Invitación enviada a ${previewInvitacion.destinatario.email}.`);
      setPreviewInvitacion(null);
    }
  };

  // Envío por bloques: se elige un colaborador y solo se ven/envían las
  // familias de sus invitados asignados, con un resumen de confirmación
  // antes de mandar nada — para no arriesgarse a un envío masivo por error.
  const [colaboradorInvitacionSel, setColaboradorInvitacionSel] = useState("");
  const [mostrarResumenLoteInvitaciones, setMostrarResumenLoteInvitaciones] = useState(false);
  const [enviandoLoteInvitaciones, setEnviandoLoteInvitaciones] = useState(false);

  const familiasParaMostrarInvitacion = colaboradorInvitacionSel
    ? familiasListasParaInvitacion.filter((f) =>
        f.confirmados.some(
          (m) => resolverColaborador(m, colaboradores)?.id === colaboradorInvitacionSel
        )
      )
    : familiasListasParaInvitacion;

  // El envío por bloque solo manda a las que todavía no se les envió nada
  // (para no repetir sin querer) — las ya enviadas se pueden reenviar a
  // mano, una a una, con el botón individual de cada tarjeta.
  const familiasPendientesDeEnviar = familiasParaMostrarInvitacion.filter(
    (f) => !f.invitacionEnviada
  );

  const confirmarEnvioLoteInvitaciones = async () => {
    setEnviandoLoteInvitaciones(true);
    let enviados = 0;
    const saltados = [];
    for (const familia of familiasPendientesDeEnviar) {
      const destinatario = familia.confirmados[0];
      if (!destinatario?.email) {
        saltados.push(`${familia.apellido} (sin email)`);
        continue;
      }
      const dataUrl = await generarImagenParaFamilia(familia);
      if (!dataUrl) {
        saltados.push(`${familia.apellido} (no se pudo generar la imagen)`);
        continue;
      }
      const base64 = dataUrl.split(",")[1] || "";
      const ok = await enviarInvitacionFamilia(
        destinatario.email,
        `Tu invitación — ${evento.nombre || "evento"}`,
        evento.plantillaInvitacionFamilia || "",
        base64
      );
      if (ok) {
        enviados++;
        marcarInvitacionEnviada(familia.clave);
      } else {
        saltados.push(`${familia.apellido} (error al enviar)`);
      }
    }
    setEnviandoLoteInvitaciones(false);
    setMostrarResumenLoteInvitaciones(false);
    window.alert(
      `Enviadas ${enviados} invitaciones.` +
        (saltados.length > 0
          ? `\n\nNo se pudieron enviar (${saltados.length}):\n${saltados.join("\n")}`
          : "")
    );
  };

  const [mostrarExportar, setMostrarExportar] = useState(false);
  const [mostrarRestaurar, setMostrarRestaurar] = useState(false);
  const [textoRestaurar, setTextoRestaurar] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);

  const zonasUnicas = [...new Set(invitados.map((g) => g.zona).filter(Boolean))].sort();
  const gruposFamiliaresUnicos = [
    ...new Set(invitados.map((g) => g.grupoFamiliar).filter(Boolean)),
  ].sort();

  const invitadosOrdenados = invitados
    .filter((g) => {
      if (filtros.texto) {
        const t = filtros.texto.toLowerCase();
        const texto = `${g.nombre} ${g.apellido} ${g.grupoFamiliar || ""}`.toLowerCase();
        if (!texto.includes(t)) return false;
      }
      if (filtros.grupoFamiliar && g.grupoFamiliar !== filtros.grupoFamiliar) return false;
      if (filtros.zona && g.zona !== filtros.zona) return false;
      if (filtros.colaboradorId) {
        const col = resolverColaborador(g, colaboradores);
        if (!col || col.id !== filtros.colaboradorId) return false;
      }
      if (filtros.mesa && String(g.mesa || "") !== filtros.mesa) return false;
      if (filtros.confirmado === "confirmado" && !g.confirmado) return false;
      if (filtros.confirmado === "tentativa" && g.confirmado) return false;
      if (filtros.datos === "completo" && !(g.confirmado && datosCompletos(g))) return false;
      if (filtros.datos === "pendiente" && (!g.confirmado || datosCompletos(g))) return false;
      if (filtros.pagado === "pagado" && !g.pagado) return false;
      if (filtros.pagado === "pendiente" && g.pagado) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const dir = orden.direccion === "asc" ? 1 : -1;
      const valor = (g) => {
        switch (orden.columna) {
          case "grupoFamiliar":
            return (g.grupoFamiliar || g.apellido || "").toLowerCase();
          case "zona":
            return (g.zona || "").toLowerCase();
          case "colaborador":
            return (resolverColaborador(g, colaboradores)?.nombre || "").toLowerCase();
          case "mesa":
            return g.mesa ? Number(g.mesa) : 9999;
          case "confirmado":
            return g.confirmado ? 1 : 0;
          case "datos":
            return g.confirmado && datosCompletos(g) ? 2 : g.confirmado ? 1 : 0;
          case "pagado":
            return g.pagado ? 1 : 0;
          default:
            return `${(g.apellido || "").toLowerCase()} ${(g.nombre || "").toLowerCase()}`;
        }
      };
      const va = valor(a);
      const vb = valor(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

  return (
    <div className="space-y-8">
      <Portada evento={evento} editable abierto={abierto} toggle={toggle} />

      {/* Resumen */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Lista global", value: total },
          { label: "Tentativa", value: tentativaCount },
          { label: "Confirmados", value: confirmadosCount },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3 rounded text-center"
            style={{ background: "#fff", border: `1px solid ${C.line}` }}
          >
            <div
              className="text-2xl"
              style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700 }}
            >
              {s.value}
            </div>
            <div
              className="text-xs uppercase"
              style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* Progreso de recopilación */}
      {abierto.progreso && (
        <VentanaFlotante
          clave="progreso"
          titulo="Progreso de recopilación"
          onCerrar={() => toggle("progreso")}
        >
            <ProgresoBar
              label="General (confirmados con datos completos)"
              completado={invitados.filter((g) => g.confirmado && datosCompletos(g)).length}
              total={confirmadosCount}
              color={C.wax}
            />
            <div className="grid sm:grid-cols-2 gap-x-6">
              {colaboradores.map((c) => {
                const suyos = invitados.filter(
                  (g) => resolverColaborador(g, colaboradores)?.id === c.id && g.confirmado
                );
                const completos = suyos.filter((g) => datosCompletos(g)).length;
                return (
                  <ProgresoBar
                    key={c.id}
                    label={c.nombre}
                    completado={completos}
                    total={suyos.length}
                  />
                );
              })}
            </div>
            {colaboradores.length === 0 && (
              <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                Añade colaboradores para ver su progreso individual.
              </p>
            )}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
              <ProgresoBar
                label="Cobro (confirmados que ya han pagado)"
                completado={invitados.filter((g) => g.confirmado && g.pagado).length}
                total={confirmadosCount}
                color={C.gold}
              />
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
                Informativo — no bloquea a nadie, solo para saber cuánto falta de la canción
                para el DJ. Las alergias se avisan directamente en la mesa (sección Mesas) y
                tienen su propia lista imprimible más abajo.
              </p>
              <ProgresoBar
                label="Con canción registrada"
                completado={
                  invitados.filter((g) => g.confirmado && g.cancion && g.cancion.trim()).length
                }
                total={confirmadosCount}
              />
            </div>
        </VentanaFlotante>
      )}

      {/* Colaboradores */}
      {abierto.colaboradores && (
        <VentanaFlotante clave="colaboradores" titulo="Colaboradores" onCerrar={() => toggle("colaboradores")}>
            <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
              Los colaboradores son también invitados del evento: búscalo por apellido o
              nombre entre los ya añadidos a la lista. Si aún no está en la lista, añádelo
              primero abajo en "Lista de invitados".
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <BuscadorInvitado
                invitados={invitadosDisponiblesParaColaborador}
                invitadoId={nuevoColab.invitadoId}
                onSeleccionar={(id) => setNuevoColab({ ...nuevoColab, invitadoId: id })}
                placeholder="Buscar invitado para hacerlo colaborador..."
              />
              <button
                onClick={agregarColaborador}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ background: C.ink, color: C.paper }}
              >
                <Plus size={14} /> Añadir
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {colaboradores.map((c) => {
                const pendientes = invitados.filter(
                  (g) =>
                    resolverColaborador(g, colaboradores)?.id === c.id &&
                    g.confirmado &&
                    !datosCompletos(g)
                ).length;
                return (
                  <ColaboradorCard
                    key={c.id}
                    c={c}
                    pendientes={pendientes}
                    invitados={invitados}
                    colaboradores={colaboradores}
                    evento={evento}
                    onEliminar={eliminarColaborador}
                    onRelevar={relevarColaborador}
                    onAsignarColaborador={asignarColaborador}
                    onCambiarEmail={cambiarEmailColaborador}
                    onProbarEmail={probarEmailColaborador}
                  />
                );
              })}
              {colaboradores.length === 0 && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  Aún no hay colaboradores.
                </p>
              )}
            </div>
        </VentanaFlotante>
      )}

      {/* Mesas */}
      {abierto.mesas && (
        <VentanaFlotante clave="mesas" titulo="Mesas" onCerrar={() => toggle("mesas")}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
            Define primero cuántos comensales caben en cada mesa. Luego puedes generar una
            distribución preliminar (respetando el grupo familiar) y ajustarla a mano.
          </p>
          <div className="flex items-center gap-2 ml-3">
            {avisosMesas.length > 0 && (
              <button
                onClick={() => setPanelFlotante("avisosMesas")}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium whitespace-nowrap"
                style={{ background: C.wax, color: "#fff" }}
                title="Ver familias que se quedaron sin mesa"
              >
                <AlertTriangle size={12} /> {avisosMesas.length} aviso{avisosMesas.length !== 1 && "s"}
              </button>
            )}
            <button
              onClick={autoAsignarMesas}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap"
              style={{ background: C.ink, color: C.paper }}
            >
              Auto-asignar (preliminar)
            </button>
            <button
              onClick={anadirMesa}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap"
              style={{ border: `1px solid ${C.ink}`, color: C.ink }}
            >
              <Plus size={14} /> Añadir mesa
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {mesas.map((m) => {
            const ocupados = ocupacionMesa(m.numero);
            const lleno = ocupados >= m.capacidad && m.capacidad > 0;
            const tieneAlergias = invitados.some(
              (g) => g.mesa === m.numero && g.confirmado && tieneAlergiaReal(g)
            );
            return (
              <MesaRedonda
                key={m.numero}
                m={m}
                ocupados={ocupados}
                lleno={lleno}
                tieneAlergias={tieneAlergias}
                onCambiarCapacidad={(v) => cambiarCapacidadMesa(m.numero, v)}
                onEliminar={() => eliminarMesa(m.numero)}
                onVaciar={() => vaciarMesa(m.numero)}
              />
            );
          })}
          {mesas.length === 0 && (
            <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía no hay mesas — pulsa "Añadir mesa" para crear la primera.
            </p>
          )}
        </div>
        </VentanaFlotante>
      )}

      {/* Plano de mesas */}
      {abierto.plano && (
        <VentanaFlotante clave="plano" titulo="Plano de mesas" onCerrar={() => toggle("plano")}>
          <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
            Arrastra cada mesa a la posición que quieras para representar cómo queda en el local.
            La posición se guarda sola. Para imprimirlo en A2, pulsa "Imprimir" y elige el tamaño
            de papel A2 en el diálogo de impresión de tu navegador.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => {
                setTimeout(() => {
                  try {
                    window.print();
                  } catch (_) {
                    // Bloqueado por el navegador: Cmd/Ctrl+P a mano.
                  }
                }, 60);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              <Printer size={14} /> Imprimir (A2)
            </button>
          </div>
          <div id="zona-imprimible-plano">
            <div
              ref={lienzoPlanoRef}
              className="relative w-full rounded"
              style={{
                aspectRatio: "594 / 420",
                background: "#F7F4EA",
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "5% 5%",
                border: `1px solid ${C.line}`,
              }}
            >
              {mesas.map((m, i) => {
                const ocupados = ocupacionMesa(m.numero);
                const posDefecto = posicionPorDefecto(i, mesas.length);
                const posX = m.posX ?? posDefecto.posX;
                const posY = m.posY ?? posDefecto.posY;
                return (
                  <MesaPlano
                    key={m.numero}
                    m={{ ...m, posX, posY }}
                    ocupados={ocupados}
                    canvasRef={lienzoPlanoRef}
                    onMover={moverMesaPlano}
                  />
                );
              })}
            </div>
          </div>
          {mesas.length === 0 && (
            <p className="text-sm italic mt-2" style={{ color: C.charcoal, opacity: 0.6 }}>
              Todavía no hay mesas — créalas primero en "Mesas".
            </p>
          )}
        </VentanaFlotante>
      )}

      {/* Invitados */}
      <section>
        <div
          className="mb-1 pb-2 flex items-center justify-between"
          style={{ borderBottom: `1.5px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={intentarCerrarInvitados}
              className="flex items-center gap-2 text-xl"
              style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}
            >
              <Tag size={18} strokeWidth={2} />
              Lista de invitados
            </button>
            {invitados.length > 0 && (
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => setPanelFlotante("tabla")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: C.gold, color: "#fff" }}
                  title="Ver / imprimir / exportar la lista de invitados"
                >
                  <Printer size={12} /> Imprimir
                </button>
                <button
                  onClick={() => setPanelFlotante("canciones")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: C.gold, color: "#fff" }}
                  title="Ver / imprimir / exportar solo la lista de canciones (para el DJ/grupo musical)"
                >
                  <Music size={12} /> Canciones
                </button>
                <button
                  onClick={() => setPanelFlotante("alergias")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ background: C.wax, color: "#fff" }}
                  title="Ver / imprimir / exportar solo la lista de alergias, con su mesa (para cocina/catering)"
                >
                  <AlertTriangle size={12} /> Alergias
                </button>
              </div>
            )}
          </div>
        </div>

        {abierto.invitados && (
        <>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setMostrarAnadir((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{
              border: `1px solid ${C.gold}`,
              color: mostrarAnadir ? C.paper : C.gold,
              background: mostrarAnadir ? C.gold : "transparent",
            }}
          >
            <Plus size={14} /> Añadir invitado individual
          </button>
          <button
            onClick={() => setModoEdicion((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{
              border: `1px solid ${C.gold}`,
              color: modoEdicion ? C.paper : C.gold,
              background: modoEdicion ? C.gold : "transparent",
            }}
            title="Activa este modo para poder corregir el grupo familiar de un invitado"
          >
            <Pencil size={14} /> {modoEdicion ? "Terminar edición" : "Editar datos"}
          </button>
          <button
            onClick={() => setMostrarImport((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{
              border: `1px solid ${C.gold}`,
              color: mostrarImport ? C.paper : C.gold,
              background: mostrarImport ? C.gold : "transparent",
            }}
          >
            <Copy size={14} /> Importar desde hoja de cálculo
          </button>
        </div>

        {mostrarAnadir && (
        <div className="flex flex-wrap gap-2 mb-3">
          <TextInput
            placeholder="Grupo familiar"
            value={nuevoInvitado.grupoFamiliar}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, grupoFamiliar: e.target.value })
            }
          />
          <TextInput
            placeholder="Apellido familiar"
            value={nuevoInvitado.apellido}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, apellido: e.target.value })
            }
          />
          <TextInput
            placeholder="Nombre"
            value={nuevoInvitado.nombre}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, nombre: e.target.value })
            }
          />
          <TextInput
            placeholder="Zona"
            value={nuevoInvitado.zona}
            onChange={(e) =>
              setNuevoInvitado({ ...nuevoInvitado, zona: e.target.value })
            }
          />
          <button
            onClick={agregarInvitado}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: C.ink, color: C.paper }}
          >
            <Plus size={14} /> Añadir
          </button>
        </div>
        )}

        {mostrarImport && (
          <div
            className="p-3 rounded mb-4"
            style={{ background: "#fff", border: `1px dashed ${C.gold}` }}
          >
            <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.7 }}>
              Pega tus filas en el orden Grupo familiar, Apellido, Nombre, Colaborador, Zona —
              directamente copiadas de tu hoja de cálculo (una fila por línea). Si el nombre
              del colaborador coincide con uno ya creado abajo, se enlaza automáticamente.
            </p>
            <textarea
              value={textoImport}
              onChange={(e) => setTextoImport(e.target.value)}
              placeholder={"Luis01\tLuis\tJavi\tBENITO\tIcod\nLuis02\tLuis\tDani\tDANIEL\tOrotava"}
              rows={4}
              className="w-full mb-2"
              style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <button
              onClick={importarInvitados}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              <Plus size={14} /> Importar filas
            </button>
          </div>
        )}

        <div
          className="rounded overflow-x-auto"
          style={{ border: `1px solid ${C.line}`, background: "#fff" }}
        >
          <div
            className="px-3 py-2 text-xs"
            style={{
              borderBottom: `1px solid ${C.line}`,
              color: C.charcoal,
              fontFamily: "'IBM Plex Mono', monospace",
              background: C.paperDark,
            }}
          >
            Edad media de los asistentes:{" "}
            <strong style={{ color: C.ink }}>
              {edadPromedio(invitadosOrdenados, evento) ?? "— (faltan años de nacimiento)"}
              {edadPromedio(invitadosOrdenados, evento) !== null && " años"}
            </strong>
          </div>
          <div style={{ minWidth: 780 }}>
            <div
              className="grid text-xs uppercase px-3 py-2 text-center"
              style={{
                gridTemplateColumns: "1.2fr 1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr auto",
                color: C.gold,
                fontFamily: "'IBM Plex Mono', monospace",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <EncabezadoOrdenable columna="invitado" orden={orden} onClick={cambiarOrden}>
                Invitado
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="grupoFamiliar" orden={orden} onClick={cambiarOrden}>
                Grupo familiar
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="zona" orden={orden} onClick={cambiarOrden}>
                Zona
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="colaborador" orden={orden} onClick={cambiarOrden}>
                Colaborador
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="mesa" orden={orden} onClick={cambiarOrden}>
                Mesa
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="confirmado" orden={orden} onClick={cambiarOrden}>
                Confirmado
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="datos" orden={orden} onClick={cambiarOrden}>
                Datos
              </EncabezadoOrdenable>
              <EncabezadoOrdenable columna="pagado" orden={orden} onClick={cambiarOrden}>
                Pagado
              </EncabezadoOrdenable>
              <span></span>
            </div>
            <div
              className="grid px-3 py-1.5"
              style={{
                gridTemplateColumns: "1.2fr 1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr auto",
                background: C.paperDark,
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <TextInput
                value={filtros.texto}
                onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
                placeholder="Buscar..."
                style={{ padding: "2px 5px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              />
              <select
                value={filtros.grupoFamiliar}
                onChange={(e) => setFiltros({ ...filtros, grupoFamiliar: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                {gruposFamiliaresUnicos.map((gf) => (
                  <option key={gf} value={gf}>
                    {gf}
                  </option>
                ))}
              </select>
              <select
                value={filtros.zona}
                onChange={(e) => setFiltros({ ...filtros, zona: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todas</option>
                {zonasUnicas.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
              <select
                value={filtros.colaboradorId}
                onChange={(e) => setFiltros({ ...filtros, colaboradorId: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <select
                value={filtros.mesa}
                onChange={(e) => setFiltros({ ...filtros, mesa: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todas</option>
                {mesas.map((m) => (
                  <option key={m.numero} value={String(m.numero)}>
                    {m.numero}
                  </option>
                ))}
              </select>
              <select
                value={filtros.confirmado}
                onChange={(e) => setFiltros({ ...filtros, confirmado: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                <option value="confirmado">Confirmado</option>
                <option value="tentativa">Tentativa</option>
              </select>
              <select
                value={filtros.datos}
                onChange={(e) => setFiltros({ ...filtros, datos: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                <option value="completo">Completos</option>
                <option value="pendiente">Por recopilar</option>
              </select>
              <select
                value={filtros.pagado}
                onChange={(e) => setFiltros({ ...filtros, pagado: e.target.value })}
                style={{ ...inputStyle, padding: "2px 4px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Todos</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>
              <span />
            </div>
            {invitadosOrdenados.map((g, i) => {
              const col = resolverColaborador(g, colaboradores);
              return (
                <div
                  key={g.id}
                  className="grid items-center px-3 py-2 text-sm"
                  style={{
                    gridTemplateColumns: "1.2fr 1fr 0.8fr 1fr 0.8fr 0.9fr 1fr 0.9fr auto",
                    background: i % 2 ? C.paperDark : "#fff",
                    fontFamily: "'Inter', sans-serif",
                    color: C.charcoal,
                  }}
                >
                  <span>
                    {modoEdicion ? (
                      <span className="flex gap-1">
                        <div className="flex-1 min-w-0">
                          <GrupoFamiliarInput
                            value={g.apellido ?? ""}
                            onCommit={(v) => asignarApellido(g.id, v)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <GrupoFamiliarInput
                            value={g.nombre ?? ""}
                            onCommit={(v) => asignarNombre(g.id, v)}
                          />
                        </div>
                      </span>
                    ) : (
                      <>
                        {g.apellido}, {g.nombre}
                        {colaboradores.some((c) => c.invitadoId === g.id) && (
                          <span
                            className="ml-1 text-xs"
                            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
                            title="También es colaborador"
                          >
                            ★
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <span>
                    {modoEdicion ? (
                      <GrupoFamiliarInput
                        value={g.grupoFamiliar ?? g.apellido ?? ""}
                        onCommit={(v) => asignarGrupoFamiliar(g.id, v)}
                      />
                    ) : (
                      g.grupoFamiliar || g.apellido || "—"
                    )}
                  </span>
                  <span>
                    {modoEdicion ? (
                      <GrupoFamiliarInput
                        value={g.zona ?? ""}
                        onCommit={(v) => asignarZona(g.id, v)}
                      />
                    ) : (
                      g.zona || "—"
                    )}
                  </span>
                  <span className="text-xs flex items-center gap-1">
                    <select
                      value={g.colaboradorId || ""}
                      onChange={(e) => asignarColaborador(g.id, e.target.value)}
                      style={{ ...inputStyle, padding: "3px 5px", fontSize: 12, width: "100%" }}
                    >
                      <option value="">Sin asignar</option>
                      {colaboradores.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    {g.colaboradorId &&
                      !colaboradores.find((c) => c.id === g.colaboradorId)?.email && (
                        <span
                          title="Este colaborador no tiene email guardado — no recibirá el aviso de esta asignación"
                          style={{ color: C.wax, flexShrink: 0 }}
                        >
                          ⚠
                        </span>
                      )}
                  </span>
                  <span className="text-xs">
                    <select
                      value={g.mesa || ""}
                      onChange={(e) => asignarMesa(g.id, e.target.value)}
                      style={{ ...inputStyle, padding: "3px 5px", fontSize: 12, width: "100%" }}
                    >
                      <option value="">Sin mesa</option>
                      {mesas.map((m) => {
                        const ocupados = ocupacionMesa(m.numero);
                        const llena = ocupados >= m.capacidad && g.mesa !== m.numero;
                        return (
                          <option key={m.numero} value={m.numero} disabled={llena}>
                            Mesa {m.numero} ({ocupados}/{m.capacidad}){llena ? " — llena" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </span>
                  <span>
                    <button
                      onClick={() => toggleConfirmar(g.id)}
                      className="flex items-center gap-1"
                    >
                      {g.confirmado ? (
                        <Stamp color={C.ink}>Confirmado</Stamp>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ border: `1px dashed ${C.line}`, color: C.charcoal, opacity: 0.6 }}
                        >
                          Tentativa
                        </span>
                      )}
                    </button>
                  </span>
                  <span>
                    {g.confirmado ? (
                      datosCompletos(g) ? (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.ink }}>
                          <Check size={13} /> completos
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.wax }}>
                          <Bell size={13} /> por recopilar
                        </span>
                      )
                    ) : (
                      <span className="text-xs" style={{ opacity: 0.5 }}>
                        —
                      </span>
                    )}
                  </span>
                  <span>
                    {g.confirmado ? (
                      g.pagado ? (
                        <Stamp color={C.ink}>Pagado</Stamp>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ border: `1px dashed ${C.line}`, color: C.charcoal, opacity: 0.6 }}
                          title="Se confirma desde la vista del colaborador"
                        >
                          Pendiente
                        </span>
                      )
                    ) : (
                      <span className="text-xs" style={{ opacity: 0.5 }}>
                        —
                      </span>
                    )}
                  </span>
                  <button onClick={() => eliminarInvitado(g.id)}>
                    <Trash2 size={14} style={{ color: C.wax }} />
                  </button>
                </div>
              );
            })}
            {invitados.length === 0 && (
              <p className="text-sm italic p-3" style={{ color: C.charcoal, opacity: 0.6 }}>
                Aún no hay invitados en la lista.
              </p>
            )}
            {invitados.length > 0 && invitadosOrdenados.length === 0 && (
              <p className="text-sm italic p-3" style={{ color: C.charcoal, opacity: 0.6 }}>
                Ningún invitado coincide con los filtros aplicados.
              </p>
            )}
          </div>
        </div>
      </>
      )}
      </section>

      {/* Invitaciones */}
      {abierto.invitaciones && (
        <VentanaFlotante
          clave="invitaciones"
          titulo={`Invitaciones${
            familiasListasParaInvitacion.length > 0 ? ` (${familiasListasParaInvitacion.length})` : ""
          }`}
          onCerrar={() => toggle("invitaciones")}
        >
            <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
              Solo aparecen aquí las familias en las que <strong>todos</strong> sus confirmados
              ya han pagado. Genera la imagen (con el apellido familiar y los nombres de los
              integrantes) y descárgala para enviarla tú mismo por WhatsApp o email — un
              artefacto de Claude no puede enviar correos automáticamente.
            </p>
            <div className="mb-4 p-3 rounded" style={{ background: C.paperDark, border: `1px dashed ${C.line}` }}>
              <Field label="Imagen de la plantilla de invitación (vertical, para móvil)">
                <div className="flex items-center gap-3 flex-wrap">
                  {evento.imagenInvitacion && (
                    <img
                      src={evento.imagenInvitacion}
                      alt="Plantilla de invitación"
                      className="rounded object-cover"
                      style={{ width: 40, height: 60, border: `1px solid ${C.line}` }}
                    />
                  )}
                  <label
                    className="text-xs px-2 py-1 rounded cursor-pointer"
                    style={{ border: `1px solid ${C.gold}`, color: C.gold }}
                  >
                    {subiendoPlantillaInvitacion ? "Procesando…" : "Subir archivo desde el dispositivo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onSeleccionarArchivoPlantillaInvitacion}
                      disabled={subiendoPlantillaInvitacion}
                      style={{ display: "none" }}
                    />
                  </label>
                  {evento.imagenInvitacion && (
                    <button
                      type="button"
                      onClick={() => persistEvento({ ...evento, imagenInvitacion: "" })}
                      className="text-xs"
                      style={{ color: C.wax }}
                    >
                      Quitar y usar la plantilla incluida
                    </button>
                  )}
                </div>
              </Field>
              {errorPlantillaInvitacion && (
                <p className="text-xs mt-1" style={{ color: C.wax }}>
                  {errorPlantillaInvitacion}
                </p>
              )}
            </div>

            <label
              className="mb-4 flex items-center gap-2 text-xs p-2 rounded cursor-pointer"
              style={{ background: modoCalibracion ? "#FDECF3" : C.paperDark, border: `1px dashed ${C.line}` }}
            >
              <input
                type="checkbox"
                checked={modoCalibracion}
                onChange={(e) => setModoCalibracion(e.target.checked)}
              />
              <span>
                Modo calibración: dibuja una cuadrícula con las coordenadas (cada 5% del ancho/alto) sobre
                la imagen — actívalo, descarga o previsualiza una invitación, y pásame esos números para ajustar
                mejor la posición del texto. Desactívalo cuando termines.
              </span>
            </label>

            {window.showDirectoryPicker && (
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    const carpeta = await obtenerCarpetaInvitaciones({ forzarElegir: true });
                    setNombreCarpetaInvitaciones(carpeta ? carpeta.name : null);
                  }}
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={{ border: `1px solid ${C.gold}`, color: C.gold }}
                >
                  {nombreCarpetaInvitaciones ? "Cambiar carpeta" : "Elegir carpeta de guardado"}
                </button>
                <span className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
                  {nombreCarpetaInvitaciones
                    ? `Guardando en: "${nombreCarpetaInvitaciones}"`
                    : "Sin elegir — se descargará a la carpeta de Descargas de siempre."}
                </span>
              </div>
            )}

            <div className="mb-4 p-3 rounded flex flex-wrap items-end gap-2" style={{ background: C.paperDark, border: `1px dashed ${C.line}` }}>
              <Field label="Envío por bloques: elige un colaborador">
                <select
                  value={colaboradorInvitacionSel}
                  onChange={(e) => setColaboradorInvitacionSel(e.target.value)}
                  style={{ ...inputStyle, minWidth: 220 }}
                >
                  <option value="">Ver todas las familias (sin agrupar)</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              {colaboradorInvitacionSel && (
                <button
                  onClick={() => setMostrarResumenLoteInvitaciones(true)}
                  disabled={familiasPendientesDeEnviar.length === 0}
                  className="px-3 py-2 rounded text-sm font-medium"
                  style={{
                    background: familiasPendientesDeEnviar.length === 0 ? C.line : C.wax,
                    color: familiasPendientesDeEnviar.length === 0 ? C.charcoal : "#fff",
                  }}
                >
                  Revisar y enviar a {familiasPendientesDeEnviar.length} familia
                  {familiasPendientesDeEnviar.length === 1 ? "" : "s"} (sin enviar todavía)
                </button>
              )}
            </div>

            <div className="space-y-2">
              {familiasParaMostrarInvitacion.map((familia) => (
                <div
                  key={familia.clave}
                  className="p-3 rounded text-sm"
                  style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-2">
                      <span style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                        Familia {familia.apellido}
                      </span>
                      {familia.invitacionEnviada && (
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                          style={{ background: C.ink, color: C.paper }}
                          title={
                            familia.invitacionEnviadaEn
                              ? new Date(familia.invitacionEnviadaEn).toLocaleString("es-ES")
                              : ""
                          }
                        >
                          <Check size={11} /> Invitación enviada
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => descargarInvitacion(familia)}
                        disabled={descargando === familia.clave}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
                        style={{ background: C.ink, color: C.paper, opacity: descargando === familia.clave ? 0.6 : 1 }}
                      >
                        <ImageIcon size={13} />
                        {descargando === familia.clave ? "Generando..." : "Descargar"}
                      </button>
                      <button
                        onClick={() => abrirPreviewInvitacion(familia)}
                        disabled={descargando === familia.clave}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
                        style={{ background: C.gold, color: "#fff", opacity: descargando === familia.clave ? 0.6 : 1 }}
                      >
                        <Mail size={13} />
                        {descargando === familia.clave ? "Generando..." : "Enviar por email"}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: 0.7 }}>
                    Orden de los nombres en la invitación (usa las flechas para cambiarlo, p.ej.
                    para poner al esposo primero — a esa persona se le enviará el email) y su
                    email de contacto:
                  </p>
                  <div className="space-y-1">
                    {familia.confirmados.map((m, i) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 px-2 py-1 rounded text-xs"
                        style={{ background: "#fff", border: `1px solid ${C.line}` }}
                      >
                        <span style={{ color: C.ink, minWidth: 90 }}>{m.nombre}</span>
                        <button
                          onClick={() => moverNombreFamilia(familia, m.id, -1)}
                          disabled={i === 0}
                          style={{ color: i === 0 ? C.line : C.gold }}
                          title="Mover antes"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moverNombreFamilia(familia, m.id, 1)}
                          disabled={i === familia.confirmados.length - 1}
                          style={{ color: i === familia.confirmados.length - 1 ? C.line : C.gold }}
                          title="Mover después"
                        >
                          ▼
                        </button>
                        <div className="flex-1">
                          <GrupoFamiliarInput
                            value={m.email || ""}
                            onCommit={(v) => asignarEmailInvitado(m.id, v)}
                          />
                        </div>
                        {i === 0 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
                            style={{ background: C.paperDark, color: C.charcoal }}
                          >
                            destinatario
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {familiasParaMostrarInvitacion.length === 0 && (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  {colaboradorInvitacionSel
                    ? "Este colaborador no tiene ninguna familia con el pago y la mesa completos todavía."
                    : "Todavía ninguna familia tiene el pago completo y la mesa asignada para todos sus confirmados."}
                </p>
              )}
            </div>
        </VentanaFlotante>
      )}

      {/* Estado de cuentas */}
      {abierto.cuentas && (
        <VentanaFlotante clave="cuentas" titulo="Estado de cuentas" onCerrar={() => toggle("cuentas")}>
          {(() => {
            const confirmados = invitados.filter((g) => g.confirmado);
            const recaudado = confirmados
              .filter((g) => g.pagado)
              .reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
            const pendienteCobro = confirmados
              .filter((g) => !g.pagado)
              .reduce((s, g) => s + importeEsperadoInvitado(g, evento), 0);
            const totalGastos = gastos.reduce((s, g) => s + parsePrecio(g.importe), 0);
            const gastosPagados = gastos
              .filter((g) => g.pagado)
              .reduce((s, g) => s + parsePrecio(g.importe), 0);
            const balance = recaudado - gastosPagados;
            const formato = (n) =>
              n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            return (
              <>
                <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
                  "Lo que entra" se calcula solo (pagos de invitados confirmados). "Lo que sale"
                  son los gastos que añadas abajo — incluye también los costes de la propia app
                  (dominio, suscripciones...), no solo proveedores de la boda.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.ink }}>
                      {formato(recaudado)} €
                    </div>
                    <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
                      Recaudado
                    </div>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.charcoal }}>
                      {formato(pendienteCobro)} €
                    </div>
                    <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
                      Pendiente de cobro
                    </div>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.wax }}>
                      {formato(totalGastos)} €
                    </div>
                    <div className="text-xs uppercase" style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
                      Total gastos
                    </div>
                  </div>
                  <div
                    className="p-2 rounded text-center"
                    style={{ background: balance >= 0 ? "#E3E9AE" : "#F0D3C8", border: `1px solid ${C.line}` }}
                  >
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: C.ink }}>
                      {formato(balance)} €
                    </div>
                    <div className="text-xs uppercase" style={{ color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}>
                      Balance (recaudado − gastos pagados)
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setMostrarListaGastos((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: C.ink }}
                >
                  {mostrarListaGastos ? "▾" : "▸"} Gastos ({gastos.length})
                </button>
                {mostrarListaGastos && (
                <>
                <div className="flex items-center justify-end mb-2">
                  <button
                    onClick={agregarGasto}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                    style={{ background: C.ink, color: C.paper }}
                  >
                    <Plus size={14} /> Añadir gasto
                  </button>
                </div>
                <div className="space-y-2">
                  {gastos.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-wrap items-center gap-2 p-2 rounded"
                      style={{ background: "#fff", border: `1px solid ${C.line}` }}
                    >
                      <TextInput
                        value={g.concepto}
                        onChange={(e) => cambiarGasto(g.id, "concepto", e.target.value)}
                        placeholder="Concepto (ej. Suscripción Claude Code)"
                        className="flex-1"
                        style={{ minWidth: 160 }}
                      />
                      <TextInput
                        value={g.categoria}
                        onChange={(e) => cambiarGasto(g.id, "categoria", e.target.value)}
                        placeholder="Categoría"
                        style={{ width: 120 }}
                      />
                      <TextInput
                        value={g.importe}
                        onChange={(e) => cambiarGasto(g.id, "importe", e.target.value)}
                        placeholder="Importe"
                        style={{ width: 90, textAlign: "right" }}
                      />
                      <label className="flex items-center gap-1 text-xs" style={{ color: C.charcoal }}>
                        <input
                          type="checkbox"
                          checked={g.pagado}
                          onChange={(e) => cambiarGasto(g.id, "pagado", e.target.checked)}
                        />
                        Pagado
                      </label>
                      <button onClick={() => eliminarGasto(g.id)} title="Quitar este gasto">
                        <X size={15} style={{ color: C.wax }} />
                      </button>
                    </div>
                  ))}
                  {gastos.length === 0 && (
                    <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                      Todavía no hay gastos registrados.
                    </p>
                  )}
                </div>
                </>
                )}
              </>
            );
          })()}
        </VentanaFlotante>
      )}

      {/* Copia de seguridad */}
      {abierto.copiaSeguridad && (
        <VentanaFlotante
          clave="copiaSeguridad"
          titulo="Copia de seguridad"
          onCerrar={() => toggle("copiaSeguridad")}
        >
            <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
              Antes de pedir más cambios y volver a publicar el artefacto, exporta todo (evento,
              colaboradores, mesas e invitados) y guárdalo en una nota. Tras publicar la nueva
              versión, pega ese mismo texto aquí para recuperarlo todo de una vez.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setMostrarExportar((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ border: `1px solid ${C.gold}`, color: C.gold }}
              >
                <Copy size={14} /> Exportar todo
              </button>
              <button
                onClick={() => setMostrarRestaurar((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ border: `1px solid ${C.ink}`, color: C.ink }}
              >
                <Repeat size={14} /> Restaurar todo
              </button>
            </div>

            {mostrarExportar && (
              <div className="mb-3">
                <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: 0.75 }}>
                  Toca dentro del cuadro, Cmd/Ctrl+A y Cmd/Ctrl+C para copiarlo todo.
                </p>
                <textarea
                  readOnly
                  value={exportarTodo()}
                  onFocus={(e) => e.target.select()}
                  rows={8}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </div>
            )}

            {mostrarRestaurar && (
              <div>
                <p className="text-xs mb-1" style={{ color: C.charcoal, opacity: 0.75 }}>
                  Pega aquí el texto que generó "Exportar todo" en una versión anterior.
                </p>
                <textarea
                  value={textoRestaurar}
                  onChange={(e) => setTextoRestaurar(e.target.value)}
                  rows={8}
                  className="w-full mb-2"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
                <button
                  onClick={restaurarTodo}
                  className="px-3 py-1.5 rounded text-sm font-medium"
                  style={{ background: C.ink, color: C.paper }}
                >
                  Restaurar
                </button>
              </div>
            )}
        </VentanaFlotante>
      )}

      {/* Configuración: solo el lanzador — cada parte se abre como ventana propia */}
      {abierto.configuracion && (
        <VentanaFlotante
          clave="configuracion"
          titulo="Configuración"
          onCerrar={() => toggle("configuracion")}
          extra={
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) toggle(e.target.value);
              }}
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                background: C.ink,
                color: C.paper,
                border: `1px solid ${C.ink}`,
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
              }}
              title="Abre esa parte de Configuración en su propia ventana"
            >
              <option value="">SECCIÓN</option>
              {SECCIONES_CONFIGURACION.map((s) => (
                <option key={s.id} value={s.id}>
                  {abierto[s.id] ? "✓ " : ""}
                  {s.etiqueta}
                </option>
              ))}
            </select>
          }
        >
        </VentanaFlotante>
      )}

      {abierto["config-datos-evento"] && (
        <VentanaFlotante
          clave="config-datos-evento"
          titulo="Datos del evento"
          onCerrar={() => toggle("config-datos-evento")}
        >
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                Datos del evento (esto es lo que se ve en la portada).
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4" style={{ maxWidth: 500 }}>
                <div style={{ gridColumn: "span 2 / span 2" }}>
                  <Field label="Nombre del evento">
                    <TextInput
                      value={evento.nombre}
                      onChange={(e) => persistEvento({ ...evento, nombre: e.target.value })}
                      placeholder="Boda de..."
                      className="w-full"
                    />
                  </Field>
                </div>
                <Field label="Fecha">
                  <TextInput
                    type="date"
                    value={evento.fecha}
                    onChange={(e) => persistEvento({ ...evento, fecha: e.target.value })}
                  />
                </Field>
                <Field label="Hora">
                  <TextInput
                    type="time"
                    value={evento.hora}
                    onChange={(e) => persistEvento({ ...evento, hora: e.target.value })}
                  />
                </Field>
                <Field label="Lugar">
                  <TextInput
                    value={evento.lugar}
                    onChange={(e) => persistEvento({ ...evento, lugar: e.target.value })}
                    placeholder="Finca El Rincón"
                  />
                </Field>
                <Field label="Dirección">
                  <TextInput
                    value={evento.direccion}
                    onChange={(e) => persistEvento({ ...evento, direccion: e.target.value })}
                    placeholder="Calle, número, municipio"
                  />
                </Field>
                <div style={{ gridColumn: "span 2 / span 2" }}>
                  <Field label="Imagen de portada">
                    <div className="flex items-center gap-2 flex-wrap">
                      {evento.imagen && (
                        <img
                          src={evento.imagen}
                          alt="Portada"
                          className="rounded object-cover"
                          style={{ width: 60, height: 40, border: `1px solid ${C.line}` }}
                        />
                      )}
                      <label
                        className="text-xs px-2 py-1 rounded cursor-pointer"
                        style={{ border: `1px solid ${C.gold}`, color: C.gold }}
                      >
                        {subiendoImagenPortada ? "Procesando…" : "Subir imagen desde el dispositivo"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onSeleccionarArchivoImagenPortada}
                          disabled={subiendoImagenPortada}
                          style={{ display: "none" }}
                        />
                      </label>
                      {evento.imagen !== "/cabecera-defecto.jpg" && (
                        <button
                          type="button"
                          onClick={() => persistEvento({ ...evento, imagen: "/cabecera-defecto.jpg" })}
                          className="text-xs"
                          style={{ color: C.wax }}
                        >
                          Quitar y usar la imagen incluida
                        </button>
                      )}
                    </div>
                    {errorImagenPortada && (
                      <p className="text-xs mt-1" style={{ color: C.wax }}>
                        {errorImagenPortada}
                      </p>
                    )}
                  </Field>
                  <label className="flex items-center gap-2 mt-2 text-xs" style={{ color: C.charcoal }}>
                    <input
                      type="checkbox"
                      checked={evento.ocultarTituloEnImagen}
                      onChange={(e) => persistEvento({ ...evento, ocultarTituloEnImagen: e.target.checked })}
                    />
                    La imagen ya incluye el título (ocultar el texto superpuesto)
                  </label>
                </div>
              </div>
        </VentanaFlotante>
      )}

      {abierto["config-precios"] && (
        <VentanaFlotante
          clave="config-precios"
          titulo="Precios"
          onCerrar={() => toggle("config-precios")}
        >
              <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
                Precios de referencia para calcular el cobro de cada familia (número de adultos
                y niños según los datos que recopile cada colaborador).
              </p>
              <div className="grid grid-cols-2 gap-4" style={{ maxWidth: 400 }}>
                <Field label="Precio adulto">
                  <TextInput
                    value={evento.precioAdulto}
                    onChange={(e) => persistEvento({ ...evento, precioAdulto: e.target.value })}
                    placeholder="€ 45"
                  />
                </Field>
                <Field label="Precio niño">
                  <TextInput
                    value={evento.precioNino}
                    onChange={(e) => persistEvento({ ...evento, precioNino: e.target.value })}
                    placeholder="€ 20"
                  />
                </Field>
                <Field label="Edad niño desde">
                  <TextInput
                    value={evento.edadNinoDesde}
                    onChange={(e) => persistEvento({ ...evento, edadNinoDesde: e.target.value })}
                    placeholder="2"
                  />
                  <span className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Menores de esta edad no pagan entrada
                  </span>
                </Field>
                <Field label="Edad niño hasta">
                  <TextInput
                    value={evento.edadNinoHasta}
                    onChange={(e) => persistEvento({ ...evento, edadNinoHasta: e.target.value })}
                    placeholder="12"
                  />
                  <span className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Desde esta edad (incluida) pagan precio adulto
                  </span>
                </Field>
              </div>
        </VentanaFlotante>
      )}

      {abierto["config-url-web"] && (
        <VentanaFlotante
          clave="config-url-web"
          titulo="URL web"
          onCerrar={() => toggle("config-url-web")}
        >
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                <strong>Importante:</strong> pega aquí la URL de tu web ya publicada (la del
                dominio que te dé Vercel, o el tuyo propio si le pones uno). Sin este dato, los
                enlaces que copies para cada colaborador no apuntarán al sitio correcto.
              </p>
              <Field label="URL de la web">
                <TextInput
                  value={evento.urlPublica}
                  onChange={(e) => persistEvento({ ...evento, urlPublica: e.target.value })}
                  placeholder="https://tu-boda.vercel.app"
                  className="w-full"
                />
              </Field>
        </VentanaFlotante>
      )}

      {abierto["config-email-anfitrion"] && (
        <VentanaFlotante
          clave="config-email-anfitrion"
          titulo="Email anfitrión"
          onCerrar={() => toggle("config-email-anfitrion")}
        >
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                Tu email, para recibir avisos automáticos cuando un colaborador complete todos
                los datos o todos los pagos de sus invitados asignados.
              </p>
              <Field label="Tu email (anfitrión)">
                <TextInput
                  value={evento.emailAnfitrion || ""}
                  onChange={(e) => persistEvento({ ...evento, emailAnfitrion: e.target.value })}
                  placeholder="tu@email.com"
                  className="w-full"
                />
              </Field>
        </VentanaFlotante>
      )}

      {abierto["config-plantillas-email"] && (
        <VentanaFlotante
          clave="config-plantillas-email"
          titulo="Texto emails"
          onCerrar={() => toggle("config-plantillas-email")}
        >
              <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.75 }}>
                Texto de los avisos automáticos por email. Usa <code>{"{colaborador}"}</code>{" "}
                donde quieras que aparezca ese nombre — se rellena solo al enviar. Admite HTML
                sencillo (<code>&lt;b&gt;</code>, <code>&lt;br&gt;</code>).
              </p>
              <Field label="Aviso al colaborador: tiene invitados nuevos o cambiados asignados">
                <textarea
                  value={evento.plantillaAsignacion || ""}
                  onChange={(e) =>
                    persistEvento({ ...evento, plantillaAsignacion: e.target.value })
                  }
                  rows={3}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </Field>
              <div className="h-2" />
              <Field label="Aviso al anfitrión: un colaborador completó todos los datos">
                <textarea
                  value={evento.plantillaDatosCompletados || ""}
                  onChange={(e) =>
                    persistEvento({ ...evento, plantillaDatosCompletados: e.target.value })
                  }
                  rows={3}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </Field>
              <div className="h-2" />
              <Field label="Aviso al anfitrión: un colaborador completó todos sus pagos">
                <textarea
                  value={evento.plantillaPagoRegistrado || ""}
                  onChange={(e) =>
                    persistEvento({ ...evento, plantillaPagoRegistrado: e.target.value })
                  }
                  rows={3}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </Field>
              <div className="h-2" />
              <Field label="Email a la familia: envío de la invitación">
                <textarea
                  value={evento.plantillaInvitacionFamilia || ""}
                  onChange={(e) =>
                    persistEvento({ ...evento, plantillaInvitacionFamilia: e.target.value })
                  }
                  rows={3}
                  className="w-full"
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
                />
              </Field>
        </VentanaFlotante>
      )}

      {abierto["config-zona-reinicio"] && (
        <VentanaFlotante
          clave="config-zona-reinicio"
          titulo="Reinicios"
          onCerrar={() => toggle("config-zona-reinicio")}
        >
              <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
                Zona de reinicio: pone a cero campos concretos de los invitados de un colaborador
                (útil tras pruebas, o para reutilizar la app en otro evento). Los invitados y los
                colaboradores <strong>nunca</strong> se borran aquí — solo los campos que elijas.
                Se descarga automáticamente una copia de seguridad de todo el evento antes de
                ejecutar nada, y hay que escribir "REINICIAR" para confirmar.
              </p>
              <div className="flex flex-wrap items-end gap-2 mb-2">
                <Field label="Colaborador">
                  <select
                    value={rColaborador}
                    onChange={(e) => {
                      setRColaborador(e.target.value);
                      setRAlcance("todos");
                      setRFamiliaClave("");
                      setRInvitadoId("");
                    }}
                    style={{ ...inputStyle, minWidth: 200 }}
                  >
                    <option value="">Todos los colaboradores</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Alcance">
                  <select
                    value={rAlcance}
                    onChange={(e) => {
                      setRAlcance(e.target.value);
                      setRFamiliaClave("");
                      setRInvitadoId("");
                    }}
                    style={{ ...inputStyle, minWidth: 180 }}
                  >
                    <option value="todos">Todos sus invitados</option>
                    <option value="familia">Una familia en concreto</option>
                    <option value="invitado">Un invitado en concreto</option>
                  </select>
                </Field>
                {rAlcance === "familia" && (
                  <Field label="Familia">
                    <select
                      value={rFamiliaClave}
                      onChange={(e) => setRFamiliaClave(e.target.value)}
                      style={{ ...inputStyle, minWidth: 200 }}
                    >
                      <option value="">Elige una familia…</option>
                      {familiasParaReset.map((f) => (
                        <option key={f.clave} value={f.clave}>
                          {f.etiqueta}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {rAlcance === "invitado" && (
                  <Field label="Invitado">
                    <select
                      value={rInvitadoId}
                      onChange={(e) => setRInvitadoId(e.target.value)}
                      style={{ ...inputStyle, minWidth: 220 }}
                    >
                      <option value="">Elige un invitado…</option>
                      {ordenarPorApellidoNombre(
                        invitadosParaReset.filter((g) => g.confirmado)
                      ).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.apellido}, {g.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {Object.entries(CATEGORIAS_RESET)
                  .filter(([, cfg]) => !cfg.familiar || rAlcance !== "invitado")
                  .map(([clave, cfg]) => (
                    <button
                      key={clave}
                      onClick={() => {
                        setRCategoria(clave);
                        setRMostrarConfirmar(true);
                        setRPalabra("");
                      }}
                      disabled={invitadoIdsParaReset.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                      style={{
                        border: `1px solid ${C.wax}`,
                        color: invitadoIdsParaReset.length === 0 ? C.line : C.wax,
                      }}
                    >
                      <Repeat size={14} /> {cfg.titulo}
                    </button>
                  ))}
              </div>
              <p className="text-xs" style={{ color: C.charcoal, opacity: 0.6 }}>
                {rAlcance === "invitado"
                  ? rInvitadoId
                    ? "Afecta a 1 invitado."
                    : "Elige un invitado arriba."
                  : rAlcance === "familia"
                  ? rFamiliaClave
                    ? `Afecta a ${invitadoIdsParaReset.length} invitado(s) de esa familia.`
                    : "Elige una familia arriba."
                  : `Afecta a ${invitadoIdsParaReset.length} invitado(s).`}
              </p>
              <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${C.line}` }}>
                <button
                  onClick={() => setReinicioAvisosPendiente(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                  style={{ border: `1px solid ${C.wax}`, color: C.wax }}
                >
                  <Repeat size={14} /> Reiniciar avisos (historial de emails)
                </button>
              </div>
        </VentanaFlotante>
      )}

      {abierto["config-zona-peligro"] && (
        <VentanaFlotante
          clave="config-zona-peligro"
          titulo="Borrado total"
          onCerrar={() => toggle("config-zona-peligro")}
        >
              <p className="text-xs mb-2" style={{ color: C.wax, fontWeight: 700 }}>
                ⚠ Zona de peligro: esto borra evento, colaboradores, invitados, mesas y fotos —
                todo el contenido de la aplicación. No se puede deshacer.
              </p>
              <button
                onClick={borrarTodoElContenido}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ background: C.wax, color: "#fff" }}
              >
                <Trash2 size={14} /> BORRAR TODO
              </button>
        </VentanaFlotante>
      )}

        {rMostrarConfirmar && rCategoria && (
          <ModalFlotante
            titulo={CATEGORIAS_RESET[rCategoria].titulo}
            onCerrar={() => {
              setRMostrarConfirmar(false);
              setRPalabra("");
            }}
          >
            <p className="text-sm mb-3" style={{ color: C.charcoal }}>
              {CATEGORIAS_RESET[rCategoria].descripcion} Afecta a {invitadoIdsParaReset.length}{" "}
              invitado(s)
              {rColaborador
                ? ` de ${colaboradores.find((c) => c.id === rColaborador)?.nombre || "ese colaborador"}`
                : " (todos los colaboradores)"}
              {rAlcance === "familia" && rFamiliaClave ? `, familia "${rFamiliaClave}"` : ""}
              {rAlcance === "invitado" && rInvitadoId
                ? `, solo ${invitados.find((g) => g.id === rInvitadoId)?.nombre || "ese invitado"}`
                : ""}
              .
            </p>
            <p className="text-xs mb-3" style={{ color: C.wax }}>
              Se descargará antes una copia de seguridad completa del evento. Esta acción no se
              puede deshacer desde la app.
            </p>
            <Field label='Escribe "REINICIAR" para confirmar'>
              <TextInput
                value={rPalabra}
                onChange={(e) => setRPalabra(e.target.value)}
                placeholder="REINICIAR"
                className="w-full"
              />
            </Field>
            <div className="flex gap-2 mt-3">
              <button
                onClick={confirmarResetPorInvitados}
                disabled={rEjecutando || rPalabra.trim().toUpperCase() !== "REINICIAR"}
                className="px-3 py-2 rounded text-sm font-medium"
                style={{
                  background: rPalabra.trim().toUpperCase() === "REINICIAR" ? C.wax : C.line,
                  color: "#fff",
                }}
              >
                {rEjecutando ? "Reiniciando…" : "Confirmar reinicio"}
              </button>
              <button
                onClick={() => {
                  setRMostrarConfirmar(false);
                  setRPalabra("");
                }}
                disabled={rEjecutando}
                className="px-3 py-2 rounded text-sm"
                style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
              >
                Cancelar
              </button>
            </div>
          </ModalFlotante>
        )}

        {reinicioAvisosPendiente && (
          <ModalFlotante
            titulo="Reiniciar avisos"
            onCerrar={() => {
              setReinicioAvisosPendiente(false);
              setPalabraAvisos("");
            }}
          >
            <p className="text-sm mb-3" style={{ color: C.charcoal }}>
              Vacía el historial de emails enviados (el panel de "Avisos"). No reenvía ni deshace
              ningún email ya enviado de verdad.
            </p>
            <p className="text-xs mb-3" style={{ color: C.wax }}>
              Se descargará antes una copia de seguridad completa del evento. Esta acción no se
              puede deshacer desde la app.
            </p>
            <Field label='Escribe "AVISOS" para confirmar'>
              <TextInput
                value={palabraAvisos}
                onChange={(e) => setPalabraAvisos(e.target.value)}
                placeholder="AVISOS"
                className="w-full"
              />
            </Field>
            <div className="flex gap-2 mt-3">
              <button
                onClick={confirmarReinicioAvisos}
                disabled={reiniciandoAvisos || palabraAvisos.trim().toUpperCase() !== "AVISOS"}
                className="px-3 py-2 rounded text-sm font-medium"
                style={{
                  background: palabraAvisos.trim().toUpperCase() === "AVISOS" ? C.wax : C.line,
                  color: "#fff",
                }}
              >
                {reiniciandoAvisos ? "Reiniciando…" : "Confirmar reinicio"}
              </button>
              <button
                onClick={() => {
                  setReinicioAvisosPendiente(false);
                  setPalabraAvisos("");
                }}
                disabled={reiniciandoAvisos}
                className="px-3 py-2 rounded text-sm"
                style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
              >
                Cancelar
              </button>
            </div>
          </ModalFlotante>
        )}

      {/* Avisos */}
      {abierto.avisos && (
        <VentanaFlotante
          clave="avisos"
          titulo={`Avisos${colaboradoresPendientes.length > 0 ? ` (${colaboradoresPendientes.length})` : ""}`}
          onCerrar={() => toggle("avisos")}
        >
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    color: datosConfirmadosPendientes > 0 ? C.wax : C.ink,
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {datosConfirmadosPendientes}
                </div>
                <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
                  Datos pendientes (confirmados)
                </div>
              </div>
              <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    color:
                      familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length > 0
                        ? C.wax
                        : C.ink,
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length}
                </div>
                <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>
                  Invitaciones pendientes
                </div>
              </div>
            </div>

            <div className="mb-5">
              <p
                className="text-xs uppercase mb-2"
                style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Pendientes de avisar
              </p>
              {colaboradoresPendientes.length === 0 ? (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  Ninguno — todos los colaboradores están al día.
                </p>
              ) : (
                <div className="space-y-2">
                  {colaboradoresPendientes.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
                      style={{ background: "#FBEAEC" }}
                    >
                      <span className="text-sm" style={{ color: C.ink }}>
                        {c.nombre}
                        {!c.email && (
                          <span className="text-xs" style={{ color: C.wax }}> — sin email</span>
                        )}
                      </span>
                      <button
                        onClick={() => setAvisoPreview({ id: c.id, nombre: c.nombre })}
                        disabled={!c.email}
                        className="text-xs px-2 py-1 rounded font-medium"
                        style={{
                          background: c.email ? C.wax : C.line,
                          color: c.email ? "#fff" : C.charcoal,
                        }}
                      >
                        Avisar ahora
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-5">
              <p
                className="text-xs uppercase mb-2"
                style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Emails enviados
              </p>
              <div className="flex gap-2 mb-2">
                {[
                  { clave: "todos", etiqueta: "Todos" },
                  { clave: "asignados", etiqueta: "Asignados" },
                  { clave: "datos", etiqueta: "Datos" },
                  { clave: "invitacion", etiqueta: "Invitación" },
                ].map((op) => (
                  <button
                    key={op.clave}
                    onClick={() => setFiltroTipoAviso(op.clave)}
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{
                      background: filtroTipoAviso === op.clave ? C.ink : "transparent",
                      color: filtroTipoAviso === op.clave ? C.paper : C.charcoal,
                      border: `1px solid ${filtroTipoAviso === op.clave ? C.ink : C.line}`,
                    }}
                  >
                    {op.etiqueta}
                  </button>
                ))}
              </div>
              {(() => {
                const ETIQUETA_TIPO_AVISO = {
                  asignados: "Asignados",
                  datos: "Datos",
                  invitacion: "Invitación",
                };
                const emailsFiltrados = avisosEnviados.filter(
                  (a) => filtroTipoAviso === "todos" || a.tipo === filtroTipoAviso
                );
                const emailsOrdenados = [...emailsFiltrados].sort((a, b) => {
                  let cmp = 0;
                  if (ordenAvisos.columna === "fecha") {
                    cmp = new Date(a.creadoEn) - new Date(b.creadoEn);
                  } else if (ordenAvisos.columna === "email") {
                    cmp = (a.destinatario || "").localeCompare(b.destinatario || "");
                  } else if (ordenAvisos.columna === "tipo") {
                    cmp = (a.tipo || "").localeCompare(b.tipo || "");
                  }
                  return ordenAvisos.direccion === "asc" ? cmp : -cmp;
                });
                if (emailsOrdenados.length === 0) {
                  return (
                    <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                      {avisosEnviados.length === 0
                        ? "Todavía no se ha enviado ningún aviso."
                        : "Ninguno de este tipo todavía."}
                    </p>
                  );
                }
                const columnas = "110px 28px 80px 1fr 1fr";
                return (
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    <div
                      className="grid text-xs mb-1 pb-1"
                      style={{ gridTemplateColumns: columnas, borderBottom: `1px solid ${C.line}` }}
                    >
                      <EncabezadoOrdenable columna="fecha" orden={ordenAvisos} onClick={cambiarOrdenAvisos}>
                        Fecha
                      </EncabezadoOrdenable>
                      <span title="¿Resend confirmó el envío?" style={{ color: C.gold }}>✓?</span>
                      <EncabezadoOrdenable columna="tipo" orden={ordenAvisos} onClick={cambiarOrdenAvisos}>
                        Tipo
                      </EncabezadoOrdenable>
                      <EncabezadoOrdenable columna="email" orden={ordenAvisos} onClick={cambiarOrdenAvisos}>
                        Email
                      </EncabezadoOrdenable>
                      <span className="text-center" style={{ color: C.gold }}>Asunto</span>
                    </div>
                    <div className="space-y-1">
                      {emailsOrdenados.map((a) => (
                        <div
                          key={a.id}
                          className="grid items-center text-xs py-1"
                          style={{ gridTemplateColumns: columnas, borderBottom: `1px solid ${C.line}` }}
                        >
                          <span style={{ color: C.charcoal, opacity: 0.5 }} className="whitespace-nowrap">
                            {new Date(a.creadoEn).toLocaleString("es-ES")}
                          </span>
                          <span
                            title={
                              a.exito === true
                                ? "Resend lo aceptó"
                                : a.exito === false
                                ? "Resend lo rechazó — revisa la clave o el remitente"
                                : "Todavía sin confirmar (se comprueba solo cada minuto)"
                            }
                            style={{ color: a.exito === true ? C.ink : a.exito === false ? C.wax : C.line }}
                          >
                            {a.exito === true ? "✓" : a.exito === false ? "✗" : "?"}
                          </span>
                          <span style={{ color: C.charcoal, opacity: 0.7 }}>
                            {ETIQUETA_TIPO_AVISO[a.tipo] || a.tipo}
                          </span>
                          <span style={{ color: C.charcoal, opacity: 0.7 }} className="truncate">
                            {a.destinatario}
                          </span>
                          <span style={{ color: C.ink }} className="truncate">
                            {a.asunto}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-5 pt-4" style={{ borderTop: `2px solid ${C.line}` }}>
              <p
                className="text-xs uppercase mb-2"
                style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Invitaciones a familias
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                  <div style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700, fontSize: 18 }}>
                    {familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length}
                  </div>
                  <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Pendientes</div>
                </div>
                <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                  <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 700, fontSize: 18 }}>
                    {familiasListasParaInvitacion.filter((f) => f.invitacionEnviada).length}
                  </div>
                  <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Enviadas</div>
                </div>
                <div className="text-center p-2 rounded" style={{ background: C.paperDark }}>
                  <div style={{ fontFamily: "'Fraunces', serif", color: C.wax, fontWeight: 700, fontSize: 18 }}>
                    {
                      familiasListasParaInvitacion.filter(
                        (f) => !f.invitacionEnviada && !f.confirmados[0]?.email
                      ).length
                    }
                  </div>
                  <div className="text-xs" style={{ color: C.charcoal, opacity: 0.7 }}>Sin email</div>
                </div>
              </div>
              {familiasListasParaInvitacion.filter((f) => !f.invitacionEnviada).length === 0 ? (
                <p className="text-sm italic" style={{ color: C.charcoal, opacity: 0.6 }}>
                  Ninguna familia lista con la invitación pendiente de enviar.
                </p>
              ) : (
                <div className="space-y-2">
                  {familiasListasParaInvitacion
                    .filter((f) => !f.invitacionEnviada)
                    .map((f) => (
                      <div
                        key={f.clave}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
                        style={{ background: "#FBEAEC" }}
                      >
                        <span className="text-sm" style={{ color: C.ink }}>
                          Familia {f.apellido}
                          {!f.confirmados[0]?.email && (
                            <span className="text-xs" style={{ color: C.wax }}> — sin email</span>
                          )}
                        </span>
                        <button
                          onClick={() => abrirPreviewInvitacion(f)}
                          disabled={!f.confirmados[0]?.email || descargando === f.clave}
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{
                            background: f.confirmados[0]?.email ? C.wax : C.line,
                            color: f.confirmados[0]?.email ? "#fff" : C.charcoal,
                          }}
                        >
                          {descargando === f.clave ? "Generando…" : "Enviar ahora"}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
        </VentanaFlotante>
      )}

      {/* Versiones */}
      {abierto.versiones && (
        <VentanaFlotante clave="versiones" titulo="Versiones" onCerrar={() => toggle("versiones")}>
            <div className="space-y-3">
              {HISTORIAL_VERSIONES.map((v) => (
                <div
                  key={v.version}
                  className="flex items-start gap-3 p-3 rounded"
                  style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
                >
                  <Stamp color={v.version === VERSION_APP ? C.ink : C.charcoal}>
                    v{v.version}
                  </Stamp>
                  <div className="space-y-2">
                    {(Array.isArray(v.cambios) ? v.cambios : [v.cambios]).map((parrafo, i) => (
                      <p key={i} className="text-sm" style={{ color: C.charcoal }}>
                        {parrafo}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {RESUMEN_VERSIONES_ANTERIORES.length > 0 && (
              <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                <p className="text-xs mb-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                  Versiones anteriores completas (resumidas):
                </p>
                <div className="space-y-2">
                  {RESUMEN_VERSIONES_ANTERIORES.map((v) => (
                    <div
                      key={v.version}
                      className="flex items-start gap-3 p-2 rounded"
                      style={{ background: C.paperDark, opacity: 0.8 }}
                    >
                      <Stamp color={C.charcoal}>v{v.version}</Stamp>
                      <p className="text-xs" style={{ color: C.charcoal }}>
                        {v.cambios}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </VentanaFlotante>
      )}

      {avisoPreview && (
        <ModalFlotante
          titulo={`Avisar a ${avisoPreview.nombre}`}
          onCerrar={() => setAvisoPreview(null)}
        >
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Colaborador
          </p>
          <p className="text-sm mb-3" style={{ color: C.ink }}>
            {avisoPreview.nombre}
            {" — "}
            {colaboradores.find((c) => c.id === avisoPreview.id)?.email || "sin email"}
          </p>
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Invitados asignados ({invitados.filter((g) => g.colaboradorId === avisoPreview.id).length}
            {" "}en total)
          </p>
          <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
            {invitados
              .filter((g) => g.colaboradorId === avisoPreview.id)
              .map((g) => (
                <li key={g.id}>
                  {g.apellido}, {g.nombre}
                  {g.avisoPendiente && g.confirmado && (
                    <span
                      className="text-xs ml-2 px-1.5 py-0.5 rounded"
                      style={{ background: C.wax, color: "#fff" }}
                    >
                      nuevo — se incluye en el email
                    </span>
                  )}
                  {g.avisoPendiente && !g.confirmado && (
                    <span
                      className="text-xs ml-2 px-1.5 py-0.5 rounded"
                      style={{ background: C.line, color: C.charcoal }}
                    >
                      tentativa — no se avisa todavía
                    </span>
                  )}
                </li>
              ))}
          </ul>
          <p
            className="text-xs uppercase mb-2"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Mensaje que se enviará
          </p>
          <div
            className="p-3 rounded text-sm mb-4"
            style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
            dangerouslySetInnerHTML={{
              __html: (evento.plantillaAsignacion || "").replace(
                "{colaborador}",
                avisoPreview.nombre
              ),
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={confirmarEnvioAvisoPreview}
              disabled={enviandoAvisoPreview}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoAvisoPreview ? "Enviando…" : "Aceptar y enviar"}
            </button>
            <button
              onClick={() => setAvisoPreview(null)}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Cancelar
            </button>
            <button
              onClick={irAEditarAsignacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.gold}`, color: C.gold }}
            >
              Editar asignación
            </button>
          </div>
        </ModalFlotante>
      )}

      {previewInvitacion && (
        <ModalFlotante
          titulo={`Enviar invitación — Familia ${previewInvitacion.familia.apellido}`}
          onCerrar={() => setPreviewInvitacion(null)}
        >
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Destinatario
          </p>
          <p className="text-sm mb-3" style={{ color: C.ink }}>
            {previewInvitacion.destinatario.nombre} — {previewInvitacion.destinatario.email}
          </p>
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Invitación
          </p>
          <img
            src={previewInvitacion.dataUrl}
            alt="Vista previa de la invitación"
            className="rounded mb-3"
            style={{ maxWidth: "100%", border: `1px solid ${C.line}` }}
          />
          <p
            className="text-xs uppercase mb-1"
            style={{ color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Mensaje del email
          </p>
          <div
            className="p-3 rounded text-sm mb-4"
            style={{ background: C.paperDark, border: `1px solid ${C.line}` }}
            dangerouslySetInnerHTML={{ __html: evento.plantillaInvitacionFamilia || "" }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={confirmarEnvioInvitacion}
              disabled={enviandoInvitacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoInvitacion ? "Enviando…" : "Aceptar y enviar"}
            </button>
            <button
              onClick={() => setPreviewInvitacion(null)}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Cancelar
            </button>
          </div>
        </ModalFlotante>
      )}

      {mostrarResumenLoteInvitaciones && (
        <ModalFlotante
          titulo={`Enviar invitaciones — ${
            colaboradores.find((c) => c.id === colaboradorInvitacionSel)?.nombre || ""
          }`}
          onCerrar={() => setMostrarResumenLoteInvitaciones(false)}
        >
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            Revisa antes de enviar — se manda un email por familia, cada una con su propia
            invitación adjunta:
          </p>
          <ul className="text-sm space-y-2 mb-4">
            {familiasPendientesDeEnviar.map((familia) => {
              const destinatario = familia.confirmados[0];
              return (
                <li key={familia.clave} className="pb-2" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ fontFamily: "'Fraunces', serif", color: C.ink, fontWeight: 600 }}>
                    Familia {familia.apellido}
                  </div>
                  <div style={{ color: C.charcoal, opacity: 0.8 }}>
                    {familia.confirmados.map((m) => m.nombre).join(", ")} —{" "}
                    {familia.confirmados.length} confirmado
                    {familia.confirmados.length === 1 ? "" : "s"}, todos con pago hecho
                  </div>
                  {destinatario?.email ? (
                    <div className="text-xs" style={{ color: C.ink }}>
                      Se enviará a: {destinatario.nombre} — {destinatario.email}
                    </div>
                  ) : (
                    <div className="text-xs" style={{ color: C.wax }}>
                      ⚠ Sin email — esta familia se saltará
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={confirmarEnvioLoteInvitaciones}
              disabled={enviandoLoteInvitaciones}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoLoteInvitaciones
                ? "Enviando…"
                : `Confirmar y enviar ${familiasPendientesDeEnviar.length} invitaciones`}
            </button>
            <button
              onClick={() => setMostrarResumenLoteInvitaciones(false)}
              disabled={enviandoLoteInvitaciones}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Cancelar
            </button>
          </div>
        </ModalFlotante>
      )}

      {mostrarResumenAsignacion && (
        <ModalFlotante
          titulo="Resumen de asignaciones"
          onCerrar={() => setMostrarResumenAsignacion(false)}
        >
          <p className="text-sm mb-3" style={{ color: C.charcoal }}>
            Estos colaboradores tienen invitados nuevos asignados. ¿Quieres avisarles ya?
          </p>
          <ul className="text-sm space-y-1 mb-4" style={{ color: C.ink }}>
            {colaboradoresPendientes.map((c) => (
              <li key={c.id}>
                {c.nombre}
                {!c.email && (
                  <span style={{ color: C.wax }}> — sin email, no se le podrá avisar</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={enviarAvisosAsignacion}
              disabled={enviandoAvisosAsignacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ background: C.ink, color: C.paper }}
            >
              {enviandoAvisosAsignacion ? "Enviando…" : "Enviar avisos"}
            </button>
            <button
              onClick={() => setMostrarResumenAsignacion(false)}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.line}`, color: C.charcoal }}
            >
              Seguir editando
            </button>
            <button
              onClick={cancelarAvisosAsignacion}
              className="px-3 py-2 rounded text-sm font-medium"
              style={{ border: `1px solid ${C.wax}`, color: C.wax }}
            >
              Cancelar (no avisar)
            </button>
          </div>
        </ModalFlotante>
      )}

      {panelFlotante && panelFlotante !== "avisosMesas" && (
        <ModalFlotante
          titulo={
            panelFlotante === "tabla"
              ? "Lista de invitados"
              : panelFlotante === "canciones"
              ? `Canciones para bailar — ${evento.nombre || "Evento"}`
              : `⚠ Alergias — ${evento.nombre || "Evento"}`
          }
          colorTitulo={panelFlotante === "alergias" ? C.wax : C.ink}
          onCerrar={() => setPanelFlotante(null)}
          acciones={
            <>
              <button
                onClick={imprimirPanelActivo}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ background: C.ink, color: C.paper }}
              >
                <Printer size={14} /> Imprimir
              </button>
              <button
                onClick={exportarPanelActivoCSV}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{ border: `1px solid ${C.gold}`, color: C.gold }}
              >
                <Copy size={14} /> Exportar CSV
              </button>
              <span className="text-xs ml-auto" style={{ color: C.charcoal, opacity: 0.6 }}>
                Si no se abre el diálogo de impresión, usa Cmd/Ctrl+P.
              </span>
            </>
          }
        >
          <div id="zona-imprimible">
            {panelFlotante === "tabla" && (
              <>
                <div
                  className="text-xs mb-2"
                  style={{ color: C.charcoal, fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Edad media de los asistentes:{" "}
                  <strong style={{ color: C.ink }}>
                    {edadPromedio(invitadosOrdenados, evento) ?? "— (faltan años de nacimiento)"}
                    {edadPromedio(invitadosOrdenados, evento) !== null && " años"}
                  </strong>
                </div>
                <div
                  className="grid text-xs uppercase px-2 py-2"
                  style={{
                    gridTemplateColumns: "1.3fr 1fr 0.8fr 1fr 0.7fr 0.9fr 0.9fr",
                    color: C.gold,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Grupo familiar</span>
                  <span>Zona</span>
                  <span>Colaborador</span>
                  <span>Mesa</span>
                  <span>Confirmado</span>
                  <span>Pagado</span>
                </div>
                {invitadosOrdenados.map((g, i) => {
                  const col = resolverColaborador(g, colaboradores);
                  return (
                    <div
                      key={g.id}
                      className="grid px-2 py-1.5 text-sm"
                      style={{
                        gridTemplateColumns: "1.3fr 1fr 0.8fr 1fr 0.7fr 0.9fr 0.9fr",
                        background: i % 2 ? C.paperDark : "#fff",
                        color: C.charcoal,
                      }}
                    >
                      <span>
                        {g.apellido}, {g.nombre}
                      </span>
                      <span>{g.grupoFamiliar || g.apellido || "—"}</span>
                      <span>{g.zona || "—"}</span>
                      <span>{col ? col.nombre : "—"}</span>
                      <span>{g.mesa ?? "—"}</span>
                      <span>{g.confirmado ? "Sí" : "Tentativa"}</span>
                      <span>{g.confirmado ? (g.pagado ? "Sí" : "No") : "—"}</span>
                    </div>
                  );
                })}
                {invitadosOrdenados.length === 0 && (
                  <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Ningún invitado coincide con los filtros aplicados.
                  </p>
                )}
              </>
            )}

            {panelFlotante === "canciones" && (
              <>
                <div
                  className="grid text-xs uppercase px-2 py-2"
                  style={{
                    gridTemplateColumns: "1.5fr 0.6fr 2fr",
                    color: C.gold,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Edad</span>
                  <span>Canción</span>
                </div>
                {ordenarPorApellidoNombre(invitados.filter((g) => g.cancion && g.cancion.trim())).map(
                  (g, i) => (
                    <div
                      key={g.id}
                      className="grid px-2 py-2 text-sm"
                      style={{
                        gridTemplateColumns: "1.5fr 0.6fr 2fr",
                        background: i % 2 ? C.paperDark : "#fff",
                        color: C.charcoal,
                      }}
                    >
                      <span>
                        {g.apellido}, {g.nombre}
                      </span>
                      <span>{calcularEdad(g.anioNacimiento, evento) ?? "—"}</span>
                      <span>{g.cancion}</span>
                    </div>
                  )
                )}
                {invitados.filter((g) => g.cancion && g.cancion.trim()).length === 0 && (
                  <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Todavía nadie ha indicado una canción.
                  </p>
                )}
              </>
            )}

            {panelFlotante === "alergias" && (
              <>
                <div
                  className="grid text-xs uppercase px-2 py-2"
                  style={{
                    gridTemplateColumns: "1.5fr 0.6fr 2fr",
                    color: C.wax,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Mesa</span>
                  <span>Alergia</span>
                </div>
                {ordenarPorApellidoNombre(invitados.filter(tieneAlergiaReal)).map((g, i) => (
                  <div
                    key={g.id}
                    className="grid px-2 py-2 text-sm"
                    style={{
                      gridTemplateColumns: "1.5fr 0.6fr 2fr",
                      background: i % 2 ? "#FBEAEA" : "#fff",
                      color: C.charcoal,
                      fontWeight: 600,
                    }}
                  >
                    <span>
                      {g.apellido}, {g.nombre}
                    </span>
                    <span>{g.mesa ?? "—"}</span>
                    <span style={{ color: C.wax }}>{g.alergias}</span>
                  </div>
                ))}
                {invitados.filter(tieneAlergiaReal).length === 0 && (
                  <p className="text-sm italic p-2" style={{ color: C.charcoal, opacity: 0.6 }}>
                    Todavía nadie ha indicado alergias.
                  </p>
                )}
              </>
            )}
          </div>
        </ModalFlotante>
      )}

      {panelFlotante === "avisosMesas" && (
        <ModalFlotante
          titulo="⚠ Familias sin mesa completa"
          colorTitulo={C.wax}
          onCerrar={() => setPanelFlotante(null)}
        >
          <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.75 }}>
            La auto-asignación nunca reparte un grupo familiar entre mesas por su cuenta.
            Estas familias se han quedado (total o parcialmente) sin mesa — sube la capacidad
            de alguna mesa, mueve gente a mano, o vuelve a pulsar "Auto-asignar" tras
            ajustarlo. Cuando ya no queden avisos, la distribución está completa.
          </p>
          <div className="space-y-2">
            {avisosMesas.map((a, i) => (
              <div
                key={i}
                className="p-2 rounded text-sm"
                style={{ background: "#FBEAEA", border: `1px solid ${C.wax}`, color: C.charcoal }}
              >
                <strong style={{ color: C.wax }}>Familia {a.grupo}</strong>: {a.motivo}
              </div>
            ))}
          </div>
        </ModalFlotante>
      )}
    </div>
  );
}
