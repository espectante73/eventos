-- ============================================================
-- BASE DE DATOS DE LA APLICACIÓN DE LA BODA
-- ============================================================
-- Reescrito el 16 de septiembre de 2026 a partir de la copia de
-- seguridad nocturna de la base real (pg_dump del 2026-09-16).
--
-- QUÉ ES ESTE ARCHIVO
-- El plano de la base de datos. Ejecutándolo de arriba abajo en un
-- proyecto de Supabase vacío se reconstruye la aplicación entera:
-- tablas, funciones, avisos automáticos, permisos y carpetas de
-- archivos. No trae ningún dato: ni invitados, ni fotos, ni claves.
--
-- CÓMO ESTÁ ORDENADO
--   1. Extensiones
--   2. Tablas
--   3. Claves primarias, únicas y foráneas
--   4. Funciones (ayudantes, anfitrión, colaboradores, tablón)
--   5. Avisos automáticos (triggers)
--   6. Permisos de lectura y escritura (RLS)
--   7. Carpetas de archivos (Storage)
--   8. Filas iniciales
--
-- LA REGLA DE ORO
-- Cada tabla y cada función aparecen UNA SOLA VEZ. La versión
-- anterior de este archivo era un diario: se iba apuntando cada
-- cambio al final, y había funciones repetidas hasta cinco veces.
-- Funcionaba (mandaba la última), pero al ir a tocar algo era fácil
-- copiar la copia vieja. Si hay que cambiar una función, se cambia
-- aquí, en su sitio, y no se añade nada al final.
--
-- SI CAMBIAS LOS PARÁMETROS DE UNA FUNCIÓN
-- Hay que borrar antes la versión antigua con su firma completa
-- (drop function if exists nombre(tipos...)). Si no, conviven las
-- dos y PostgreSQL responde «function is not unique». Esto ya rompió
-- el botón «Avisar ahora» una vez.
--
-- POR QUÉ HAY «where true» POR TODAS PARTES
-- Supabase obliga a poner una condición en cada update y cada delete,
-- para que nadie se lleve una tabla entera por delante sin querer.


-- ============================================================
-- 1. EXTENSIONES
-- ============================================================
-- pg_net: permite que la base de datos llame por su cuenta a la API
-- de Resend para mandar los emails.
-- unaccent: quita los acentos, para poder comparar nombres escritos
-- de cualquier manera en el control del tablón.

create extension if not exists pg_net with schema public;
create extension if not exists unaccent with schema public;


-- ============================================================
-- 2. TABLAS
-- ============================================================

-- Los datos de la boda: nombre, fecha, lugar, precios, imágenes y
-- plantillas de email. Una sola fila, con id = true.
CREATE TABLE public.evento (
    id boolean DEFAULT true NOT NULL,
    nombre text DEFAULT ''::text NOT NULL,
    fecha text DEFAULT ''::text NOT NULL,
    hora text DEFAULT ''::text NOT NULL,
    precio text DEFAULT ''::text NOT NULL,
    imagen text DEFAULT '/cabecera-defecto.jpg'::text NOT NULL,
    "imagenInvitacion" text DEFAULT '/invitacion-defecto.jpg'::text NOT NULL,
    lugar text DEFAULT ''::text NOT NULL,
    direccion text DEFAULT ''::text NOT NULL,
    "precioAdulto" text DEFAULT ''::text NOT NULL,
    "precioNino" text DEFAULT ''::text NOT NULL,
    "edadNinoDesde" text DEFAULT '2'::text NOT NULL,
    "edadNinoHasta" text DEFAULT '12'::text NOT NULL,
    "urlPublica" text DEFAULT ''::text NOT NULL,
    "ocultarTituloEnImagen" boolean DEFAULT true NOT NULL,
    "emailAnfitrion" text DEFAULT ''::text NOT NULL,
    "plantillaAsignacion" text DEFAULT 'Hola,<br><br>Se te ha asignado <b>{invitado}</b> como invitado.<br>Entra en tu enlace cuando puedas para completar sus datos.'::text NOT NULL,
    "plantillaDatosCompletados" text DEFAULT 'Hola,<br><br><b>{colaborador}</b> ha completado los datos de <b>{invitado}</b>.'::text NOT NULL,
    "plantillaPagoRegistrado" text DEFAULT 'Hola,<br><br><b>{colaborador}</b> ha marcado como pagado a <b>{invitado}</b>.'::text NOT NULL,
    "plantillaInvitacionFamilia" text DEFAULT 'Hola,<br><br>Aquí tienes tu invitación. ¡Os esperamos con muchas ganas!'::text NOT NULL,
    "modoPruebasActivo" boolean DEFAULT false NOT NULL,
    "enlaceGrupoWhatsapp" text DEFAULT ''::text NOT NULL,
    "cronogramaBloques" jsonb DEFAULT '[{"texto": "Recepción", "duracionMin": 15}, {"texto": "Cóctel", "duracionMin": 30}, {"texto": "Foto 1", "duracionMin": 15}, {"texto": "Mesas", "duracionMin": 15}, {"texto": "Cena", "duracionMin": 90}, {"texto": "Foto 2", "duracionMin": 15}, {"texto": "Postre", "duracionMin": 15}, {"texto": "Baile", "duracionMin": 135}, {"texto": "Final", "duracionMin": 15}]'::jsonb NOT NULL,
    "cronogramaHoraFin" text DEFAULT '23:45'::text NOT NULL,
    "cronogramaHoraInicio" text DEFAULT '18:00'::text NOT NULL,
    "rolesTrabajoResponsables" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "imprimirFecha" boolean DEFAULT true NOT NULL,
    "imprimirHora" boolean DEFAULT true NOT NULL,
    "imprimirLugar" boolean DEFAULT true NOT NULL,
    "tablonOcultarFecha" boolean DEFAULT false NOT NULL,
    "asistenciaAbierta" boolean DEFAULT false NOT NULL,
    -- Cuánto suena la cortinilla por encima de la música, en puntos.
    -- La app la guarda desde la ventana de Música del evento.
    "cortinillaRealce" integer DEFAULT 15 NOT NULL,
    CONSTRAINT evento_id_check CHECK (id)
);

-- La lista de invitados. Es la raíz de la aplicación: todo lo demás
-- cuelga de aquí.
CREATE TABLE public.invitados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text DEFAULT ''::text NOT NULL,
    apellido text DEFAULT ''::text NOT NULL,
    zona text DEFAULT ''::text NOT NULL,
    confirmado boolean DEFAULT false NOT NULL,
    "colaboradorId" uuid,
    "grupoFamiliar" text DEFAULT ''::text NOT NULL,
    mesa integer,
    "anioNacimiento" text DEFAULT ''::text NOT NULL,
    "anioBoda" text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    cancion text DEFAULT ''::text NOT NULL,
    alergias text DEFAULT ''::text NOT NULL,
    observaciones text DEFAULT ''::text NOT NULL,
    pagado boolean DEFAULT false NOT NULL,
    "avisoPendiente" boolean DEFAULT false NOT NULL,
    "rolesTrabajo" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "excluidoTablon" boolean DEFAULT false NOT NULL,
    "rolFamiliar" text DEFAULT ''::text NOT NULL,
    presente boolean DEFAULT false NOT NULL
);

-- Quién ayuda a recoger datos y qué permisos tiene cada uno.
CREATE TABLE public.colaboradores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text DEFAULT ''::text NOT NULL,
    "invitadoId" uuid,
    email text DEFAULT ''::text NOT NULL,
    "authUserId" uuid,
    "dineroRecogidoEn" timestamp with time zone,
    "dineroRecogidoImporte" numeric,
    "habilitadoEnPruebas" boolean DEFAULT true NOT NULL,
    "emailSincronizadoEn" timestamp with time zone,
    permisos jsonb DEFAULT '[]'::jsonb NOT NULL
);

-- Las mesas del banquete y su posición en el plano.
CREATE TABLE public.mesas (
    numero integer NOT NULL,
    capacidad integer DEFAULT 10 NOT NULL,
    "posX" numeric,
    "posY" numeric,
    CONSTRAINT mesas_capacidad_check CHECK ((capacidad >= 0)),
    -- Antes había un tope de 15 mesas. Se quitó en la app hace tiempo,
    -- pero el tope seguía puesto en la base: la mesa 16 habría dado error.
    CONSTRAINT mesas_numero_check CHECK ((numero >= 1))
);

-- Orden de los invitados dentro de cada familia y si ya se les mandó
-- la invitación.
CREATE TABLE public.orden_familias (
    "grupoFamiliar" text NOT NULL,
    orden text[] DEFAULT '{}'::text[] NOT NULL,
    "invitacionEnviada" boolean DEFAULT false NOT NULL,
    "invitacionEnviadaEn" timestamp with time zone
);

