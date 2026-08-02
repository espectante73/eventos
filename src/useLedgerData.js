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

  // Se mantiene al día para poder comparar "antes/después" dentro de
  // persistInvitados sin depender de closures obsoletas.
  const invitadosRef = useRef(invitados);
  useEffect(() => {
    invitadosRef.current = invitados;
  }, [invitados]);

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

        if (cancelado) return;
        if (eventoFilas && eventoFilas[0]) setEvento(eventoFilas[0]);
        setFotosFamiliares(
          Object.fromEntries((fotosFilas || []).map((r) => [r.grupoFamiliar, r.url]))
        );
        setColaboradores(todosColaboradores || []);
        setInvitados(todosInvitados || []);
        setMesas(todasMesas || []);
        setAvisosEnviados(avisos || []);
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
    setMesas(next);
    const { error } = await supabase.from("mesas").upsert(next);
    if (error) avisar("No se pudieron guardar las mesas.", error);
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
    avisosEnviados,
  };
}
