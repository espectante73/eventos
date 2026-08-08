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
import { exportarTodo } from "../lib/backup";
import { VentanaVersiones } from "./anfitrion/VentanaVersiones";
import { VentanaProgreso } from "./anfitrion/VentanaProgreso";
import { VentanaCopiaSeguridad } from "./anfitrion/VentanaCopiaSeguridad";
import { VentanaConfigPrecios } from "./anfitrion/VentanaConfigPrecios";
import { VentanaConfigUrlWeb } from "./anfitrion/VentanaConfigUrlWeb";
import { VentanaConfigEmailAnfitrion } from "./anfitrion/VentanaConfigEmailAnfitrion";
import { VentanaConfigDatosEvento } from "./anfitrion/VentanaConfigDatosEvento";
import { VentanaConfigPlantillasEmail } from "./anfitrion/VentanaConfigPlantillasEmail";
import { VentanaConfigZonaReinicio } from "./anfitrion/VentanaConfigZonaReinicio";
import { VentanaConfigZonaPeligro } from "./anfitrion/VentanaConfigZonaPeligro";
import { VentanaColaboradores } from "./anfitrion/VentanaColaboradores";
import { VentanaMesas } from "./anfitrion/VentanaMesas";
import { VentanaPlano } from "./anfitrion/VentanaPlano";
import { VentanaCuentas } from "./anfitrion/VentanaCuentas";
import { VentanaAvisos } from "./anfitrion/VentanaAvisos";
import { VentanaInvitaciones } from "./anfitrion/VentanaInvitaciones";

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

export function VistaAnfitrion({ data }) {
  const { evento, colaboradores, invitados, mesas, fotosFamiliares, persistEvento, persistColaboradores, persistInvitados, persistMesas, persistFotosFamiliares, avisarColaborador, probarEmailColaborador, avisosEnviados, ordenFamiliares, persistOrdenFamiliares, enviarInvitacionFamilia, resetearAvisos, resetearPorInvitados, gastos, persistGastos } = data;

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

  // ---------- Estado de cuentas (gastos) ----------
  // "importe" se guarda tal cual se escribe (texto), igual que precioAdulto/
  // precioNino del evento — se convierte a número solo al sumar
  // (parsePrecio), nunca en cada pulsación. Convertirlo a número al momento
  // borraba la coma decimal a medio escribir (9,18 acababa siendo 918).

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

  // El email de un invitado puede vivir en su propio registro, o -si ese
  // invitado es también colaborador- en el registro de colaboradores (se
  // edita solo ahí; el campo de su propia ficha se queda vacío a
  // propósito y se muestra de solo lectura, ver VistaColaborador). Para
  // saber la dirección real de alguien hay que mirar los dos sitios.
  const emailDeInvitado = (miembro) =>
    miembro.email || colaboradores.find((c) => c.invitadoId === miembro.id)?.email || "";

  // El destinatario del email de invitación no tiene por qué ser el primero
  // del orden de nombres (ese orden es solo para el texto de la propia
  // invitación) — se busca el primer confirmado de la familia que SÍ tenga
  // email (propio o de su colaborador vinculado), sea cual sea su
  // posición. Antes se miraba solo confirmados[0].email y, si esa persona
  // en concreto no tenía email en su propia ficha, se daba la familia
  // entera por "sin email" — aunque otro miembro sí lo tuviera, o aunque
  // esa misma persona lo tuviera guardado como colaborador.
  const destinatarioConEmail = (familia) => {
    const elegido =
      familia.confirmados.find((m) => emailDeInvitado(m)) || familia.confirmados[0];
    return elegido ? { ...elegido, email: emailDeInvitado(elegido) } : elegido;
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

  const [previewInvitacion, setPreviewInvitacion] = useState(null); // { familia, dataUrl, destinatario } | null
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);

  const abrirPreviewInvitacion = async (familia) => {
    const destinatario = destinatarioConEmail(familia);
    if (!destinatario?.email) {
      window.alert(
        "No se puede enviar todavía: ninguno de los confirmados de esta familia tiene " +
          "email guardado. Rellena el de alguno de ellos (en su formulario de datos) para poder enviarle la invitación."
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
        <VentanaProgreso data={data} onCerrar={() => toggle("progreso")} />
      )}

      {/* Colaboradores */}
      {abierto.colaboradores && (
        <VentanaColaboradores
          data={data}
          asignarColaborador={asignarColaborador}
          onCerrar={() => toggle("colaboradores")}
        />
      )}

      {/* Mesas */}
      {abierto.mesas && (
        <VentanaMesas
          data={data}
          ocupacionMesa={ocupacionMesa}
          panelFlotante={panelFlotante}
          setPanelFlotante={setPanelFlotante}
          onCerrar={() => toggle("mesas")}
        />
      )}

      {/* Plano de mesas */}
      {abierto.plano && (
        <VentanaPlano data={data} ocupacionMesa={ocupacionMesa} onCerrar={() => toggle("plano")} />
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
        <VentanaInvitaciones
          data={data}
          familiasListasParaInvitacion={familiasListasParaInvitacion}
          destinatarioConEmail={destinatarioConEmail}
          descargando={descargando}
          setDescargando={setDescargando}
          abrirPreviewInvitacion={abrirPreviewInvitacion}
          generarImagenParaFamilia={generarImagenParaFamilia}
          modoCalibracion={modoCalibracion}
          setModoCalibracion={setModoCalibracion}
          marcarInvitacionEnviada={marcarInvitacionEnviada}
          onCerrar={() => toggle("invitaciones")}
        />
      )}

      {/* Estado de cuentas */}
      {abierto.cuentas && (
        <VentanaCuentas data={data} onCerrar={() => toggle("cuentas")} />
      )}

      {/* Copia de seguridad */}
      {abierto.copiaSeguridad && (
        <VentanaCopiaSeguridad data={data} onCerrar={() => toggle("copiaSeguridad")} />
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
        <VentanaConfigDatosEvento data={data} onCerrar={() => toggle("config-datos-evento")} />
      )}

      {abierto["config-precios"] && (
        <VentanaConfigPrecios data={data} onCerrar={() => toggle("config-precios")} />
      )}

      {abierto["config-url-web"] && (
        <VentanaConfigUrlWeb data={data} onCerrar={() => toggle("config-url-web")} />
      )}

      {abierto["config-email-anfitrion"] && (
        <VentanaConfigEmailAnfitrion data={data} onCerrar={() => toggle("config-email-anfitrion")} />
      )}

      {abierto["config-plantillas-email"] && (
        <VentanaConfigPlantillasEmail data={data} onCerrar={() => toggle("config-plantillas-email")} />
      )}

      {abierto["config-zona-reinicio"] && (
        <VentanaConfigZonaReinicio data={data} onCerrar={() => toggle("config-zona-reinicio")} />
      )}

      {abierto["config-zona-peligro"] && (
        <VentanaConfigZonaPeligro data={data} onCerrar={() => toggle("config-zona-peligro")} />
      )}

      {/* Avisos */}
      {abierto.avisos && (
        <VentanaAvisos
          data={data}
          familiasListasParaInvitacion={familiasListasParaInvitacion}
          destinatarioConEmail={destinatarioConEmail}
          descargando={descargando}
          abrirPreviewInvitacion={abrirPreviewInvitacion}
          colaboradoresPendientes={colaboradoresPendientes}
          setFiltros={setFiltros}
          setAbierto={setAbierto}
          onCerrar={() => toggle("avisos")}
        />
      )}

      {/* Versiones */}
      {abierto.versiones && (
        <VentanaVersiones onCerrar={() => toggle("versiones")} />
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

    </div>
  );
}