-- Una foto por familia, guardada como texto (base64).
CREATE TABLE public.fotos_familiares (
    "grupoFamiliar" text NOT NULL,
    -- Las dos guardan la RUTA del archivo dentro del cubo
    -- "fotos-matrimonios", nunca la foto: son ~100 y metidas aquí se
    -- descargarían enteras cada vez que se abre la app.
    -- ⚠️ "url" todavía puede traer un data: URI en base64 de antes del
    -- cambio del 2026-09-17; el formulario del colaborador sigue
    -- guardándola así hasta que se migre esa mitad.
    url text DEFAULT ''::text NOT NULL,
    "urlAniversario" text DEFAULT ''::text NOT NULL,
    -- La de boda ya montada en la plantilla (2026-09-17). "url" es la
    -- ORIGINAL del colaborador y no se toca: si un montaje sale mal, se
    -- rehace desde ella. Solo la escribe el anfitrión.
    "urlBodaFinal" text DEFAULT ''::text NOT NULL
);

-- El tablón de novedades que ven los invitados.
CREATE TABLE public.novedades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text DEFAULT ''::text NOT NULL,
    cuerpo text DEFAULT ''::text NOT NULL,
    publicada boolean DEFAULT true NOT NULL,
    "creadaEn" timestamp with time zone DEFAULT now() NOT NULL,
    "esNovedad" boolean DEFAULT false NOT NULL
);

-- Los gastos del evento.
CREATE TABLE public.gastos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    concepto text DEFAULT ''::text NOT NULL,
    categoria text DEFAULT ''::text NOT NULL,
    importe text DEFAULT ''::text NOT NULL,
    pagado boolean DEFAULT false NOT NULL
);

-- Registro de cada email enviado: a quién, cuándo y si salió bien.
CREATE TABLE public.avisos_enviados (
    id bigint NOT NULL,
    destinatario text NOT NULL,
    asunto text NOT NULL,
    "creadoEn" timestamp with time zone DEFAULT now() NOT NULL,
    tipo text DEFAULT 'asignados'::text NOT NULL,
    exito boolean,
    "requestId" bigint
);

ALTER TABLE public.avisos_enviados ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.avisos_enviados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- Copia del texto anterior cada vez que se guarda una novedad o una
-- plantilla de email. Es lo que permite deshacer.
CREATE TABLE public.historial_texto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    origen text NOT NULL,
    "refId" uuid,
    campo text NOT NULL,
    "valorAnterior" text NOT NULL,
    "guardadoEn" timestamp with time zone DEFAULT now() NOT NULL
);

-- Las cuentas de acceso que mandan (los novios).
CREATE TABLE public.anfitriones (
    "authUserId" uuid NOT NULL
);

-- La llave maestra del anfitrión. Una sola fila.
CREATE TABLE public.anfitrion_secreto (
    id boolean DEFAULT true NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    CONSTRAINT anfitrion_secreto_id_check CHECK (id)
);

-- Claves de servicios externos (Resend). Una sola fila.
-- Nunca sale en las copias de seguridad.
CREATE TABLE public.config_secretos (
    id boolean DEFAULT true NOT NULL,
    "resendApiKey" text DEFAULT ''::text NOT NULL,
    "emailRemitente" text DEFAULT 'onboarding@resend.dev'::text NOT NULL,
    "emailRemitenteFamilia" text DEFAULT 'onboarding@resend.dev'::text NOT NULL,
    CONSTRAINT config_secretos_id_check CHECK (id)
);

-- La llave del tablón público y la pregunta de control. Una sola fila.
CREATE TABLE public.tablon_secreto (
    id boolean DEFAULT true NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    pregunta text DEFAULT ''::text NOT NULL,
    "respuestaCorrecta" text DEFAULT ''::text NOT NULL,
    CONSTRAINT tablon_secreto_id_check CHECK (id)
);

-- Quién ha entrado al tablón y desde qué dispositivo, para detectar
-- accesos raros.
CREATE TABLE public.tablon_accesos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "nombreNormalizado" text NOT NULL,
    "dispositivoId" text NOT NULL,
    "creadoEn" timestamp with time zone DEFAULT now() NOT NULL,
    "actualizadoEn" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foto de los datos antes de activar el modo pruebas, para poder
-- volver atrás.
CREATE TABLE public.modo_pruebas_snapshot (
    id boolean DEFAULT true NOT NULL,
    datos jsonb NOT NULL,
    "creadoEn" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT modo_pruebas_snapshot_id_check CHECK (id)
);



-- ============================================================
-- 3. CLAVES PRIMARIAS, ÚNICAS Y FORÁNEAS
-- ============================================================
-- Las claves primarias dicen qué identifica a cada fila. Las
-- foráneas atan unas tablas con otras: si borras una mesa, los
-- invitados que estaban en ella se quedan sin mesa, no se borran.

ALTER TABLE ONLY public.anfitrion_secreto
    ADD CONSTRAINT anfitrion_secreto_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anfitriones
    ADD CONSTRAINT anfitriones_pkey PRIMARY KEY ("authUserId");

ALTER TABLE ONLY public.avisos_enviados
    ADD CONSTRAINT avisos_enviados_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.colaboradores
    ADD CONSTRAINT colaboradores_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.config_secretos
    ADD CONSTRAINT config_secretos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.evento
    ADD CONSTRAINT evento_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fotos_familiares
    ADD CONSTRAINT fotos_familiares_pkey PRIMARY KEY ("grupoFamiliar");

ALTER TABLE ONLY public.gastos
    ADD CONSTRAINT gastos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.historial_texto
    ADD CONSTRAINT historial_texto_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.invitados
    ADD CONSTRAINT invitados_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT mesas_pkey PRIMARY KEY (numero);

ALTER TABLE ONLY public.modo_pruebas_snapshot
    ADD CONSTRAINT modo_pruebas_snapshot_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.novedades
    ADD CONSTRAINT novedades_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.orden_familias
    ADD CONSTRAINT orden_familias_pkey PRIMARY KEY ("grupoFamiliar");

ALTER TABLE ONLY public.tablon_accesos
    ADD CONSTRAINT "tablon_accesos_nombreNormalizado_dispositivoId_key" UNIQUE ("nombreNormalizado", "dispositivoId");

