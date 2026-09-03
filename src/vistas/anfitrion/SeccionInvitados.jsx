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
import { useState } from "react";
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
  Tag,
  Star,
  ShieldOff,
  ClipboardCheck,
} from "lucide-react";
import { C, inputStyle } from "../../theme";
import { uid } from "../../lib/id";
import { datosCompletos, tieneAlergiaReal, resolverColaborador, parseImport, calcularEdad, edadPromedio } from "../../lib/invitados";
import { ordenarPorApellidoNombre } from "../../lib/formato";
import { ROL_FAMILIAR, LETRA_ROL, NOMBRE_ROL } from "../../lib/rolFamiliar";
import { contarMatrimonios, conyugesSueltos, anioDelEvento } from "../../lib/matrimonios";
import { descargarCSV } from "../../lib/descargas";
import { TextInput } from "../../components/Formulario";
import { EncabezadoOrdenable, GrupoFamiliarInput } from "../../components/Widgets";
import { VentanaFlotante, ModalFlotante } from "../../components/VentanaFlotante";
import { MenuFlotante } from "../../components/MenuFlotante";
import { InformeInvitados } from "../../components/InformeInvitados";
import { revisarInvitados } from "../../lib/revisionInvitados";

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
  // Presentes solo cuando esta sección vive en una ventana de verdad
  // del sistema operativo (usePopupWindow.js): `ventana` es el objeto
  // window de ESA ventana y `fijo` quita el marco flotante, que ahí lo
  // pone el sistema. Ver la regla de CLAUDE.md sobre no usar nunca
  // `window`/`document`/`alert` a secas dentro de una emergente.
  ventana,
  fijo,
}) {
  const { evento, persistEvento, colaboradores, invitados, mesas, persistInvitados, avisarColaborador } = data;

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
  const [mostrarRevision, setMostrarRevision] = useState(false);
  // Avisos de la propia interfaz, NUNCA `window.alert`: dentro de una
  // ventana emergente ese diálogo sale en la pestaña principal (o no
  // sale) y además bloquea. Ya nos costó una ronda de bugs en Novedades.
  const [aviso, setAviso] = useState("");

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
        rolFamiliar: "",
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

  // "esposo" | "esposa" | "hijo" | "" (unidad suelta) -- ver
  // lib/rolFamiliar.js y lib/matrimonios.js.
  const asignarRolFamiliar = (id, rolFamiliar) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, rolFamiliar } : g)));
  };

  const asignarMesa = (id, mesaValue) => {
    setAviso("");
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
      setAviso("Este invitado todavía no está confirmado: confírmalo antes de asignarle mesa.");
      return;
    }
    if (numero) {
      const mesa = mesas.find((m) => m.numero === numero);
      const yaEnEstaMesa = invitadoActual && invitadoActual.mesa === numero;
      if (mesa && !yaEnEstaMesa && ocupacionMesa(numero) >= mesa.capacidad) {
        setAviso(`La mesa ${numero} ya está completa (${mesa.capacidad}/${mesa.capacidad}).`);
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
      rolFamiliar: "",
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

  // ---------- Rol de trabajo (2026-08-27) ----------
  // Un invitado que además trabaja EL DÍA del evento (empezando por
  // "acomodador") -- distinto de "colaborador" a propósito: no da
  // ningún acceso a la app, es solo una etiqueta para poder asignarlo
  // a un bloque del cronograma. Catálogo ABIERTO: no hay ninguna lista
  // fija en el código -- el propio anfitrión escribe el nombre del rol
  // la primera vez que lo necesita, y a partir de ahí ya aparece como
  // opción para cualquier otro invitado (se calcula solo, mirando qué
  // roles ya se han usado -- ninguna tabla ni columna de catálogo
  // aparte que mantener).
  const [invitadoRolAbierto, setInvitadoRolAbierto] = useState(null);
  const [nuevoRolTexto, setNuevoRolTexto] = useState("");
  const rolesConocidos = [
    ...new Set(invitados.flatMap((g) => (Array.isArray(g.rolesTrabajo) ? g.rolesTrabajo : []))),
  ].sort();

  const alternarRolTrabajo = (id, rol) => {
    persistInvitados(
      invitados.map((g) => {
        if (g.id !== id) return g;
        const actuales = Array.isArray(g.rolesTrabajo) ? g.rolesTrabajo : [];
        const siguientes = actuales.includes(rol) ? actuales.filter((r) => r !== rol) : [...actuales, rol];
        return { ...g, rolesTrabajo: siguientes };
      })
    );
  };

  // Excluir del acceso al tablón público (2026-08-29): nombres que
  // nunca deben servir como respuesta válida, aunque el invitado esté
  // confirmado -- empezando por el propio anfitrión, cuyo nombre es
  // información pública (ver schema.sql, "excluidoTablon").
  const alternarExcluidoTablon = (id) => {
    persistInvitados(invitados.map((g) => (g.id === id ? { ...g, excluidoTablon: !g.excluidoTablon } : g)));
  };

  const anadirRolNuevo = (id) => {
    const rol = nuevoRolTexto.trim();
    if (!rol) return;
    alternarRolTrabajo(id, rol);
    setNuevoRolTexto("");
  };

  // Responsable de un rol -- UNO SOLO para todo el evento, sea cual sea
  // el bloque del cronograma donde trabaje ese rol (a petición del
  // usuario: "el capitán de acomodadores será el mismo durante todo el
  // evento"). Vive en evento.rolesTrabajoResponsables ({ rol: invitadoId }),
  // no en el invitado ni en el bloque -- un único mapa por rol, para
  // que sirva igual si "acomodador" apareciera en más de un bloque.
  const responsablesRol = evento.rolesTrabajoResponsables || {};
  const marcarResponsable = (rol, invitadoId) => {
    const actual = responsablesRol[rol];
    const siguientes = { ...responsablesRol };
    if (actual === invitadoId) {
      delete siguientes[rol];
    } else {
      siguientes[rol] = invitadoId;
    }
    persistEvento({ ...evento, rolesTrabajoResponsables: siguientes });
  };

  const imprimirPanelActivo = () => {
    setTimeout(() => {
      try {
        (ventana || window).print();
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
  // El "numerito" ya existe en el filtro de Rol; se aplica igual aquí,
  // a petición del usuario (2026-09-05).
  const porZona = invitados.reduce((cuenta, g) => {
    const clave = g.zona || "sin";
    cuenta[clave] = (cuenta[clave] || 0) + 1;
    return cuenta;
  }, {});
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
      // "matrimonio" = los dos cónyuges (O y A), sin los hijos: el
      // filtro se llama "Mat." y tiene que enseñar exactamente eso.
      // "sin" = SIN REVISAR (el vacío ya no significa "suelto": para
      // eso está la S, que dice que esa fila ya se ha mirado).
      if (
        filtros.rolFamiliar === "matrimonio" &&
        g.rolFamiliar !== ROL_FAMILIAR.ESPOSO &&
        g.rolFamiliar !== ROL_FAMILIAR.ESPOSA
      )
        return false;
      if (filtros.rolFamiliar === "sin" && g.rolFamiliar) return false;
      if (Object.values(ROL_FAMILIAR).includes(filtros.rolFamiliar) && g.rolFamiliar !== filtros.rolFamiliar)
        return false;
      if (filtros.zona && g.zona !== filtros.zona) return false;
      if (filtros.anioBoda === "con" && !g.anioBoda) return false;
      if (filtros.anioBoda === "sin" && g.anioBoda) return false;
      if (filtros.colaboradorId) {
        const col = resolverColaborador(g, colaboradores);
        if (!col || col.id !== filtros.colaboradorId) return false;
      }
      if (filtros.mesa === "sin" && g.mesa) return false;
      if (filtros.mesa && filtros.mesa !== "sin" && String(g.mesa || "") !== filtros.mesa) return false;
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
          // Sin año, al final: lo que se busca al ordenar por aquí son
          // los que sí lo tienen.
          case "anioBoda":
            return parseInt(g.anioBoda, 10) || 9999;
          // Los cónyuges arriba y juntos por familia: es como se
          // repasan cuando lo que buscas son los matrimonios.
          case "rolFamiliar":
            return `${g.rolFamiliar ? "0" : "1"}${(g.grupoFamiliar || g.apellido || "").toLowerCase()}${g.rolFamiliar || ""}`;
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
  // Familia 1fr -> 1.3fr, Confirmado 0.9fr -> 1.2fr, Colaborador
  // 1.3fr -> 1.8fr (mismo ancho que Invitado): mismo motivo, a
  // petición del usuario, 2026-08-20.
  // Definición de columnas ÚNICA: la comparten la cabecera, los filtros
  // y las filas, que desde la v22.2 viven dentro del mismo contenedor
  // (ver `cabeceraTabla`). Antes había que medir en píxeles para que dos
  // rejillas separadas coincidieran -- el navegador redondea las
  // fracciones `fr` de forma independiente en cada una, así que a partir
  // de la 2ª o 3ª columna se descuadraban solas. Siendo una sola pieza,
  // ese problema no puede existir.
  // ⚠️ La última columna (los tres iconos de acción) mide 92px FIJOS, no
  // "auto". Con "auto" el navegador la ajusta a su contenido, y ese
  // contenido es distinto en cada rejilla: tres botones en las filas y
  // nada en la cabecera y en los filtros. Así que cada una le daba una
  // anchura distinta, el sobrante se repartía distinto entre las `fr`, y
  // las columnas se iban descuadrando cada vez más hacia la derecha --
  // lo vio el usuario el 2026-09-05 y dio con la causa: "tienen tres
  // iconos al final que no tienen encabezado, están ocupando espacio del
  // resto". Con una medida fija, las tres rejillas parten de lo mismo.
  const columnasTabla = "1.6fr 1.1fr 0.5fr 0.8fr 0.9fr 1.5fr 1.1fr 1fr 0.8fr 0.8fr 92px";
  // Recuadro que diferencia cada columna en la barra verde (cabecera +
  // filtros), en vez de las pequeñas líneas divisorias de antes (ya
  // quitadas de EncabezadoOrdenable para `claro`) -- sombra suave y
  // TRANSPARENTE (blanco al 7%, no un color sólido: se sigue viendo el
  // verde de fondo) alternando por columna, igual que ya se hace en las
  // filas de datos de más abajo (pero ahí es oscuro sobre blanco; aquí
  // claro sobre verde oscuro). El mismo tono en la celda de cabecera y
  // en la de su filtro justo debajo (con las esquinas redondeadas solo
  // arriba/abajo respectivamente) hace que las dos lean como un único
  // recuadro que "incluye nombre y filtro" -- a petición del usuario,
  // 2026-08-20.
  const tintaColumnaCabecera = (idx) => (idx % 2 === 1 ? "rgba(255,255,255,0.07)" : "transparent");

  const idsSueltos = new Set(conyugesSueltos(invitados).map((g) => g.id));
  // Los años que cumplen EL DÍA DEL EVENTO, no hoy: es el número que va
  // en el sello de la foto de cada pareja.
  const anioEvento = anioDelEvento(evento.fecha);
  const aniversarioDe = (g) => {
    const anio = parseInt(g.anioBoda, 10);
    return anioEvento && Number.isFinite(anio) && anio > 1900 ? anioEvento - anio : null;
  };
  // Informe de revisión: solo lee, no toca nada. Ver
  // lib/revisionInvitados.js para lo que comprueba y por qué.
  const hallazgos = revisarInvitados(invitados, evento);
  // El "numerito" que pidió el usuario, pero dentro del propio filtro:
  // así se ven los cinco papeles a la vez, en vez de tener que filtrar
  // uno por uno para saber cuántos hay de cada.
  const totalMatrimonios = contarMatrimonios(invitados);
  const porRol = invitados.reduce((cuenta, g) => {
    const clave = g.rolFamiliar || "sin";
    cuenta[clave] = (cuenta[clave] || 0) + 1;
    return cuenta;
  }, {});
  const conCuenta = (texto, clave) => `${texto} (${porRol[clave] || 0})`;
  const sinRevisar = invitados.filter((g) => !g.rolFamiliar).length;
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
    // Matrimonios: un esposO + una esposA dentro del mismo grupo
    // familiar (2026-09-03). Ver lib/matrimonios.js.
    { label: "Matrimonios", value: totalMatrimonios },
    // Solo aparece si hay algo que corregir: en cuanto está todo
    // emparejado, deja de ocupar sitio.
    ...(idsSueltos.size ? [{ label: "Sin pareja", value: idsSueltos.size, alerta: true }] : []),
    // Cuánto queda por repasar: es lo que hace útil que el vacío
    // signifique "sin revisar" y no "suelto". Desaparece al terminar.
    ...(sinRevisar ? [{ label: "Sin revisar", value: sinRevisar }] : []),
    // Solo con algún filtro puesto: si no, repetiría "Previstos".
    ...(invitadosOrdenados.length !== totalInvitados
      ? [{ label: "Mostrando", value: `${invitadosOrdenados.length}/${totalInvitados}` }]
      : []),
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
  const erroresRevision = hallazgos.filter((h) => h.tipo === "error").length;
  const opcionesMenuInvitados = [
    {
      id: "revision",
      // Escondido aquí a petición del usuario (2026-09-04): arriba de la
      // lista ocupaba sitio siempre. El número va en la etiqueta para
      // que un fallo se vea sin tener que abrir el menú -- si no, un
      // informe escondido es un informe que nadie mira.
      etiqueta: (mostrarRevision ? "✓ " : "") + "Revisión" + (erroresRevision ? ` (${erroresRevision})` : ""),
      icono: ClipboardCheck,
      ...(erroresRevision ? { fondo: C.peligro, color: "#fff" } : {}),
      onClick: () => setMostrarRevision((v) => !v),
    },
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

  // ---------- Cabecera de columnas + filtros ----------
  // ⚠️ Viven DENTRO del mismo contenedor que las filas, compartiendo la
  // MISMA definición de rejilla (`columnasTabla`). No es un detalle: son
  // una sola pieza, y por eso cuadran por construcción.
  //
  // Hasta la v22.1 vivían en la barra verde de la ventana, o sea en OTRO
  // sitio del documento, y se hacían coincidir midiendo en píxeles el
  // ancho de cada columna abajo para copiárselo arriba. De ahí salieron,
  // uno detrás de otro: la cabecera saliéndose del marco, una sola
  // columna ocupándolo todo, dos columnas gigantes, los filtros
  // recortados por abajo. Todos el mismo fallo -- una medida tomada en
  // mal momento. El usuario lo vio antes que yo: "en realidad la lista
  // debería ser todo una sola pieza".
  //
  // `sticky`: se quedan pegados arriba al desplazar la lista, así que se
  // siguen viendo como la cabecera de siempre.
  const cabeceraTabla = (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        background: C.ink,
        borderBottom: `1px solid ${C.gold}`,
      }}
    >
<div className="flex flex-col gap-1">
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
            <div className="rounded" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
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
                  gridTemplateColumns: columnasTabla,
                  color: C.goldClaro,
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: "0.03em",
                }}
              >
                <span style={{ background: tintaColumnaCabecera(0), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="invitado" orden={orden} onClick={cambiarOrden}>
                    Invitado
                  </EncabezadoOrdenable>
                </span>
                <span style={{ background: tintaColumnaCabecera(1), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="grupoFamiliar" orden={orden} onClick={cambiarOrden}>
                    Familia
                  </EncabezadoOrdenable>
                </span>
                {/* Papel en la familia: O esposo, A esposa, H hijo, y en
                    blanco una unidad suelta (2026-09-04). Sirve
                    para contar los matrimonios y para la ventana
                    "Matrimonios" -- cada pareja tiene su foto de boda y
                    se les hará otra en el evento. */}
                <span style={{ background: tintaColumnaCabecera(2), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="rolFamiliar" orden={orden} onClick={cambiarOrden}>
                    Rol
                  </EncabezadoOrdenable>
                </span>
                {/* Año de boda y los años que cumplen EN EL AÑO DEL
                    EVENTO -- el número del sello de "Las bodas de
                    todos". Vive aquí, y no en una ventana aparte, desde
                    que se quitó la de Matrimonios: filtrando por O sale
                    una fila por pareja, que es justo esa lista
                    (2026-09-04). */}
                <span style={{ background: tintaColumnaCabecera(3), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="anioBoda" orden={orden} onClick={cambiarOrden}>
                    Boda
                  </EncabezadoOrdenable>
                </span>
                <span style={{ background: tintaColumnaCabecera(4), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="zona" orden={orden} onClick={cambiarOrden}>
                    Zona
                  </EncabezadoOrdenable>
                </span>
                <span style={{ background: tintaColumnaCabecera(5), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="colaborador" orden={orden} onClick={cambiarOrden}>
                    Colaborador
                  </EncabezadoOrdenable>
                </span>
                <span style={{ background: tintaColumnaCabecera(6), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="mesa" orden={orden} onClick={cambiarOrden}>
                    Mesa
                  </EncabezadoOrdenable>
                </span>
                <span style={{ background: tintaColumnaCabecera(7), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="confirmado" orden={orden} onClick={cambiarOrden}>
                    Confirm.
                  </EncabezadoOrdenable>
                </span>
                <span style={{ background: tintaColumnaCabecera(8), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="datos" orden={orden} onClick={cambiarOrden}>
                    Datos
                  </EncabezadoOrdenable>
                </span>
                <span style={{ background: tintaColumnaCabecera(9), borderRadius: "6px 6px 0 0" }}>
                  <EncabezadoOrdenable claro sinDivisor columna="pagado" orden={orden} onClick={cambiarOrden}>
                    Pagado
                  </EncabezadoOrdenable>
                </span>
                <span style={{ background: tintaColumnaCabecera(10), borderRadius: "6px 6px 0 0" }}></span>
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
                  gridTemplateColumns: columnasTabla,
                }}
              >
                {/* Cada celda de filtro va envuelta en el mismo recuadro
                    (misma `tintaColumnaCabecera(idx)`) que su cabecera
                    de arriba, con las esquinas redondeadas solo abajo --
                    juntas, cabecera+filtro se leen como un único
                    recuadro por columna, a petición del usuario,
                    2026-08-20. */}
                <span style={{ background: tintaColumnaCabecera(0), borderRadius: "0 0 6px 6px" }}>
                  <TextInput
                    value={filtros.texto}
                    onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
                    placeholder="Buscar..."
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
                </span>
                <span style={{ background: tintaColumnaCabecera(1), borderRadius: "0 0 6px 6px" }}>
                  <select
                    value={filtros.grupoFamiliar}
                    onChange={(e) => setFiltros({ ...filtros, grupoFamiliar: e.target.value })}
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
                </span>
                <span style={{ background: tintaColumnaCabecera(2), borderRadius: "0 0 6px 6px" }}>
                  <select
                    value={filtros.rolFamiliar}
                    onChange={(e) => setFiltros({ ...filtros, rolFamiliar: e.target.value })}
                    style={{
                      ...inputStyle,
                      border: "none",
                      background: "transparent",
                      color: C.goldClaro,
                      fontFamily: "'IBM Plex Mono', monospace",
                      padding: "2px 0",
                      fontSize: 12,
                      width: "100%",
                      minWidth: 0,
                      // Misma razón que en la celda de datos: la flecha
                      // no cabe en una columna tan estrecha.
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      textAlign: "center",
                      textAlignLast: "center",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                    title="Filtrar por papel en la familia"
                  >
                    <option value="">Todos</option>
                    {/* PAREJAS, no personas: 48 matrimonios, aunque al
                        elegirlo se vean sus 96 filas. Poner 96 aquí era
                        contar cónyuges y llamarlos matrimonios. */}
                    <option value="matrimonio">Mat. ({totalMatrimonios})</option>
                    <option value={ROL_FAMILIAR.ESPOSO}>{conCuenta("O", ROL_FAMILIAR.ESPOSO)}</option>
                    <option value={ROL_FAMILIAR.ESPOSA}>{conCuenta("A", ROL_FAMILIAR.ESPOSA)}</option>
                    <option value={ROL_FAMILIAR.HIJO}>{conCuenta("H", ROL_FAMILIAR.HIJO)}</option>
                    <option value={ROL_FAMILIAR.PADRE}>{conCuenta("P", ROL_FAMILIAR.PADRE)}</option>
                    <option value={ROL_FAMILIAR.SUELTO}>{conCuenta("S", ROL_FAMILIAR.SUELTO)}</option>
                    <option value="sin">{conCuenta("Sin revisar", "sin")}</option>
                  </select>
                </span>
                <span style={{ background: tintaColumnaCabecera(3), borderRadius: "0 0 6px 6px" }}>
                  <select
                    value={filtros.anioBoda}
                    onChange={(e) => setFiltros({ ...filtros, anioBoda: e.target.value })}
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
                    title="Filtrar por año de boda"
                  >
                    <option value="">Todos</option>
                    <option value="con">Con año</option>
                    <option value="sin">Sin año</option>
                  </select>
                </span>
                <span style={{ background: tintaColumnaCabecera(4), borderRadius: "0 0 6px 6px" }}>
                  <select
                    value={filtros.zona}
                    onChange={(e) => setFiltros({ ...filtros, zona: e.target.value })}
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
                        {z} ({porZona[z] || 0})
                      </option>
                    ))}
                  </select>
                </span>
                <span style={{ background: tintaColumnaCabecera(5), borderRadius: "0 0 6px 6px" }}>
                  <select
                    value={filtros.colaboradorId}
                    onChange={(e) => setFiltros({ ...filtros, colaboradorId: e.target.value })}
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
                </span>
                <span style={{ background: tintaColumnaCabecera(6), borderRadius: "0 0 6px 6px" }}>
                  <select
                    value={filtros.mesa}
                    onChange={(e) => setFiltros({ ...filtros, mesa: e.target.value })}
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
                    {/* "Sin mesa" vive aquí, en el filtro, y no en el
                        informe de revisión: la lista es la raíz y esto
                        se puede mirar columna a columna. */}
                    <option value="sin">Sin mesa</option>
                    {mesas.map((m) => (
                      <option key={m.numero} value={String(m.numero)}>
                        {m.numero}
                      </option>
                    ))}
                  </select>
                </span>
                <span style={{ background: tintaColumnaCabecera(7), borderRadius: "0 0 6px 6px" }}>
                  <select
                    value={filtros.confirmado}
                    onChange={(e) => setFiltros({ ...filtros, confirmado: e.target.value })}
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
                </span>
                <span style={{ background: tintaColumnaCabecera(8), borderRadius: "0 0 6px 6px" }}>
                  <select
                    value={filtros.datos}
                    onChange={(e) => setFiltros({ ...filtros, datos: e.target.value })}
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
                </span>
                <span style={{ background: tintaColumnaCabecera(9), borderRadius: "0 0 6px 6px" }}>
                  <select
                    value={filtros.pagado}
                    onChange={(e) => setFiltros({ ...filtros, pagado: e.target.value })}
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
                </span>
                <span style={{ background: tintaColumnaCabecera(10), borderRadius: "0 0 6px 6px" }} />
              </div>
            </div>
          </div>
    </div>
  );

  return (
    <>

      {/* ⚠️ Al imprimir desde el modal, la lista de detrás sigue
          OCUPANDO SITIO: la regla de impresión la vuelve invisible
          (`visibility: hidden`), pero eso no quita el hueco -- 140 filas
          de hueco, que son las cinco páginas y media en blanco que salían
          antes de empezar a imprimir de verdad (visto por el usuario,
          2026-09-05). Con `display: none` desaparece de la maquetación y
          el papel empieza donde tiene que empezar. */}
      <div className={panelFlotante ? "oculto-al-imprimir" : undefined}>
      <VentanaFlotante
        clave="invitados"
        titulo="Lista de invitados"
        fijo={fijo}
        onCerrar={intentarCerrarInvitados}
        // Lo bastante ancha para que las columnas Y sus filtros quepan
        // ENTEROS nada más abrirla, sin desplazamiento lateral: es una
        // ventana que se mira de un vistazo. 940px -> 1260px porque la
        // tabla pasó de 9 a 11 columnas y su ancho mínimo subió a 1180
        // (v21.7): la cabecera se salía por fuera del marco y parecía
        // sin terminar -- señalado por el usuario, 2026-09-04.
        // 1180 de tabla + 32 de padding del cuerpo + margen.
        ancho="min(1260px, calc(100vw - 48px))"
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
            {[resumen.slice(0, 2), resumen.slice(2, 4), resumen.slice(4)].map((grupo, i) => (
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
                      style={{
                        background: s.alerta ? C.avisoFondo : "rgba(239,233,222,0.92)",
                        color: s.alerta ? C.peligro : C.ink,
                        fontFamily: "'Fraunces', serif",
                      }}
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
        <div
          style={{
            marginTop: -16,
            // En ventana propia, esta columna reparte el alto: lo que no
            // ocupan los avisos y los formularios se lo lleva la tabla,
            // que pasa a ser QUIEN DESPLAZA. Sin esto, quien desplazaba
            // era el cuerpo de la ventana y la cabecera pegajosa se iba
            // hacia arriba con la lista (2026-09-05).
            ...(fijo ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : {}),
          }}
        >
        {/* Se abre desde "Acciones" → Revisión; no está siempre a la
            vista. Tocar un nombre lo busca en la lista de abajo. */}
        {aviso && (
          <p
            className="rounded px-3 py-2 mb-3 text-sm flex items-start gap-2"
            style={{ background: C.avisoFondo, color: C.peligro }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span className="flex-1">{aviso}</span>
            <button onClick={() => setAviso("")} style={{ textDecoration: "underline" }}>
              Cerrar
            </button>
          </p>
        )}

        {mostrarRevision && (
          <InformeInvitados
            hallazgos={hallazgos}
            onBuscar={(g) => setFiltros({ ...filtros, texto: `${g.nombre} ${g.apellido}` })}
            onCerrar={() => setMostrarRevision(false)}
          />
        )}
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
          className="rounded"
          style={{
            border: `1px solid ${C.line}`,
            background: "#fff",
            // Este contenedor es el que desplaza, en los dos ejes: por
            // eso la cabecera pegajosa de dentro funciona. En ventana
            // propia ocupa todo el alto que quede; dentro de la página
            // se queda en media pantalla, para no comerse el resto.
            overflow: "auto",
            ...(fijo ? { flex: 1, minHeight: 0 } : { maxHeight: "50vh" }),
          }}
        >
          {/* 1180 -> 1080: Safari no da siempre el ancho pedido a una
              ventana nueva, y con 1180 se quedaban fuera "Pagado" y la
              columna de acciones (captura del usuario, 2026-09-05). Con
              1080 entran las once; si alguna queda justa, el texto se
              recorta con puntos suspensivos, que es la regla de la casa. */}
          <div style={{ minWidth: 1080 }}>
            {cabeceraTabla}
            {/* La cabecera de columnas Y la fila de filtros
                (Invitado/Familia/... y sus buscadores) viven ahora en la
                barra verde de la ventana (subtitulo, más arriba) -- a
                petición del usuario, 2026-08-18. Aquí solo quedan las
                filas de datos. */}
            <div>
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
                padding: "0 6px",
                // Altura FIJA e idéntica en todas las filas: el texto va
                // en una sola línea (ver .fila-una-linea en index.css).
                height: 38,
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
                  className="grid text-sm fila-una-linea"
                  style={{
                    gridTemplateColumns: columnasTabla,
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
                  {/* O = esposO, A = esposA. En modo edición es un
                      desplegable de tres opciones; fuera de él, solo la
                      letra en dorado (o un guion). */}
                  <span style={celda(2, { justifyContent: "center", textAlign: "center" })}>
                    {modoEdicion ? (
                      <select
                        value={g.rolFamiliar || ""}
                        onChange={(e) => asignarRolFamiliar(g.id, e.target.value)}
                        style={{
                          ...inputStyle,
                          border: "none",
                          // ⚠️ Sin la flecha del <select>: esta columna es
                          // estrecha a propósito y la flecha se comía el
                          // ancho entero, dejando la letra fuera de la
                          // vista (2026-09-03). Sigue siendo un
                          // desplegable normal, solo que se ve la letra.
                          appearance: "none",
                          WebkitAppearance: "none",
                          MozAppearance: "none",
                          background: idsSueltos.has(g.id) ? C.avisoFondo : "rgba(31,58,46,0.06)",
                          borderRadius: 4,
                          padding: "2px 0",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: idsSueltos.has(g.id) ? C.peligro : C.gold,
                          width: "100%",
                          minWidth: 0,
                          textAlign: "center",
                          textAlignLast: "center",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                        title="Papel en la familia: O esposo, A esposa, H hijo, P padre/madre sin su cónyuge, S suelto. En blanco = sin revisar"
                      >
                        <option value="">—</option>
                        <option value={ROL_FAMILIAR.ESPOSO}>O</option>
                        <option value={ROL_FAMILIAR.ESPOSA}>A</option>
                        <option value={ROL_FAMILIAR.HIJO}>H</option>
                        <option value={ROL_FAMILIAR.PADRE}>P</option>
                        <option value={ROL_FAMILIAR.SUELTO}>S</option>
                      </select>
                    ) : g.rolFamiliar ? (
                      <span
                        className="rounded px-1.5"
                        style={{
                          color: idsSueltos.has(g.id) ? C.peligro : C.gold,
                          background: idsSueltos.has(g.id) ? C.avisoFondo : "transparent",
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontWeight: 700,
                        }}
                        title={
                          idsSueltos.has(g.id)
                            ? `${NOMBRE_ROL[g.rolFamiliar]} sin pareja: falta marcar al otro cónyuge de esta familia (o sobra esta marca)`
                            : NOMBRE_ROL[g.rolFamiliar]
                        }
                      >
                        {LETRA_ROL[g.rolFamiliar]}
                        {idsSueltos.has(g.id) ? "!" : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                  {/* "2001 · 25": el año de boda y los años que cumplen
                      el día del evento. El año lo rellena el colaborador
                      en su formulario; aquí solo se lee. */}
                  <span style={celda(3, { justifyContent: "center", textAlign: "center" })}>
                    {g.anioBoda ? (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                        {g.anioBoda}
                        {aniversarioDe(g) !== null && (
                          <>
                            {" · "}
                            <strong style={{ color: C.gold, fontWeight: 700 }}>{aniversarioDe(g)}</strong>
                          </>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span style={celda(4)}>
                    {modoEdicion ? (
                      <GrupoFamiliarInput
                        value={g.zona ?? ""}
                        onCommit={(v) => asignarZona(g.id, v)}
                      />
                    ) : (
                      g.zona || "—"
                    )}
                  </span>
                  <span className="text-xs gap-1" style={celda(5)}>
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
                  <span className="text-xs" style={celda(6)}>
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
                  <span style={celda(7, { justifyContent: "center", textAlign: "center" })}>
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
                  <span style={celda(8, { justifyContent: "center", textAlign: "center" })}>
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
                  <span style={celda(9, { justifyContent: "center", textAlign: "center" })}>
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
                  <span style={{ ...celda(10), gap: 6 }}>
                    <button
                      onClick={() => setInvitadoRolAbierto(g.id)}
                      title="Rol de trabajo el día del evento (acomodador, etc.)"
                    >
                      <Tag
                        size={14}
                        style={{
                          color: Array.isArray(g.rolesTrabajo) && g.rolesTrabajo.length > 0 ? C.ink : C.charcoal,
                          opacity: Array.isArray(g.rolesTrabajo) && g.rolesTrabajo.length > 0 ? 1 : 0.35,
                        }}
                      />
                    </button>
                    <button
                      onClick={() => alternarExcluidoTablon(g.id)}
                      title={
                        g.excluidoTablon
                          ? "Excluido del acceso al tablón — su nombre nunca sirve como respuesta válida"
                          : "Excluir del acceso al tablón (nombre de conocimiento público, p.ej. el anfitrión)"
                      }
                    >
                      <ShieldOff
                        size={14}
                        style={{
                          color: g.excluidoTablon ? C.peligro : C.charcoal,
                          opacity: g.excluidoTablon ? 1 : 0.35,
                        }}
                      />
                    </button>
                    <button onClick={() => eliminarInvitado(g.id)}>
                      <Trash2 size={14} style={{ color: C.wax }} />
                    </button>
                  </span>
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
      </div>

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
                    gridTemplateColumns: "1.3fr 1fr 0.8fr 0.8fr 1fr 0.6fr 0.9fr 0.8fr",
                    color: C.gold,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  <span>Invitado</span>
                  <span>Familia</span>
                  <span>Zona</span>
                  <span>Boda</span>
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
                      className="grid px-2 py-1.5 text-sm fila-una-linea"
                      style={{
                        gridTemplateColumns: "1.3fr 1fr 0.8fr 0.8fr 1fr 0.6fr 0.9fr 0.8fr",
                        background: i % 2 ? C.paperDark : "#fff",
                        color: C.charcoal,
                      }}
                    >
                      <span>
                        {g.apellido}, {g.nombre}
                      </span>
                      <span>{g.grupoFamiliar || g.apellido || "—"}</span>
                      <span>{g.zona || "—"}</span>
                      {/* Con el filtro puesto en "O" esta lista impresa
                          es, fila a fila, la de las parejas con sus
                          años -- para eso se quitó la ventana aparte. */}
                      <span>
                        {g.anioBoda || "—"}
                        {aniversarioDe(g) !== null && ` · ${aniversarioDe(g)}`}
                      </span>
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

      {invitadoRolAbierto && (
        <ModalFlotante
          titulo={`Rol de trabajo: ${invitados.find((g) => g.id === invitadoRolAbierto)?.nombre || ""}`}
          onCerrar={() => {
            setInvitadoRolAbierto(null);
            setNuevoRolTexto("");
          }}
        >
          <p className="text-xs mb-3" style={{ color: C.charcoal, opacity: 0.7 }}>
            Marca los roles que este invitado desempeña EL DÍA del evento (acomodador,
            fotografía...) -- no da ningún acceso a la app, solo sirve para poder asignarlo a un
            bloque del cronograma. La estrella marca quién es el responsable de ese rol para
            todo el evento (uno solo por rol).
          </p>
          {rolesConocidos.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-3">
              {rolesConocidos.map((rol) => {
                const g = invitados.find((i) => i.id === invitadoRolAbierto);
                const activo = Array.isArray(g?.rolesTrabajo) && g.rolesTrabajo.includes(rol);
                const esResponsable = responsablesRol[rol] === invitadoRolAbierto;
                return (
                  <div key={rol} className="flex items-center justify-between gap-2 text-sm" style={{ color: C.charcoal }}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={activo} onChange={() => alternarRolTrabajo(invitadoRolAbierto, rol)} />
                      {rol}
                    </label>
                    {activo && (
                      <button
                        onClick={() => marcarResponsable(rol, invitadoRolAbierto)}
                        title={esResponsable ? "Es el responsable de este rol -- pulsa para quitarlo" : "Marcar como responsable de este rol"}
                      >
                        <Star size={14} fill={esResponsable ? C.gold : "none"} style={{ color: C.gold }} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <TextInput
              value={nuevoRolTexto}
              onChange={(e) => setNuevoRolTexto(e.target.value)}
              placeholder="+ nuevo rol (ej. Fotografía)"
              style={{ width: "100%" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") anadirRolNuevo(invitadoRolAbierto);
              }}
            />
            <button
              onClick={() => anadirRolNuevo(invitadoRolAbierto)}
              className="boton-3d px-3 py-1.5 rounded text-sm font-medium flex-shrink-0"
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Añadir
            </button>
          </div>
        </ModalFlotante>
      )}
    </>
  );
}
