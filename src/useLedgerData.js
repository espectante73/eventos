import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

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
    '<p style="color:#B00020;font-weight:700;text-transform:uppercase;font-family:Georgia,serif;margin-top:14px;">' +
    "Si ya has rellenado los datos de los nuevos que adjunto en este email, ignora este aviso." +
    "</p>",
  plantillaDatosCompletados:
    "Hola,<br><br><b>{colaborador}</b> ha completado los datos de todos sus invitados asignados.",
  plantillaPagoRegistrado:
    "Hola,<br><br><b>{colaborador}</b> ha completado todos los pagos de sus invitados asignados.",
  plantillaInvitacionFamilia:
    "Hola,<br><br>Aquí tienes tu invitación. ¡Os esperamos con muchas ganas!",
};

function avisar(mensaje, error) {
  // eslint-disable-next-line no-console
  console.error(mensaje, error);
  window.alert(mensaje);
}

export function useLedgerData(rol) {
  const [evento, setEvento] = useState(EVENTO_POR_DEFECTO);
  const [colaboradores, setColaboradores] = useState([]);
  const [invitados, setInvitados] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [fotosFamiliares, setFotosFamiliares] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [esAnfitrion, setEsAnfitrion] = useState(false);
  const [avisosEnviados, setAvisosEnviados] = useState([]);
  // Estado de cuentas — solo lo carga/usa el anfitrión, nunca colaboradores.
  const [gastos, setGastos] = useState([]);
  // Orden manual de nombres por familia (para la invitación) — solo lo usa
  // el anfitrión, igual que las mesas.
  const [ordenFamiliares, setOrdenFamiliares] = useState({});

  // Se mantiene al día para poder comparar "antes/después" dentro de
  // persistInvitados sin depender de closures obsoletas. También sirve
  // para revertir la pantalla si el guardado en Supabase falla — todos los
  // persistX actualizan el estado local antes de confirmar el guardado
  // (para que la pantalla responda al instante), así que si la escritura
  // real falla, hay que deshacer ese cambio optimista o la pantalla se
  // queda mintiendo (muestra el dato nuevo aunque nunca se guardó).
  const invitadosRef = useRef(invitados);
  useEffect(() => {
    invitadosRef.current = invitados;
  }, [invitados]);

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
  useEffect(() => {
    fotosFamiliaresRef.current = fotosFamiliares;
  }, [fotosFamiliares]);

  const ordenFamiliaresRef = useRef(ordenFamiliares);
  useEffect(() => {
    ordenFamiliaresRef.current = ordenFamiliares;
  }, [ordenFamiliares]);

  const gastosRef = useRef(gastos);
  useEffect(() => {
    gastosRef.current = gastos;
  }, [gastos]);

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

        if (cancelado) return;
        if (eventoFilas && eventoFilas[0]) setEvento(eventoFilas[0]);
        setFotosFamiliares(
          Object.fromEntries((fotosFilas || []).map((r) => [r.grupoFamiliar, r.url]))
        );
        setColaboradores(perfil);
        if (!errInv) setInvitados(misInvitados || []);
        setMesas([]); // La vista de colaborador nunca necesita las mesas.
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

        if (cancelado) return;
        if (eventoFilas && eventoFilas[0]) setEvento(eventoFilas[0]);
        setFotosFamiliares(
          Object.fromEntries((fotosFilas || []).map((r) => [r.grupoFamiliar, r.url]))
        );
        if (!errCol) setColaboradores(todosColaboradores || []);
        if (!errInv) setInvitados(todosInvitados || []);
        if (!errMesas) setMesas(todasMesas || []);
        if (!errAvisos) setAvisosEnviados(avisos || []);
        if (!errGastos) setGastos(todosGastos || []);
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
    const intervalo = setInterval(() => cargarDatos(false), 60 * 1000);
    const alVolverVisible = () => {
      if (document.visibilityState === "visible") cargarDatos(false);
    };
    document.addEventListener("visibilitychange", alVolverVisible);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolverVisible);
    };
  }, [rol]);

  const persistEvento = useCallback(async (next) => {
    const anterior = eventoRef.current;
    setEvento(next);
    eventoRef.current = next;
    const { error } = await supabase.from("evento").update(next).eq("id", true);
    if (error) {
      avisar("No se pudo guardar la configuración del evento. Se deshace el cambio en pantalla.", error);
      setEvento(anterior);
      eventoRef.current = anterior;
    }
  }, []);

  const persistMesas = useCallback(async (next) => {
    const anterior = mesasRef.current;
    setMesas(next);
    mesasRef.current = next;

    const numerosNuevos = new Set(next.map((m) => m.numero));
    const numerosBorrados = anterior
      .filter((m) => !numerosNuevos.has(m.numero))
      .map((m) => m.numero);
    let huboError = false;
    if (numerosBorrados.length > 0) {
      const { error: errBorrar } = await supabase
        .from("mesas")
        .delete()
        .in("numero", numerosBorrados);
      if (errBorrar) {
        avisar("No se pudieron eliminar las mesas quitadas.", errBorrar);
        huboError = true;
      }
    }
    if (next.length > 0) {
      const { error } = await supabase.from("mesas").upsert(next);
      if (error) {
        avisar("No se pudieron guardar las mesas.", error);
        huboError = true;
      }
    }
    // Si algo falló a mitad, la pantalla no puede seguir mostrando el
    // cambio como si se hubiera guardado entero — se deshace por completo
    // y se recarga desde la base de datos la próxima vez que haga falta.
    if (huboError) {
      setMesas(anterior);
      mesasRef.current = anterior;
    }
  }, []);

  const persistFotosFamiliares = useCallback(async (next) => {
    const anterior = fotosFamiliaresRef.current;
    setFotosFamiliares(next);
    fotosFamiliaresRef.current = next;
    const filas = Object.entries(next).map(([grupoFamiliar, url]) => ({
      grupoFamiliar,
      url,
    }));
    if (filas.length === 0) return;
    const { error } = await supabase.from("fotos_familiares").upsert(filas);
    if (error) {
      avisar("No se pudo guardar la foto familiar. Se deshace el cambio en pantalla.", error);
      setFotosFamiliares(anterior);
      fotosFamiliaresRef.current = anterior;
    }
  }, []);

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
    if (filas.length === 0) return;
    const { error } = await supabase.from("orden_familias").upsert(filas);
    if (error) {
      avisar("No se pudo guardar el orden de la familia. Se deshace el cambio en pantalla.", error);
      setOrdenFamiliares(anterior);
      ordenFamiliaresRef.current = anterior;
    }
  }, []);

  const persistColaboradores = useCallback(
    async (next) => {
      const anterior = colaboradoresRef.current;
      setColaboradores(next);
      colaboradoresRef.current = next;
      if (!esAnfitrion) return; // Un colaborador nunca modifica la lista de colaboradores.
      const { error } = await supabase.rpc("anfitrion_guardar_colaboradores", {
        p_token: rol,
        p_filas: next,
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
      const { error } = await supabase.rpc("anfitrion_guardar_gastos", {
        p_token: rol,
        p_filas: next,
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
        const { error } = await supabase.rpc("anfitrion_guardar_invitados", {
          p_token: rol,
          p_filas: next,
        });
        if (error) avisar("No se pudieron guardar los invitados.", error);
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
      const soloCambioPagado =
        previo && previo.pagado !== cambiado.pagado
          ? Object.keys(cambiado).every(
              (k) => k === "pagado" || cambiado[k] === previo[k]
            )
          : false;

      if (soloCambioPagado) {
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
        }
      }
    },
    [esAnfitrion, rol]
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
        setFotosFamiliares(Object.fromEntries(fotosFilas.map((r) => [r.grupoFamiliar, r.url])));
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
    mesas,
    fotosFamiliares,
    loaded,
    esAnfitrion,
    persistEvento,
    persistColaboradores,
    persistInvitados,
    persistMesas,
    persistFotosFamiliares,
    avisarColaborador,
    probarEmailColaborador,
    enviarInvitacionLogin,
    enviarInvitacionFamilia,
    avisosEnviados,
    ordenFamiliares,
    persistOrdenFamiliares,
    resetearAvisos,
    resetearPorInvitados,
    gastos,
    persistGastos,
    confirmarRecogidaColaborador,
    reenviarAcuseColaborador,
    deshacerRecogidaColaborador,
    confirmarEmailColaboradorActualizado,
    activarModoPruebas,
    desactivarModoPruebas,
  };
}
