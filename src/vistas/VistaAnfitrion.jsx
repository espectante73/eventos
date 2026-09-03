// Vista completa del anfitrión: todas las ventanas de gestión (Colaboradores,
// Mesas, Plano, Avisos, Estado de cuentas, Configuración, Invitaciones,
// Zona de Reinicio...). Movida tal cual desde App.jsx en el reparto del
// 2026-08-08 (ver CLAUDE.md) — sigue siendo un único componente grande;
// dividir su interior es un cambio aparte, deliberadamente pospuesto (ver
// CLAUDE.md, Fase 4).
import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
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
import { VentanaConfigCronograma } from "./anfitrion/VentanaConfigCronograma";
import { VentanaMusicaEvento } from "./anfitrion/VentanaMusicaEvento";
import { guardarAspecto, ASPECTO_POR_DEFECTO } from "../lib/temasMusica";
import { ErrorBoundary } from "../components/ErrorBoundary";
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

  // Ventana Cronograma: mismo patrón, a petición del usuario, 2026-08-29
  // ("independiente al navegador"). Sí necesita `ventana` -- "Imprimir"
  // usa ventana.print(), nunca window.print() a secas (ver
  // VentanaConfigCronograma.jsx).
  const {
    abrir: abrirCronograma,
    actualizar: actualizarCronograma,
    abierta: cronogramaAbierta,
    ventana: ventanaCronograma,
  } = usePopupWindow({ nombreVentana: "cronograma-evento", ancho: 480, alto: 800 });
  useEffect(() => {
    if (cronogramaAbierta) actualizarCronograma(<VentanaConfigCronograma data={data} ventana={ventanaCronograma} />);
  }, [cronogramaAbierta, actualizarCronograma, data, ventanaCronograma]);

  // Ventana "Música del evento" (2026-08-31): mismo patrón de ventana de
  // verdad, y aquí es especialmente importante -- va a estar abierta
  // toda la noche sonando por los altavoces, así que conviene poder
  // moverla a otra pantalla y dejarla en paz. Necesita `ventana` para
  // el Wake Lock (ventana.navigator, nunca navigator a secas).
  const {
    abrir: abrirMusicaPopup,
    actualizar: actualizarMusicaEvento,
    abierta: musicaEventoAbierta,
    ventana: ventanaMusicaEvento,
    // Ancha a propósito: en el Mac esta ventana es un puesto de control
    // de dos columnas (bloques a un lado, reproductor y pistas al otro).
  } = usePopupWindow({ nombreVentana: "musica-evento", ancho: 940, alto: 800 });

  // En el móvil, la música NO se abre como ventana aparte. Dos motivos,
  // los dos comprobados en vivo (2026-09-01): Safari en iOS trae el
  // bloqueo de ventanas emergentes activado de fábrica, así que pulsar
  // "Música" no hacía absolutamente nada -- sin aviso, sin error, sin
  // nada; y aunque se permita, ahí una "ventana" es otra pestaña a
  // pantalla completa, que no aporta nada frente a mostrarla en la
  // misma página. El mando a distancia vive en el móvil: no puede
  // depender de un permiso del navegador.
  // La Lista de invitados también sale del navegador: es la ventana más
  // importante de la app y se quiere lo más grande posible, con las
  // columnas y sus filtros de un vistazo (petición del usuario,
  // 2026-09-04). Misma decisión que Música: en un aparato táctil no se
  // intenta -- allí una "ventana" es otra pestaña y encima Safari las
  // bloquea de fábrica -- y ahí se queda como ventana flotante dentro
  // de la página, que es como ha funcionado hasta hoy.
  const {
    abrir: abrirInvitadosPopup,
    actualizar: actualizarInvitados,
    abierta: invitadosEnVentana,
    ventana: ventanaInvitados,
  } = usePopupWindow({ nombreVentana: "lista-invitados", ancho: 1280, alto: 900 });

  const [musicaEnPagina, setMusicaEnPagina] = useState(false);
  const abrirMusicaEvento = useCallback(() => {
    // ⚠️ La pregunta es qué APARATO es, no cuánto mide la ventana. El
    // primer intento miraba `innerWidth < 820` y se llevó por delante el
    // caso normal del Mac: con el navegador a media pantalla, el
    // ordenador también daba menos de 820 y perdía su ventana aparte
    // (2026-09-01, reportado al momento). `pointer: coarse` + `hover:
    // none` es cierto en un móvil o tablet y falso en un portátil, mida
    // lo que mida la ventana.
    const esTactil = window.matchMedia?.("(pointer: coarse) and (hover: none)").matches;
    // `abrirMusicaPopup()` devuelve false si el navegador la bloqueó
    // (Safari en iOS lo hace de fábrica): ese caso también cae aquí, en
    // vez de quedarse en nada.
    if (esTactil || !abrirMusicaPopup()) setMusicaEnPagina(true);
  }, [abrirMusicaPopup]);
  useEffect(() => {
    // Con su propio Error Boundary: si algo revienta ahí dentro, esta
    // ventana es un root de React aparte (createRoot en el documento de
    // la emergente), así que el de la pestaña principal no la cubre --
    // se quedaría en blanco sin decir nada. El botón de rescate devuelve
    // el aspecto a como venía de fábrica, que es de lo poco que se puede
    // dejar en mal estado desde aquí.
    if (musicaEventoAbierta)
      actualizarMusicaEvento(
        <ErrorBoundary ventana={ventanaMusicaEvento} alReiniciar={() => guardarAspecto(ASPECTO_POR_DEFECTO)}>
          <VentanaMusicaEvento data={data} ventana={ventanaMusicaEvento} />
        </ErrorBoundary>
      );
  }, [musicaEventoAbierta, actualizarMusicaEvento, data, ventanaMusicaEvento]);

  // Se repinta con cada refresco de datos, igual que Música: la ventana
  // es un root de React aparte y no se entera sola de que `data` cambió.
  // Con su Error Boundary propio: el de la pestaña principal no cubre
  // ese root, y sin él un fallo ahí dentro sería una ventana en blanco.
  useEffect(() => {
    if (!invitadosEnVentana) return;
    actualizarInvitados(
      <ErrorBoundary ventana={ventanaInvitados}>
        <SeccionInvitados
          data={data}
          asignarColaborador={asignarColaborador}
          ocupacionMesa={ocupacionMesa}
          panelFlotante={panelFlotante}
          setPanelFlotante={setPanelFlotante}
          colaboradoresPendientes={colaboradoresPendientes}
          filtros={filtros}
          setFiltros={setFiltros}
          onCerrar={() => ventanaInvitados?.close()}
          ventana={ventanaInvitados}
          fijo
        />
      </ErrorBoundary>
    );
  });

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
    // "" | "matrimonio" | "esposo" | "esposa" | "hijo" | "sin" -- columna
    // O/A/H (ver lib/rolFamiliar.js).
    rolFamiliar: "",
    // "" | "con" | "sin" -- columna Boda.
    anioBoda: "",
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

  const esAparatoTactil = () => window.matchMedia?.("(pointer: coarse) and (hover: none)").matches;

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

  const abrirInvitados = useCallback(() => {
    if (esAparatoTactil() || !abrirInvitadosPopup()) toggle("invitados");
  }, [abrirInvitadosPopup]);
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
        abrirCronograma={abrirCronograma}
        abrirMusicaEvento={abrirMusicaEvento}
        abrirInvitados={abrirInvitados}
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

      {/* Lista de invitados, en la página (móvil, o si el navegador
          bloqueara la ventana). En el ordenador vive en su propia
          ventana del sistema, ver `contenidoInvitados` más arriba. */}
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

      {/* Cronograma: ventana emergente de verdad (ver arriba), no pasa
          por `abierto`/`toggle` -- se abre con abrirCronograma. */}

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

      {/* Música del evento DENTRO de la página: el camino del móvil (y
          el de reserva si el navegador bloquea las ventanas emergentes).
          Ocupa la pantalla entera porque es un mando a distancia: se usa
          de pie, con una mano y sin mirar mucho. Lleva su propio Error
          Boundary igual que la versión en ventana aparte. */}
      {musicaEnPagina && (
        <div className="fixed inset-0 flex flex-col" style={{ zIndex: 2000, background: C.ink }}>
          <div
            className="flex items-center justify-between px-3"
            style={{ minHeight: 44, flexShrink: 0, background: C.ink, color: C.goldClaro }}
          >
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 600 }}>Música del evento</span>
            <button
              onClick={() => setMusicaEnPagina(false)}
              className="flex items-center justify-center"
              style={{ width: 40, height: 40, borderRadius: 10, color: C.goldClaro }}
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ErrorBoundary alReiniciar={() => guardarAspecto(ASPECTO_POR_DEFECTO)}>
              <VentanaMusicaEvento data={data} ventana={window} />
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}
