// Vista completa del anfitrión: todas las ventanas de gestión (Colaboradores,
// Mesas, Plano, Avisos, Estado de cuentas, Configuración, Invitaciones,
// Zona de Reinicio...). Movida tal cual desde App.jsx en el reparto del
// 2026-08-08 (ver CLAUDE.md) — sigue siendo un único componente grande;
// dividir su interior es un cambio aparte, deliberadamente pospuesto (ver
// CLAUDE.md, Fase 4).
import { useState, useEffect } from "react";
import { construirEnlaceTablon } from "../lib/url";
import { usePopupWindow } from "../lib/usePopupWindow";
import { useMotorInvitaciones } from "../lib/useMotorInvitaciones";
import { C } from "../theme";
import { ModalFlotante } from "../components/VentanaFlotante";
import { Portada } from "../components/Portada";
import { VentanaVersiones } from "./anfitrion/VentanaVersiones";
import { VentanaNovedades } from "./anfitrion/VentanaNovedades";
import { VentanaPermisos } from "./anfitrion/VentanaPermisos";
import { VentanaConfigMusica } from "./anfitrion/VentanaConfigMusica";
import { VentanaProgreso } from "./anfitrion/VentanaProgreso";
import { VentanaCopiaSeguridad } from "./anfitrion/VentanaCopiaSeguridad";
import { VentanaConfigPrecios } from "./anfitrion/VentanaConfigPrecios";
import { VentanaConfigUrlWeb } from "./anfitrion/VentanaConfigUrlWeb";
import { VentanaConfigEmailAnfitrion } from "./anfitrion/VentanaConfigEmailAnfitrion";
import { VentanaConfigDatosEvento } from "./anfitrion/VentanaConfigDatosEvento";
import { VentanaConfigPlantillasEmail } from "./anfitrion/VentanaConfigPlantillasEmail";
import { VentanaConfigModoPruebas } from "./anfitrion/VentanaConfigModoPruebas";
import { VentanaConfigZonaReinicio } from "./anfitrion/VentanaConfigZonaReinicio";
import { VentanaConfigZonaPeligro } from "./anfitrion/VentanaConfigZonaPeligro";
import { VentanaColaboradoresDatos } from "./anfitrion/VentanaColaboradoresDatos";
import { VentanaMesas } from "./anfitrion/VentanaMesas";
import { VentanaPlano } from "./anfitrion/VentanaPlano";
import { VentanaCuentas } from "./anfitrion/VentanaCuentas";
import { VentanaAvisos } from "./anfitrion/VentanaAvisos";
import { VentanaInvitaciones } from "./anfitrion/VentanaInvitaciones";
import { SeccionInvitados } from "./anfitrion/SeccionInvitados";

export function VistaAnfitrion({ data, setRol, anfitrionToken, onCerrarSesion }) {
  const { evento, colaboradores, invitados, persistInvitados, tokenTablon } = data;
  const enlaceTablon = construirEnlaceTablon(evento.urlPublica, tokenTablon);
  // Ventana Novedades: ventana de verdad del sistema operativo, no una
  // VentanaFlotante -- ver lib/usePopupWindow.js. `abrir` se pasa hasta
  // DesplegableSecciones.jsx (a través de Portada) para que se llame de
  // forma SÍNCRONA dentro del propio clic del menú; si se llamara más
  // tarde, algunos navegadores la bloquearían por no venir de una acción
  // directa del usuario.
  const {
    abrir: abrirNovedades,
    actualizar: actualizarNovedades,
    abierta: novedadesAbierta,
    ventana: ventanaNovedades,
  } = usePopupWindow({ nombreVentana: "novedades-evento", ancho: 640, alto: 800 });
  // Repinta el contenido de la ventana (root propio, no un createPortal
  // -- ver el porqué en usePopupWindow.js) cada vez que `data` cambie,
  // mientras siga abierta -- así una novedad guardada, o el refresco
  // silencioso de cada minuto, se reflejan ahí sin tener que cerrarla y
  // volver a abrirla. Se le pasa también `ventana` (el propio objeto
  // window de esa ventana emergente) -- lo necesita para el portapapeles,
  // ver el porqué en VentanaNovedades.jsx.
  useEffect(() => {
    if (novedadesAbierta) actualizarNovedades(<VentanaNovedades data={data} ventana={ventanaNovedades} />);
  }, [novedadesAbierta, actualizarNovedades, data, ventanaNovedades]);

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

  const [abierto, setAbierto] = useState({
    copiaSeguridad: false,
    progreso: false,
    "colaboradores-datos": false,
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

  // Motor de "enviar la invitación a una familia" -- extraído a
  // lib/useMotorInvitaciones.js el 2026-08-25 para poder reutilizarlo
  // también desde VistaColaborador.jsx (permiso "invitaciones_enviar",
  // ver lib/permisos.js). Mismo comportamiento de siempre, solo cambia
  // dónde vive el código.
  const {
    familiasListasParaInvitacion,
    destinatarioConEmail,
    marcarInvitacionEnviada,
    descargando,
    setDescargando,
    modoCalibracion,
    setModoCalibracion,
    generarImagenParaFamilia,
    previewInvitacion,
    setPreviewInvitacion,
    enviandoInvitacion,
    abrirPreviewInvitacion,
    confirmarEnvioInvitacion,
  } = useMotorInvitaciones(data);

  return (
    <div className="space-y-8">
      <Portada
        evento={evento}
        editable
        abierto={abierto}
        toggle={toggle}
        colaboradores={colaboradores}
        onCambiarRol={setRol}
        anfitrionToken={anfitrionToken}
        onCerrarSesion={onCerrarSesion}
        enlaceTablon={enlaceTablon}
        abrirNovedades={abrirNovedades}
      />

      {/* Los 3 recuadros de resumen (Lista global/Tentativa/Confirmados)
          se mudaron a la ventana Progreso -- a petición del usuario,
          2026-08-18: tienen más sentido ahí (la ventana de estadísticas
          del evento) que sueltos en la Portada. */}

      {/* Progreso de recopilación */}
      {abierto.progreso && (
        <VentanaProgreso data={data} onCerrar={() => toggle("progreso")} />
      )}

      {/* Colaboradores: "Datos Colab." abre esta ventana; "Formularios" no
          abre ninguna — cambia de vista directamente (ver DesplegableSecciones.jsx) */}
      {abierto["colaboradores-datos"] && (
        <VentanaColaboradoresDatos
          data={data}
          asignarColaborador={asignarColaborador}
          onCerrar={() => toggle("colaboradores-datos")}
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

      {abierto["config-musica"] && (
        <VentanaConfigMusica onCerrar={() => toggle("config-musica")} />
      )}

      {/* Permisos */}
      {abierto.permisos && (
        <VentanaPermisos data={data} onCerrar={() => toggle("permisos")} />
      )}

      {abierto["config-modo-pruebas"] && (
        <VentanaConfigModoPruebas data={data} onCerrar={() => toggle("config-modo-pruebas")} />
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
