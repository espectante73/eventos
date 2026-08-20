// Ventana "Lista de invitados": alta individual, importación masiva,
// filtros, la tabla editable fila a fila, el resumen de asignaciones
// pendientes de avisar al cerrarla, y el panel de imprimir/exportar CSV
// (tabla completa, solo canciones, o solo alergias). Extraída de
// VistaAnfitrion.jsx en el reparto del 2026-08-08 (Fase 4, Ronda 5);
// convertida en ventana flotante (como el resto) el 2026-08-09, con la
// fila de filtros fija arriba al hacer scroll por la lista.
//
// `asignarColaborador` y `ocupacionMesa` no viven aquí: los usan también
// otras ventanas (Colaboradores, Mesas, Plano), así que siguen en
// VistaAnfitrion y llegan como props. `panelFlotante`/`setPanelFlotante`
// tampoco son exclusivos de esta sección -Mesas también los usa, para su
// aviso de familias sin mesa- así que también llegan como props.
// `filtros`/`setFiltros` igual: el botón "Editar asignación" de la
// ventana Avisos necesita poder rellenar el filtro de colaborador de
// esta misma tabla, así que ese estado también vive en VistaAnfitrion.
import { useState, useRef, useEffect } from "react";
import {
  Check,
  Trash2,
  Music,
  AlertTriangle,
  Plus,
  Pencil,
  Copy,
  Printer,
  MoreHorizontal,
} from "lucide-react";
import { C, inputStyle } from "../../theme";
import { uid } from "../../lib/id";
import { datosCompletos, tieneAlergiaReal, resolverColaborador, parseImport, calcularEdad, edadPromedio } from "../../lib/invitados";
import { ordenarPorApellidoNombre } from "../../lib/formato";
import { descargarCSV } from "../../lib/descargas";
import { TextInput } from "../../components/Formulario";
import { EncabezadoOrdenable, GrupoFamiliarInput } from "../../components/Widgets";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";
import { MenuFlotante } from "../../components/MenuFlotante";