ALTER TABLE ONLY public.tablon_accesos
    ADD CONSTRAINT tablon_accesos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tablon_secreto
    ADD CONSTRAINT tablon_secreto_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.anfitriones
    ADD CONSTRAINT "anfitriones_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.colaboradores
    ADD CONSTRAINT "colaboradores_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.colaboradores
    ADD CONSTRAINT "colaboradores_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES public.invitados(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.invitados
    ADD CONSTRAINT invitados_colaborador_fk FOREIGN KEY ("colaboradorId") REFERENCES public.colaboradores(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.invitados
    ADD CONSTRAINT invitados_mesa_fk FOREIGN KEY (mesa) REFERENCES public.mesas(numero) ON DELETE SET NULL;



-- ============================================================
-- 4. FUNCIONES
-- ============================================================
-- Todas son SECURITY DEFINER: se ejecutan con permisos elevados y
-- comprueban ellas mismas quién llama. Es lo que permite que las
-- tablas estén cerradas a cal y canto (sección 6) y la aplicación
-- siga funcionando: nadie toca una tabla directamente, todo pasa
-- por aquí.


-- ------------------------------------------------------------
-- Ayudantes: quién eres y qué puedes hacer
-- ------------------------------------------------------------

-- ¿La cuenta conectada es de un anfitrión (los novios)?
CREATE FUNCTION public.es_anfitrion() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select exists (select 1 from anfitriones a where a."authUserId" = auth.uid());
$$;

-- Devuelve el papel de quien está conectado: anfitrión, colaborador o nadie.
CREATE FUNCTION public.mi_rol() RETURNS TABLE(rol text, token uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if exists (select 1 from anfitriones a where a."authUserId" = auth.uid()) then
    return query select 'anfitrion'::text, s."token" from anfitrion_secreto s limit 1;
    return;
  end if;

  return query
    select 'colaborador'::text, c."id"
    from colaboradores c
    where c."authUserId" = auth.uid()
    limit 1;
end;
$$;

-- Quita acentos, mayúsculas y espacios sobrantes para poder comparar nombres.
CREATE FUNCTION public.normalizar_nombre_tablon(p_texto text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
  select trim(lower(unaccent(regexp_replace(coalesce(p_texto, ''), '[,\s]+', ' ', 'g'))));
$$;

-- ¿La llave que trae el navegador es la del anfitrión?
CREATE FUNCTION public.anfitrion_verificar_token(p_token uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$ select p_token = (select "token" from anfitrion_secreto limit 1); $$;

-- ¿La llave que trae el navegador es la del tablón?
CREATE FUNCTION public.tablon_verificar_token(p_token uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$ select p_token = (select "token" from tablon_secreto limit 1); $$;

-- ¿El colaborador conectado tiene este permiso concreto?
CREATE FUNCTION public.colaborador_tiene_permiso(p_clave text) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1 from colaboradores c
    where c."authUserId" = auth.uid()
      and c."permisos" ? p_clave
  );
$$;

-- ¿Este colaborador puede tocar datos ahora mismo?
CREATE FUNCTION public.colaborador_puede_actuar(p_colaborador_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1 from colaboradores c
    where c."id" = p_colaborador_id
      and c."authUserId" = auth.uid()
      and (
        not coalesce((select "modoPruebasActivo" from evento limit 1), false)
        or c."habilitadoEnPruebas"
      )
  );
$$;

-- ¿Este colaborador puede escribir en el tablón de novedades?
CREATE FUNCTION public.colaborador_puede_editar_novedades(p_colaborador_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1 from colaboradores c
    where c."id" = p_colaborador_id
      and c."authUserId" = auth.uid()
      and c."permisos" ? 'novedades_editar'
  );
$$;


-- ------------------------------------------------------------
-- Correo e historial
-- ------------------------------------------------------------

-- Manda un email a través de Resend y lo apunta en avisos_enviados.
CREATE FUNCTION public.enviar_email(p_para text, p_asunto text, p_html text, p_adjunto_nombre text DEFAULT NULL::text, p_adjunto_base64 text DEFAULT NULL::text, p_remitente text DEFAULT NULL::text, p_tipo text DEFAULT 'asignados'::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'net', 'pg_temp'
    AS $$
declare
  v_id bigint;
  v_request_id bigint;
begin
  if p_para is null or trim(p_para) = '' then
    return;
  end if;

  insert into avisos_enviados ("destinatario", "asunto", "tipo")
  values (p_para, p_asunto, p_tipo)
  returning "id" into v_id;

  v_request_id := net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select "resendApiKey" from config_secretos limit 1),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', coalesce(p_remitente, (select "emailRemitente" from config_secretos limit 1)),
      'to', p_para,
      'subject', p_asunto,
      'html', p_html
    ) || case
      when p_adjunto_base64 is not null and trim(p_adjunto_base64) <> '' then
        jsonb_build_object(
          'attachments',
          jsonb_build_array(jsonb_build_object(
            'filename', coalesce(nullif(p_adjunto_nombre, ''), 'invitacion.png'),
            'content', p_adjunto_base64
          ))
        )
      else '{}'::jsonb
    end
  );

  update avisos_enviados set "requestId" = v_request_id where "id" = v_id;
end;
$$;

-- Guarda el texto anterior antes de pisarlo, para poder deshacer.
CREATE FUNCTION public.registrar_historial_texto(p_origen text, p_ref_id uuid, p_campo text, p_valor_anterior text) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  insert into historial_texto ("origen", "refId", "campo", "valorAnterior")
  values (p_origen, p_ref_id, p_campo, p_valor_anterior);

  delete from historial_texto
  where id in (
    select id from (
      select id, row_number() over (
        partition by origen, coalesce("refId", '00000000-0000-0000-0000-000000000000'::uuid), campo
        order by "guardadoEn" desc
      ) as rn
      from historial_texto
      where origen = p_origen
        and coalesce("refId", '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_ref_id, '00000000-0000-0000-0000-000000000000'::uuid)
        and campo = p_campo
    ) t where rn > 10
  );
end;
$$;


-- ------------------------------------------------------------
-- Datos compartidos del evento
-- ------------------------------------------------------------

-- Guarda los datos de la boda (nombre, fecha, lugar, precios, plantillas).
CREATE FUNCTION public.guardar_evento(p_token uuid, p_fila jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $_$
declare
  v_es_anfitrion boolean;
  v_claves text[];
  v_sets text;
  v_permitidas text[] := array[
    'nombre', 'fecha', 'hora', 'lugar', 'direccion', 'imagen',
    'ocultarTituloEnImagen', 'emailAnfitrion', 'urlPublica',
    'precioAdulto', 'precioNino', 'edadNinoDesde', 'edadNinoHasta',
    'plantillaAsignacion', 'plantillaDatosCompletados',
    'plantillaPagoRegistrado', 'plantillaInvitacionFamilia'
  ];
begin
  v_es_anfitrion := p_token is not null
    and p_token = (select "token" from anfitrion_secreto limit 1);

  if not v_es_anfitrion and not colaborador_tiene_permiso('datos_evento_editar') then
    raise exception 'No autorizado para editar los datos del evento';
  end if;

  select array_agg(a.attname::text) into v_claves
  from pg_attribute a
  where a.attrelid = 'public.evento'::regclass
    and a.attnum > 0
    and not a.attisdropped
    and a.attname <> 'id'
    and p_fila ? a.attname::text
    and (v_es_anfitrion or a.attname::text = any(v_permitidas));

  if v_claves is null then
    return;
  end if;

  select string_agg(
           format('%I = ($1->>%L)::%s', a.attname, a.attname,
                  format_type(a.atttypid, a.atttypmod)),
           ', ')
    into v_sets
  from pg_attribute a
  where a.attrelid = 'public.evento'::regclass
    and a.attnum > 0
    and not a.attisdropped
    and a.attname::text = any(v_claves);

  execute format('update evento set %s where "id" = true', v_sets) using p_fila;
end;
$_$;

-- Guarda las fotos de familia.
CREATE FUNCTION public.guardar_fotos_familiares(p_token uuid, p_filas jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_es_anfitrion boolean;
begin
  v_es_anfitrion := p_token is not distinct from (select "token" from anfitrion_secreto limit 1);

  if not v_es_anfitrion
     and not exists (select 1 from colaboradores c where c."authUserId" = auth.uid())
  then
    raise exception 'No autorizado para guardar fotos familiares';
  end if;

  -- La de aniversario y la de boda con plantilla solo las toca el
  -- anfitrión. Un colaborador guarda la original de boda (la que sube en
  -- su formulario) sin poder pisar las otras, aunque las mande vacías.
  insert into fotos_familiares ("grupoFamiliar", "url", "urlAniversario", "urlBodaFinal")
  select
    v->>'grupoFamiliar',
    coalesce(v->>'url', ''),
    case when v_es_anfitrion then coalesce(v->>'urlAniversario', '') else '' end,
    case when v_es_anfitrion then coalesce(v->>'urlBodaFinal', '') else '' end
  from jsonb_array_elements(coalesce(p_filas, '[]'::jsonb)) v
  where coalesce(v->>'grupoFamiliar', '') <> ''
  on conflict ("grupoFamiliar") do update set
    "url" = excluded."url",
    "urlAniversario" = case
      when v_es_anfitrion then excluded."urlAniversario"
      else fotos_familiares."urlAniversario"
    end,
    "urlBodaFinal" = case
      when v_es_anfitrion then excluded."urlBodaFinal"
      else fotos_familiares."urlBodaFinal"
    end;
end;
$$;

-- Guarda el orden de los invitados dentro de cada familia.
CREATE FUNCTION public.guardar_orden_familias(p_token uuid, p_filas jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1)
     and not colaborador_tiene_permiso('invitaciones_enviar')
  then
    raise exception 'No autorizado para guardar el orden de las familias';
  end if;

  insert into orden_familias ("grupoFamiliar", "orden", "invitacionEnviada", "invitacionEnviadaEn")
  select v->>'grupoFamiliar',
         coalesce(
           (select array_agg(x) from jsonb_array_elements_text(v->'orden') x),
           '{}'::text[]
         ),
         coalesce((v->>'invitacionEnviada')::boolean, false),
         (v->>'invitacionEnviadaEn')::timestamptz
  from jsonb_array_elements(coalesce(p_filas, '[]'::jsonb)) v
  where coalesce(v->>'grupoFamiliar', '') <> ''
  on conflict ("grupoFamiliar") do update set
    "orden"               = excluded."orden",
    "invitacionEnviada"   = excluded."invitacionEnviada",
    "invitacionEnviadaEn" = excluded."invitacionEnviadaEn";
end;
$$;


-- ------------------------------------------------------------
-- El anfitrión (los novios)
-- ------------------------------------------------------------

-- Hace una foto de los datos y entra en modo pruebas.
CREATE FUNCTION public.anfitrion_activar_modo_pruebas(p_token uuid, p_colaborador_ids_habilitados uuid[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_datos jsonb;
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  select jsonb_build_object(
    'evento', (select to_jsonb(e) from evento e limit 1),
    'colaboradores', (select coalesce(jsonb_agg(c), '[]'::jsonb) from colaboradores c),
    'invitados', (select coalesce(jsonb_agg(i), '[]'::jsonb) from invitados i),
    'mesas', (select coalesce(jsonb_agg(m), '[]'::jsonb) from mesas m),
    'gastos', (select coalesce(jsonb_agg(g), '[]'::jsonb) from gastos g),
    'ordenFamilias', (select coalesce(jsonb_agg(o), '[]'::jsonb) from orden_familias o),
    'fotosFamiliares', (select coalesce(jsonb_agg(f), '[]'::jsonb) from fotos_familiares f),
    'avisosEnviados', (select coalesce(jsonb_agg(a), '[]'::jsonb) from avisos_enviados a),
    -- Novedades se creó DESPUÉS del Modo Pruebas y se quedó fuera de la
    -- foto hasta el 2026-09-17: lo que se tocara en el tablón durante una
    -- prueba se quedaba así al salir. Lo cazó el usuario preguntando si la
    -- lista de tablas estaba al día.
    -- NO entran a propósito: historial_texto y tablon_accesos (son
    -- registros de lo que ha pasado de verdad; reponerlos borraría
    -- historia real), anfitriones y las tablas de secretos (cuentas y
    -- llaves: vaciarlas dejaría a todo el mundo fuera).
    'novedades', (select coalesce(jsonb_agg(n), '[]'::jsonb) from novedades n)
  ) into v_datos;

  insert into modo_pruebas_snapshot ("id", "datos", "creadoEn")
  values (true, v_datos, now())
  on conflict ("id") do update set "datos" = excluded."datos", "creadoEn" = excluded."creadoEn";

  update colaboradores set "habilitadoEnPruebas" = ("id" = any(p_colaborador_ids_habilitados)) where true;
  update evento set "modoPruebasActivo" = true where true;
end;
$$;

-- Recalcula qué invitados tienen aviso pendiente.
CREATE FUNCTION public.anfitrion_actualizar_estado_avisos(p_token uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'net', 'pg_temp'
    AS $$
declare
  fila record;
  v_resultado net.http_response_result;
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  for fila in
    select "id", "requestId" from avisos_enviados
    where "requestId" is not null
      and "exito" is null
      and "creadoEn" > now() - interval '1 hour'
  loop
    begin
      v_resultado := net.http_collect_response(fila."requestId", async := true);
      if v_resultado.status = 'SUCCESS' then
        update avisos_enviados
        set "exito" = ((v_resultado.response).status_code between 200 and 299)
        where "id" = fila."id";
      elsif v_resultado.status = 'ERROR' then
        update avisos_enviados set "exito" = false where "id" = fila."id";
      end if;
    exception when others then
      null;
    end;
  end loop;
end;
$$;

-- Manda a un colaborador el aviso de los invitados que se le han asignado.
CREATE FUNCTION public.anfitrion_avisar_colaborador(p_token uuid, p_colaborador_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  lista_invitados text;
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  select string_agg(
    '<li>' || coalesce("nombre", '') || ' ' || coalesce("apellido", '') || '</li>',
    '' order by "apellido", "nombre"
  )
  into lista_invitados
  from invitados
  where "colaboradorId" = p_colaborador_id and "avisoPendiente" = true and "confirmado" = true;

  perform enviar_email(
    (select "email" from colaboradores where "id" = p_colaborador_id),
    'Tus invitados asignados',
    replace(
      (select "plantillaAsignacion" from evento limit 1),
      '{colaborador}', coalesce((select "nombre" from colaboradores where "id" = p_colaborador_id), '')
    ) ||
    case
      when lista_invitados is not null then '<ul>' || lista_invitados || '</ul>'
      else ''
    end ||
    case
      when coalesce((select "urlPublica" from evento limit 1), '') = '' then ''
      else
        '<div style="margin-top:18px;"><a href="' ||
        (select "urlPublica" from evento limit 1) || '?rol=' || p_colaborador_id::text ||
        '" style="display:inline-block;background:#1F3A2E;color:#EFE9DE;' ||
        'padding:10px 22px;border-radius:6px;text-decoration:none;' ||
        'font-weight:600;font-family:sans-serif;">Abrir formulario</a></div>'
    end ||
    '<br><br><small>Aviso automático de la app de invitados del evento.</small>'
  );

  update invitados set "avisoPendiente" = false
  where "colaboradorId" = p_colaborador_id and "avisoPendiente" = true and "confirmado" = true;
end;
$$;

-- Da por buena la nueva dirección de correo de un colaborador.
CREATE FUNCTION public.anfitrion_confirmar_email_colaborador_actualizado(p_token uuid, p_colaborador_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  update colaboradores
  set "emailSincronizadoEn" = null
  where "id" = p_colaborador_id;
end;
$$;

-- Cierra la recogida de datos de un colaborador y le manda el acuse.
CREATE FUNCTION public.anfitrion_confirmar_recogida_colaborador(p_token uuid, p_colaborador_id uuid, p_importe numeric, p_email text, p_asunto text, p_html text, p_adjunto_nombre text, p_adjunto_base64 text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  update colaboradores
  set "dineroRecogidoEn" = now(), "dineroRecogidoImporte" = p_importe
  where "id" = p_colaborador_id;

  perform enviar_email(p_email, p_asunto, p_html, p_adjunto_nombre, p_adjunto_base64, null, 'asignados');
end;
$$;

-- Sale del modo pruebas y devuelve los datos a como estaban.
CREATE FUNCTION public.anfitrion_desactivar_modo_pruebas(p_token uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_datos jsonb;
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  select "datos" into v_datos from modo_pruebas_snapshot where "id" = true;
  if v_datos is null then
    update evento set "modoPruebasActivo" = false where true;
    return;
  end if;

  delete from invitados where true;
  delete from colaboradores where true;
  delete from mesas where true;
  delete from gastos where true;
  delete from orden_familias where true;
  delete from fotos_familiares where true;
  delete from avisos_enviados where true;
  delete from novedades where true;
  delete from evento where true;

  insert into invitados
  select * from jsonb_populate_recordset(
    null::invitados,
    (select coalesce(jsonb_agg(elem - 'colaboradorId'), '[]'::jsonb)
     from jsonb_array_elements(v_datos->'invitados') elem)
  );

  insert into colaboradores
  select * from jsonb_populate_recordset(null::colaboradores, v_datos->'colaboradores');

  update invitados i set "colaboradorId" = (elem->>'colaboradorId')::uuid
  from jsonb_array_elements(v_datos->'invitados') elem
  where (elem->>'id')::uuid = i."id" and elem->>'colaboradorId' is not null;

  insert into mesas select * from jsonb_populate_recordset(null::mesas, v_datos->'mesas');
  insert into gastos select * from jsonb_populate_recordset(null::gastos, v_datos->'gastos');
  insert into orden_familias
  select * from jsonb_populate_recordset(null::orden_familias, v_datos->'ordenFamilias');
  insert into fotos_familiares
  select * from jsonb_populate_recordset(null::fotos_familiares, v_datos->'fotosFamiliares');
  insert into avisos_enviados overriding system value
  select * from jsonb_populate_recordset(null::avisos_enviados, v_datos->'avisosEnviados');

  insert into novedades
    select * from jsonb_populate_recordset(null::novedades, coalesce(v_datos->'novedades', '[]'::jsonb));
  insert into evento select * from jsonb_populate_record(null::evento, v_datos->'evento');

  delete from modo_pruebas_snapshot where true;
end;
$$;

-- Deshace ese cierre y vuelve a dejar la recogida abierta.
CREATE FUNCTION public.anfitrion_deshacer_recogida_colaborador(p_token uuid, p_colaborador_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  update colaboradores
  set "dineroRecogidoEn" = null, "dineroRecogidoImporte" = null
  where "id" = p_colaborador_id;
end;
$$;

-- Envía la invitación a una familia.
CREATE FUNCTION public.anfitrion_enviar_invitacion_familia(p_token uuid, p_email text, p_asunto text, p_html text, p_imagen_base64 text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  perform enviar_email(
    p_email, p_asunto, p_html, 'invitacion.png', p_imagen_base64,
    (select "emailRemitenteFamilia" from config_secretos limit 1),
    'invitacion'
  );
end;
$$;

-- Envía a un colaborador el enlace para crear su cuenta de acceso.
CREATE FUNCTION public.anfitrion_enviar_invitacion_login(p_token uuid, p_colaborador_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  v_email text;
  v_nombre text;
  v_enlace text;
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  select "email", "nombre" into v_email, v_nombre from colaboradores where "id" = p_colaborador_id;
  if v_email is null or trim(v_email) = '' then
    return;
  end if;

  v_enlace := coalesce((select "urlPublica" from evento limit 1), '')
    || '?crear=' || replace(v_email, '+', '%2B');

  perform enviar_email(
    v_email,
    'Tu acceso para colaborar',
    'Hola ' || coalesce(nullif(v_nombre, ''), '') || ',<br><br>' ||
    'Ya puedes crear tu cuenta para gestionar tus invitados asignados. ' ||
    'Pulsa el botón y elige tu contraseña:' ||
    '<div style="margin-top:18px;"><a href="' || v_enlace ||
    '" style="display:inline-block;background:#1F3A2E;color:#EFE9DE;' ||
    'padding:10px 22px;border-radius:6px;text-decoration:none;' ||
    'font-weight:600;font-family:sans-serif;">Crear mi cuenta</a></div>' ||
    '<br><small>Si el botón no funciona, copia este enlace: ' || v_enlace || '</small>'
  );
end;
$$;

-- Guarda la lista de colaboradores y sus permisos.
CREATE FUNCTION public.anfitrion_guardar_colaboradores(p_token uuid, p_filas jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  r record;
  resumen text;
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  -- Aviso de "ponerse al día": si un colaborador pasa de no tener email a
  -- tenerlo, le mandamos ya mismo la lista de invitados que tuviera
  -- asignados de antes (por si se le asignaron sin que aún tuviera email).
  for r in
    select
      (f->>'id')::uuid as colaborador_id,
      nullif(f->>'email','') as nuevo_email,
      c."email" as anterior_email
    from jsonb_array_elements(p_filas) as f
    left join colaboradores c on c."id" = (f->>'id')::uuid
  loop
    if r.nuevo_email is not null and coalesce(r.anterior_email, '') = '' then
      select string_agg(
        '<li>' || coalesce(i."nombre", '') || ' ' || coalesce(i."apellido", '') || '</li>',
        '' order by i."apellido", i."nombre"
      )
      into resumen
      from invitados i
      where i."colaboradorId" = r.colaborador_id;

      if resumen is not null then
        perform enviar_email(
          r.nuevo_email,
          'Tus invitados asignados',
          'Hola,<br><br>Ya tienes registrado tu email. Estos son los invitados que ya tenías asignados:' ||
            '<ul>' || resumen || '</ul>' ||
            case
              when coalesce((select "urlPublica" from evento limit 1), '') = '' then ''
              else
                '<div style="margin-top:18px;"><a href="' ||
                (select "urlPublica" from evento limit 1) || '?rol=' || r.colaborador_id::text ||
                '" style="display:inline-block;background:#1F3A2E;color:#EFE9DE;' ||
                'padding:10px 22px;border-radius:6px;text-decoration:none;' ||
                'font-weight:600;font-family:sans-serif;">Abrir formulario</a></div>'
            end ||
            '<small>Aviso automático de la app de invitados del evento.</small>'
        );
      end if;
    end if;
  end loop;

  insert into colaboradores ("id", "nombre", "invitadoId", "email", "permisos")
  select
    (f->>'id')::uuid, f->>'nombre', nullif(f->>'invitadoId','')::uuid,
    coalesce(f->>'email', ''),
    coalesce(f->'permisos', '[]'::jsonb)
  from jsonb_array_elements(p_filas) as f
  on conflict ("id") do update
    set "nombre" = excluded."nombre",
        "invitadoId" = excluded."invitadoId",
        "email" = excluded."email",
        "permisos" = excluded."permisos";

  delete from colaboradores c
  where not exists (
    select 1 from jsonb_array_elements(p_filas) f
    where (f->>'id')::uuid = c."id"
  );
end;
$$;

-- Guarda la lista de gastos.
CREATE FUNCTION public.anfitrion_guardar_gastos(p_token uuid, p_filas jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token <> (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  insert into gastos ("id", "concepto", "categoria", "importe", "pagado")
  select
    (f->>'id')::uuid,
    coalesce(f->>'concepto', ''),
    coalesce(f->>'categoria', ''),
    coalesce(f->>'importe', ''),
    coalesce((f->>'pagado')::boolean, false)
  from jsonb_array_elements(p_filas) as f
  on conflict ("id") do update
    set "concepto" = excluded."concepto",
        "categoria" = excluded."categoria",
        "importe" = excluded."importe",
        "pagado" = excluded."pagado";

  delete from gastos g
  where not exists (
    select 1 from jsonb_array_elements(p_filas) f
    where (f->>'id')::uuid = g."id"
  );
end;
$$;

-- Guarda la lista de invitados. Es la función más usada de toda la app.
CREATE FUNCTION public.anfitrion_guardar_invitados(p_token uuid, p_filas jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  insert into invitados (
    "id","nombre","apellido","zona","confirmado","colaboradorId",
    "grupoFamiliar","mesa","anioNacimiento","anioBoda","email",
    "cancion","alergias","observaciones","pagado","rolesTrabajo",
    "excluidoTablon","rolFamiliar","presente"
  )
  select
    (f->>'id')::uuid, f->>'nombre', f->>'apellido', f->>'zona',
    coalesce((f->>'confirmado')::boolean, false),
    nullif(f->>'colaboradorId','')::uuid,
    f->>'grupoFamiliar', nullif(f->>'mesa','')::integer,
    f->>'anioNacimiento', f->>'anioBoda', f->>'email', f->>'cancion',
    f->>'alergias', f->>'observaciones',
    coalesce((f->>'pagado')::boolean, false),
    coalesce(f->'rolesTrabajo', '[]'::jsonb),
    coalesce((f->>'excluidoTablon')::boolean, false),
    coalesce(f->>'rolFamiliar', ''),
    coalesce((f->>'presente')::boolean, false)
  from jsonb_array_elements(p_filas) as f
  on conflict ("id") do update set
    "nombre"=excluded."nombre", "apellido"=excluded."apellido",
    "zona"=excluded."zona", "confirmado"=excluded."confirmado",
    "colaboradorId"=excluded."colaboradorId", "grupoFamiliar"=excluded."grupoFamiliar",
    "mesa"=excluded."mesa", "anioNacimiento"=excluded."anioNacimiento",
    "anioBoda"=excluded."anioBoda", "email"=excluded."email",
    "cancion"=excluded."cancion", "alergias"=excluded."alergias",
    "observaciones"=excluded."observaciones", "pagado"=excluded."pagado",
    "rolesTrabajo"=excluded."rolesTrabajo", "excluidoTablon"=excluded."excluidoTablon",
    "rolFamiliar"=excluded."rolFamiliar", "presente"=excluded."presente";

  delete from invitados g
  where not exists (
    select 1 from jsonb_array_elements(p_filas) f
    where (f->>'id')::uuid = g."id"
  );
end;
$$;

-- Guarda las mesas y su posición en el plano.
CREATE FUNCTION public.anfitrion_guardar_mesas(p_token uuid, p_filas jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    raise exception 'Token no válido';
  end if;

  delete from mesas
  where "numero" not in (
    select (v->>'numero')::int from jsonb_array_elements(coalesce(p_filas, '[]'::jsonb)) v
  );

  insert into mesas ("numero", "capacidad", "posX", "posY")
  select (v->>'numero')::int,
         coalesce((v->>'capacidad')::int, 10),
         (v->>'posX')::numeric,
         (v->>'posY')::numeric
  from jsonb_array_elements(coalesce(p_filas, '[]'::jsonb)) v
  on conflict ("numero") do update set
    "capacidad" = excluded."capacidad",
    "posX"      = excluded."posX",
    "posY"      = excluded."posY";
end;
$$;

-- Guarda las novedades del tablón.
CREATE FUNCTION public.anfitrion_guardar_novedades(p_token uuid, p_filas jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  insert into novedades ("id", "titulo", "cuerpo", "publicada", "creadaEn", "esNovedad")
  select
    (f->>'id')::uuid, coalesce(f->>'titulo', ''), coalesce(f->>'cuerpo', ''),
    coalesce((f->>'publicada')::boolean, true),
    coalesce((f->>'creadaEn')::timestamptz, now()),
    coalesce((f->>'esNovedad')::boolean, false)
  from jsonb_array_elements(p_filas) as f
  on conflict ("id") do update
    set "titulo" = excluded."titulo",
        "cuerpo" = excluded."cuerpo",
        "publicada" = excluded."publicada",
        "esNovedad" = excluded."esNovedad";

  delete from novedades n
  where not exists (
    select 1 from jsonb_array_elements(p_filas) f
    where (f->>'id')::uuid = n."id"
  );
end;
$$;

-- Guarda la pregunta de control del tablón y su respuesta.
CREATE FUNCTION public.anfitrion_guardar_pregunta_tablon(p_token uuid, p_pregunta text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;
  update tablon_secreto set "pregunta" = p_pregunta where true;
end;
$$;

-- Lista los intentos raros de entrar al tablón.
CREATE FUNCTION public.anfitrion_listar_accesos_tablon_sospechosos(p_token uuid) RETURNS TABLE("nombreNormalizado" text, "numDispositivos" bigint, "ultimoAcceso" timestamp with time zone)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select ta."nombreNormalizado", count(*), max(ta."actualizadoEn")
  from tablon_accesos ta
  where p_token = (select "token" from anfitrion_secreto limit 1)
  group by ta."nombreNormalizado"
  having count(*) > 1
  order by max(ta."actualizadoEn") desc;
$$;

SET default_tablespace = '';

SET default_table_access_method = heap;

-- Lista los emails enviados y si salieron bien.
CREATE FUNCTION public.anfitrion_listar_avisos_enviados(p_token uuid) RETURNS SETOF public.avisos_enviados
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select * from avisos_enviados
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by "creadoEn" desc
  limit 200;
$$;

-- Lista los colaboradores.
CREATE FUNCTION public.anfitrion_listar_colaboradores(p_token uuid) RETURNS SETOF public.colaboradores
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select c.* from colaboradores c
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by c."nombre";
$$;

-- Lista los gastos.
CREATE FUNCTION public.anfitrion_listar_gastos(p_token uuid) RETURNS SETOF public.gastos
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select * from gastos
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by "categoria", "concepto";
$$;

-- Lista las versiones anteriores de un texto, para deshacer.
CREATE FUNCTION public.anfitrion_listar_historial_texto(p_token uuid, p_origen text, p_ref_id uuid, p_campo text) RETURNS SETOF public.historial_texto
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select h.* from historial_texto h
  where p_token = (select "token" from anfitrion_secreto limit 1)
    and h."origen" = p_origen
    and coalesce(h."refId", '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_ref_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and h."campo" = p_campo
  order by h."guardadoEn" desc
  limit 10;
$$;

-- Lista los invitados.
CREATE FUNCTION public.anfitrion_listar_invitados(p_token uuid) RETURNS SETOF public.invitados
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select i.* from invitados i
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by i."apellido", i."nombre";
$$;

-- Lista las novedades.
CREATE FUNCTION public.anfitrion_listar_novedades(p_token uuid) RETURNS SETOF public.novedades
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select n.* from novedades n
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by n."creadaEn" desc;
$$;

-- Lee la pregunta de control del tablón.
CREATE FUNCTION public.anfitrion_obtener_pregunta_tablon(p_token uuid) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select "pregunta" from tablon_secreto
  where p_token = (select "token" from anfitrion_secreto limit 1);
$$;

-- Lee la llave del tablón (la del enlace que se manda por WhatsApp).
CREATE FUNCTION public.anfitrion_obtener_token_tablon(p_token uuid) RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select case
    when p_token = (select "token" from anfitrion_secreto limit 1)
    then (select "token" from tablon_secreto limit 1)
    else null
  end;
$$;

-- Envía un correo de prueba para comprobar que la dirección funciona.
CREATE FUNCTION public.anfitrion_probar_email_colaborador(p_token uuid, p_colaborador_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  perform enviar_email(
    (select "email" from colaboradores where "id" = p_colaborador_id),
    'Email de prueba',
    'Hola,<br><br>Esto es un email de prueba para confirmar que esta dirección está bien escrita ' ||
    'y te llegan los avisos de la app de invitados del evento.<br><br>' ||
    'Si has recibido esto, todo funciona correctamente — no hace falta que respondas.'
  );
end;
$$;

-- Vuelve a enviar el acuse de recibo a un colaborador.
CREATE FUNCTION public.anfitrion_reenviar_acuse_colaborador(p_token uuid, p_email text, p_asunto text, p_html text, p_adjunto_nombre text, p_adjunto_base64 text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  perform enviar_email(p_email, p_asunto, p_html, p_adjunto_nombre, p_adjunto_base64, null, 'asignados');
end;
$$;

-- Marca todos los avisos como no enviados.
CREATE FUNCTION public.anfitrion_resetear_avisos(p_token uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token <> (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;
  delete from avisos_enviados where true;
  update invitados set "avisoPendiente" = true where "colaboradorId" is not null;
end;
$$;

-- Quita asignaciones o campos de unos invitados concretos. Nunca borra invitados.
CREATE FUNCTION public.anfitrion_resetear_por_invitados(p_token uuid, p_invitado_ids uuid[], p_categoria text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if p_token <> (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  if p_categoria = 'datos' then
    update invitados set
      "anioNacimiento" = '', "anioBoda" = '', "email" = '',
      "cancion" = '', "alergias" = '', "observaciones" = ''
    where "id" = any(p_invitado_ids);
  elsif p_categoria = 'pago' then
    update invitados set "pagado" = false
    where "id" = any(p_invitado_ids);
  elsif p_categoria = 'mesa' then
    update invitados set "mesa" = null
    where "id" = any(p_invitado_ids);
  elsif p_categoria = 'asignacion' then
    update invitados set "colaboradorId" = null
    where "id" = any(p_invitado_ids);
  elsif p_categoria = 'foto' then
    delete from fotos_familiares where "grupoFamiliar" in (
      select distinct coalesce(nullif("grupoFamiliar", ''), "apellido")
      from invitados where "id" = any(p_invitado_ids)
    );
  elsif p_categoria = 'invitacion' then
    update orden_familias set "invitacionEnviada" = false, "invitacionEnviadaEn" = null
    where "grupoFamiliar" in (
      select distinct coalesce(nullif("grupoFamiliar", ''), "apellido")
      from invitados where "id" = any(p_invitado_ids)
    );
  end if;
end;
$$;


-- ------------------------------------------------------------
-- Los colaboradores
-- ------------------------------------------------------------

-- El colaborador da por terminada su recogida de datos.
CREATE FUNCTION public.colaborador_confirmar_datos_completos(p_colaborador_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  total integer;
  completos integer;
begin
  if not colaborador_puede_actuar(p_colaborador_id) then
    return false;
  end if;

  select count(*), count(*) filter (
    where coalesce("anioNacimiento", '') <> '' and coalesce("alergias", '') <> ''
  )
  into total, completos
  from invitados
  where "colaboradorId" = p_colaborador_id and "confirmado" = true;

  if total > 0 and total = completos then
    perform enviar_email(
      (select "emailAnfitrion" from evento limit 1),
      'Datos completados',
      replace(
        (select "plantillaDatosCompletados" from evento limit 1),
        '{colaborador}', coalesce((select "nombre" from colaboradores where "id" = p_colaborador_id), '')
      ) || '<br><br><small>Aviso automático de la app de invitados del evento.</small>',
      p_tipo := 'datos'
    );
    return true;
  end if;
  return false;
end;
$$;

-- El colaborador da por terminados sus cobros.
CREATE FUNCTION public.colaborador_confirmar_pagos_completos(p_colaborador_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  total integer;
  pagados integer;
begin
  if not colaborador_puede_actuar(p_colaborador_id) then
    return false;
  end if;

  select count(*), count(*) filter (where "pagado")
  into total, pagados
  from invitados
  where "colaboradorId" = p_colaborador_id and "confirmado" = true;

  if total > 0 and total = pagados then
    perform enviar_email(
      (select "emailAnfitrion" from evento limit 1),
      'Pagos completos',
      replace(
        (select "plantillaPagoRegistrado" from evento limit 1),
        '{colaborador}', coalesce((select "nombre" from colaboradores where "id" = p_colaborador_id), '')
      ) || '<br><br><small>Aviso automático de la app de invitados del evento.</small>',
      p_tipo := 'datos'
    );
    return true;
  end if;
  return false;
end;
$$;

-- El colaborador guarda los datos de uno de sus invitados.
CREATE FUNCTION public.colaborador_guardar_invitado(p_colaborador_id uuid, p_invitado_id uuid, p_cambios jsonb) RETURNS SETOF public.invitados
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if not colaborador_puede_actuar(p_colaborador_id) then
    return;
  end if;

  perform set_config('eventos.recalculo_aviso_activo', 'off', true);
  return query
  update invitados set
    "anioNacimiento" = coalesce(p_cambios->>'anioNacimiento', "anioNacimiento"),
    "anioBoda"       = coalesce(p_cambios->>'anioBoda', "anioBoda"),
    "email"          = coalesce(p_cambios->>'email', "email"),
    "cancion"        = coalesce(p_cambios->>'cancion', "cancion"),
    "alergias"       = coalesce(p_cambios->>'alergias', "alergias"),
    "observaciones"  = coalesce(p_cambios->>'observaciones', "observaciones")
  where "id" = p_invitado_id and "colaboradorId" = p_colaborador_id
  returning *;
end;
$$;

-- El colaborador escribe en el tablón de novedades, si tiene permiso.
CREATE FUNCTION public.colaborador_guardar_novedades(p_colaborador_id uuid, p_filas jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if not colaborador_puede_editar_novedades(p_colaborador_id) then
    return;
  end if;

  update novedades n
  set "titulo" = coalesce(f->>'titulo', n."titulo"),
      "cuerpo" = coalesce(f->>'cuerpo', n."cuerpo"),
      "publicada" = coalesce((f->>'publicada')::boolean, n."publicada")
  from jsonb_array_elements(p_filas) as f
  where n."id" = (f->>'id')::uuid;
end;
$$;

-- El colaborador ve las novedades.
CREATE FUNCTION public.colaborador_listar_novedades(p_colaborador_id uuid) RETURNS SETOF public.novedades
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select n.* from novedades n
  where colaborador_puede_editar_novedades(p_colaborador_id)
  order by n."creadaEn" desc;
$$;

-- El colaborador marca a un invitado como pagado.
CREATE FUNCTION public.colaborador_marcar_pagado(p_colaborador_id uuid, p_invitado_id uuid, p_pagado boolean) RETURNS SETOF public.invitados
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  actualizado invitados;
begin
  if not colaborador_puede_actuar(p_colaborador_id) then
    return;
  end if;

  if p_pagado then
    perform 1 from invitados
    where "id" = p_invitado_id and "colaboradorId" = p_colaborador_id
      and coalesce("anioNacimiento", '') <> '' and coalesce("alergias", '') <> '';
    if not found then
      return;
    end if;
  end if;

  perform set_config('eventos.recalculo_aviso_activo', 'off', true);
  update invitados set "pagado" = p_pagado
  where "id" = p_invitado_id and "colaboradorId" = p_colaborador_id
  returning * into actualizado;

  if not found then
    return;
  end if;

  return next actualizado;
end;
$$;

-- El colaborador marca a un invitado como presente el día de la boda.
CREATE FUNCTION public.colaborador_marcar_presente(p_colaborador_id uuid, p_invitado_id uuid, p_presente boolean) RETURNS SETOF public.invitados
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare
  actualizado invitados;
begin
  if not colaborador_puede_actuar(p_colaborador_id) then
    return;
  end if;

  if p_presente then
    if not coalesce((select "asistenciaAbierta" from evento limit 1), false) then
      return;
    end if;

    perform 1 from invitados
    where "id" = p_invitado_id and "colaboradorId" = p_colaborador_id
      and coalesce("anioNacimiento", '') <> ''
      and coalesce("alergias", '') <> ''
      and "pagado" = true;
    if not found then
      return;
    end if;
  end if;

  perform set_config('eventos.recalculo_aviso_activo', 'off', true);
  update invitados set "presente" = p_presente
  where "id" = p_invitado_id and "colaboradorId" = p_colaborador_id
  returning * into actualizado;

  if not found then
    return;
  end if;

  return next actualizado;
end;
$$;

-- El colaborador ve su propia ficha y sus permisos.
CREATE FUNCTION public.colaborador_mi_perfil(p_colaborador_id uuid) RETURNS SETOF public.colaboradores
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$ select * from colaboradores where "id" = p_colaborador_id; $$;

-- El colaborador ve solo los invitados que le tocan.
CREATE FUNCTION public.colaborador_mis_invitados(p_colaborador_id uuid) RETURNS SETOF public.invitados
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select i.* from invitados i
  where i."colaboradorId" = p_colaborador_id
    and i."confirmado" = true
    and exists (
      select 1 from colaboradores c
      where c."id" = p_colaborador_id and c."authUserId" = auth.uid()
    );
$$;

-- El colaborador lee la llave del tablón para poder compartir el enlace.
CREATE FUNCTION public.colaborador_obtener_token_tablon(p_colaborador_id uuid) RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select case
    when exists (
      select 1 from colaboradores c
      where c."id" = p_colaborador_id and c."authUserId" = auth.uid()
    )
    then (select "token" from tablon_secreto limit 1)
    else null
  end;
$$;


-- ------------------------------------------------------------
-- El tablón público
-- ------------------------------------------------------------

-- Devuelve las novedades publicadas a quien ha pasado el control.
CREATE FUNCTION public.tablon_listar_novedades(p_token uuid, p_respuesta text, p_dispositivo_id text) RETURNS SETOF public.novedades
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
declare
  v_valido boolean;
begin
  v_valido := tablon_verificar_respuesta(p_token, p_respuesta);
  if v_valido then
    insert into tablon_accesos ("nombreNormalizado", "dispositivoId")
    values (normalizar_nombre_tablon(p_respuesta), coalesce(nullif(p_dispositivo_id, ''), 'desconocido'))
    on conflict ("nombreNormalizado", "dispositivoId") do update set "actualizadoEn" = now();
  end if;

  return query
  select n.* from novedades n
  where v_valido and n."publicada" = true
  order by n."creadaEn" desc;
end;
$$;

-- Devuelve la pregunta de control a quien abre el tablón.
CREATE FUNCTION public.tablon_obtener_pregunta(p_token uuid) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  select case
    when p_token = (select "token" from tablon_secreto limit 1)
    then (select "pregunta" from tablon_secreto limit 1)
    else null
  end;
$$;

-- Comprueba el nombre y apellido contra la lista de confirmados.
CREATE FUNCTION public.tablon_verificar_respuesta(p_token uuid, p_respuesta text) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $$
  select p_token = (select "token" from tablon_secreto limit 1)
    and exists (
      select 1 from invitados i
      where i."confirmado" = true
        and i."excluidoTablon" = false
        and normalizar_nombre_tablon(i."apellido" || ' ' || i."nombre") = normalizar_nombre_tablon(p_respuesta)
    );
$$;


-- ------------------------------------------------------------
-- Funciones que disparan los avisos automáticos (triggers)
-- ------------------------------------------------------------

-- Si un colaborador cambia su email de acceso, lo copia a su ficha.
CREATE FUNCTION public.sincronizar_email_colaborador() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  update colaboradores
  set "email" = new.email, "emailSincronizadoEn" = now()
  where "authUserId" = new.id;
  return new;
end;
$$;

-- Cuando alguien se registra, le engancha su ficha de colaborador.
CREATE FUNCTION public.vincular_cuenta_nueva() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
begin
  if lower(new.email) = lower((select "emailAnfitrion" from evento limit 1)) then
    insert into anfitriones ("authUserId") values (new.id)
    on conflict do nothing;
  else
    update colaboradores
    set "authUserId" = new.id
    where lower("email") = lower(new.email);
  end if;
  return new;
end;
$$;

-- Recalcula si un invitado tiene un aviso pendiente de enviar.
CREATE FUNCTION public.trg_recalcular_aviso_pendiente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- Vía de escape para las funciones del propio colaborador (rellenar
  -- datos, marcar pago): su cambio no debe generarle un aviso a sí mismo.
  if coalesce(current_setting('eventos.recalculo_aviso_activo', true), 'on') = 'off' then
    return new;
  end if;

  if new."colaboradorId" is null then
    new."avisoPendiente" := false;
  elsif TG_OP = 'INSERT' then
    new."avisoPendiente" := new."confirmado";
  elsif new."confirmado" and (
    new."colaboradorId" is distinct from old."colaboradorId" or
    new."confirmado" is distinct from old."confirmado" or
    new."anioNacimiento" is distinct from old."anioNacimiento" or
    new."anioBoda" is distinct from old."anioBoda" or
    new."email" is distinct from old."email" or
    new."cancion" is distinct from old."cancion" or
    new."alergias" is distinct from old."alergias" or
    new."observaciones" is distinct from old."observaciones" or
    new."pagado" is distinct from old."pagado" or
    new."mesa" is distinct from old."mesa"
  ) then
    new."avisoPendiente" := true;
  end if;
  return new;
end;
$$;

-- Si cambian los datos de un invitado, marca la invitación de su familia como caducada.
CREATE FUNCTION public.trg_invalidar_invitacion_familia() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  clave text;
  clave_anterior text;
begin
  clave := coalesce(nullif(new."grupoFamiliar", ''), new."apellido");
  update orden_familias set "invitacionEnviada" = false, "invitacionEnviadaEn" = null
  where "grupoFamiliar" = clave and "invitacionEnviada" = true;

  if TG_OP = 'UPDATE' then
    clave_anterior := coalesce(nullif(old."grupoFamiliar", ''), old."apellido");
    if clave_anterior is distinct from clave then
      update orden_familias set "invitacionEnviada" = false, "invitacionEnviadaEn" = null
      where "grupoFamiliar" = clave_anterior and "invitacionEnviada" = true;
    end if;
  end if;

  return new;
end;
$$;

-- Al cambiar el texto de una novedad, guarda el anterior.
CREATE FUNCTION public.trg_historial_novedad_cuerpo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old."cuerpo" is distinct from new."cuerpo" then
    perform registrar_historial_texto('novedad', old."id", 'cuerpo', old."cuerpo");
  end if;
  return new;
end;
$$;

-- Al cambiar una plantilla de email, guarda la anterior.
CREATE FUNCTION public.trg_historial_plantillas_email() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old."plantillaAsignacion" is distinct from new."plantillaAsignacion" then
    perform registrar_historial_texto('plantilla', null, 'plantillaAsignacion', old."plantillaAsignacion");
  end if;
  if old."plantillaDatosCompletados" is distinct from new."plantillaDatosCompletados" then
    perform registrar_historial_texto('plantilla', null, 'plantillaDatosCompletados', old."plantillaDatosCompletados");
  end if;
  if old."plantillaPagoRegistrado" is distinct from new."plantillaPagoRegistrado" then
    perform registrar_historial_texto('plantilla', null, 'plantillaPagoRegistrado', old."plantillaPagoRegistrado");
  end if;
  if old."plantillaInvitacionFamilia" is distinct from new."plantillaInvitacionFamilia" then
    perform registrar_historial_texto('plantilla', null, 'plantillaInvitacionFamilia', old."plantillaInvitacionFamilia");
  end if;
  return new;
end;
$$;



-- ============================================================
-- 5. AVISOS AUTOMÁTICOS (TRIGGERS)
-- ============================================================
-- Se disparan solos cuando cambia una fila. Son los que mantienen
-- al día el aviso pendiente de cada invitado, invalidan una
-- invitación cuando cambian los datos de la familia y guardan el
-- texto anterior para poder deshacer.

CREATE TRIGGER invitados_invalidar_invitacion AFTER INSERT OR UPDATE OF confirmado, pagado, mesa, "grupoFamiliar", apellido ON public.invitados FOR EACH ROW EXECUTE FUNCTION public.trg_invalidar_invitacion_familia();

CREATE TRIGGER invitados_recalcular_aviso BEFORE INSERT OR UPDATE ON public.invitados FOR EACH ROW EXECUTE FUNCTION public.trg_recalcular_aviso_pendiente();

CREATE TRIGGER trg_historial_novedad_cuerpo AFTER UPDATE OF cuerpo ON public.novedades FOR EACH ROW EXECUTE FUNCTION public.trg_historial_novedad_cuerpo();

CREATE TRIGGER trg_historial_plantillas_email AFTER UPDATE ON public.evento FOR EACH ROW EXECUTE FUNCTION public.trg_historial_plantillas_email();

CREATE TRIGGER trg_sincronizar_email_colaborador AFTER UPDATE OF email ON auth.users FOR EACH ROW WHEN (((old.email)::text IS DISTINCT FROM (new.email)::text)) EXECUTE FUNCTION public.sincronizar_email_colaborador();

CREATE TRIGGER trg_vincular_cuenta_nueva AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.vincular_cuenta_nueva();



-- ============================================================
-- 6. PERMISOS DE LECTURA Y ESCRITURA (RLS)
-- ============================================================
-- Todas las tablas tienen la seguridad por fila activada. Solo
-- cuatro permiten lectura pública, que es lo que necesita la página
-- de la boda para verse sin entrar: los datos del evento, las fotos
-- de familia, las mesas y el orden de las familias.
--
-- El resto no tiene NINGUNA política. Eso significa que desde fuera
-- no se puede leer ni escribir nada: solo se llega a través de las
-- funciones de la sección 4. Ni la lista de invitados, ni los
-- emails, ni las llaves.

alter table public.evento enable row level security;
alter table public.invitados enable row level security;
alter table public.colaboradores enable row level security;
alter table public.mesas enable row level security;
alter table public.orden_familias enable row level security;
alter table public.fotos_familiares enable row level security;
alter table public.novedades enable row level security;
alter table public.gastos enable row level security;
alter table public.avisos_enviados enable row level security;
alter table public.historial_texto enable row level security;
alter table public.anfitriones enable row level security;
alter table public.anfitrion_secreto enable row level security;
alter table public.config_secretos enable row level security;
alter table public.tablon_secreto enable row level security;
alter table public.tablon_accesos enable row level security;
alter table public.modo_pruebas_snapshot enable row level security;

CREATE POLICY lectura_publica ON public.evento FOR SELECT USING (true);

CREATE POLICY lectura_publica ON public.fotos_familiares FOR SELECT USING (true);

CREATE POLICY lectura_publica ON public.mesas FOR SELECT USING (true);

CREATE POLICY lectura_publica ON public.orden_familias FOR SELECT USING (true);



-- ============================================================
-- 7. CARPETAS DE ARCHIVOS (STORAGE)
-- ============================================================
-- Cuatro carpetas públicas de lectura: cualquiera puede ver o oír
-- lo que hay dentro (hace falta para la página y para el mando de
-- música), pero solo el anfitrión puede subir, cambiar o borrar.

insert into storage.buckets (id, name, public) values ('musica-ambiental', 'musica-ambiental', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('og-imagen', 'og-imagen', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('cronograma', 'cronograma', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('musica-fondo', 'musica-fondo', true)
  on conflict (id) do nothing;

-- El quinto es CERRADO (public = false), a diferencia de los cuatro de
-- arriba: guarda las fotos de boda y de aniversario de cada matrimonio, y
-- esas no deben poder verse acertando una dirección. Para enseñarlas hay
-- que pedir un enlace temporal (createSignedUrl), ver lib/fotosAlmacen.js.
insert into storage.buckets (id, name, public) values ('fotos-matrimonios', 'fotos-matrimonios', false)
  on conflict (id) do nothing;

CREATE POLICY cronograma_lectura_publica ON storage.objects FOR SELECT USING ((bucket_id = 'cronograma'::text));

CREATE POLICY cronograma_solo_anfitrion_borra ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'cronograma'::text) AND public.es_anfitrion()));

CREATE POLICY cronograma_solo_anfitrion_reemplaza ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'cronograma'::text) AND public.es_anfitrion())) WITH CHECK (((bucket_id = 'cronograma'::text) AND public.es_anfitrion()));

CREATE POLICY cronograma_solo_anfitrion_sube ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'cronograma'::text) AND public.es_anfitrion()));

CREATE POLICY musica_ambiental_lectura_publica ON storage.objects FOR SELECT USING ((bucket_id = 'musica-ambiental'::text));

CREATE POLICY musica_ambiental_solo_anfitrion_borra ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'musica-ambiental'::text) AND public.es_anfitrion()));

CREATE POLICY musica_ambiental_solo_anfitrion_escribe ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'musica-ambiental'::text) AND public.es_anfitrion()));

CREATE POLICY musica_fondo_lectura_publica ON storage.objects FOR SELECT USING ((bucket_id = 'musica-fondo'::text));

CREATE POLICY musica_fondo_solo_anfitrion_borra ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'musica-fondo'::text) AND public.es_anfitrion()));

CREATE POLICY musica_fondo_solo_anfitrion_reemplaza ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'musica-fondo'::text) AND public.es_anfitrion())) WITH CHECK (((bucket_id = 'musica-fondo'::text) AND public.es_anfitrion()));

CREATE POLICY musica_fondo_solo_anfitrion_sube ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'musica-fondo'::text) AND public.es_anfitrion()));

CREATE POLICY og_imagen_lectura_publica ON storage.objects FOR SELECT USING ((bucket_id = 'og-imagen'::text));

CREATE POLICY og_imagen_solo_anfitrion_reemplaza ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'og-imagen'::text) AND public.es_anfitrion())) WITH CHECK (((bucket_id = 'og-imagen'::text) AND public.es_anfitrion()));

CREATE POLICY og_imagen_solo_anfitrion_sube ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'og-imagen'::text) AND public.es_anfitrion()));



-- ============================================================
-- 8. FILAS INICIALES
-- ============================================================
-- Las cuatro tablas de una sola fila necesitan que esa fila exista.
-- Las llaves se generan solas y no se escriben aquí: tras ejecutar
-- esto hay que copiar la del anfitrión desde la propia tabla, y la
-- clave de Resend se mete a mano en config_secretos.

insert into evento (id) values (true) on conflict (id) do nothing;
insert into anfitrion_secreto (id) values (true) on conflict (id) do nothing;
insert into tablon_secreto (id) values (true) on conflict (id) do nothing;
insert into config_secretos (id) values (true) on conflict (id) do nothing;

-- Las fotos de matrimonio: las ve cualquiera que haya entrado (anfitrión o
-- colaborador), nadie desde fuera. Carpetas: "boda" (original, la sube el
-- colaborador), "boda-final" (con plantilla) y "aniversario"; en estas dos
-- últimas solo escribe el anfitrión, porque la condición de carpeta pide
-- exactamente 'boda'.
create policy fotos_matrimonios_ver on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos-matrimonios');

create policy fotos_matrimonios_sube on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos-matrimonios'
    and (public.es_anfitrion() or (storage.foldername(name))[1] = 'boda')
  );

create policy fotos_matrimonios_reemplaza on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fotos-matrimonios'
    and (public.es_anfitrion() or (storage.foldername(name))[1] = 'boda')
  )
  with check (
    bucket_id = 'fotos-matrimonios'
    and (public.es_anfitrion() or (storage.foldername(name))[1] = 'boda')
  );

create policy fotos_matrimonios_borra on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fotos-matrimonios'
    and (public.es_anfitrion() or (storage.foldername(name))[1] = 'boda')
  );


-- Fin del archivo.
