import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import { avisoEnPantalla } from "./lib/avisos";
import { useCanalAsistencia } from "./lib/useCanalAsistencia";
import { C } from "./theme";
import { familiaDe, comoMiembro } from "./lib/familiaCobroLlegada";

const EVENTO_POR_DEFECTO = {
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
    `<p style="color:${C.peligro};font-weight:700;text-transform:uppercase;font-family:Georgia,serif;margin-top:14px;">` +
    "Si ya has rellenado los datos de los nuevos que adjunto en este email, ignora este aviso." +
    "</p>",
  plantillaDatosCompletados:
    "Hola,<br><br><b>{colaborador}</b> ha completado los datos de todos sus invitados asignados.",
  plantillaPagoRegistrado:
    "Hola,<br><br><b>{colaborador}</b> ha completado todos los pagos de sus invitados asignados.",
  plantillaInvitacionFamilia:
    "Hola,<br><br>Aquí tienes tu invitación. ¡Les esperamos con muchas ganas!",
};

function avisar(mensaje, error) {
  // eslint-disable-next-line no-console
  console.error(mensaje, error);
  // En la ventana de siempre, no en un window.alert (ver lib/avisos.js):
  // el alert bloquea el navegador y, disparado desde una ventana
  // emergente, salía en la pestaña de detrás.
  //
  // Con el motivo que da la base de datos en letra pequeña: un "no se
  // pudo" a secas no se puede ni diagnosticar ni contar por teléfono.
  avisoEnPantalla(mensaje, undefined, error?.message || error?.hint || "");
}