export function SeccionInvitados({
  data,
  asignarColaborador,
  ocupacionMesa,
  panelFlotante,
  setPanelFlotante,
  colaboradoresPendientes,
  filtros,
  setFiltros,
  onCerrar,
}) {
  const { evento, colaboradores, invitados, mesas, persistInvitados, avisarColaborador } = data;

  const [nuevoInvitado, setNuevoInvitado] = useState({ nombre: "", apellido: "", zona: "", grupoFamiliar: "" });
  const [textoImport, setTextoImport] = useState("");
  const [mostrarImport, setMostrarImport] = useState(false);
  const [mostrarAnadir, setMostrarAnadir] = useState(false);
  const [orden, setOrden] = useState({ columna: "invitado", direccion: "asc" });
  const [modoEdicion, setModoEdicion] = useState(false);

  // "avisoPendiente" vive en el servidor (columna en invitados), no solo
  // en memoria — así no se pierde el rastro si cancelas o cierras la
  // ventana. Al cerrarla, si queda alguien pendiente, se pregunta.
  const [mostrarResumenAsignacion, setMostrarResumenAsignacion] = useState(false);
  const [enviandoAvisosAsignacion, setEnviandoAvisosAsignacion] = useState(false);

  const tablaRef = useRef(null);
  const filaEjemploRef = useRef(null);
  const [anchoTabla, setAnchoTabla] = useState(null);
  const [anchosColumnas, setAnchosColumnas] = useState(null);

  const cambiarOrden = (columna) => {
    setOrden((o) =>
      o.columna === columna
        ? { columna, direccion: o.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: "asc" }
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

  const intentarCerrarInvitados = () => {
    if (colaboradoresPendientes.length > 0) {
      setMostrarResumenAsignacion(true);
      return;
    }
    onCerrar();
  };

  const enviarAvisosAsignacion = async () => {
    setEnviandoAvisosAsignacion(true);
    for (const c of colaboradoresPendientes) {
      await avisarColaborador(c.id);
    }
    setEnviandoAvisosAsignacion(false);
    setMostrarResumenAsignacion(false);
    onCerrar();
  };

  const cancelarAvisosAsignacion = () => {
    setMostrarResumenAsignacion(false);
    onCerrar();
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

  const asignarMesa = (id, mesaValue) => {
    const numero = mesaValue ? Number(mesaValue) : null;
    const invitadoActual = invitados.find((g) => g.id === id);
    // Solo se puede asignar mesa a un invitado ya CONFIRMADO -- el
    // contador de ocupación (ocupacionMesa) solo cuenta confirmados a
    // propósito (la mesa es sitio real para quien va a venir de
    // verdad), así que dejar asignar a alguien sin confirmar hacía que
    // el indicador pareciera "no actualizarse" (en realidad contaba
    // bien, solo que a ese invitado no lo contaba). El <select> ya va
    // deshabilitado para invitados sin confirmar (ver más abajo); esto
    // es la comprobación de refuerzo en el propio guardado. Quitar la
    // mesa (numero = null) se sigue permitiendo siempre, confirmado o
    // no -- a petición del usuario, 2026-08-20.
    if (numero && invitadoActual && !invitadoActual.confirmado) {
      window.alert("Este invitado todavía no está confirmado -- confírmalo antes de asignarle mesa.");
      return;
    }
    if (numero) {
      const mesa = mesas.find((m) => m.numero === numero);
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
          g.confirmado ? "Sí" : "Sin confirmar",
          g.confirmado ? (g.pagado ? "Sí" : "No") : "",
        ];
      });
      descargarCSV(
        `invitados-${evento.nombre || "evento"}.csv`,
        ["Invitado", "Familia", "Zona", "Colaborador", "Mesa", "Confirmado", "Pagado"],
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

  // Invitado 1.2fr->1.8fr, Zona 0.8fr->1.1fr, Colaborador 1fr->1.3fr y
  // Mesa 0.8fr->1.1fr->1.4fr (Mesa necesitó una segunda pasada: seguía
  // sin caber "Mesa X (n/cap)"): mismo motivo en las cuatro -- la fila
  // entera se estira a la altura de su celda más alta, así que una
  // columna estrecha con texto que no cabe (el nombre del colaborador
  // seleccionado, el texto de la mesa) dejaba esa fila más alta que el
  // resto, y además costaba leerlas. Las demás columnas se reparten el
  // resto igual que antes (mismos números de fr entre ellas), solo
  // ceden algo de su porcentaje relativo del ancho total -- a petición
  // del usuario, 2026-08-20.
  // Familia 1fr -> 1.3fr, Confirmado 0.9fr -> 1.2fr: mismo motivo, a
  // petición del usuario, 2026-08-20.
  const columnasTabla = "1.8fr 1.3fr 1.1fr 1.3fr 1.4fr 1.2fr 1fr 0.9fr auto";
  const hayFilas = invitadosOrdenados.length > 0;

  // La cabecera de columnas y los filtros viven en la barra verde
  // (subtitulo) y las filas de datos en la caja blanca del cuerpo -- dos
  // ramas de DOM totalmente separadas dentro de VentanaFlotante, cada
  // una con su propia cuadrícula CSS Grid. Medir solo el ANCHO TOTAL
  // (ronda anterior, `anchoTabla`) no bastaba: aunque el ancho total
  // coincidiera al milímetro y minWidth:0 impidiera que el contenido
  // ensanchara una columna de más, CADA cuadrícula sigue calculando sus
  // propias fronteras internas a partir de `columnasTabla` (fracciones
  // `fr`) por su cuenta -- y el navegador redondea esas fracciones a
  // píxeles enteros de forma INDEPENDIENTE en cada cuadrícula, columna a
  // columna según va avanzando. Con anchos casi iguales pero no
  // idénticos al milésima, ese redondeo puede tomar una decisión
  // distinta en una cuadrícula que en otra a partir de la 2ª o 3ª
  // columna -- de ahí que el usuario viera la 1ª columna bien y el resto
  // descuadrándose progresivamente.
  //
  // Arreglo definitivo: en vez de que cada cuadrícula calcule sus
  // columnas por su cuenta, se MIDEN los anchos reales en px de las 9
  // columnas de UNA fila de datos ya renderizada (`filaEjemploRef`) y se
  // congelan como una lista de píxeles concretos (`anchosColumnas`,
  // p.ej. "182px 152px 121px..."), que sustituye a `columnasTabla` en
  // las TRES cuadrículas por igual -- todas usan literalmente los mismos
  // números ya redondeados, no fracciones que cada una redondea a su
  // manera. Con ResizeObserver sobre la tabla para volver a medir si la
  // ventana cambia de tamaño, y `hayFilas` en las dependencias para
  // volver a medir en cuanto exista ya una fila real de la que copiar
  // (si los invitados tardan en llegar tras abrir la ventana, la primera
  // pasada no tiene ninguna fila de la que medir todavía).
  useEffect(() => {
    const el = tablaRef.current;
    if (!el) return;
    const medir = () => {
      setAnchoTabla(el.clientWidth);
      const fila = filaEjemploRef.current;
      if (fila) {
        setAnchosColumnas(
          Array.from(fila.children)
            .map((celda) => `${celda.getBoundingClientRect().width}px`)
            .join(" ")
        );
      }
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hayFilas]);

  // Lista global/Tentativa/Confirmados: mudados aquí desde la cabecera
  // de "Progreso de recopilación" -- con los 6 botones ahora escondidos
  // en "Acciones" (justo debajo), la cabecera de esta ventana quedó con
  // sitio libre y encajan mejor aquí, a petición del usuario,
  // 2026-08-20. Mismo aspecto de siempre (2ª línea la etiqueta, 3ª el
  // número resaltado sobre el verde).
  const totalInvitados = invitados.length;
  const confirmadosCount = invitados.filter((g) => g.confirmado).length;
  const edadMedia = edadPromedio(invitadosOrdenados, evento);
  // "Lista global" -> "Previstos" y "Tentativa" -> "Sin confirmar":
  // nombres más precisos, a petición del usuario 2026-08-20 -- el
  // primero es el TOTAL (confirmados + sin confirmar), y "Lista global"
  // sonaba a lista ya cerrada/definitiva cuando en realidad la mayoría
  // de esas personas todavía no han respondido; el segundo es
  // exactamente eso, quien de ese total no ha confirmado todavía.
  const resumen = [
    { label: "Previstos", value: totalInvitados },
    { label: "Sin confirmar", value: totalInvitados - confirmadosCount },
    { label: "Confirmados", value: confirmadosCount },
    // Edad media como recuadro más, en vez del texto suelto que llevaba
    // antes justo debajo del título -- a petición del usuario,
    // 2026-08-20.
    { label: "Edad media", value: edadMedia === null ? "—" : `${edadMedia} años` },
  ];

  // Los 6 botones de la cabecera (Imprimir/Canciones/Alergias/Añadir/
  // Editar/Importar) se esconden en un desplegable ("Acciones"), en vez
  // de ir todos sueltos en una fila -- a petición del usuario,
  // 2026-08-20. Mismo componente MenuFlotante que ya usa el resto de la
  // app (Abrir sección…, Modo pruebas...) en vez de un desplegable
  // nuevo. Añadir/Editar/Importar activan un panel que se queda abierto
  // debajo -- el "✓ " delante de la etiqueta cuando está activo es el
  // mismo convenio ya usado en DesplegableSecciones.jsx para señalar
  // "esto ya está abierto". Alergias conserva su fondo propio (la única
  // que avisa de algo), igual que llevaba suelta.
  const opcionesMenuInvitados = [
    ...(invitados.length > 0
      ? [
          { id: "imprimir", etiqueta: "Imprimir", icono: Printer, onClick: () => setPanelFlotante("tabla") },
          { id: "canciones", etiqueta: "Canciones", icono: Music, onClick: () => setPanelFlotante("canciones") },
          {
            id: "alergias",
            etiqueta: "Alergias",
            icono: AlertTriangle,
            fondo: C.wax,
            color: "#fff",
            onClick: () => setPanelFlotante("alergias"),
          },
        ]
      : []),
    {
      id: "anadir",
      etiqueta: (mostrarAnadir ? "✓ " : "") + "Añadir invitado",
      icono: Plus,
      onClick: () => setMostrarAnadir((v) => !v),
    },
    {
      id: "editar",
      etiqueta: (modoEdicion ? "✓ " : "") + (modoEdicion ? "Terminar edición" : "Editar"),
      icono: Pencil,
      onClick: () => setModoEdicion((v) => !v),
    },
    {
      id: "importar",
      etiqueta: (mostrarImport ? "✓ " : "") + "Importar",
      icono: Copy,
      onClick: () => setMostrarImport((v) => !v),
    },
  ];

  return (
    <>
      <VentanaFlotante
        clave="invitados"
        titulo="Lista de invitados"
        onCerrar={intentarCerrarInvitados}
        // Ancho fijo de vuelta (no ya "ancho total" de pantalla, se
        // deshizo a petición del usuario, 2026-08-18) -- lo bastante
        // ancha para que la cabecera de columnas quepa entera sin scroll
        // horizontal nada más abrirla. 820px->940px: con los títulos de
        // columna más grandes/en negrita (a petición del usuario,
        // 2026-08-20) ya no cabían, hacía falta más ancho total para
        // repartir entre las 9 columnas.
        ancho="min(940px, calc(100vw - 48px))"
        subtitulo={
          // Segunda línea bajo el título: la edad media (número en
          // negrita y 3px más grande que el resto de la línea) y, debajo,
          // la cabecera de columnas de la tabla (Invitado/Familia/...) --
          // de vuelta a la barra verde (a petición del usuario,
          // 2026-08-18: la quería ahí, no en la caja blanca).
          //
          // El ancho de las dos rejillas de aquí abajo (cabecera de
          // columnas y filtros) YA NO se deja "a fórmula" (%, bordes,
          // paddings calculados a mano) -- después de varias rondas en
          // las que seguía sin coincidir de verdad con la tabla del
          // cuerpo (redondeos, la barra de scroll de overflow-x-auto,
          // redimensionar la ventana a mano...), se mide el ancho REAL
          // de la tabla con un ResizeObserver (`tablaRef`/`anchoTabla`,
          // más arriba) y se aplica tal cual como `width` en px a las dos
          // -- así coinciden siempre de verdad, no "deberían coincidir
          // según el cálculo".
          // `stopPropagation` en mousedown/touchstart: son controles
          // interactivos (los botones de ordenar) dentro de la cabecera
          // arrastrable de la ventana, igual que ya exige `extra`.
          <div className="flex flex-col gap-1 mt-3">
            {/* mt-3: separa la cabecera de columnas de los 4 recuadros
                informativos de arriba (Previstos/Sin confirmar/
                Confirmados/Edad media, en `extra`) -- antes quedaba
                pegada justo debajo, a petición del usuario, 2026-08-20,
                se baja para acercarla más a los filtros/la lista y
                diferenciarla mejor de los recuadros. */}
            {/* La línea de texto suelto "Edad media: X años" que iba
                aquí se quitó -- ahora es un recuadro más junto a Lista
                global/Tentativa/Confirmados, arriba en `extra` (a
                petición del usuario, 2026-08-20). */}
            {/* Sin `minWidth: 780` aquí (a diferencia de la tabla de
                abajo, que sí lo lleva dentro de su propio contenedor con
                scroll horizontal propio) -- en móvil vertical, la
                ventana se encoge (ancho = calc(100vw - 48px), ver el
                `ancho` de más arriba) y esta fila, al no tener scroll
                propio, se salía literalmente fuera del marco de la
                ventana en vez de encogerse con ella. Sigue coincidiendo
                con la tabla en horizontal/escritorio (ahí la ventana ya
                es más ancha que 780 de sobra) -- a petición del usuario,
                2026-08-18. */}
            <div
              className="rounded"
              style={{ border: "1px solid transparent" }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {/* Sin `px-3` aquí (a diferencia de como estaba antes): esos
                  12px a cada lado encogían el ancho de ESTE grid 24px por
                  debajo del de las filas de datos (que no llevan ningún
                  padding de fila, solo padding por celda) -- mismo
                  columnasTabla mismos números de fr, pero repartidos
                  sobre un ancho total distinto, así que los límites de
                  columna quedaban desplazados y el sombreado de la tabla
                  no coincidía con su filtro de aquí arriba. Quitado en
                  esta fila y en la de filtros de más abajo -- a petición
                  del usuario, 2026-08-18. */}
              <div
                // text-sm + font-bold + más letterSpacing (antes text-xs
                // normal): para que los títulos de columna resalten más
                // -- a petición del usuario, 2026-08-20.
                className="grid text-sm font-bold uppercase text-center"
                style={{
                  gridTemplateColumns: anchosColumnas ?? columnasTabla,
                  width: anchoTabla ?? undefined,
                  color: C.goldClaro,
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: "0.03em",
                }}
              >
                <EncabezadoOrdenable claro columna="invitado" orden={orden} onClick={cambiarOrden}>
                  Invitado
                </EncabezadoOrdenable>
                <EncabezadoOrdenable claro columna="grupoFamiliar" orden={orden} onClick={cambiarOrden}>
                  Familia
                </EncabezadoOrdenable>
                <EncabezadoOrdenable claro columna="zona" orden={orden} onClick={cambiarOrden}>
                  Zona
                </EncabezadoOrdenable>
                <EncabezadoOrdenable claro columna="colaborador" orden={orden} onClick={cambiarOrden}>
                  Colaborador
                </EncabezadoOrdenable>
                <EncabezadoOrdenable claro columna="mesa" orden={orden} onClick={cambiarOrden}>
                  Mesa
                </EncabezadoOrdenable>
                <EncabezadoOrdenable claro columna="confirmado" orden={orden} onClick={cambiarOrden}>
                  Confirmado
                </EncabezadoOrdenable>
                <EncabezadoOrdenable claro columna="datos" orden={orden} onClick={cambiarOrden}>
                  Datos
                </EncabezadoOrdenable>
                <EncabezadoOrdenable claro columna="pagado" orden={orden} onClick={cambiarOrden}>
                  Pagado
                </EncabezadoOrdenable>
                <span></span>
              </div>
              {/* Fila de filtros, subida aquí junto a la cabecera de
                  columnas (antes vivía sola en la caja blanca) -- a
                  petición del usuario, 2026-08-18: "quiero que los campos
                  que están debajo de los encabezados sean parte de la
                  cabecera de la lista invitados". Mismo `columnasTabla`
                  que la fila de arriba, sin ningún hueco entre columnas
                  (columna y filtro pegados, a petición del usuario) --
                  así que siguen coincidiendo columna a columna entre sí y
                  con la tabla de más abajo. */}
              <div
                className="grid pb-1"
                // marginBottom: -12 contrarresta el pb-3 (12px) que
                // VentanaFlotante.jsx aplica siempre al final de
                // `subtitulo` -- sin esto quedaba una franja verde
                // vacía entre los filtros y la lista blanca de abajo,
                // señalada por el usuario, 2026-08-20 (mismo tipo de
                // arreglo que el marginTop:-16 ya usado para el hueco
                // equivalente del lado del cuerpo).
                style={{
                  gridTemplateColumns: anchosColumnas ?? columnasTabla,
                  width: anchoTabla ?? undefined,
                  marginBottom: -12,
                }}
              >
                <TextInput
                  value={filtros.texto}
                  onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
                  placeholder="Buscar..."
                  // Sin contorno, fondo transparente, mismas letras que
                  // la cabecera de columnas (color + fuente) -- a
                  // petición del usuario, 2026-08-20.
                  style={{
                    border: "none",
                    background: "transparent",
                    color: C.goldClaro,
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: "2px 5px",
                    fontSize: 12,
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                />
                <select
                  value={filtros.grupoFamiliar}
                  onChange={(e) => setFiltros({ ...filtros, grupoFamiliar: e.target.value })}
                  // Sin contorno, fondo transparente, mismas letras que
                  // la cabecera de columnas (color + fuente) -- a
                  // petición del usuario, 2026-08-20.
                  style={{
                    ...inputStyle,
                    border: "none",
                    background: "transparent",
                    color: C.goldClaro,
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: "2px 4px",
                    fontSize: 12,
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
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
                  // Sin contorno, fondo transparente, mismas letras que
                  // la cabecera de columnas (color + fuente) -- a
                  // petición del usuario, 2026-08-20.
                  style={{
                    ...inputStyle,
                    border: "none",
                    background: "transparent",
                    color: C.goldClaro,
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: "2px 4px",
                    fontSize: 12,
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
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
                  // Sin contorno, fondo transparente, mismas letras que
                  // la cabecera de columnas (color + fuente) -- a
                  // petición del usuario, 2026-08-20.
                  style={{
                    ...inputStyle,
                    border: "none",
                    background: "transparent",
                    color: C.goldClaro,
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: "2px 4px",
                    fontSize: 12,
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
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
                  // Sin contorno, fondo transparente, mismas letras que
                  // la cabecera de columnas (color + fuente) -- a
                  // petición del usuario, 2026-08-20.
                  style={{
                    ...inputStyle,
                    border: "none",
                    background: "transparent",
                    color: C.goldClaro,
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: "2px 4px",
                    fontSize: 12,
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
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
                  // Sin contorno, fondo transparente, mismas letras que
                  // la cabecera de columnas (color + fuente) -- a
                  // petición del usuario, 2026-08-20.
                  style={{
                    ...inputStyle,
                    border: "none",
                    background: "transparent",
                    color: C.goldClaro,
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: "2px 4px",
                    fontSize: 12,
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Todos</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="tentativa">Sin confirmar</option>
                </select>
                <select
                  value={filtros.datos}
                  onChange={(e) => setFiltros({ ...filtros, datos: e.target.value })}
                  // Sin contorno, fondo transparente, mismas letras que
                  // la cabecera de columnas (color + fuente) -- a
                  // petición del usuario, 2026-08-20.
                  style={{
                    ...inputStyle,
                    border: "none",
                    background: "transparent",
                    color: C.goldClaro,
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: "2px 4px",
                    fontSize: 12,
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Todos</option>
                  <option value="completo">Completos</option>
                  <option value="pendiente">Por recopilar</option>
                </select>
                <select
                  value={filtros.pagado}
                  onChange={(e) => setFiltros({ ...filtros, pagado: e.target.value })}
                  // Sin contorno, fondo transparente, mismas letras que
                  // la cabecera de columnas (color + fuente) -- a
                  // petición del usuario, 2026-08-20.
                  style={{
                    ...inputStyle,
                    border: "none",
                    background: "transparent",
                    color: C.goldClaro,
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: "2px 4px",
                    fontSize: 12,
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Todos</option>
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                </select>
                <span />
              </div>
            </div>
          </div>
        }
        extra={
          <div className="flex items-center gap-2">
            {/* Previstos/Sin confirmar/Confirmados/Edad media: mudados
                aquí desde "Progreso de recopilación" -- sitio libre en
                esta cabecera ahora que los 6 botones caben en un solo
                "Acciones", a petición del usuario, 2026-08-20.
                Agrupados de dos en dos dentro de su propio recuadro con
                borde dorado (Previstos+Sin confirmar por un lado,
                Confirmados+Edad media por otro) -- a petición del
                usuario, para diferenciarlos visualmente como dos
                bloques en vez de 4 sueltos. */}
            {[resumen.slice(0, 2), resumen.slice(2, 4)].map((grupo, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded px-2 py-1"
                style={{ border: `1px solid ${C.gold}` }}
              >
                {grupo.map((s) => (
                  <div key={s.label} className="text-center">
                    <div
                      className="text-[10px] uppercase"
                      style={{ color: C.goldClaro, opacity: 0.75, fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {s.label}
                    </div>
                    <div
                      className="text-sm font-bold rounded px-2 mt-0.5 inline-block"
                      style={{ background: "rgba(239,233,222,0.92)", color: C.ink, fontFamily: "'Fraunces', serif" }}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {/* Los 6 botones sueltos (Imprimir/Canciones/Alergias/Añadir/
                Editar/Importar) se esconden en un desplegable
                ("Acciones"), mismo MenuFlotante que usa el resto de la
                app -- a petición del usuario, 2026-08-20.
                `opcionesMenuInvitados` se construye más arriba, junto al
                resto de estado de esta ventana. */}
            <MenuFlotante
              anchor="bottom-left"
              opciones={opcionesMenuInvitados}
              render={({ ref, toggle }) => (
                <button
                  ref={ref}
                  onClick={toggle}
                  className="flex items-center justify-center gap-1 text-xs px-2 py-1 rounded"
                  style={{ border: `1px solid ${C.gold}`, color: C.goldClaro }}
                  title="Imprimir, canciones, alergias, añadir, editar o importar"
                >
                  <MoreHorizontal size={14} /> Acciones
                </button>
              )}
            />
          </div>
        }
      >
        {/* -16px: contrarresta el `p-4` (16px) de arriba del cuerpo de la
            ventana -- sin esto quedaba un hueco vacío entre la barra
            verde de filtros y la primera fila de la tabla (señalado en
            rojo por el usuario en una captura), del mismo color de fondo
            que el resto de la ventana (C.paper) y sin ningún elemento
            dentro. Solo se toca el margen SUPERIOR: los laterales y el
            inferior se quedan con el padding normal del cuerpo. */}
        <div style={{ marginTop: -16 }}>
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
          <div ref={tablaRef} style={{ minWidth: 780 }}>
            {/* La cabecera de columnas Y la fila de filtros
                (Invitado/Familia/... y sus buscadores) viven ahora en la
                barra verde de la ventana (subtitulo, más arriba) -- a
                petición del usuario, 2026-08-18. Aquí solo quedan las
                filas de datos. */}
            <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
            {invitadosOrdenados.map((g, i) => {
              // Zebra por FILA, de vuelta a como estaba (blanco/paperDark
              // en el propio fondo de la fila) -- el sombreado por
              // columna de la ronda anterior no lo sustituía, se quedaba
              // corto: era un AÑADIDO aparte, un verde muy suave por
              // encima. A petición del usuario, 2026-08-18: "quiero las
              // filas alternas como estaban antes, el sombreado alterno
              // para las columnas un verde muy muy suave, solo era
              // añadir esto último". `celda` sigue centrando el
              // contenido (coincide con la cabecera, ya centrada) y ahora
              // solo aporta el lavado verde translúcido de las columnas
              // impares -- las pares quedan transparentes, dejando ver el
              // zebra de la fila tal cual.
              const celda = (idx, extra) => ({
                background: idx % 2 === 1 ? "rgba(31,58,46,0.07)" : "transparent",
                display: "flex",
                alignItems: "center",
                // Datos alineados a la izquierda de su celda, con el
                // padding de 6px de siempre como margen -- antes
                // centrados (a petición del usuario, 2026-08-18), ahora
                // a la izquierda (a petición del usuario, 2026-08-20).
                // Solo afecta a las filas de datos; la cabecera de
                // columnas y los filtros se quedan centrados.
                justifyContent: "flex-start",
                textAlign: "left",
                padding: "8px 6px",
                // Ver el mismo `minWidth: 0` en EncabezadoOrdenable
                // (Widgets.jsx) -- aquí hace falta por el mismo motivo:
                // sin él, un nombre largo o el texto de un <select>
                // puede ensanchar ESTA fila más que su `fr`, y esa
                // columna deja de coincidir con la cabecera/filtro de
                // arriba (que tienen su propio contenido, más corto o
                // más largo).
                minWidth: 0,
                ...extra,
              });
              return (
                <div
                  key={g.id}
                  ref={i === 0 ? filaEjemploRef : undefined}
                  className="grid text-sm"
                  style={{
                    gridTemplateColumns: anchosColumnas ?? columnasTabla,
                    background: i % 2 ? C.paperDark : "#fff",
                    fontFamily: "'Inter', sans-serif",
                    color: C.charcoal,
                  }}
                >
                  <span style={celda(0)}>
                    {modoEdicion ? (
                      <span className="flex gap-1 w-full">
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
                  <span style={celda(1)}>
                    {modoEdicion ? (
                      <GrupoFamiliarInput
                        value={g.grupoFamiliar ?? g.apellido ?? ""}
                        onCommit={(v) => asignarGrupoFamiliar(g.id, v)}
                      />
                    ) : (
                      g.grupoFamiliar || g.apellido || "—"
                    )}
                  </span>
                  <span style={celda(2)}>
                    {modoEdicion ? (
                      <GrupoFamiliarInput
                        value={g.zona ?? ""}
                        onCommit={(v) => asignarZona(g.id, v)}
                      />
                    ) : (
                      g.zona || "—"
                    )}
                  </span>
                  <span className="text-xs gap-1" style={celda(3)}>
                    <select
                      value={g.colaboradorId || ""}
                      onChange={(e) => asignarColaborador(g.id, e.target.value)}
                      // Sin borde y sin el fondo blanco de inputStyle --
                      // transparente, para que se vea el fondo real de
                      // la celda (que alterna por fila y por columna)
                      // en vez de una caja blanca encima -- a petición
                      // del usuario, 2026-08-20.
                      style={{ ...inputStyle, border: "none", background: "transparent", padding: "3px 5px", fontSize: 12, width: "100%", minWidth: 0 }}
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
                  <span className="text-xs" style={celda(4)}>
                    <select
                      value={g.mesa || ""}
                      onChange={(e) => asignarMesa(g.id, e.target.value)}
                      // Deshabilitado hasta que el invitado esté
                      // confirmado -- la mesa es sitio real para quien
                      // va a venir de verdad, y el contador (X/N) solo
                      // cuenta confirmados; asignar antes de confirmar
                      // hacía que ese contador pareciera "no
                      // actualizarse" al añadir gente sin confirmar. A
                      // petición del usuario, 2026-08-20.
                      disabled={!g.confirmado}
                      title={g.confirmado ? undefined : "Confirma primero a este invitado para poder asignarle mesa"}
                      style={{
                        ...inputStyle,
                        // Sin borde y sin el fondo blanco de inputStyle
                        // -- transparente, para que se vea el fondo real
                        // de la celda (que alterna por fila y por
                        // columna) en vez de una caja blanca encima --
                        // a petición del usuario, 2026-08-20.
                        border: "none",
                        background: "transparent",
                        padding: "3px 5px",
                        fontSize: 12,
                        width: "100%",
                        minWidth: 0,
                        opacity: g.confirmado ? 1 : 0.5,
                      }}
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
                  {/* Confirmado/Datos/Pagado comparten ahora el mismo
                      lenguaje visual: SÍ -> solo un check (centrado,
                      grande), NO -> solo "No" en mayúscula/cursiva/
                      negrita, centrado en la celda -- sin sellos ni
                      texto de más, a petición del usuario, 2026-08-20
                      ("solo tengan o check de ok y la palabra NO").
                      El "No" de Datos conserva el color de aviso
                      (C.wax) que ya tenía -- a diferencia de
                      Confirmado/Pagado, que no necesitan llamar la
                      atención tanto. */}
                  <span style={celda(5, { justifyContent: "center", textAlign: "center" })}>
                    <button
                      onClick={() => toggleConfirmar(g.id)}
                      className="flex items-center justify-center w-full"
                    >
                      {g.confirmado ? (
                        <Check size={20} style={{ color: C.ink }} />
                      ) : (
                        <span
                          className="text-xs font-bold italic uppercase"
                          style={{ color: C.charcoal, opacity: 0.7 }}
                        >
                          No
                        </span>
                      )}
                    </button>
                  </span>
                  <span style={celda(6, { justifyContent: "center", textAlign: "center" })}>
                    {g.confirmado ? (
                      datosCompletos(g) ? (
                        <Check size={20} style={{ color: C.ink }} />
                      ) : (
                        <span
                          className="text-xs font-bold italic uppercase"
                          style={{ color: C.wax }}
                        >
                          No
                        </span>
                      )
                    ) : (
                      <span className="text-xs" style={{ opacity: 0.5 }}>
                        —
                      </span>
                    )}
                  </span>
                  <span style={celda(7, { justifyContent: "center", textAlign: "center" })}>
                    {g.confirmado ? (
                      g.pagado ? (
                        <Check size={20} style={{ color: C.ink }} />
                      ) : (
                        <span
                          className="text-xs font-bold italic uppercase"
                          style={{ color: C.charcoal, opacity: 0.7 }}
                          title="Se confirma desde la vista del colaborador"
                        >
                          No
                        </span>
                      )
                    ) : (
                      <span className="text-xs" style={{ opacity: 0.5 }}>
                        —
                      </span>
                    )}
                  </span>
                  <button onClick={() => eliminarInvitado(g.id)} style={celda(8)}>
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
        </div>
        </div>
      </VentanaFlotante>

      {mostrarResumenAsignacion && (
        <ModalFlotante
          titulo="Resumen de asignaciones"
          onCerrar={cancelarAvisosAsignacion}
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
                  <span>Familia</span>
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
                      <span>{g.confirmado ? "Sí" : "Sin confirmar"}</span>
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
    </>
  );
}
