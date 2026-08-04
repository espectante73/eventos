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
    "Hola,<br><br>Tienes invitados nuevos asignados.<br>Entra en tu enlace cuando puedas para revisarlos y completar sus datos.",
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
  // persistInvitados sin depender de closures obsoletas.
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

  useEffect(() => {
    let cancelado = false;

    (async () => {
      setLoaded(false);
      setEsAnfitrion(false);

      // Sin ningún código en el enlace: no se intenta cargar nada real.
      // No hay "modo por defecto" — antes esto era el fallo de seguridad.
      if (!rol) {
        setColaboradores([]);
        setInvitados([]);
        setMesas([]);
        setLoaded(true);
        return;
      }

      // 1) ¿El código del enlace es el de un colaborador real?
      const { data: perfil, error: errPerfil } = await supabase.rpc(
        "colaborador_mi_perfil",
        { p_colaborador_id: rol }
      );
      if (errPerfil) avisar("No se pudo comprobar el enlace.", errPerfil);

      if (perfil && perfil.length > 0) {
        const { data: eventoFilas } = await supabase.from("evento").select("*").limit(1);
        const { data: fotosFilas } = await supabase.from("fotos_familiares").select("*");
        const { data: misInvitados, error: errInv } = await supabase.rpc(
          "colaborador_mis_invitados",
          { p_colaborador_id: rol }
        );
        if (errInv) avisar("No se pudieron cargar tus invitados asignados.", errInv);

        if (cancelado) return;
        if (eventoFilas && eventoFilas[0]) setEvento(eventoFilas[0]);
        setFotosFamiliares(
          Object.fromEntries((fotosFilas || []).map((r) => [r.grupoFamiliar, r.url]))
        );
        setColaboradores(perfil);
        setInvitados(misInvitados || []);
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
      if (errToken) avisar("No se pudo comprobar el enlace.", errToken);

      if (esValido === true) {
        const { data: eventoFilas } = await supabase.from("evento").select("*").limit(1);
        const { data: fotosFilas } = await supabase.from("fotos_familiares").select("*");
        const { data: todosColaboradores, error: errCol } = await supabase.rpc(
          "anfitrion_listar_colaboradores",
          { p_token: rol }
        );
        if (errCol) avisar("No se pudieron cargar los colaboradores.", errCol);
        const { data: todosInvitados, error: errInv } = await supabase.rpc(
          "anfitrion_listar_invitados",
          { p_token: rol }
        );
        if (errInv) avisar("No se pudieron cargar los invitados.", errInv);
        const { data: todasMesas, error: errMesas } = await supabase
          .from("mesas")
          .select("*")
          .order("numero", { ascending: true });
        if (errMesas) avisar("No se pudieron cargar las mesas.", errMesas);
        const { data: avisos, error: errAvisos } = await supabase.rpc(
          "anfitrion_listar_avisos_enviados",
          { p_token: rol }
        );
        if (errAvisos) avisar("No se pudo cargar el historial de avisos.", errAvisos);
        const { data: ordenFilas, error: errOrden } = await supabase
          .from("orden_familias")
          .select("*");
        if (errOrden) avisar("No se pudo cargar el orden de las familias.", errOrden);
        const { data: todosGastos, error: errGastos } = await supabase.rpc(
          "anfitrion_listar_gastos",
          { p_token: rol }
        );
        if (errGastos) avisar("No se pudo cargar el estado de cuentas.", errGastos);

        if (cancelado) return;
        if (eventoFilas && eventoFilas[0]) setEvento(eventoFilas[0]);
        setFotosFamiliares(
          Object.fromEntries((fotosFilas || []).map((r) => [r.grupoFamiliar, r.url]))
        );
        setColaboradores(todosColaboradores || []);
        setInvitados(todosInvitados || []);
        setMesas(todasMesas || []);
        setAvisosEnviados(avisos || []);
        setGastos(todosGastos || []);
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
      setColaboradores([]);
      setInvitados([]);
      setMesas([]);
      setEsAnfitrion(false);
      setLoaded(true);
    })();

    return () => {
      cancelado = true;
    };
  }, [rol]);

  const persistEvento = useCallback(async (next) => {
    setEvento(next);
    const { error } = await supabase.from("evento").update(next).eq("id", true);
    if (error) avisar("No se pudo guardar la configuración del evento.", error);
  }, []);

  const persistMesas = useCallback(async (next) => {
    const anterior = mesasRef.current;
    setMesas(next);
    mesasRef.current = next;

    const numerosNuevos = new Set(next.map((m) => m.numero));
    const numerosBorrados = anterior
      .filter((m) => !numerosNuevos.has(m.numero))
      .map((m) => m.numero);
    if (numerosBorrados.length > 0) {
      const { error: errBorrar } = await supabase
        .from("mesas")
        .delete()
        .in("numero", numerosBorrados);
      if (errBorrar) avisar("No se pudieron eliminar las mesas quitadas.", errBorrar);
    }
    if (next.length > 0) {
      const { error } = await supabase.from("mesas").upsert(next);
      if (error) avisar("No se pudieron guardar las mesas.", error);
    }
  }, []);

  const persistFotosFamiliares = useCallback(async (next) => {
    setFotosFamiliares(next);
    const filas = Object.entries(next).map(([grupoFamiliar, url]) => ({
      grupoFamiliar,
      url,
    }));
    if (filas.length === 0) return;
    const { error } = await supabase.from("fotos_familiares").upsert(filas);
    if (error) avisar("No se pudo guardar la foto familiar.", error);
  }, []);

  const persistOrdenFamiliares = useCallback(async (next) => {
    setOrdenFamiliares(next);
    const filas = Object.entries(next).map(([grupoFamiliar, datos]) => ({
      grupoFamiliar,
      orden: datos.orden || [],
      invitacionEnviada: Boolean(datos.invitacionEnviada),
      invitacionEnviadaEn: datos.invitacionEnviadaEn || null,
    }));
    if (filas.length === 0) return;
    const { error } = await supabase.from("orden_familias").upsert(filas);
    if (error) avisar("No se pudo guardar el orden de la familia.", error);
  }, []);

  const persistColaboradores = useCallback(
    async (next) => {
      setColaboradores(next);
      if (!esAnfitrion) return; // Un colaborador nunca modifica la lista de colaboradores.
      const { error } = await supabase.rpc("anfitrion_guardar_colaboradores", {
        p_token: rol,
        p_filas: next,
      });
      if (error) avisar("No se pudieron guardar los colaboradores.", error);
    },
    [esAnfitrion, rol]
  );

  const persistGastos = useCallback(
    async (next) => {
      setGastos(next);
      if (!esAnfitrion) return; // Estado de cuentas: solo el anfitrión lo toca.
      const { error } = await supabase.rpc("anfitrion_guardar_gastos", {
        p_token: rol,
        p_filas: next,
      });
      if (error) avisar("No se pudo guardar el estado de cuentas.", error);
    },
    [esAnfitrion, rol]
  );

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
        // el servidor — recargamos para que se vea al momento.
        const { data: todosInvitados, error: errInv } = await supabase.rpc(
          "anfitrion_listar_invitados",
          { p_token: rol }
        );
        if (!errInv) {
          setInvitados(todosInvitados || []);
          invitadosRef.current = todosInvitados || [];
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
          avisar("No se pudo actualizar el pago (¿sigue asignado a ti este invitado?).", error);
        }
      } else {
        const { data, error } = await supabase.rpc("colaborador_guardar_invitado", {
          p_colaborador_id: rol,
          p_invitado_id: cambiado.id,
          p_cambios: cambiado,
        });
        if (error || !data || data.length === 0) {
          avisar("No se pudieron guardar los datos (¿sigue asignado a ti este invitado?).", error);
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

  const resetearAvisos = useCallback(async () => {
    if (!esAnfitrion) return false;
    const { error } = await supabase.rpc("anfitrion_resetear_avisos", { p_token: rol });
    if (error) {
      avisar("No se pudo vaciar el historial de avisos.", error);
      return false;
    }
    setAvisosEnviados([]);
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
    enviarInvitacionFamilia,
    avisosEnviados,
    ordenFamiliares,
    persistOrdenFamiliares,
    resetearAvisos,
    resetearPorInvitados,
    gastos,
    persistGastos,
  };
}