export function useLedgerData(rol) {
  const [evento, setEvento] = useState(EVENTO_POR_DEFECTO);
  const [colaboradores, setColaboradores] = useState([]);
  const [invitados, setInvitados] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [fotosFamiliares, setFotosFamiliares] = useState({});
  // Foto de aniversario, aparte de la de boda aunque vivan en la misma
  // tabla. Guarda la RUTA del archivo dentro del cajón "fotos-matrimonios",
  // no la foto: son ~50 y metidas en la base se descargarían enteras cada
  // vez que se abre la app (2026-09-17).
  const [fotosAniversario, setFotosAniversario] = useState({});
  // La foto de boda ya montada en la plantilla (la sube el anfitrión tras
  // pasarla por otra IA). Va APARTE de la original del colaborador, para no
  // perderla si un montaje sale mal (decidido con el usuario, 2026-09-17).
  const [fotosBodaFinal, setFotosBodaFinal] = useState({});
  // Familias que NO tienen foto de boda, marcado por el colaborador
  // (usuario, 2026-09-19): así la foto deja de contar como dato pendiente.
  const [fotosSinBoda, setFotosSinBoda] = useState({});
  // Colaborador: las familias suyas SIN ningún email de un adulto. Lo
  // calcula la base (colaborador_familias_sin_email), que ve a la familia
  // entera: el colaborador solo ve a sus invitados, y un matrimonio puede
  // tener dos colaboradores. El anfitrión no lo necesita: lo calcula él
  // mismo con la lista completa (lib/invitados.js, familiasSinEmail).
  const [familiasSinEmailServidor, setFamiliasSinEmailServidor] = useState([]);
  const cargarFamiliasSinEmail = useCallback(async (colaboradorId) => {
    const { data, error } = await supabase.rpc("colaborador_familias_sin_email", {
      p_colaborador_id: colaboradorId,
    });
    // Sin la función en la base (SQL sin ejecutar), no se avisa de nada.
    setFamiliasSinEmailServidor(error ? [] : data || []);
  }, []);
  // Reparte las filas de `fotos_familiares` en sus cuatro mapas. Una sola
  // función para los tres sitios que las cargan: antes cada uno copiaba
  // las tres líneas, y una columna nueva había que acordarse de añadirla
  // en los tres.
  // La última verdad del servidor, para no mandar de vuelta filas que no
  // hemos tocado (norma 12). Los colaboradores suben la foto de boda: si
  // el anfitrión reenviara la colección entera con su copia, borraría la
  // que acaban de subir.
  const fotosServidorRef = useRef({});

  const repartirFilasDeFotos = (filas) => {
    fotosServidorRef.current = Object.fromEntries(
      (filas || []).map((r) => [
        r.grupoFamiliar,
        JSON.stringify({
          url: r.url || "",
          urlAniversario: r.urlAniversario || "",
          urlBodaFinal: r.urlBodaFinal || "",
          sinFotoBoda: Boolean(r.sinFotoBoda),
        }),
      ])
    );
    const porFamilia = (dato) => Object.fromEntries((filas || []).map((r) => [r.grupoFamiliar, dato(r)]));
    setFotosFamiliares(porFamilia((r) => r.url));
    setFotosAniversario(porFamilia((r) => r.urlAniversario || ""));
    setFotosBodaFinal(porFamilia((r) => r.urlBodaFinal || ""));
    setFotosSinBoda(porFamilia((r) => Boolean(r.sinFotoBoda)));
  };
  const [loaded, setLoaded] = useState(false);
  const [esAnfitrion, setEsAnfitrion] = useState(false);
  const [avisosEnviados, setAvisosEnviados] = useState([]);
  // Estado de cuentas — solo lo carga/usa el anfitrión, nunca colaboradores.
  const [gastos, setGastos] = useState([]);
  // Orden manual de nombres por familia (para la invitación) — solo lo usa
  // el anfitrión, igual que las mesas.
  const [ordenFamiliares, setOrdenFamiliares] = useState({});
  // Tablón de novedades (público, de solo lectura) — solo el anfitrión
  // las carga/edita aquí; el propio tablón público (VistaTablon.jsx) las
  // lee por su cuenta, sin pasar por este hook (no tiene rol ni sesión).
  const [novedades, setNovedades] = useState([]);
  // Token del enlace público del tablón (?tablon=...) — se muestra en
  // VentanaNovedades.jsx para copiarlo y compartirlo en el grupo de
  // WhatsApp. null hasta que se cargue (o si falla la carga).
  const [tokenTablon, setTokenTablon] = useState(null);
  // Pregunta de acceso al tablón público (capa extra sobre el enlace en
  // sí) -- solo el anfitrión la carga/edita, desde VentanaNovedades.jsx.
  // Texto suelto: desde 2026-08-29 el acceso se comprueba por nombre
  // contra los invitados confirmados, no contra una respuesta fija --
  // "pregunta" ya solo es el redactado que ve la persona.
  const [preguntaTablon, setPreguntaTablon] = useState("");
  // Nombres del tablón que han entrado desde más de un dispositivo
  // distinto -- señal de alarma (ver schema.sql, 2026-08-29), nunca
  // bloquea a nadie. Solo lo carga el anfitrión.
  const [accesosTablonSospechosos, setAccesosTablonSospechosos] = useState([]);

  // Se mantiene al día para poder comparar "antes/después" dentro de
  // persistInvitados sin depender de closures obsoletas. También sirve
  // para revertir la pantalla si el guardado en Supabase falla — todos los
  // persistX actualizan el estado local antes de confirmar el guardado
  // (para que la pantalla responda al instante), así que si la escritura
  // real falla, hay que deshacer ese cambio optimista o la pantalla se
  // queda mintiendo (muestra el dato nuevo aunque nunca se guardó).
  // La fecha del evento, para que el refresco periódico sepa si hoy es
  // el día sin tener que depender del objeto `evento` (si lo tuviera en
  // las dependencias, cada carga reiniciaría el temporizador).
  const fechaEventoRef = useRef("");
  useEffect(() => {
    fechaEventoRef.current = evento?.fecha || "";
  }, [evento?.fecha]);

  const invitadosRef = useRef(invitados);
  useEffect(() => {
    invitadosRef.current = invitados;
  }, [invitados]);

  // Llegadas del día del evento, en vivo: el resto de la app se entera
  // de los cambios preguntando cada minuto, pero aquí eso se nota
  // demasiado (marcas en el móvil y el recuento del anfitrión no se
  // mueve). Ver lib/useCanalAsistencia.js -- solo corrige ESE campo del
  // invitado que llega en el mensaje; el refresco periódico sigue
  // siendo la fuente de verdad.
  const { avisarLlegada, conectado: asistenciaEnVivo } = useCanalAsistencia((id, presente) => {
    setInvitados((previos) => {
      const siguientes = previos.map((g) => (g.id === id ? { ...g, presente } : g));
      invitadosRef.current = siguientes;
      return siguientes;
    });
  });

  // Igual que invitadosRef, pero para mesas — hace falta para saber qué
  // números de mesa se han quitado y borrarlos también en Supabase (un
  // upsert por sí solo nunca borra filas que ya no estén en la lista).
  const mesasRef = useRef(mesas);
  useEffect(() => {
    mesasRef.current = mesas;
  }, [mesas]);

  const eventoRef = useRef(evento);
  useEffect(() => {
    eventoRef.current = evento;
  }, [evento]);

  const colaboradoresRef = useRef(colaboradores);
  useEffect(() => {
    colaboradoresRef.current = colaboradores;
  }, [colaboradores]);

  const fotosFamiliaresRef = useRef(fotosFamiliares);
  const fotosAniversarioRef = useRef(fotosAniversario);
  const fotosBodaFinalRef = useRef(fotosBodaFinal);
  const fotosSinBodaRef = useRef(fotosSinBoda);
  useEffect(() => {
    fotosFamiliaresRef.current = fotosFamiliares;
  }, [fotosFamiliares]);
  useEffect(() => {
    fotosAniversarioRef.current = fotosAniversario;
  }, [fotosAniversario]);
  useEffect(() => {
    fotosBodaFinalRef.current = fotosBodaFinal;
  }, [fotosBodaFinal]);
  useEffect(() => {
    fotosSinBodaRef.current = fotosSinBoda;
  }, [fotosSinBoda]);

  const ordenFamiliaresRef = useRef(ordenFamiliares);
  useEffect(() => {
    ordenFamiliaresRef.current = ordenFamiliares;
  }, [ordenFamiliares]);

  const gastosRef = useRef(gastos);
  useEffect(() => {
    gastosRef.current = gastos;
  }, [gastos]);

  const novedadesRef = useRef(novedades);
  useEffect(() => {
    novedadesRef.current = novedades;
  }, [novedades]);

  useEffect(() => {
    let cancelado = false;

    // "mostrarCarga": true solo en la primera carga (pantalla "Abriendo el
    // libro de invitados…"). Las actualizaciones periódicas de fondo son
    // silenciosas — sin esto, la pantalla entera parpadearía a "cargando"
    // cada minuto solo para enterarse de cambios de otra persona.
    const cargarDatos = async (mostrarCarga) => {
      if (mostrarCarga) {
        setLoaded(false);
        setEsAnfitrion(false);
      }

      // Sin ningún código en el enlace: no se intenta cargar nada real.
      // No hay "modo por defecto" — antes esto era el fallo de seguridad.
      if (!rol) {
        if (mostrarCarga) {
          setColaboradores([]);
          setInvitados([]);
          setMesas([]);
          setLoaded(true);
        }
        return;
      }

      // 1) ¿El código del enlace es el de un colaborador real?
      const { data: perfil, error: errPerfil } = await supabase.rpc(
        "colaborador_mi_perfil",
        { p_colaborador_id: rol }
      );
      if (errPerfil) {
        if (mostrarCarga) avisar("No se pudo comprobar el enlace.", errPerfil);
        return;
      }

      if (perfil && perfil.length > 0) {
        const { data: eventoFilas } = await supabase.from("evento").select("*").limit(1);
        const { data: fotosFilas } = await supabase.from("fotos_familiares").select("*");
        const { data: misInvitados, error: errInv } = await supabase.rpc(
          "colaborador_mis_invitados",
          { p_colaborador_id: rol }
        );
        if (errInv && mostrarCarga) avisar("No se pudieron cargar tus invitados asignados.", errInv);
        // "Best effort", igual que en la rama del anfitrión: es solo el
        // enlace del botón "Novedades" en Portada, no bloquea nada más.
        const { data: tokenTablonCargado } = await supabase.rpc("colaborador_obtener_token_tablon", {
          p_colaborador_id: rol,
        });
        // Permiso especial (ver lib/permisos.js): si este colaborador
        // puede editar el texto de Novedades, carga también esa lista --
        // colaborador_listar_novedades vuelve a comprobar el permiso por
        // su cuenta (no se fía de que el cliente ya lo sepa).
        const tienePermisoNovedades =
          perfil[0] && Array.isArray(perfil[0].permisos) && perfil[0].permisos.includes("novedades_editar");
        await cargarFamiliasSinEmail(rol);
        const { data: novedadesColaborador } = tienePermisoNovedades
          ? await supabase.rpc("colaborador_listar_novedades", { p_colaborador_id: rol })
          : { data: null };

        if (cancelado) return;
        if (eventoFilas && eventoFilas[0]) setEvento(eventoFilas[0]);
        repartirFilasDeFotos(fotosFilas);
        setColaboradores(perfil);
        if (!errInv) setInvitados(misInvitados || []);
        setMesas([]); // La vista de colaborador nunca necesita las mesas.
        if (tokenTablonCargado) setTokenTablon(tokenTablonCargado);
        if (novedadesColaborador) setNovedades(novedadesColaborador);
        setEsAnfitrion(false);
        setLoaded(true);
        return;
      }

      // 2) ¿El código del enlace es el secreto del anfitrión?
      const { data: esValido, error: errToken } = await supabase.rpc(
        "anfitrion_verificar_token",
        { p_token: rol }
      );
      if (errToken) {
        if (mostrarCarga) avisar("No se pudo comprobar el enlace.", errToken);
        return;
      }

      if (esValido === true) {
        const { data: eventoFilas } = await supabase.from("evento").select("*").limit(1);
        const { data: fotosFilas } = await supabase.from("fotos_familiares").select("*");
        const { data: todosColaboradores, error: errCol } = await supabase.rpc(
          "anfitrion_listar_colaboradores",
          { p_token: rol }
        );
        if (errCol && mostrarCarga) avisar("No se pudieron cargar los colaboradores.", errCol);
        const { data: todosInvitados, error: errInv } = await supabase.rpc(
          "anfitrion_listar_invitados",
          { p_token: rol }
        );
        if (errInv && mostrarCarga) avisar("No se pudieron cargar los invitados.", errInv);
        const { data: todasMesas, error: errMesas } = await supabase
          .from("mesas")
          .select("*")
          .order("numero", { ascending: true });
        if (errMesas && mostrarCarga) avisar("No se pudieron cargar las mesas.", errMesas);
        // Comprobación aparte (nunca dentro de enviar_email — ver el
        // episodio del 2026-08-08 documentado en schema.sql) de si Resend
        // ya confirmó los envíos recientes. Es "best effort": si falla, no
        // se avisa con una alerta — simplemente el ✓/✗/? de esta vuelta se
        // queda como estaba y se reintenta solo en el próximo refresco.
        await supabase.rpc("anfitrion_actualizar_estado_avisos", { p_token: rol });
        const { data: avisos, error: errAvisos } = await supabase.rpc(
          "anfitrion_listar_avisos_enviados",
          { p_token: rol }
        );
        if (errAvisos && mostrarCarga) avisar("No se pudo cargar el historial de avisos.", errAvisos);
        const { data: ordenFilas, error: errOrden } = await supabase
          .from("orden_familias")
          .select("*");
        if (errOrden && mostrarCarga) avisar("No se pudo cargar el orden de las familias.", errOrden);
        const { data: todosGastos, error: errGastos } = await supabase.rpc(
          "anfitrion_listar_gastos",
          { p_token: rol }
        );
        if (errGastos && mostrarCarga) avisar("No se pudo cargar el estado de cuentas.", errGastos);
        const { data: todasNovedades, error: errNovedades } = await supabase.rpc(
          "anfitrion_listar_novedades",
          { p_token: rol }
        );
        if (errNovedades && mostrarCarga) avisar("No se pudo cargar el tablón de novedades.", errNovedades);
        // "Best effort", sin avisar con una alerta si falla: es solo el
        // enlace a mostrar en la ventana Novedades, no afecta a nada más.
        const { data: tokenTablonCargado } = await supabase.rpc("anfitrion_obtener_token_tablon", {
          p_token: rol,
        });
        const { data: preguntaCargada } = await supabase.rpc("anfitrion_obtener_pregunta_tablon", {
          p_token: rol,
        });
        // Accesos al tablón desde más de un dispositivo con el mismo
        // nombre -- señal de alarma, nunca bloquea a nadie (ver
        // schema.sql, 2026-08-29). "Best effort": si falla, no hace
        // falta avisar con una alerta, no es una función crítica.
        const { data: accesosCargados } = await supabase.rpc(
          "anfitrion_listar_accesos_tablon_sospechosos",
          { p_token: rol }
        );

        if (cancelado) return;
        if (eventoFilas && eventoFilas[0]) setEvento(eventoFilas[0]);
        repartirFilasDeFotos(fotosFilas);
        if (!errCol) setColaboradores(todosColaboradores || []);
        if (!errInv) setInvitados(todosInvitados || []);
        if (!errMesas) setMesas(todasMesas || []);
        if (!errAvisos) setAvisosEnviados(avisos || []);
        if (!errGastos) setGastos(todosGastos || []);
        if (!errNovedades) setNovedades(todasNovedades || []);
        if (tokenTablonCargado) setTokenTablon(tokenTablonCargado);
        // Ahora es un texto suelto (ya no {pregunta, respuesta} -- la
        // "respuesta correcta" fija desapareció, ver schema.sql
        // 2026-08-29: el acceso se comprueba contra los invitados
        // confirmados, no contra un secreto compartido).
        setPreguntaTablon(preguntaCargada || "");
        setAccesosTablonSospechosos(accesosCargados || []);
        setOrdenFamiliares(
          Object.fromEntries(
            (ordenFilas || []).map((r) => [
              r.grupoFamiliar,
              {
                orden: r.orden,
                invitacionEnviada: r.invitacionEnviada,
                invitacionEnviadaEn: r.invitacionEnviadaEn,
              },
            ])
          )
        );
        setEsAnfitrion(true);
        setLoaded(true);
        return;
      }

      // 3) Ni colaborador ni anfitrión: enlace no reconocido. No se
      // devuelve ni se intenta cargar ningún dato real.
      if (cancelado) return;
      if (mostrarCarga) {
        setColaboradores([]);
        setInvitados([]);
        setMesas([]);
        setEsAnfitrion(false);
        setLoaded(true);
      }
    };

    cargarDatos(true);

    // Sin esto, cada sesión de navegador (la tuya, la de cada colaborador)
    // se queda con la primera copia de los datos para siempre — si otra
    // persona cambia algo, esta pestaña no se entera hasta recargar a
    // mano. No es Realtime de verdad (eso exigiría montar autenticación
    // real primero, ver CLAUDE.md), pero evita tener que recargar sin
    // parar: se vuelve a preguntar sola cada minuto, y también al volver
    // a esta pestaña tras estar en otra.
    // ⚠️ EL DÍA DEL EVENTO se pregunta cada 8 segundos, no cada minuto.
    // No es un capricho: ese día las llegadas se marcan desde varios
    // aparatos a la vez y el anfitrión mira el recuento en vivo. El
    // canal de Realtime (lib/useCanalAsistencia.js) es lo que da la
    // respuesta instantánea, pero NO puede ser lo único: un WebSocket se
    // cae, el navegador congela la pestaña que queda por detrás, el wifi
    // del local hace lo que quiere. Con esto, el peor caso pasa de un
    // minuto a ocho segundos aunque el canal esté muerto del todo.
    //
    // El resto del año no hay ninguna prisa, así que se queda en un
    // minuto y no se castiga la base de datos sin motivo.
    // Se reprograma en cada vuelta en vez de un setInterval fijo: cuando
    // este efecto arranca todavía no se han cargado los datos, así que
    // la fecha del evento aún no se sabe -- con un intervalo fijo, el
    // día de la boda se habría quedado en el ritmo lento para siempre.
    let temporizador = null;
    const proximaVuelta = () => {
      const esHoyElEvento = fechaEventoRef.current === new Date().toISOString().slice(0, 10);
      temporizador = setTimeout(async () => {
        await cargarDatos(false);
        if (!cancelado) proximaVuelta();
      }, esHoyElEvento ? 8 * 1000 : 60 * 1000);
    };
    proximaVuelta();
    const alVolverVisible = () => {
      if (document.visibilityState === "visible") cargarDatos(false);
    };
    document.addEventListener("visibilitychange", alVolverVisible);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alVolverVisible);
    };
  }, [rol]);

  const persistEvento = useCallback(async (next) => {
    const anterior = eventoRef.current;
    // Norma 12: solo lo cambiado. `anterior` es lo último que se leyó del
    // servidor; lo que no se manda, no se toca.
    // ⚠️ Aquí no era solo cuestión de pisar lo de otro: la fila de
    // `evento` pesa ~830 KB (la portada y la plantilla de invitación van
    // dentro, en base64), así que mandarla entera en CADA tecla obligaba
    // a la base a reescribir las dos imágenes, y la sentencia se cortaba
    // sola con "canceling statement due to statement timeout". Lo
    // encontró él el 2026-09-24 editando el Cronograma.
    const cambios = {};
    for (const [clave, valor] of Object.entries(next || {})) {
      if (clave === "id") continue;
      if (JSON.stringify(valor) !== JSON.stringify(anterior?.[clave])) cambios[clave] = valor;
    }
    if (Object.keys(cambios).length === 0) return;
    setEvento(next);
    eventoRef.current = next;
    const { error } = await supabase.rpc("guardar_evento", { p_token: rol, p_fila: cambios });
    if (error) {
      avisar("No se pudo guardar la configuración del evento. Se deshace el cambio en pantalla.", error);
      setEvento(anterior);
      eventoRef.current = anterior;
    }
  }, [rol]);

  // Antes eran dos llamadas seguidas (borrar las quitadas + guardar el
  // resto), que podían quedarse a medias si fallaba la segunda. Ahora es
  // una sola función que reemplaza la lista entera dentro de una
  // transacción: o se guarda todo o no se guarda nada.
  const persistMesas = useCallback(async (next) => {
    const anterior = mesasRef.current;
    setMesas(next);
    mesasRef.current = next;
    // Norma 12: solo lo cambiado. `anterior` es lo último que se leyó
    // del servidor; lo que no se manda, no se toca.
    const yaEstaba = Object.fromEntries(anterior.map((x) => [x.numero, JSON.stringify(x)]));
    const cambiadas = next.filter((x) => yaEstaba[x.numero] !== JSON.stringify(x));
    const { error } = await supabase.rpc("anfitrion_guardar_mesas", {
      p_token: rol,
      p_filas: cambiadas,
      p_numeros: next.map((m) => m.numero),
    });
    if (error) {
      avisar("No se pudieron guardar las mesas. Se deshace el cambio en pantalla.", error);
      setMesas(anterior);
      mesasRef.current = anterior;
    }
  }, [rol]);

  // Las dos fotos de cada familia viven en la MISMA fila de la tabla, así
  // que cualquier guardado tiene que mandar las dos o la otra se borraría.
  // Por eso hay un solo escritor y dos envoltorios finos encima, en vez de
  // dos funciones que manden cada una su mitad ("una sola pieza").
  const guardarFilasDeFotos = useCallback(async (boda, aniversario, bodaFinal, sinBoda = fotosSinBodaRef.current) => {
    const familias = new Set([
      ...Object.keys(boda),
      ...Object.keys(aniversario),
      ...Object.keys(bodaFinal),
      ...Object.keys(sinBoda),
    ]);
    const filas = [...familias].map((grupoFamiliar) => ({
      grupoFamiliar,
      url: boda[grupoFamiliar] || "",
      urlAniversario: aniversario[grupoFamiliar] || "",
      urlBodaFinal: bodaFinal[grupoFamiliar] || "",
      sinFotoBoda: Boolean(sinBoda[grupoFamiliar]),
    }));
    // Norma 12: solo lo que difiere de lo que tiene el servidor. Esta
    // función no borra lo que no llega, pero SÍ reescribe las cuatro
    // columnas de cada fila que se manda — mandarlas todas era pisar con
    // una copia vieja la foto que un colaborador acabara de subir.
    const cambiadas = filas.filter(
      ({ grupoFamiliar, url, urlAniversario, urlBodaFinal, sinFotoBoda }) =>
        fotosServidorRef.current[grupoFamiliar] !==
        JSON.stringify({ url, urlAniversario, urlBodaFinal, sinFotoBoda })
    );
    if (cambiadas.length === 0) return null;
    const { error } = await supabase.rpc("guardar_fotos_familiares", {
      p_token: rol,
      p_filas: cambiadas,
    });
    if (!error) {
      for (const f of cambiadas) {
        const { grupoFamiliar, ...resto } = f;
        fotosServidorRef.current[grupoFamiliar] = JSON.stringify(resto);
      }
    }
    return error;
  }, [rol]);

  const persistFotosFamiliares = useCallback(async (next) => {
    const anterior = fotosFamiliaresRef.current;
    setFotosFamiliares(next);
    fotosFamiliaresRef.current = next;
    const error = await guardarFilasDeFotos(next, fotosAniversarioRef.current, fotosBodaFinalRef.current);
    if (error) {
      avisar("No se pudo guardar la foto familiar. Se deshace el cambio en pantalla.", error);
      setFotosFamiliares(anterior);
      fotosFamiliaresRef.current = anterior;
    }
  }, [guardarFilasDeFotos]);

  const persistFotosAniversario = useCallback(async (next) => {
    const anterior = fotosAniversarioRef.current;
    setFotosAniversario(next);
    fotosAniversarioRef.current = next;
    const error = await guardarFilasDeFotos(fotosFamiliaresRef.current, next, fotosBodaFinalRef.current);
    if (error) {
      avisar("No se pudo guardar la foto de aniversario. Se deshace el cambio en pantalla.", error);
      setFotosAniversario(anterior);
      fotosAniversarioRef.current = anterior;
    }
  }, [guardarFilasDeFotos]);

  const persistFotosBodaFinal = useCallback(async (next) => {
    const anterior = fotosBodaFinalRef.current;
    setFotosBodaFinal(next);
    fotosBodaFinalRef.current = next;
    const error = await guardarFilasDeFotos(fotosFamiliaresRef.current, fotosAniversarioRef.current, next);
    if (error) {
      avisar("No se pudo guardar la foto de boda terminada. Se deshace el cambio en pantalla.", error);
      setFotosBodaFinal(anterior);
      fotosBodaFinalRef.current = anterior;
    }
  }, [guardarFilasDeFotos]);

  const persistFotosSinBoda = useCallback(async (next) => {
    const anterior = fotosSinBodaRef.current;
    setFotosSinBoda(next);
    fotosSinBodaRef.current = next;
    const error = await guardarFilasDeFotos(fotosFamiliaresRef.current, fotosAniversarioRef.current, fotosBodaFinalRef.current, next);
    if (error) {
      avisar("No se pudo guardar que esta familia no tiene foto de boda. Se deshace el cambio en pantalla.", error);
      setFotosSinBoda(anterior);
      fotosSinBodaRef.current = anterior;
    }
  }, [guardarFilasDeFotos]);

  const persistOrdenFamiliares = useCallback(async (next) => {
    const anterior = ordenFamiliaresRef.current;
    setOrdenFamiliares(next);
    ordenFamiliaresRef.current = next;
    const filas = Object.entries(next).map(([grupoFamiliar, datos]) => ({
      grupoFamiliar,
      orden: datos.orden || [],
      invitacionEnviada: Boolean(datos.invitacionEnviada),
      invitacionEnviadaEn: datos.invitacionEnviadaEn || null,
    }));
    // Norma 12. Aquí hay un segundo escritor que no es una persona: el
    // trigger `invitados_invalidar_invitacion` pone `invitacionEnviada`
    // a false solo. Mandar la colección entera lo deshacía.
    const yaEstaba = Object.fromEntries(
      Object.entries(anterior).map(([g, d]) => [
        g,
        JSON.stringify({
          orden: d.orden || [],
          invitacionEnviada: Boolean(d.invitacionEnviada),
          invitacionEnviadaEn: d.invitacionEnviadaEn || null,
        }),
      ])
    );
    const cambiadas = filas.filter(({ grupoFamiliar, ...resto }) => yaEstaba[grupoFamiliar] !== JSON.stringify(resto));
    if (cambiadas.length === 0) return;
    const { error } = await supabase.rpc("guardar_orden_familias", {
      p_token: rol,
      p_filas: cambiadas,
    });
    if (error) {
      avisar("No se pudo guardar el orden de la familia. Se deshace el cambio en pantalla.", error);
      setOrdenFamiliares(anterior);
      ordenFamiliaresRef.current = anterior;
    }
  }, [rol]);

  const persistColaboradores = useCallback(
    async (next) => {
      const anterior = colaboradoresRef.current;
      setColaboradores(next);
      colaboradoresRef.current = next;
      if (!esAnfitrion) return; // Un colaborador nunca modifica la lista de colaboradores.
      // Norma 12: solo lo cambiado. `anterior` es lo último que se leyó
      // del servidor; lo que no se manda, no se toca.
      const yaEstaba = Object.fromEntries(anterior.map((x) => [x.id, JSON.stringify(x)]));
      const cambiadas = next.filter((x) => yaEstaba[x.id] !== JSON.stringify(x));
      const { error } = await supabase.rpc("anfitrion_guardar_colaboradores", {
        p_token: rol,
        p_filas: cambiadas,
        p_ids: next.map((c) => c.id),
      });
      if (error) {
        avisar("No se pudieron guardar los colaboradores. Se deshace el cambio en pantalla.", error);
        setColaboradores(anterior);
        colaboradoresRef.current = anterior;
      }
    },
    [esAnfitrion, rol]
  );

  const persistGastos = useCallback(
    async (next) => {
      const anterior = gastosRef.current;
      setGastos(next);
      gastosRef.current = next;
      if (!esAnfitrion) return; // Estado de cuentas: solo el anfitrión lo toca.
      // Norma 12: solo lo cambiado. `anterior` es lo último que se leyó
      // del servidor; lo que no se manda, no se toca.
      const yaEstaba = Object.fromEntries(anterior.map((x) => [x.id, JSON.stringify(x)]));
      const cambiadas = next.filter((x) => yaEstaba[x.id] !== JSON.stringify(x));
      const { error } = await supabase.rpc("anfitrion_guardar_gastos", {
        p_token: rol,
        p_filas: cambiadas,
        p_ids: next.map((g) => g.id),
      });
      if (error) {
        avisar("No se pudo guardar el estado de cuentas. Se deshace el cambio en pantalla.", error);
        setGastos(anterior);
        gastosRef.current = anterior;
      }
    },
    [esAnfitrion, rol]
  );

  // Confirmar/deshacer que el anfitrión ha recibido de un colaborador lo
  // recaudado de sus invitados -- evento aparte de "invitado pagó a su
  // colaborador" (invitados.pagado). El importe se congela en el momento
  // de confirmar (no se recalcula después), para que el acuse ya
  // enviado siga siendo fiel a lo que de verdad se entregó ese día. El
  // acuse (desglose por invitado, total, fecha, firma) se genera como
  // IMAGEN adjunta en el navegador (ver lib/acuseImagen.js) y se manda
  // por email al propio colaborador en la misma llamada.
  const confirmarRecogidaColaborador = useCallback(
    async (colaboradorId, importe, email, asunto, html, adjuntoNombre, adjuntoBase64) => {
      if (!esAnfitrion) return false;
      const { error } = await supabase.rpc("anfitrion_confirmar_recogida_colaborador", {
        p_token: rol,
        p_colaborador_id: colaboradorId,
        p_importe: importe,
        p_email: email,
        p_asunto: asunto,
        p_html: html,
        p_adjunto_nombre: adjuntoNombre,
        p_adjunto_base64: adjuntoBase64,
      });
      if (error) {
        avisar("No se pudo confirmar la recogida.", error);
        return false;
      }
      const { data: todosColaboradores, error: errCol } = await supabase.rpc(
        "anfitrion_listar_colaboradores",
        { p_token: rol }
      );
      if (!errCol) setColaboradores(todosColaboradores || []);
      return true;
    },
    [esAnfitrion, rol]
  );

  // Reenviar el mismo acuse sin volver a "confirmar" (no toca la fecha ni
  // el importe ya registrados) -- para cuando el colaborador dice que no
  // le llegó o lo perdió. También la usa "Probar acuse".
  const reenviarAcuseColaborador = useCallback(
    async (email, asunto, html, adjuntoNombre, adjuntoBase64) => {
      if (!esAnfitrion) return false;
      const { error } = await supabase.rpc("anfitrion_reenviar_acuse_colaborador", {
        p_token: rol,
        p_email: email,
        p_asunto: asunto,
        p_html: html,
        p_adjunto_nombre: adjuntoNombre,
        p_adjunto_base64: adjuntoBase64,
      });
      if (error) {
        avisar("No se pudo reenviar el acuse.", error);
        return false;
      }
      return true;
    },
    [esAnfitrion, rol]
  );

  const deshacerRecogidaColaborador = useCallback(
    async (colaboradorId) => {
      if (!esAnfitrion) return false;
      const { error } = await supabase.rpc("anfitrion_deshacer_recogida_colaborador", {
        p_token: rol,
        p_colaborador_id: colaboradorId,
      });
      if (error) {
        avisar("No se pudo deshacer la recogida.", error);
        return false;
      }
      const { data: todosColaboradores, error: errCol } = await supabase.rpc(
        "anfitrion_listar_colaboradores",
        { p_token: rol }
      );
      if (!errCol) setColaboradores(todosColaboradores || []);
      return true;
    },
    [esAnfitrion, rol]
  );

  // Dos caminos según quién llama: el anfitrión gestiona el tablón
  // entero (crear/borrar/publicar/marcar); un colaborador con el permiso
  // "novedades_editar" (ver lib/permisos.js) solo puede llegar aquí
  // desde VentanaNovedades.jsx en modo `soloTexto`, y
  // colaborador_guardar_novedades solo actualiza título/cuerpo de filas
  // ya existentes -- vuelve a comprobar el permiso por su cuenta en el
  // servidor, no se fía de lo que el cliente ya deshabilitó en pantalla.
  //
  // Deliberadamente NO usa avisar(): devuelve true/false y
  // VentanaNovedades.jsx enseña el fallo dentro de su propia pantalla
  // (`guardadoFallido`) -- mismo motivo que persistPreguntaTablon(), unas
  // líneas más abajo.
  const persistNovedades = useCallback(
    async (next) => {
      const anterior = novedadesRef.current;
      setNovedades(next);
      novedadesRef.current = next;
      // Norma 12. Aquí hay dos escritores de verdad: el anfitrión y un
      // colaborador con el permiso "novedades_editar". Mandar la lista
      // entera reescribía el título y el cuerpo de TODAS las novedades
      // con la copia de quien guardara último.
      const anteriorSerializado = Object.fromEntries(anterior.map((n) => [n.id, JSON.stringify(n)]));
      const cambiadas = next.filter((n) => anteriorSerializado[n.id] !== JSON.stringify(n));
      const { error } = esAnfitrion
        ? await supabase.rpc("anfitrion_guardar_novedades", {
            p_token: rol,
            p_filas: cambiadas,
            p_ids: next.map((n) => n.id),
          })
        : await supabase.rpc("colaborador_guardar_novedades", {
            p_colaborador_id: rol,
            p_filas: cambiadas,
          });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("No se pudo guardar el tablón de novedades.", error);
        setNovedades(anterior);
        novedadesRef.current = anterior;
        return false;
      }
      return true;
    },
    [esAnfitrion, rol]
  );

  // Deliberadamente NO usa avisar(): esta función solo la llama
  // VentanaNovedades.jsx, que vive en una ventana emergente y ya enseña
  // el fallo en su propia pantalla, junto al texto que no se ha podido
  // guardar -- ahí se entiende mejor que en una ventana aparte. Devuelve
  // true/false; quien la llama decide cómo avisar.
  // (Antes esto era además obligatorio: avisar() era un window.alert,
  // que apunta al `window` de la pestaña principal -- mismo problema de
  // fondo que el portapapeles, ver usePopupWindow.js/CLAUDE.md -- y al
  // ser BLOQUEANTE dejaba la ventana como "colgada". Ya no: lib/avisos.js
  // enseña el aviso en la ventana que tiene el foco.)
  const persistPreguntaTablon = useCallback(
    async (pregunta) => {
      const anterior = preguntaTablon;
      setPreguntaTablon(pregunta);
      if (!esAnfitrion) return true;
      const { error } = await supabase.rpc("anfitrion_guardar_pregunta_tablon", {
        p_token: rol,
        p_pregunta: pregunta,
      });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("No se pudo guardar la pregunta del tablón.", error);
        setPreguntaTablon(anterior);
        return false;
      }
      return true;
    },
    [esAnfitrion, rol, preguntaTablon]
  );

  // Últimas versiones guardadas de un texto largo (cuerpo de una
  // novedad, o una plantilla de email) -- solo lectura, nunca escribe
  // nada por sí sola (restaurar una versión reutiliza el guardado
  // normal de siempre, ver HistorialTexto.jsx). Solo tiene datos reales
  // para el anfitrión -- si la llama un colaborador, el token no
  // coincide con ningún anfitrión y la RPC devuelve una lista vacía.
  const obtenerHistorialTexto = useCallback(
    async (origen, refId, campo) => {
      const { data, error } = await supabase.rpc("anfitrion_listar_historial_texto", {
        p_token: rol,
        p_origen: origen,
        p_ref_id: refId,
        p_campo: campo,
      });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("No se pudo cargar el historial de este texto.", error);
        return [];
      }
      return data || [];
    },
    [rol]
  );

  // "Entendido" sobre el aviso de email sincronizado (ColaboradorCard):
  // el propio colaborador cambió su email de acceso desde "Mi cuenta" y
  // eso actualizó colaboradores.email solo (trigger en schema.sql) --
  // esto solo borra la marca visible, nunca el email en sí.
  const confirmarEmailColaboradorActualizado = useCallback(
    async (colaboradorId) => {
      if (!esAnfitrion) return false;
      const anterior = colaboradoresRef.current;
      const siguiente = anterior.map((c) =>
        c.id === colaboradorId ? { ...c, emailSincronizadoEn: null } : c
      );
      setColaboradores(siguiente);
      colaboradoresRef.current = siguiente;
      const { error } = await supabase.rpc("anfitrion_confirmar_email_colaborador_actualizado", {
        p_token: rol,
        p_colaborador_id: colaboradorId,
      });
      if (error) {
        avisar("No se pudo confirmar el aviso. Se deshace el cambio en pantalla.", error);
        setColaboradores(anterior);
        colaboradoresRef.current = anterior;
        return false;
      }
      return true;
    },
    [esAnfitrion, rol]
  );

  // Modo Pruebas: activar guarda una foto completa de los datos
  // operativos; desactivar la restaura entera (reset global, no solo de
  // lo tocado en esta sesión — ver el aviso largo en schema.sql). Se
  // recarga la página entera después de cada una de las dos acciones en
  // vez de intentar refrescar cada pieza de estado local a mano: cambia
  // prácticamente todo a la vez (evento, colaboradores, invitados,
  // mesas, gastos...) y una recarga limpia es más fiable que ir
  // reconciliando estado optimista con lo que de verdad quedó en la base
  // de datos.
  const activarModoPruebas = useCallback(
    async (colaboradorIdsHabilitados) => {
      if (!esAnfitrion) return false;
      const { error } = await supabase.rpc("anfitrion_activar_modo_pruebas", {
        p_token: rol,
        p_colaborador_ids_habilitados: colaboradorIdsHabilitados,
      });
      if (error) {
        avisar("No se pudo activar el Modo Pruebas.", error);
        return false;
      }
      window.location.reload();
      return true;
    },
    [esAnfitrion, rol]
  );

  const desactivarModoPruebas = useCallback(async () => {
    if (!esAnfitrion) return false;
    const { error } = await supabase.rpc("anfitrion_desactivar_modo_pruebas", { p_token: rol });
    if (error) {
      avisar("No se pudo desactivar el Modo Pruebas.", error);
      return false;
    }
    window.location.reload();
    return true;
  }, [esAnfitrion, rol]);

  const persistInvitados = useCallback(
    async (next) => {
      const anterior = invitadosRef.current;
      setInvitados(next);
      invitadosRef.current = next;

      if (esAnfitrion) {
        // Llegadas que cambian en ESTE guardado: hay que avisarlas por el
        // canal igual que hace el colaborador. Faltaba, y era un agujero
        // real (2026-09-06): si quien marca es el anfitrión -- desde la
        // previsualización de "Formularios", que corre con SU sesión y
        // por tanto entra por esta rama, no por la del colaborador -- no
        // se mandaba ningún aviso y el resto de aparatos se enteraban en
        // el refresco de cada minuto.
        const presenciaPorId = Object.fromEntries(anterior.map((g) => [g.id, Boolean(g.presente)]));
        const llegadasCambiadas = next.filter(
          (g) => g.id in presenciaPorId && presenciaPorId[g.id] !== Boolean(g.presente)
        );

        // ⚠️ Se mandan SOLO las filas que el anfitrión ha cambiado, no
        // la lista entera (2026-09-23). Antes se mandaba entera y la
        // función borraba a quien no viniera: si un colaborador rellenaba
        // un email mientras esta pantalla llevaba un rato abierta, el
        // siguiente guardado del anfitrión lo devolvía a como estaba en
        // SU copia. Sin error y sin aviso — el dato simplemente volvía
        // atrás. Con un colaborador no coincidía nunca; con cinco a la
        // vez, sí.
        //
        // `anterior` es la última verdad del servidor: después de cada
        // guardado se recarga con anfitrion_listar_invitados (unas
        // líneas más abajo) y el refresco de cada minuto hace lo mismo.
        // Lo que no está en `cambiadas` no se toca, así que el trabajo
        // de los colaboradores sobrevive.
        //
        // `p_ids` va aparte porque el borrado sí necesita la lista
        // completa: es como la función sabe a quién se ha quitado.
        const anteriorSerializado = Object.fromEntries(anterior.map((g) => [g.id, JSON.stringify(g)]));
        const cambiadas = next.filter((g) => anteriorSerializado[g.id] !== JSON.stringify(g));

        const { error } = await supabase.rpc("anfitrion_guardar_invitados", {
          p_token: rol,
          p_filas: cambiadas,
          p_ids: next.map((g) => g.id),
        });
        if (error) avisar("No se pudieron guardar los invitados.", error);
        else llegadasCambiadas.forEach((g) => avisarLlegada(g.id, Boolean(g.presente)));
        // Una reasignación marca "avisoPendiente" en el propio invitado, en
        // el servidor — recargamos para que se vea al momento. Si el guardado
        // falló y esta recarga también falla, no hay verdad del servidor que
        // consultar: se deshace el cambio optimista en vez de dejar la
        // pantalla mostrando datos que nunca llegaron a guardarse.
        const { data: todosInvitados, error: errInv } = await supabase.rpc(
          "anfitrion_listar_invitados",
          { p_token: rol }
        );
        if (!errInv) {
          setInvitados(todosInvitados || []);
          invitadosRef.current = todosInvitados || [];
        } else if (error) {
          setInvitados(anterior);
          invitadosRef.current = anterior;
        }
        return;
      }

      // Colaborador: solo cambia una fila a la vez, y solo mediante las
      // funciones que comprueban en el servidor que ese invitado es suyo.
      const anteriorPorId = Object.fromEntries(anterior.map((g) => [g.id, g]));
      const cambiado = next.find((g) => {
        const previo = anteriorPorId[g.id];
        return !previo || JSON.stringify(previo) !== JSON.stringify(g);
      });
      if (!cambiado) return;

      const previo = anteriorPorId[cambiado.id];
      // Un solo campo cambiado tiene su propia RPC, más estrecha que el
      // guardado general: así el colaborador puede marcar pago o
      // asistencia sin que la función de guardar datos tenga que
      // aceptar cambios en columnas que no le tocan.
      const soloCambio = (campo) =>
        previo && previo[campo] !== cambiado[campo]
          ? Object.keys(cambiado).every((k) => k === campo || cambiado[k] === previo[k])
          : false;
      const soloCambioPagado = soloCambio("pagado");
      const soloCambioPresente = soloCambio("presente");

      if (soloCambioPresente) {
        // Asistencia el día del evento: ver colaborador_marcar_presente
        // en schema.sql.
        const { data, error } = await supabase.rpc("colaborador_marcar_presente", {
          p_colaborador_id: rol,
          p_invitado_id: cambiado.id,
          p_presente: cambiado.presente,
        });
        if (error || !data || data.length === 0) {
          avisar("No se pudo marcar la asistencia (¿sigue asignado a ti este invitado?). Se deshace el cambio en pantalla.", error);
          setInvitados(anterior);
          invitadosRef.current = anterior;
        } else {
          // Solo DESPUÉS de que el servidor lo acepte: avisar antes
          // pintaría en la pantalla del anfitrión una llegada que
          // podría no haberse guardado.
          avisarLlegada(cambiado.id, cambiado.presente);
        }
      } else if (soloCambioPagado) {
        const { data, error } = await supabase.rpc("colaborador_marcar_pagado", {
          p_colaborador_id: rol,
          p_invitado_id: cambiado.id,
          p_pagado: cambiado.pagado,
        });
        if (error || !data || data.length === 0) {
          avisar("No se pudo actualizar el pago (¿sigue asignado a ti este invitado?). Se deshace el cambio en pantalla.", error);
          setInvitados(anterior);
          invitadosRef.current = anterior;
        }
      } else {
        const { data, error } = await supabase.rpc("colaborador_guardar_invitado", {
          p_colaborador_id: rol,
          p_invitado_id: cambiado.id,
          p_cambios: cambiado,
        });
        if (error || !data || data.length === 0) {
          avisar("No se pudieron guardar los datos (¿sigue asignado a ti este invitado?). Se deshace el cambio en pantalla.", error);
          setInvitados(anterior);
          invitadosRef.current = anterior;
        } else if (previo && (previo.email !== cambiado.email || previo.sinEmail !== cambiado.sinEmail)) {
          // El aviso de "familia sin ningún email" depende de esto.
          cargarFamiliasSinEmail(rol);
        } else if (previo && previo.anioBoda !== cambiado.anioBoda) {
          // El año de boda lo copia la base al cónyuge (trigger
          // invitados_anio_boda_pareja, 2026-09-19). Se recarga la lista
          // para que la ficha de su pareja lo enseñe ya, sin esperar al
          // refresco de cada minuto.
          const { data: recargados } = await supabase.rpc("colaborador_mis_invitados", {
            p_colaborador_id: rol,
          });
          if (recargados) {
            setInvitados(recargados);
            invitadosRef.current = recargados;
          }
        }
      }
    },
    [esAnfitrion, rol, avisarLlegada, cargarFamiliasSinEmail]
  );

  // El pago y la llegada para TODA la familia (norma 11). El anfitrión
  // tiene la lista entera; el colaborador solo la suya, y un cónyuge puede
  // llevarlo otro colaborador: se lo pide a la base, que también es quien
  // marca a todos de una vez (o a ninguno). Ver lib/familiaCobroLlegada.js.
  const obtenerFamilia = useCallback(
    async (g) => {
      if (esAnfitrion) return familiaDe(invitadosRef.current, g);
      const { data, error } = await supabase.rpc("colaborador_familia_de", {
        p_colaborador_id: rol,
        p_invitado_id: g.id,
      });
      // Sin la familia (o sin la función subida) se pregunta solo por él.
      if (error || !data?.length) return [comoMiembro(g)];
      return data;
    },
    [esAnfitrion, rol]
  );

  // Devuelve true si se marcó a toda la familia.
  const marcarFamilia = useCallback(
    async (g, campo, valor) => {
      const anterior = invitadosRef.current;
      if (esAnfitrion) {
        const ids = new Set(familiaDe(anterior, g).map((m) => m.id));
        await persistInvitados(anterior.map((x) => (ids.has(x.id) ? { ...x, [campo]: valor } : x)));
        return true;
      }
      const { data, error } = await supabase.rpc("colaborador_marcar_familia", {
        p_colaborador_id: rol,
        p_invitado_id: g.id,
        p_campo: campo,
        p_valor: valor,
      });
      if (error || !data?.length) {
        avisar("No se pudo marcar a toda la familia: no se ha cambiado a nadie.", error);
        return false;
      }
      // Solo se pintan los suyos: los que lleva otro colaborador no están
      // en su lista, y a ese le llegarán al recargar.
      const porId = Object.fromEntries(data.map((x) => [x.id, x]));
      const next = anterior.map((x) => (porId[x.id] ? { ...x, [campo]: porId[x.id][campo] } : x));
      setInvitados(next);
      invitadosRef.current = next;
      if (campo === "presente") data.forEach((x) => avisarLlegada(x.id, Boolean(x.presente)));
      return true;
    },
    [esAnfitrion, rol, persistInvitados, avisarLlegada]
  );

  const avisarColaborador = useCallback(
    async (colaboradorId) => {
      if (!esAnfitrion) return;
      const { error } = await supabase.rpc("anfitrion_avisar_colaborador", {
        p_token: rol,
        p_colaborador_id: colaboradorId,
      });
      if (error) {
        avisar("No se pudo avisar al colaborador.", error);
        return;
      }
      const [{ data: todosInvitados }, { data: avisos }] = await Promise.all([
        supabase.rpc("anfitrion_listar_invitados", { p_token: rol }),
        supabase.rpc("anfitrion_listar_avisos_enviados", { p_token: rol }),
      ]);
      if (todosInvitados) {
        setInvitados(todosInvitados);
        invitadosRef.current = todosInvitados;
      }
      if (avisos) setAvisosEnviados(avisos);
    },
    [esAnfitrion, rol]
  );

  // Prueba puntual de un email de colaborador (p.ej. justo después de
  // corregir una errata): no cambia ningún dato, solo intenta el envío y
  // devuelve si funcionó, para que el anfitrión lo sepa al momento en vez
  // de descubrirlo días después porque nunca llegó ningún aviso real.
  const probarEmailColaborador = useCallback(
    async (colaboradorId) => {
      if (!esAnfitrion) return false;
      const { error } = await supabase.rpc("anfitrion_probar_email_colaborador", {
        p_token: rol,
        p_colaborador_id: colaboradorId,
      });
      if (error) {
        avisar("No se pudo enviar el email de prueba.", error);
        return false;
      }
      return true;
    },
    [esAnfitrion, rol]
  );

  // Sustituye al antiguo "Copiar enlace": manda por email un enlace al
  // login con "Crear cuenta" ya abierta y el email del colaborador ya
  // relleno, en vez de que el anfitrión copie y pegue un enlace-token.
  const enviarInvitacionLogin = useCallback(
    async (colaboradorId) => {
      if (!esAnfitrion) return false;
      const { error } = await supabase.rpc("anfitrion_enviar_invitacion_login", {
        p_token: rol,
        p_colaborador_id: colaboradorId,
      });
      if (error) {
        avisar("No se pudo enviar la invitación de acceso.", error);
        return false;
      }
      return true;
    },
    [esAnfitrion, rol]
  );

  // ---------- Deshacer la última acción destructiva ----------
  // Sustituye a la descarga automática de una copia en JSON: esa no se podía
  // volver a subir a ningún sitio, así que no era un deshacer de verdad
  // (razonado con el usuario el 2026-09-17). La foto se guarda en el
  // servidor y vuelve con un botón.
  const [fotoDeshacer, setFotoDeshacer] = useState(null);

  const refrescarFotoDeshacer = useCallback(async () => {
    if (!rol) return;
    const { data: filas } = await supabase.rpc("anfitrion_foto_deshacer", { p_token: rol });
    setFotoDeshacer(filas && filas.length > 0 ? filas[0] : null);
  }, [rol]);

  // Se llama ANTES de la acción destructiva: si falla, no se toca nada.
  const guardarFotoDeshacer = useCallback(async (accion) => {
    const { error } = await supabase.rpc("anfitrion_guardar_foto_deshacer", {
      p_token: rol,
      p_accion: accion || "",
    });
    if (error) {
      avisar("No se pudo guardar la copia previa. No se ha hecho nada.", error);
      return false;
    }
    await refrescarFotoDeshacer();
    return true;
  }, [rol, refrescarFotoDeshacer]);

  const deshacerUltimaAccion = useCallback(async () => {
    const { error } = await supabase.rpc("anfitrion_deshacer", { p_token: rol });
    if (error) {
      avisar("No se pudo deshacer.", error);
      return false;
    }
    await refrescarFotoDeshacer();
    return true;
  }, [rol, refrescarFotoDeshacer]);

  const resetearAvisos = useCallback(async () => {
    if (!esAnfitrion) return false;
    const { error } = await supabase.rpc("anfitrion_resetear_avisos", { p_token: rol });
    if (error) {
      avisar("No se pudo vaciar el historial de avisos.", error);
      return false;
    }
    setAvisosEnviados([]);
    // También vuelve a marcar como pendientes a los ya asignados (lo hace
    // el propio RPC) — sin recargar esto, el botón "Avisar ahora" seguiría
    // sin aparecer hasta refrescar la página a mano.
    const { data: todosInvitados, error: errInv } = await supabase.rpc(
      "anfitrion_listar_invitados",
      { p_token: rol }
    );
    if (!errInv) {
      setInvitados(todosInvitados || []);
      invitadosRef.current = todosInvitados || [];
    }
    return true;
  }, [esAnfitrion, rol]);

  // Reinicio "por invitados": categoria es "datos" | "pago" | "mesa" |
  // "asignacion" | "foto" | "invitacion" — el conjunto de invitados afectados
  // (todos los de un colaborador, una familia, o uno solo) se calcula en la
  // propia pantalla y aquí solo se manda la lista de ids ya resuelta.
  const resetearPorInvitados = useCallback(
    async (invitadoIds, categoria) => {
      if (!esAnfitrion || !invitadoIds || invitadoIds.length === 0) return false;
      const { error } = await supabase.rpc("anfitrion_resetear_por_invitados", {
        p_token: rol,
        p_invitado_ids: invitadoIds,
        p_categoria: categoria,
      });
      if (error) {
        avisar("No se pudo ejecutar el reinicio.", error);
        return false;
      }
      const [{ data: todosInvitados }, { data: fotosFilas }, { data: ordenFilas }] =
        await Promise.all([
          supabase.rpc("anfitrion_listar_invitados", { p_token: rol }),
          supabase.from("fotos_familiares").select("*"),
          supabase.from("orden_familias").select("*"),
        ]);
      if (todosInvitados) {
        setInvitados(todosInvitados);
        invitadosRef.current = todosInvitados;
      }
      if (fotosFilas) {
        repartirFilasDeFotos(fotosFilas);
      }
      if (ordenFilas) {
        setOrdenFamiliares(
          Object.fromEntries(
            ordenFilas.map((r) => [
              r.grupoFamiliar,
              {
                orden: r.orden,
                invitacionEnviada: r.invitacionEnviada,
                invitacionEnviadaEn: r.invitacionEnviadaEn,
              },
            ])
          )
        );
      }
      return true;
    },
    [esAnfitrion, rol]
  );

  const enviarInvitacionFamilia = useCallback(
    async (email, asunto, html, imagenBase64) => {
      if (!esAnfitrion) return false;
      const { error } = await supabase.rpc("anfitrion_enviar_invitacion_familia", {
        p_token: rol,
        p_email: email,
        p_asunto: asunto,
        p_html: html,
        p_imagen_base64: imagenBase64,
      });
      if (error) {
        avisar("No se pudo enviar la invitación por email.", error);
        return false;
      }
      const { data: avisos } = await supabase.rpc("anfitrion_listar_avisos_enviados", {
        p_token: rol,
      });
      if (avisos) setAvisosEnviados(avisos);
      return true;
    },
    [esAnfitrion, rol]
  );

  return {
    evento,
    colaboradores,
    invitados,
    // Si el canal en vivo de llegadas está enganchado (ver
    // lib/useCanalAsistencia.js) -- se enseña en el marcador del día.
    asistenciaEnVivo,
    mesas,
    fotosFamiliares,
    fotosAniversario,
    fotosBodaFinal,
    fotosSinBoda,
    familiasSinEmailServidor,
    loaded,
    esAnfitrion,
    persistEvento,
    persistColaboradores,
    persistInvitados,
    persistMesas,
    persistFotosFamiliares,
    persistFotosAniversario,
    persistFotosBodaFinal,
    persistFotosSinBoda,
    avisarColaborador,
    probarEmailColaborador,
    enviarInvitacionLogin,
    enviarInvitacionFamilia,
    avisosEnviados,
    ordenFamiliares,
    persistOrdenFamiliares,
    resetearAvisos,
    fotoDeshacer,
    refrescarFotoDeshacer,
    guardarFotoDeshacer,
    deshacerUltimaAccion,
    resetearPorInvitados,
    gastos,
    persistGastos,
    confirmarRecogidaColaborador,
    reenviarAcuseColaborador,
    deshacerRecogidaColaborador,
    confirmarEmailColaboradorActualizado,
    activarModoPruebas,
    desactivarModoPruebas,
    novedades,
    persistNovedades,
    tokenTablon,
    preguntaTablon,
    persistPreguntaTablon,
    accesosTablonSospechosos,
    obtenerHistorialTexto,
    obtenerFamilia,
    marcarFamilia,
  };
}
