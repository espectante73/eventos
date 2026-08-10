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
  Music,
  AlertTriangle,
  Clock,
  MapPin,
  Bell,
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
import { ModalFlotante } from "../components/VentanaFlotante";
import { SectionTitle, Field, TextInput } from "../components/Formulario";
import { Portada } from "../components/Portada";
import { MesaRedonda, MesaPlano } from "../components/Mesas";
import { BuscadorInvitado } from "../components/BuscadorInvitado";
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
import { VentanaColaboradoresDatos } from "./anfitrion/VentanaColaboradoresDatos";
import { VentanaColaboradoresFormularios } from "./anfitrion/VentanaColaboradoresFormularios";
import { VentanaMesas } from "./anfitrion/VentanaMesas";
import { VentanaPlano } from "./anfitrion/VentanaPlano";
import { VentanaCuentas } from "./anfitrion/VentanaCuentas";
import { VentanaAvisos } from "./anfitrion/VentanaAvisos";
import { VentanaInvitaciones } from "./anfitrion/VentanaInvitaciones";
import { SeccionInvitados } from "./anfitrion/SeccionInvitados";

export function VistaAnfitrion({ data }) {
  const { evento, colaboradores, invitados, mesas, fotosFamiliares, persistEvento, persistColaboradores, persistInvitados, persistMesas, persistFotosFamiliares, avisarColaborador, probarEmailColaborador, avisosEnviados, ordenFamiliares, persistOrdenFamiliares, enviarInvitacionFamilia, resetearAvisos, resetearPorInvitados, gastos, persistGastos } = data;

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

  // Vive aquí (no en SeccionInvitados) porque el botón "Editar asignación"
  // de la ventana Avisos también necesita poder rellenar el filtro de
  // colaborador de esta tabla.
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

  const asignarColaborador = (id, colaboradorId) => {
    const nuevoId = colaboradorId || null;
    persistInvitados(
      invitados.map((g) => (g.id === id ? { ...g, colaboradorId: nuevoId } : g))
    );
  };

  const ocupacionMesa = (numero) =>
    invitados.filter((g) => g.mesa === numero && g.confirmado).length;

  const total = invitados.length;
  const confirmadosCount = invitados.filter((g) => g.confirmado).length;
  const tentativaCount = total - confirmadosCount;

  const [abierto, setAbierto] = useState({
    copiaSeguridad: false,
    progreso: false,
    "colaboradores-datos": false,
    "colaboradores-formularios": false,
    mesas: false,
    plano: false,
    invitados: false,
    invitaciones: false,
    cuentas: false,
    versiones: false,
    avisos: false,
  });
  const toggle = (clave) => setAbierto((a) => ({ ...a, [clave]: !a[clave] }));
  // null | "tabla" | "canciones" | "alergias" | "avisosMesas" — controla la
  // ventana flotante; independiente de qué secciones estén plegadas.
  const [panelFlotante, setPanelFlotante] = useState(null);

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

      {/* Colaboradores — dos ventanas, ver DesplegableSecciones.jsx (submenú "Colaboradores") */}
      {abierto["colaboradores-datos"] && (
        <VentanaColaboradoresDatos data={data} onCerrar={() => toggle("colaboradores-datos")} />
      )}
      {abierto["colaboradores-formularios"] && (
        <VentanaColaboradoresFormularios
          data={data}
          asignarColaborador={asignarColaborador}
          onCerrar={() => toggle("colaboradores-formularios")}
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

      {/* Lista de invitados */}
      {abierto.invitados && (
        <SeccionInvitados
          data={data}
          asignarColaborador={asignarColaborador}
          ocupacionMesa={ocupacionMesa}
          panelFlotante={panelFlotante}
          setPanelFlotante={setPanelFlotante}
          colaboradoresPendientes={colaboradoresPendientes}
          filtros={filtros}
          setFiltros={setFiltros}
          onCerrar={() => toggle("invitados")}
        />
      )}

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

      {/* Configuración ya no tiene ventana propia: se abre directo desde el
          submenú "Configuración" de "Abrir sección…" (ver DesplegableSecciones.jsx) */}
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

    </div>
  );
}
