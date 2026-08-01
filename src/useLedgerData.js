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
};

function avisar(mensaje, error) {
  // Centralizado para poder cambiarlo fácilmente (toast, etc.) más adelante.
  // eslint-disable-next-line no-console
  console.error(mensaje, error);
  window.alert(mensaje);
}

export function useLedgerData(rol) {
  const esColaborador = Boolean(rol) && rol !== "anfitrion";

  const [evento, setEvento] = useState(EVENTO_POR_DEFECTO);
  const [colaboradores, setColaboradores] = useState([]);
  const [invitados, setInvitados] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [fotosFamiliares, setFotosFamiliares] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Se mantienen al día en cada render para poder comparar "antes/después"
  // dentro de persistInvitados sin depender de closures obsoletas.
  const invitadosRef = useRef(invitados);
  useEffect(() => {
    invitadosRef.current = invitados;
  }, [invitados]);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      setLoaded(false);

      const { data: eventoFilas, error: errEvento } = await supabase
        .from("evento")
        .select("*")
        .limit(1);
      if (errEvento) avisar("No se pudo cargar el evento.", errEvento);

      const { data: fotosFilas, error: errFotos } = await supabase
        .from("fotos_familiares")
        .select("*");
      if (errFotos) avisar("No se pudieron cargar las fotos familiares.", errFotos);

      let colaboradoresNuevos = [];
      let invitadosNuevos = [];
      let mesasNuevas = [];

      if (esColaborador) {
        const { data: perfil, error: errPerfil } = await supabase.rpc(
          "colaborador_mi_perfil",
          { p_colaborador_id: rol }
        );
        if (errPerfil) avisar("No se pudo identificar al colaborador.", errPerfil);
        colaboradoresNuevos = perfil || [];

        const { data: misInvitados, error: errInv } = await supabase.rpc(
          "colaborador_mis_invitados",
          { p_colaborador_id: rol }
        );
        if (errInv) avisar("No se pudieron cargar tus invitados asignados.", errInv);
        invitadosNuevos = misInvitados || [];

        mesasNuevas = []; // La vista de colaborador nunca necesita las mesas.
      } else {
        const { data: todosColaboradores, error: errCol } = await supabase.rpc(
          "anfitrion_listar_colaboradores"
        );
        if (errCol) avisar("No se pudieron cargar los colaboradores.", errCol);
        colaboradoresNuevos = todosColaboradores || [];

        const { data: todosInvitados, error: errInv } = await supabase.rpc(
          "anfitrion_listar_invitados"
        );
        if (errInv) avisar("No se pudieron cargar los invitados.", errInv);
        invitadosNuevos = todosInvitados || [];

        const { data: todasMesas, error: errMesas } = await supabase
          .from("mesas")
          .select("*")
          .order("numero", { ascending: true });
        if (errMesas) avisar("No se pudieron cargar las mesas.", errMesas);
        mesasNuevas = todasMesas || [];
      }

      if (cancelado) return;

      if (eventoFilas && eventoFilas[0]) setEvento(eventoFilas[0]);
      setFotosFamiliares(
        Object.fromEntries((fotosFilas || []).map((r) => [r.grupoFamiliar, r.url]))
      );
      setColaboradores(colaboradoresNuevos);
      setInvitados(invitadosNuevos);
      setMesas(mesasNuevas);
      setLoaded(true);
    })();

    return () => {
      cancelado = true;
    };
  }, [rol, esColaborador]);

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

  const persistColaboradores = useCallback(async (next) => {
    setColaboradores(next);
    if (esColaborador) return; // Un colaborador nunca modifica la lista de colaboradores.
    const { error } = await supabase.rpc("anfitrion_guardar_colaboradores", {
      p_filas: next,
    });
    if (error) avisar("No se pudieron guardar los colaboradores.", error);
  }, [esColaborador]);

  const persistInvitados = useCallback(
    async (next) => {
      const anterior = invitadosRef.current;
      setInvitados(next);
      invitadosRef.current = next;

      if (!esColaborador) {
        // Anfitrión: reemplaza el array completo de una vez (inserta/actualiza
        // todo lo que venga en `next`, y borra lo que ya no esté).
        const { error } = await supabase.rpc("anfitrion_guardar_invitados", {
          p_filas: next,
        });
        if (error) avisar("No se pudieron guardar los invitados.", error);
        return;
      }

      // Colaborador: solo puede cambiar UNA fila a la vez (su propio flujo de
      // trabajo nunca edita varias a la vez), y solo mediante las dos
      // funciones que de verdad comprueban en el servidor que ese invitado
      // es suyo.
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
    [esColaborador, rol]
  );

  return {
    evento,
    colaboradores,
    invitados,
    mesas,
    fotosFamiliares,
    loaded,
    persistEvento,
    persistColaboradores,
    persistInvitados,
    persistMesas,
    persistFotosFamiliares,
  };
}
