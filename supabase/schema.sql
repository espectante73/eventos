-- ============================================================
-- Esquema de la app de eventos (Supabase / Postgres)
--
-- Cómo usarlo: pega TODO este archivo en el editor SQL de tu
-- proyecto de Supabase (Database > SQL Editor > New query) y
-- ejecútalo una sola vez. Es seguro volver a ejecutarlo si algo
-- falla a medias, salvo la línea "insert into evento" (fallará
-- la segunda vez porque ya existe la fila — no pasa nada, ignórala).
--
-- Nombres de columna en camelCase (a propósito): así el objeto
-- de JavaScript de la app y la fila de la base de datos usan
-- literalmente las mismas claves, sin tener que traducir entre
-- "grupoFamiliar" y "grupo_familiar" en ningún sitio del código.
-- ============================================================

-- ============================================================
-- 1. INVITADOS (la FK hacia colaboradores se añade después, para
--    resolver la referencia circular entre las dos tablas)
-- ============================================================
create table invitados (
  "id"              uuid primary key default gen_random_uuid(),
  "nombre"          text not null default '',
  "apellido"        text not null default '',
  "zona"            text not null default '',
  "confirmado"      boolean not null default false,
  "colaboradorId"   uuid null,
  "grupoFamiliar"   text not null default '',
  "mesa"            integer null,
  "anioNacimiento"  text not null default '',
  "anioBoda"        text not null default '',
  "email"           text not null default '',
  "cancion"         text not null default '',
  "alergias"        text not null default '',
  "observaciones"   text not null default '',
  "pagado"          boolean not null default false,
  -- Se marca al asignarle (o reasignarle) un colaborador, y se limpia al
  -- avisar de verdad a ese colaborador — así se sabe exactamente cuáles
  -- son "los invitados nuevos" de cada aviso, no solo un sí/no genérico.
  "avisoPendiente"  boolean not null default false
);

-- ============================================================
-- 2. COLABORADORES
-- ============================================================
create table colaboradores (
  "id"          uuid primary key default gen_random_uuid(),
  "nombre"      text not null default '',
  "invitadoId"  uuid null references invitados("id") on delete set null,
  "email"       text not null default ''
);

alter table invitados
  add constraint invitados_colaborador_fk
  foreign key ("colaboradorId") references colaboradores("id") on delete set null;

-- ============================================================
-- 3. MESAS (1 a 15, número fijo)
-- ============================================================
-- Cantidad de mesas libre (se añaden/quitan una a una desde la app) — sin
-- límite fijo de 15 como en versiones anteriores.
create table mesas (
  "numero"     integer primary key check ("numero" > 0),
  "capacidad"  integer not null default 10 check ("capacidad" >= 0),
  -- Posición en el plano de mesas (0-100, % del ancho/alto del lienzo).
  -- null = todavía no se ha colocado a mano, usa una rejilla por defecto.
  "posX"       numeric null,
  "posY"       numeric null
);

alter table invitados
  add constraint invitados_mesa_fk
  foreign key ("mesa") references mesas("numero") on delete set null;

-- ============================================================
-- 4. FOTOS FAMILIARES (diccionario: grupoFamiliar -> url)
-- ============================================================
create table fotos_familiares (
  "grupoFamiliar"  text primary key,
  "url"            text not null default ''
);

-- ============================================================
-- 4b. ORDEN Y ESTADO DE ENVÍO POR FAMILIA (diccionario: grupoFamiliar ->
--     array de ids de invitados en el orden elegido a mano por el
--     anfitrión — para poner al esposo primero, etc., en la
--     invitación — y si ya se le envió la invitación por email o no.
--     Si una familia no tiene fila aquí, se usa el orden por defecto
--     y se considera que no se le ha enviado nada todavía.
-- ============================================================
create table orden_familias (
  "grupoFamiliar"        text primary key,
  "orden"                text[] not null default '{}',
  "invitacionEnviada"    boolean not null default false,
  "invitacionEnviadaEn"  timestamptz
);

-- ============================================================
-- 4b. TRIGGERS: "avisoPendiente" e "invitacionEnviada" dejan de ser
--     banderas que cada función RPC tiene que acordarse de actualizar a
--     mano (y por eso se desincronizaban entre sí) — pasan a recalcularse
--     solas dentro de la propia base de datos en cuanto cambia algo
--     relevante. Las RPC ya NO necesitan tocar estas columnas ellas
--     mismas salvo para el único gesto deliberado de cada una: "ya avisé"
--     (avisoPendiente = false) o el reinicio explícito para pruebas.
-- ============================================================

-- Se dispara con cualquier alta o cambio en invitados. Si se desasigna
-- del colaborador, no hay a quién avisar → false. Si sigue asignado y
-- confirmado, y cambió algo que le importa al colaborador (asignación,
-- confirmación, datos, pago o mesa), pasa a pendiente — sea la primera
-- vez (alta nueva) o la enésima (un reinicio de pruebas, una edición
-- real, lo que sea). El único sitio que lo pone en false a propósito es
-- anfitrion_avisar_colaborador, cuando de verdad ya se avisó.
create or replace function trg_recalcular_aviso_pendiente()
returns trigger
language plpgsql
as $$
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

drop trigger if exists invitados_recalcular_aviso on invitados;
create trigger invitados_recalcular_aviso
before insert or update on invitados
for each row execute function trg_recalcular_aviso_pendiente();

-- Si una familia ya tiene la invitación marcada como enviada y luego
-- cambia algo que puede afectar a quién debería salir en ella (se
-- confirma un nuevo miembro, paga, se le asigna mesa, o cambia de
-- familia), se invalida el envío anterior — vuelve a aparecer en
-- "pendientes" en vez de darse por hecha para siempre con datos vejos.
-- Es intencionadamente un poco "generoso" invalidando: preferible
-- reaparecer en pendientes alguna vez de más que perder en silencio a
-- alguien que se sumó después de enviada la invitación.
create or replace function trg_invalidar_invitacion_familia()
returns trigger
language plpgsql
as $$
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

drop trigger if exists invitados_invalidar_invitacion on invitados;
create trigger invitados_invalidar_invitacion
after insert or update of "confirmado", "pagado", "mesa", "grupoFamiliar", "apellido" on invitados
for each row execute function trg_invalidar_invitacion_familia();

-- ============================================================
-- 5. EVENTO (una única fila, forzado con un truco de PK booleana)
-- ============================================================
create table evento (
  "id"                      boolean primary key default true check ("id"),
  "nombre"                  text not null default '',
  "fecha"                   text not null default '',
  "hora"                    text not null default '',
  "precio"                  text not null default '',   -- campo antiguo sin uso hoy, se mantiene por compatibilidad
  "imagen"                  text not null default '/cabecera-defecto.jpg',
  "imagenInvitacion"        text not null default '/invitacion-defecto.jpg',
  "lugar"                   text not null default '',
  "direccion"               text not null default '',
  "precioAdulto"            text not null default '',
  "precioNino"              text not null default '',
  "edadNinoDesde"           text not null default '2',
  "edadNinoHasta"           text not null default '12',
  "urlPublica"              text not null default '',
  "ocultarTituloEnImagen"   boolean not null default true,
  "emailAnfitrion"          text not null default '',
  -- Plantillas de los avisos automáticos por email. {colaborador} y
  -- {invitado} se sustituyen por los nombres reales al enviar — así el
  -- anfitrión puede cambiar el texto desde Configuración sin tocar código.
  "plantillaAsignacion"        text not null default 'Hola,<br><br>Tienes invitados nuevos asignados.<br>Entra en tu enlace cuando puedas para revisarlos y completar sus datos.',
  "plantillaDatosCompletados"  text not null default 'Hola,<br><br><b>{colaborador}</b> ha completado los datos de todos sus invitados asignados.',
  "plantillaPagoRegistrado"    text not null default 'Hola,<br><br><b>{colaborador}</b> ha completado todos los pagos de sus invitados asignados.',
  "plantillaInvitacionFamilia" text not null default 'Hola,<br><br>Aquí tienes tu invitación. ¡Os esperamos con muchas ganas!'
);
insert into evento ("id") values (true);

-- ============================================================
-- 6. SECRETO DEL ANFITRIÓN (tabla completamente cerrada — el
--    código que hace de "contraseña" para el modo Anfitrión).
--    Importante: esto NO puede vivir como columna de `evento`,
--    porque esa tabla está abierta a todo el mundo (ver abajo).
-- ============================================================
create table anfitrion_secreto (
  "id"     boolean primary key default true check ("id"),
  "token"  uuid not null default gen_random_uuid()
);
insert into anfitrion_secreto ("id") values (true);
alter table anfitrion_secreto enable row level security;
revoke all on table anfitrion_secreto from anon, authenticated;
-- Sin ninguna política de acceso = nadie puede leerla directamente.

-- ============================================================
-- 7. CONFIG SECRETA DE EMAILS (clave de Resend y remitente).
--    Misma idea que anfitrion_secreto: tabla completamente
--    cerrada, solo legible desde dentro de enviar_email().
-- ============================================================
create table config_secretos (
  "id"                      boolean primary key default true check ("id"),
  "resendApiKey"            text not null default '',
  -- Remitente por defecto: avisos internos (colaborador/anfitrión).
  "emailRemitente"          text not null default 'onboarding@resend.dev',
  -- Remitente específico para el email de invitación a la familia
  -- (distinto del anterior, para que el invitado vea un remitente
  -- pensado para él, no uno "interno" de gestión).
  "emailRemitenteFamilia"   text not null default 'onboarding@resend.dev'
);
insert into config_secretos ("id") values (true);
alter table config_secretos enable row level security;
revoke all on table config_secretos from anon, authenticated;

-- ============================================================
-- 8. REGISTRO DE AVISOS ENVIADOS (para el panel "Avisos" del
--    anfitrión). Se rellena solo, desde dentro de enviar_email().
-- ============================================================
create table avisos_enviados (
  "id"           bigint generated always as identity primary key,
  "destinatario" text not null,
  "asunto"       text not null,
  -- 'asignados' (aviso de invitados nuevos/cambiados, y prueba), 'datos'
  -- (aviso de datos/pagos completados) o 'invitacion' (a una familia) —
  -- para poder filtrar el historial por tipo en la app.
  "tipo"         text not null default 'asignados',
  -- null = todavía sin confirmar (o pg_net nunca llegó a tener respuesta
  -- dentro de la ventana que comprueba anfitrion_actualizar_estado_avisos).
  -- true = Resend respondió aceptándolo. false = Resend lo rechazó de
  -- entrada (clave inválida, remitente mal configurado...).
  "exito"        boolean,
  -- Id que devuelve net.http_post() al encolar la petición (no la
  -- respuesta en sí) — sirve para poder preguntar MÁS TARDE, en otra
  -- transacción, si ya hay respuesta. Ver enviar_email() y
  -- anfitrion_actualizar_estado_avisos() más abajo.
  "requestId"    bigint,
  "creadoEn"     timestamptz not null default now()
);
alter table avisos_enviados enable row level security;
revoke all on table avisos_enviados from anon, authenticated;
alter table avisos_enviados add column if not exists "requestId" bigint;

-- Migración de una sola vez (segura de repetir): reclasifica cualquier
-- fila que se guardara con el esquema de tipos antiguo ('colaborador' /
-- 'familia', dos tipos) al nuevo de tres, usando el asunto fijo de cada
-- email para saber cuál era.
update avisos_enviados set "tipo" = case
  when "asunto" in ('Datos completados', 'Pagos completos') then 'datos'
  when "asunto" = 'Tus invitados asignados' or "asunto" = 'Email de prueba' then 'asignados'
  when "tipo" = 'familia' then 'invitacion'
  else "tipo"
end
where "tipo" in ('colaborador', 'familia');

-- ============================================================
-- 9. GASTOS (Estado de cuentas — solo el anfitrión, nunca los
--    colaboradores). Igual de cerrada que invitados/colaboradores:
--    solo alcanzable a través de las funciones RPC de más abajo.
-- ============================================================
create table gastos (
  "id"         uuid primary key default gen_random_uuid(),
  "concepto"   text not null default '',
  "categoria"  text not null default '',
  -- Texto, no numeric: igual que precioAdulto/precioNino del evento — se
  -- guarda tal cual se escribe (admite coma decimal) y solo se convierte a
  -- número al sumar, nunca al guardar cada pulsación.
  "importe"    text not null default '',
  "pagado"     boolean not null default false
);
alter table gastos enable row level security;
revoke all on table gastos from anon, authenticated;

-- ============================================================
-- RLS: activada en las 10 tablas. evento/mesas/fotos_familiares/
-- orden_familias quedan abiertas (datos sin sensibilidad real).
-- invitados, colaboradores, anfitrion_secreto, config_secretos,
-- avisos_enviados y gastos NO tienen ninguna política — solo se
-- pueden tocar a través de las funciones de más abajo.
-- ============================================================
alter table evento             enable row level security;
alter table mesas              enable row level security;
alter table fotos_familiares   enable row level security;
alter table orden_familias     enable row level security;
alter table invitados          enable row level security;
alter table colaboradores      enable row level security;

create policy "anon_full_access" on evento             for all using (true) with check (true);
create policy "anon_full_access" on mesas              for all using (true) with check (true);
create policy "anon_full_access" on fotos_familiares   for all using (true) with check (true);
create policy "anon_full_access" on orden_familias     for all using (true) with check (true);

-- Cinturón y tirantes: quitamos también los permisos de tabla que
-- Supabase concede por defecto, para que no exista ningún camino
-- directo a estas dos tablas salvo por las funciones RPC.
revoke all on table invitados     from anon, authenticated;
revoke all on table colaboradores from anon, authenticated;

-- ============================================================
-- ENVÍO DE EMAILS (Resend), disparado desde las funciones de
-- guardado de más abajo cuando ocurre algo relevante. Nunca se
-- llama desde el navegador — la clave de Resend nunca sale del
-- servidor.
-- ============================================================
create extension if not exists pg_net;

drop function if exists enviar_email(text, text, text);

-- "p_adjunto_*" son opcionales — se usan para adjuntar la imagen de la
-- invitación (ver anfitrion_enviar_invitacion_familia). El resto de
-- avisos de la app los deja vacíos, sin cambiar nada en su llamada.
-- Cambia de 5 a 6 parámetros (se añade p_remitente) — hace falta borrar
-- la versión de 5 antes, si no create or replace deja las DOS funciones
-- a la vez (misma lección que la vez anterior que se tocó esta función).
drop function if exists enviar_email(text, text, text, text, text);

-- Cambia de 6 a 7 parámetros (se añade p_tipo) — MISMA lección otra vez:
-- sin este drop, quedan las dos versiones a la vez y cualquier llamada
-- con menos de 6 argumentos (la inmensa mayoría de las llamadas de la
-- app) se vuelve ambigua para Postgres ("function is not unique") y
-- falla — esto es justo lo que rompió "Avisar ahora" el 2026-08-06.
drop function if exists enviar_email(text, text, text, text, text, text);

create or replace function enviar_email(
  p_para text, p_asunto text, p_html text,
  p_adjunto_nombre text default null, p_adjunto_base64 text default null,
  -- Remitente concreto a usar; si se deja null, se usa el remitente por
  -- defecto (avisos internos). El email a la familia pasa el suyo propio.
  p_remitente text default null,
  -- Tres tipos, para el filtro del historial en la app: 'asignados' (aviso
  -- al colaborador de invitados nuevos/cambiados, y el email de prueba),
  -- 'datos' (aviso al anfitrión de que un colaborador completó datos o
  -- pagos) e 'invitacion' (la invitación final a una familia).
  p_tipo text default 'asignados'
)
returns void
language plpgsql security definer set search_path = public, net, pg_temp
as $$
declare
  v_id bigint;
  v_request_id bigint;
begin
  if p_para is null or trim(p_para) = '' then
    return; -- sin email no hay a quién avisar
  end if;

  -- IMPORTANTE (episodio del 2026-08-08): NO esperar aquí la respuesta de
  -- Resend de forma bloqueante (net.http_collect_response con async :=
  -- false). Se probó y provocó "canceling statement due to statement
  -- timeout" — Postgres cancela la transacción ENTERA si tarda más de lo
  -- permitido, y eso deshace también el propio net.http_post: el email
  -- deja de enviarse de verdad, no solo de confirmarse. net.http_post es
  -- "dispara y olvida" a propósito.
  --
  -- Lo que SÍ es seguro hacer aquí: net.http_post() devuelve al momento
  -- (sin esperar nada) un "requestId" que solo sirve para poder mirar la
  -- respuesta MÁS TARDE, en otra transacción aparte. Guardarlo no es lo
  -- mismo que esperar la respuesta — es dejar la miga de pan para que
  -- anfitrion_actualizar_estado_avisos() la siga después, sin bloquear
  -- nunca el envío en sí. Ver esa función más abajo.
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

-- ============================================================
-- RPCs — lado anfitrión. Exigen p_token, comprobado en el propio
-- SQL contra anfitrion_secreto — sin el token correcto, no
-- devuelven ni graban nada. Así la web pública, sin el enlace
-- secreto del anfitrión, no expone datos ni por la propia API.
-- ============================================================
create or replace function anfitrion_verificar_token(p_token uuid)
returns boolean
language sql security definer set search_path = public, pg_temp
as $$ select p_token = (select "token" from anfitrion_secreto limit 1); $$;

create or replace function anfitrion_listar_colaboradores(p_token uuid)
returns setof colaboradores
language sql security definer set search_path = public, pg_temp
as $$
  select c.* from colaboradores c
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by c."nombre";
$$;

create or replace function anfitrion_listar_invitados(p_token uuid)
returns setof invitados
language sql security definer set search_path = public, pg_temp
as $$
  select i.* from invitados i
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by i."apellido", i."nombre";
$$;

create or replace function anfitrion_guardar_colaboradores(p_token uuid, p_filas jsonb)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
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

-- Aviso explícito: el anfitrión lo confirma él mismo (tras revisar el
-- resumen de cambios al cerrar la tabla), en vez de dispararse solo por
-- cada asignación suelta — evita el aluvión de emails a los colaboradores.
--
-- Solo se avisa (y solo se lista) de los invitados YA CONFIRMADOS: a los
-- que siguen en tentativa no se les nombra en el email, para no generar
-- sospechas sobre la organización del evento antes de que esté decidido
-- si van o no. Su "avisoPendiente" se queda tal cual (sin tocar) — si más
-- adelante se confirman, entran solos en la siguiente tanda de aviso.
create or replace function anfitrion_avisar_colaborador(p_token uuid, p_colaborador_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
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

-- Prueba puntual, a demanda del anfitrión, de que el email de un
-- colaborador es correcto y llega de verdad — pensado para usarse justo
-- después de escribir o corregir ese email, en vez de descubrir un fallo
-- días después porque nunca le llegó ningún aviso real.
create or replace function anfitrion_probar_email_colaborador(p_token uuid, p_colaborador_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
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

-- Sustituye al antiguo "Copiar enlace" de ColaboradorCard.jsx: en vez de
-- que el anfitrión copie el enlace-token a mano y lo pegue donde quiera,
-- este manda directamente por email un enlace a la pantalla de login con
-- "Crear cuenta" ya abierta y el email del colaborador ya relleno
-- (?crear=<email>, ver App.jsx / VistaLogin.jsx). El '+' se escapa a mano
-- porque URLSearchParams (que lo lee en el navegador) trata un '+' suelto
-- como un espacio -- sin este replace, un email con '+' llegaría mal leído.
create or replace function anfitrion_enviar_invitacion_login(p_token uuid, p_colaborador_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
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
    return; -- sin email no hay a quién enviarlo
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

-- Envía la invitación (imagen generada en el navegador) por email a una
-- familia. El destinatario y el texto los decide el anfitrión al
-- confirmar en la vista previa — aquí solo se comprueba el token y se
-- reenvía a enviar_email() con el adjunto.
create or replace function anfitrion_enviar_invitacion_familia(
  p_token uuid, p_email text, p_asunto text, p_html text, p_imagen_base64 text
)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
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

create or replace function anfitrion_guardar_invitados(p_token uuid, p_filas jsonb)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  -- "avisoPendiente" ya no se calcula aquí a mano — lo recalcula solo el
  -- trigger invitados_recalcular_aviso en cuanto cambia algo relevante
  -- (asignación, confirmación, datos, pago o mesa).
  insert into invitados (
    "id","nombre","apellido","zona","confirmado","colaboradorId",
    "grupoFamiliar","mesa","anioNacimiento","anioBoda","email",
    "cancion","alergias","observaciones","pagado"
  )
  select
    (f->>'id')::uuid, f->>'nombre', f->>'apellido', f->>'zona',
    coalesce((f->>'confirmado')::boolean, false),
    nullif(f->>'colaboradorId','')::uuid,
    f->>'grupoFamiliar', nullif(f->>'mesa','')::integer,
    f->>'anioNacimiento', f->>'anioBoda', f->>'email', f->>'cancion',
    f->>'alergias', f->>'observaciones',
    coalesce((f->>'pagado')::boolean, false)
  from jsonb_array_elements(p_filas) as f
  on conflict ("id") do update set
    "nombre"=excluded."nombre", "apellido"=excluded."apellido",
    "zona"=excluded."zona", "confirmado"=excluded."confirmado",
    "colaboradorId"=excluded."colaboradorId", "grupoFamiliar"=excluded."grupoFamiliar",
    "mesa"=excluded."mesa", "anioNacimiento"=excluded."anioNacimiento",
    "anioBoda"=excluded."anioBoda", "email"=excluded."email",
    "cancion"=excluded."cancion", "alergias"=excluded."alergias",
    "observaciones"=excluded."observaciones", "pagado"=excluded."pagado";

  delete from invitados g
  where not exists (
    select 1 from jsonb_array_elements(p_filas) f
    where (f->>'id')::uuid = g."id"
  );
end;
$$;

-- ============================================================
-- RPCs — lado colaborador (comprueban de verdad la propiedad del
-- invitado dentro del propio SQL, no solo en el navegador).
--
-- 2026-08-12: se retira el enlace-token para colaboradores (Fase B del
-- plan de login, ver .claude/plans/mejoras-pendientes-login-y-solidez.md
-- -- detectado en pruebas en vivo que un colaborador seguía pudiendo
-- entrar con su enlace ?rol=... antiguo aunque ya tuviera cuenta). Las
-- 6 funciones de aquí abajo exigen ahora, ADEMÁS de p_colaborador_id,
-- que auth.uid() (la sesión real de quien llama) sea justo el
-- authUserId enlazado a ese colaborador -- p_colaborador_id deja de
-- bastar por sí solo. El enlace-token del ANFITRIÓN no se toca (sigue
-- siendo válido como plan B, a propósito).
create or replace function colaborador_mi_perfil(p_colaborador_id uuid)
returns setof colaboradores
language sql security definer set search_path = public, pg_temp
as $$
  select * from colaboradores
  where "id" = p_colaborador_id and "authUserId" = auth.uid();
$$;

-- 2026-08-12: deja de devolver los invitados en TENTATIVA -- son
-- información confidencial de la organización (candidatos que el
-- anfitrión aún no ha decidido confirmar) y solo el anfitrión debe
-- poder verlos. Antes solo se ocultaban en algunos sitios de la
-- pantalla del colaborador (p.ej. el email de aviso ya los excluía),
-- pero esta misma RPC seguía mandándolos al navegador igualmente, y
-- una parte de la pantalla llegó a mostrar cuántos había ("N en
-- tentativa"). Con "confirmado" = true en el propio WHERE, ni siquiera
-- llegan al navegador del colaborador -- no es solo ocultarlos, es no
-- enviarlos.
-- 2026-08-12: NO usa colaborador_puede_actuar() a propósito -- igual que
-- colaborador_mi_perfil, esto es solo LECTURA. El bloqueo del Modo
-- Pruebas (habilitadoEnPruebas) debe impedir guardar/marcar/confirmar,
-- nunca ocultar al colaborador su propia lista de invitados asignados
-- (eso rompía además la propia utilidad del Modo Pruebas: no se podía
-- ni probar cómo se veía la pantalla del colaborador).
create or replace function colaborador_mis_invitados(p_colaborador_id uuid)
returns setof invitados
language sql security definer set search_path = public, pg_temp
as $$
  select i.* from invitados i
  where i."colaboradorId" = p_colaborador_id
    and i."confirmado" = true
    and exists (
      select 1 from colaboradores c
      where c."id" = p_colaborador_id and c."authUserId" = auth.uid()
    );
$$;

-- Solo puede tocar estos 6 campos, y solo si el invitado es
-- realmente suyo — el resto de columnas de p_cambios, si vinieran,
-- se ignoran sin más.
-- "set_config(..., true)" desactiva el trigger de avisoPendiente solo
-- para esta transacción: cuando el propio colaborador rellena sus datos
-- no hay que "avisarle" de su propio cambio (eso generaría un falso
-- pendiente cada vez que hace su trabajo normal) — avisoPendiente solo
-- debe reaccionar a cambios que vengan del lado del anfitrión.
create or replace function colaborador_guardar_invitado(
  p_colaborador_id uuid, p_invitado_id uuid, p_cambios jsonb
)
returns setof invitados
language plpgsql security definer set search_path = public, pg_temp
as $$
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

-- No se puede marcar como pagado (p_pagado = true) si al invitado le
-- faltan sus datos obligatorios (año de nacimiento y alergias) — quitar
-- el pago (p_pagado = false) sigue permitido siempre. Mismo motivo que
-- arriba para desactivar el trigger: es el propio colaborador actuando.
create or replace function colaborador_marcar_pagado(
  p_colaborador_id uuid, p_invitado_id uuid, p_pagado boolean
)
returns setof invitados
language plpgsql security definer set search_path = public, pg_temp
as $$
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

-- Avisos por confirmación explícita del colaborador (no automáticos): al
-- pulsar "He terminado", la app comprueba de verdad el estado en el
-- servidor antes de avisar al anfitrión — así nunca se manda un aviso
-- fuera de sitio, ni se repite por cada cambio suelto durante el trabajo.
create or replace function colaborador_confirmar_datos_completos(p_colaborador_id uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  total integer;
  completos integer;
begin
  if not colaborador_puede_actuar(p_colaborador_id) then
    return false;
  end if;

  -- Solo se cuentan los invitados YA CONFIRMADOS de este colaborador — los
  -- que sigan en tentativa no bloquean el aviso: si más adelante se
  -- confirman, forman su propia tanda nueva (ver anfitrion_guardar_invitados
  -- y anfitrion_avisar_colaborador). Antes exigía cero tentativas en total,
  -- pero eso impedía avisar de un lote ya completo solo porque hubiera
  -- otro invitado todavía por confirmar sin relación con ese lote.
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

create or replace function colaborador_confirmar_pagos_completos(p_colaborador_id uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  total integer;
  pagados integer;
begin
  if not colaborador_puede_actuar(p_colaborador_id) then
    return false;
  end if;

  -- Mismo criterio que colaborador_confirmar_datos_completos: solo cuentan
  -- los ya confirmados, la tentativa no bloquea.
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

create or replace function anfitrion_listar_avisos_enviados(p_token uuid)
returns setof avisos_enviados
language sql security definer set search_path = public, pg_temp
as $$
  select * from avisos_enviados
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by "creadoEn" desc
  limit 200;
$$;

-- Comprobación NO bloqueante de si Resend ya respondió a los envíos
-- recientes — separada a propósito de enviar_email() (ver el episodio del
-- 2026-08-08 documentado ahí). Se llama aparte, en su propia transacción,
-- típicamente desde el refresco automático de cada minuto de la app.
create or replace function anfitrion_actualizar_estado_avisos(p_token uuid)
returns void
language plpgsql security definer set search_path = public, net, pg_temp
as $$
declare
  fila record;
  v_resultado net.http_response_result;
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  -- Solo los recientes y aún sin confirmar: pasada una hora, si pg_net
  -- todavía no tiene respuesta, ya no la va a tener — se queda en "sin
  -- confirmar" para siempre y repasarlo más no serviría de nada.
  for fila in
    select "id", "requestId" from avisos_enviados
    where "requestId" is not null
      and "exito" is null
      and "creadoEn" > now() - interval '1 hour'
  loop
    begin
      -- async := true es la clave: mira si la respuesta YA está lista y,
      -- si no, lo dice (status 'PENDING') y sigue al momento con el
      -- siguiente aviso — nunca espera, nunca puede agotar el tiempo
      -- máximo de la consulta. Es justo lo que enviar_email() no puede
      -- permitirse hacer dentro de su propia transacción.
      v_resultado := net.http_collect_response(fila."requestId", async := true);
      if v_resultado.status = 'SUCCESS' then
        update avisos_enviados
        set "exito" = ((v_resultado.response).status_code between 200 and 299)
        where "id" = fila."id";
      elsif v_resultado.status = 'ERROR' then
        update avisos_enviados set "exito" = false where "id" = fila."id";
      end if;
      -- status 'PENDING': todavía no hay respuesta — se deja tal cual,
      -- para que la próxima llamada (dentro de un minuto) vuelva a mirar.
    exception when others then
      null; -- un aviso problemático no debe impedir comprobar el resto.
    end;
  end loop;
end;
$$;

-- ============================================================
-- ESTADO DE CUENTAS (gastos) — mismo patrón que colaboradores:
-- upsert por id + borra los que ya no estén en la lista.
-- ============================================================
create or replace function anfitrion_listar_gastos(p_token uuid)
returns setof gastos
language sql security definer set search_path = public, pg_temp
as $$
  select * from gastos
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by "categoria", "concepto";
$$;

create or replace function anfitrion_guardar_gastos(p_token uuid, p_filas jsonb)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
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

-- ============================================================
-- RECOGIDA DE DINERO DE CADA COLABORADOR (2026-08-12): registro,
-- aparte de "invitado pagó a su colaborador" (invitados.pagado), de
-- "colaborador entregó lo recaudado al anfitrión" -- un evento propio,
-- con su fecha e importe congelados en el momento de confirmarlo (no
-- recalculado después, para que el acuse ya enviado siga siendo fiel a
-- lo que de verdad se entregó ese día). El acuse (desglose por invitado,
-- total, fecha, firma) se construye en el navegador (ya tiene los
-- nombres cargados) y se manda por email al propio colaborador -- mismo
-- patrón que anfitrion_enviar_invitacion_familia: el HTML llega ya
-- hecho, aquí solo se reenvía a enviar_email() y se deja constancia.
-- ============================================================
alter table colaboradores add column if not exists "dineroRecogidoEn" timestamptz;
alter table colaboradores add column if not exists "dineroRecogidoImporte" numeric;

-- 2026-08-12: se añade el adjunto (imagen del acuse, ver
-- lib/acuseImagen.js) -- el desglose por invitado pasa del cuerpo del
-- email a un documento adjunto. Cambia de 6 a 8 parámetros: hay que
-- borrar la firma vieja de 6 antes (esta función sí llegó a
-- desplegarse) o quedan las dos coexistiendo y cualquier llamada se
-- vuelve ambigua (mismo gotcha de siempre, ver CLAUDE.md).
drop function if exists anfitrion_confirmar_recogida_colaborador(uuid, uuid, numeric, text, text, text);

create or replace function anfitrion_confirmar_recogida_colaborador(
  p_token uuid, p_colaborador_id uuid, p_importe numeric,
  p_email text, p_asunto text, p_html text,
  p_adjunto_nombre text, p_adjunto_base64 text
)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  update colaboradores
  set "dineroRecogidoEn" = now(), "dineroRecogidoImporte" = p_importe
  where "id" = p_colaborador_id;

  -- enviar_email ya no hace nada si p_email viene vacío (ver su propio
  -- guard) -- no hace falta comprobarlo aquí también.
  perform enviar_email(p_email, p_asunto, p_html, p_adjunto_nombre, p_adjunto_base64, null, 'asignados');
end;
$$;

-- Reenviar el mismo acuse sin volver a "confirmar" (no toca la fecha ni
-- el importe ya registrados) -- para cuando el colaborador dice que no
-- le llegó o lo perdió. También la usa "Probar acuse" (envía sin
-- confirmar ni registrar nada).
drop function if exists anfitrion_reenviar_acuse_colaborador(uuid, text, text, text);

create or replace function anfitrion_reenviar_acuse_colaborador(
  p_token uuid, p_email text, p_asunto text, p_html text,
  p_adjunto_nombre text, p_adjunto_base64 text
)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  perform enviar_email(p_email, p_asunto, p_html, p_adjunto_nombre, p_adjunto_base64, null, 'asignados');
end;
$$;

-- Deshacer una recogida marcada por error -- no borra ningún dato de
-- invitados ni pagos, solo el registro de la entrega en sí (mismo
-- espíritu que la Zona de Reinicio: nunca borra invitados/colaboradores).
create or replace function anfitrion_deshacer_recogida_colaborador(
  p_token uuid, p_colaborador_id uuid
)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  update colaboradores
  set "dineroRecogidoEn" = null, "dineroRecogidoImporte" = null
  where "id" = p_colaborador_id;
end;
$$;

-- ============================================================
-- MODO PRUEBAS (2026-08-12): probar la app con datos reales sabiendo
-- que se puede volver todo atrás de un golpe. Activar guarda una foto
-- completa de los datos operativos (evento, colaboradores, invitados,
-- mesas, gastos, orden de familias, fotos familiares, avisos enviados
-- -- NUNCA anfitrion_secreto ni config_secretos, esas son credenciales,
-- no datos del evento). Desactivar restaura esa foto entera: deshace
-- TODO lo hecho mientras estuvo activo, no solo lo de la propia
-- sesión -- es un reset global, no selectivo.
--
-- ⚠️ Aviso real, no solo teórico: como esto es una app compartida en
-- vivo con colaboradores reales, si alguien más edita datos reales
-- MIENTRAS el modo pruebas está activo, esos cambios también se
-- pierden al desactivarlo -- la restauración no distingue "cambios de
-- prueba" de "cambios reales", vuelve TODO al estado exacto de cuando
-- se activó. Por eso "evento.modoPruebasActivo" es una columna abierta
-- (visible para cualquier rol, no solo el anfitrión): la propia app
-- avisa en rojo a cualquiera que la abra mientras está activo.
-- ============================================================
alter table evento add column if not exists "modoPruebasActivo" boolean not null default false;

-- Selección de colaboradores habilitados DURANTE el Modo Pruebas: al
-- activarlo, el anfitrión elige a quién se le sigue dejando actuar como
-- colaborador (guardar datos, marcar pagos, confirmar...) mientras dura
-- la prueba -- por defecto true (nadie queda bloqueado si nunca se ha
-- tocado esta selección, p.ej. datos antiguos restaurados de un
-- snapshot previo a este cambio). Los 5 gestos reales de colaborador
-- (mi_perfil queda aparte, ver más abajo) pasan todos por
-- colaborador_puede_actuar() para no repetir esta condición 5 veces.
alter table colaboradores add column if not exists "habilitadoEnPruebas" boolean not null default true;

-- colaborador_mi_perfil NO usa esta función a propósito: un colaborador
-- deshabilitado durante el Modo Pruebas debe poder seguir viendo su
-- propio perfil (para que la app le explique que está bloqueado en vez
-- de fallar en seco) -- solo se bloquean sus gestos, no la lectura de
-- quién es.
create or replace function colaborador_puede_actuar(p_colaborador_id uuid)
returns boolean
language sql security definer set search_path = public, pg_temp
as $$
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

create table if not exists modo_pruebas_snapshot (
  "id"       boolean primary key default true check ("id"),
  "datos"    jsonb not null,
  "creadoEn" timestamptz not null default now()
);
alter table modo_pruebas_snapshot enable row level security;
revoke all on table modo_pruebas_snapshot from anon, authenticated;

-- 2026-08-12: gana un segundo parámetro, p_colaborador_ids_habilitados --
-- la lista de colaboradores a los que se les sigue dejando actuar
-- (guardar datos, marcar pagos, confirmar) mientras dura la prueba. El
-- resto queda bloqueado por colaborador_puede_actuar() sin necesidad de
-- tocar su cuenta ni desasignarle nada. Cambia el número de parámetros
-- -- hace falta el drop de la firma vieja (ver regla en CLAUDE.md).
drop function if exists anfitrion_activar_modo_pruebas(uuid);

create or replace function anfitrion_activar_modo_pruebas(
  p_token uuid, p_colaborador_ids_habilitados uuid[]
)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_datos jsonb;
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  -- La foto se toma ANTES de marcar modoPruebasActivo = true (y ANTES de
  -- tocar habilitadoEnPruebas), para que quede guardado el estado
  -- "normal" -- al restaurar, ambas cosas vuelven solas, sin necesidad
  -- de tratarlas como caso especial aparte.
  select jsonb_build_object(
    'evento', (select to_jsonb(e) from evento e limit 1),
    'colaboradores', (select coalesce(jsonb_agg(c), '[]'::jsonb) from colaboradores c),
    'invitados', (select coalesce(jsonb_agg(i), '[]'::jsonb) from invitados i),
    'mesas', (select coalesce(jsonb_agg(m), '[]'::jsonb) from mesas m),
    'gastos', (select coalesce(jsonb_agg(g), '[]'::jsonb) from gastos g),
    'ordenFamilias', (select coalesce(jsonb_agg(o), '[]'::jsonb) from orden_familias o),
    'fotosFamiliares', (select coalesce(jsonb_agg(f), '[]'::jsonb) from fotos_familiares f),
    'avisosEnviados', (select coalesce(jsonb_agg(a), '[]'::jsonb) from avisos_enviados a)
  ) into v_datos;

  insert into modo_pruebas_snapshot ("id", "datos", "creadoEn")
  values (true, v_datos, now())
  on conflict ("id") do update set "datos" = excluded."datos", "creadoEn" = excluded."creadoEn";

  -- "where true": Supabase exige WHERE en todo UPDATE/DELETE -- estos
  -- dos son intencionalmente sobre toda la tabla (1-N filas reales, muy
  -- pocas), no un descuido.
  update colaboradores set "habilitadoEnPruebas" = ("id" = any(p_colaborador_ids_habilitados)) where true;
  update evento set "modoPruebasActivo" = true where true;
end;
$$;

create or replace function anfitrion_desactivar_modo_pruebas(p_token uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_datos jsonb;
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  select "datos" into v_datos from modo_pruebas_snapshot where "id" = true;
  if v_datos is null then
    -- No hay foto guardada (nunca se activó de verdad) -- no hay nada
    -- que restaurar, solo se asegura que la bandera quede apagada.
    update evento set "modoPruebasActivo" = false where true;
    return;
  end if;

  -- "where true" en los 8 delete: Supabase exige WHERE en todo
  -- UPDATE/DELETE -- aquí el vaciado total es intencional (se
  -- repueblan enteras justo debajo, desde la foto guardada).
  delete from invitados where true;
  delete from colaboradores where true;
  delete from mesas where true;
  delete from gastos where true;
  delete from orden_familias where true;
  delete from fotos_familiares where true;
  delete from avisos_enviados where true;
  delete from evento where true;

  -- invitados y colaboradores se referencian el uno al otro (FK
  -- circular, ver el comentario de invitados_colaborador_fk más arriba)
  -- -- no se pueden insertar ambos de golpe con esas columnas puestas.
  -- Se insertan los invitados primero SIN colaboradorId (colaboradores
  -- todavía no existen), luego los colaboradores (invitados ya
  -- existen, esa FK sí cuadra), y por último se rellena
  -- invitados.colaboradorId ahora que colaboradores ya existen.
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
  -- avisos_enviados.id es "generated always as identity" -- sin
  -- OVERRIDING SYSTEM VALUE, Postgres rechaza los ids explícitos del
  -- snapshot e intentaría generar unos nuevos.
  insert into avisos_enviados overriding system value
  select * from jsonb_populate_recordset(null::avisos_enviados, v_datos->'avisosEnviados');

  insert into evento select * from jsonb_populate_record(null::evento, v_datos->'evento');

  delete from modo_pruebas_snapshot where true;
end;
$$;

grant execute on function anfitrion_activar_modo_pruebas(uuid, uuid[]) to anon;
grant execute on function anfitrion_desactivar_modo_pruebas(uuid) to anon;

-- ============================================================
-- ZONA DE REINICIO ("botón nuclear"): pone a cero campos concretos
-- sin borrar nunca al invitado ni al colaborador en sí. Pensado para
-- poder reutilizar la app en otro evento, o limpiar datos de pruebas
-- antes del real.
-- ============================================================
-- Borra el historial (para poder repetir pruebas) Y vuelve a marcar como
-- pendientes a todos los invitados que ya tienen colaborador asignado —
-- si no, cualquier otro reinicio que ya hubiera limpiado "avisoPendiente"
-- (datos/pago/mesa/asignación, ver anfitrion_resetear_por_invitados) deja
-- sin ningún botón con el que volver a probar el envío real, aunque el
-- colaborador tenga un email perfectamente válido.
create or replace function anfitrion_resetear_avisos(p_token uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_token <> (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;
  delete from avisos_enviados where true;
  update invitados set "avisoPendiente" = true where "colaboradorId" is not null;
end;
$$;

-- Reinicio "por invitados": el conjunto exacto de invitados afectados
-- (todos los de un colaborador, una familia, o uno solo) se calcula en la
-- propia app y se manda aquí ya resuelto como lista de ids — así no hace
-- falta duplicar en SQL la lógica de "clave de familia" (grupoFamiliar,
-- con reserva a apellido) que ya usa el frontend en varios sitios.
-- Categorías a nivel de invitado (datos/pago/mesa/asignación) limpian
-- también el aviso pendiente: si lo que se resetea era de prueba, el
-- aviso que generó también lo era.
create or replace function anfitrion_resetear_por_invitados(
  p_token uuid,
  p_invitado_ids uuid[],
  p_categoria text
)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_token <> (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  -- "avisoPendiente" ya no se fija aquí a mano en ninguna categoría — lo
  -- recalcula solo el trigger invitados_recalcular_aviso al ver cambiar
  -- estos mismos campos (y sí distingue confirmado/tentativa él solo,
  -- cosa que este código ya no necesita saber).
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

-- Permisos de ejecución (los permisos de tabla siguen revocados,
-- solo estas funciones son alcanzables):
grant execute on function anfitrion_verificar_token(uuid) to anon;
grant execute on function anfitrion_listar_colaboradores(uuid) to anon;
grant execute on function anfitrion_listar_invitados(uuid) to anon;
grant execute on function anfitrion_guardar_colaboradores(uuid, jsonb) to anon;
grant execute on function anfitrion_guardar_invitados(uuid, jsonb) to anon;
grant execute on function anfitrion_avisar_colaborador(uuid, uuid) to anon;
grant execute on function anfitrion_probar_email_colaborador(uuid, uuid) to anon;
grant execute on function anfitrion_enviar_invitacion_login(uuid, uuid) to anon;
grant execute on function anfitrion_enviar_invitacion_familia(uuid, text, text, text, text) to anon;
grant execute on function anfitrion_listar_avisos_enviados(uuid) to anon;
grant execute on function anfitrion_actualizar_estado_avisos(uuid) to anon;
grant execute on function anfitrion_resetear_avisos(uuid) to anon;
grant execute on function anfitrion_resetear_por_invitados(uuid, uuid[], text) to anon;
grant execute on function anfitrion_listar_gastos(uuid) to anon;
grant execute on function anfitrion_guardar_gastos(uuid, jsonb) to anon;
grant execute on function anfitrion_confirmar_recogida_colaborador(uuid, uuid, numeric, text, text, text, text, text) to anon;
grant execute on function anfitrion_reenviar_acuse_colaborador(uuid, text, text, text, text, text) to anon;
grant execute on function anfitrion_deshacer_recogida_colaborador(uuid, uuid) to anon;
grant execute on function colaborador_mi_perfil(uuid) to anon;
grant execute on function colaborador_mis_invitados(uuid) to anon;
grant execute on function colaborador_guardar_invitado(uuid, uuid, jsonb) to anon;
grant execute on function colaborador_marcar_pagado(uuid, uuid, boolean) to anon;
grant execute on function colaborador_confirmar_datos_completos(uuid) to anon;
grant execute on function colaborador_confirmar_pagos_completos(uuid) to anon;

-- ============================================================
-- LOGIN REAL (Supabase Auth) — capa añadida SOBRE el modelo de
-- enlace-token de arriba, sin tocar ninguna de las RPC anteriores.
-- En vez de reescribir cada función de anfitrión/colaborador para leer
-- auth.uid() (arriesgado: son ~20 funciones ya probadas en producción),
-- se añade una única función nueva, mi_rol(), que traduce "quién ha
-- iniciado sesión" al mismo p_token / p_colaborador_id de siempre. El
-- resto de la app sigue funcionando exactamente igual por dentro — solo
-- cambia CÓMO llega ese token al navegador (login en vez de URL).
-- Ver .claude/plans/login-supabase-auth.md para el plan completo.
--
-- Esta sección SÍ se puede volver a ejecutar sola sin repetir todo el
-- archivo: usa "if not exists" / "create or replace" en todo.
-- ============================================================

-- Enlaza cada colaborador con su cuenta real de Supabase Auth. Sigue
-- existiendo el "id" de siempre como clave primaria — deja de viajar en
-- la URL como secreto, pero la RPC colaborador_* que ya existen lo siguen
-- recibiendo igual (mi_rol() se lo entrega a la app, la app se lo pasa a
-- esas RPC exactamente como hacía con el token del enlace).
alter table colaboradores add column if not exists "authUserId" uuid references auth.users("id") on delete set null;

-- Cuentas autorizadas como anfitrión (normalmente una sola fila). Tabla
-- completamente cerrada, misma idea que anfitrion_secreto: solo legible
-- desde dentro de mi_rol().
create table if not exists anfitriones (
  "authUserId" uuid primary key references auth.users("id") on delete cascade
);
alter table anfitriones enable row level security;
revoke all on table anfitriones from anon, authenticated;

-- Se llama sin argumentos: usa auth.uid() (el usuario de la sesión activa
-- que Supabase ya valida solo antes de llegar aquí). Devuelve una fila si
-- esa cuenta está vinculada como anfitrión o como colaborador, ninguna si
-- no está vinculada a nada todavía.
create or replace function mi_rol()
returns table("rol" text, "token" uuid)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  -- "token" a secas es ambiguo aquí: coincide con el nombre de la columna
  -- de salida de la propia función (returns table(..., "token" uuid)) y
  -- con la columna "token" de anfitrion_secreto -- hay que cualificar de
  -- cuál se habla con el alias "s".
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

-- A diferencia de las RPC de arriba, esta NO se concede a "anon": sin
-- sesión iniciada, auth.uid() es null y no encontraría ninguna fila de
-- todas formas, pero cerrarla del todo a quien no ha iniciado sesión es
-- más explícito.
-- ⚠️ Postgres concede EXECUTE a PUBLIC (todo el mundo, incluido "anon")
-- por defecto al crear cualquier función nueva -- hay que revocarlo antes
-- de conceder solo a "authenticated", o el "grant" de abajo no cierra
-- nada de verdad (detectado el 2026-08-09 con una prueba en vivo: sin
-- este revoke, mi_rol() respondía 200 OK con datos aunque la llamada
-- viniera sin sesión). Mismo gotcha a vigilar en cualquier función nueva
-- que dependa de auth.uid() para su seguridad.
revoke execute on function mi_rol() from public;
grant execute on function mi_rol() to authenticated;

-- ============================================================
-- AUTORREGISTRO: en vez de que el anfitrión tenga que crear a mano la
-- cuenta de Auth de cada colaborador (Authentication > Users, uno a uno,
-- copiando el UID a mano), cada persona crea su PROPIA cuenta desde la
-- pantalla de login ("Crear cuenta") usando el email con el que YA está
-- registrada -- el mismo que se usa para los avisos automáticos.
--
-- Este trigger se dispara solo, dentro de la propia base de datos, en
-- cuanto se crea una fila nueva en auth.users (o sea, en cuanto alguien
-- termina de crear su cuenta). Si el email coincide con el del anfitrión
-- (evento.emailAnfitrion) o con el de un colaborador ya existente, la
-- enlaza automáticamente -- exactamente lo mismo que hacíamos a mano con
-- el "update colaboradores set authUserId = ...". Si el email no
-- coincide con nadie conocido, no pasa nada: esa cuenta simplemente no
-- queda enlazada a ningún acceso (pantalla "cuenta sin vincular").
-- ============================================================
create or replace function vincular_cuenta_nueva()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if lower(new.email) = lower((select "emailAnfitrion" from evento limit 1)) then
    insert into anfitriones ("authUserId") values (new.id)
    on conflict do nothing;
  else
    -- Sin la condición "and authUserId is null": si un colaborador cambia
    -- de email (el anfitrión lo actualiza en Colaboradores) y se registra
    -- de nuevo con el email nuevo, la cuenta nueva TOMA el relevo aunque
    -- ya hubiera una cuenta vieja enlazada -- sin tener que desvincularla
    -- a mano con un update aparte primero. La cuenta vieja de Auth queda
    -- huérfana (sin acceso, inofensiva) hasta que alguien la borre a mano
    -- desde el panel si quiere limpiarla; no hace falta limpiarla para
    -- que esto funcione.
    update colaboradores
    set "authUserId" = new.id
    where lower("email") = lower(new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vincular_cuenta_nueva on auth.users;
create trigger trg_vincular_cuenta_nueva
after insert on auth.users
for each row execute function vincular_cuenta_nueva();

-- ============================================================
-- SINCRONIZAR EMAIL DE ACCESO -> EMAIL DE AVISOS DEL COLABORADOR
-- (2026-08-24, Fase C ampliada). "Mi cuenta" (MiCuenta.jsx) deja a
-- cualquier colaborador cambiar el email con el que INICIA SESIÓN. La
-- primera versión lo dejaba deliberadamente separado de
-- colaboradores.email (el que usa la app para mandarle avisos
-- automáticos), para no tocar ese campo sin que el anfitrión se
-- enterase -- decisión revisada a petición expresa del usuario: separado
-- resultaba confuso (alguien cambia "su email" y sigue sin recibir
-- avisos importantes) y añadía un paso manual justo donde el resto del
-- login busca quitarlos.
--
-- Se sincronizan, pero dejando constancia visible para el anfitrión:
-- "emailSincronizadoEn" se rellena solo aquí, nunca a mano, y
-- ColaboradorCard.jsx muestra un aviso mientras no sea null.
--
-- Se dispara DESPUÉS de que Supabase confirme el cambio de verdad -- si
-- el proyecto tiene activada la confirmación doble (email antiguo +
-- nuevo), auth.users.email no cambia hasta que la persona confirma los
-- dos; el trigger no se adelanta a eso.
alter table colaboradores add column if not exists "emailSincronizadoEn" timestamptz;

create or replace function sincronizar_email_colaborador()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update colaboradores
  set "email" = new.email, "emailSincronizadoEn" = now()
  where "authUserId" = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sincronizar_email_colaborador on auth.users;
create trigger trg_sincronizar_email_colaborador
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function sincronizar_email_colaborador();

-- El anfitrión confirma que ha visto el aviso ("Entendido" en
-- ColaboradorCard.jsx) -- solo borra la marca, nunca el email en sí.
create or replace function anfitrion_confirmar_email_colaborador_actualizado(
  p_token uuid, p_colaborador_id uuid
)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  update colaboradores
  set "emailSincronizadoEn" = null
  where "id" = p_colaborador_id;
end;
$$;

grant execute on function anfitrion_confirmar_email_colaborador_actualizado(uuid, uuid) to anon;

-- ============================================================
-- TABLÓN PÚBLICO DE NOVEDADES (2026-08-25). El anfitrión se comunica con
-- los invitados ya confirmados por un grupo de WhatsApp "solo lectura"
-- (tipo tablón de anuncios) que va creciendo hasta el número final de
-- confirmados. Para no saturar ese chat con avisos largos, esta sección
-- añade una página pública de solo lectura (sin login, sin cuenta) con
-- las mismas novedades, agrupadas por secciones plegables -- se comparte
-- UN enlace único en el propio grupo de WhatsApp (no uno por persona,
-- a diferencia del enlace-token de colaborador): cualquiera con el
-- enlace ve el tablón, nadie sin él lo encuentra ni por casualidad.
--
-- Mismo patrón de seguridad que el resto de la app: "novedades" es una
-- tabla completamente cerrada (como invitados/colaboradores), solo
-- alcanzable a través de las funciones RPC de aquí abajo, y el enlace en
-- sí depende de un secreto propio en su propia tabla cerrada
-- ("tablon_secreto"), nunca de una columna en `evento` (que está
-- abierta a todo el mundo -- ver el bloque de RLS al principio del
-- archivo).
-- ============================================================
create table if not exists novedades (
  "id"        uuid primary key default gen_random_uuid(),
  "titulo"    text not null default '',
  "cuerpo"    text not null default '',
  -- Permite escribir un borrador sin que se vea todavía en el tablón
  -- público -- por defecto true (lo normal es escribir y publicar del
  -- tirón, no dejar pasos a medias).
  "publicada" boolean not null default true,
  "creadaEn"  timestamptz not null default now(),
  -- Etiqueta automática en el FAQ público: "NOVEDADES" si está marcada,
  -- "FAQ" si no -- a petición del usuario, 2026-08-25 (la mayoría de
  -- entradas serán preguntas frecuentes; los cambios/avisos de verdad
  -- ya se anuncian aparte en el grupo de WhatsApp, esto solo los marca
  -- visualmente dentro del mismo listado). Por defecto false (FAQ).
  "esNovedad" boolean not null default false
);
alter table novedades enable row level security;
-- Por si `novedades` ya existía de una sesión anterior sin esta
-- columna (el "create table if not exists" de arriba no la añadiría a
-- una tabla ya creada).
alter table novedades add column if not exists "esNovedad" boolean not null default false;
revoke all on table novedades from anon, authenticated;

create table if not exists tablon_secreto (
  "id"    boolean primary key default true check ("id"),
  "token" uuid not null default gen_random_uuid(),
  -- Pregunta de acceso (2026-08-25, a petición del usuario): capa extra
  -- sobre el enlace en sí -- aunque alguien reenvíe el enlace fuera del
  -- grupo, sin la respuesta correcta no ve nada. "pregunta" es pública
  -- (hace falta mostrarla en el tablón antes de dejar pasar);
  -- "respuestaCorrecta" NUNCA sale de esta tabla cerrada -- se compara
  -- siempre dentro de una función, nunca se lee directamente.
  -- Comparación sin mayúsculas ni espacios sobrantes (ver las funciones
  -- de más abajo), pero SÍ sensible a acentos -- elegir una pregunta con
  -- respuesta sencilla (un número, una palabra sin tilde) evita
  -- fricciones tontas.
  "pregunta"          text not null default '',
  "respuestaCorrecta" text not null default ''
);
insert into tablon_secreto ("id") values (true) on conflict do nothing;
alter table tablon_secreto enable row level security;
revoke all on table tablon_secreto from anon, authenticated;
-- Por si `tablon_secreto` ya existía de una sesión anterior sin estas
-- dos columnas (el "create table if not exists" de arriba no las
-- añadiría a una tabla ya creada).
alter table tablon_secreto add column if not exists "pregunta" text not null default '';
alter table tablon_secreto add column if not exists "respuestaCorrecta" text not null default '';

-- ---------- Lado anfitrión: escribir novedades y consultar el enlace ----------

create or replace function anfitrion_obtener_token_tablon(p_token uuid)
returns uuid
language sql security definer set search_path = public, pg_temp
as $$
  select case
    when p_token = (select "token" from anfitrion_secreto limit 1)
    then (select "token" from tablon_secreto limit 1)
    else null
  end;
$$;

-- El anfitrión ve TODAS las novedades (publicadas y borradores), para
-- poder editarlas -- el tablón público (más abajo) solo ve las publicadas.
create or replace function anfitrion_listar_novedades(p_token uuid)
returns setof novedades
language sql security definer set search_path = public, pg_temp
as $$
  select n.* from novedades n
  where p_token = (select "token" from anfitrion_secreto limit 1)
  order by n."creadaEn" desc;
$$;

create or replace function anfitrion_guardar_novedades(p_token uuid, p_filas jsonb)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  -- "creadaEn" solo se fija al CREAR (si el cliente no la manda, usa
  -- now()) -- el "on conflict do update" de abajo no la toca nunca, así
  -- que editar el texto de una novedad ya existente no cambia su fecha.
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

-- El anfitrión consulta y guarda la pregunta de acceso desde la propia
-- ventana Novedades -- "respuesta" SÍ viaja aquí en texto plano (el
-- anfitrión necesita poder verla/editarla), a diferencia del tablón
-- público, donde solo se compara, nunca se devuelve.
create or replace function anfitrion_obtener_pregunta_tablon(p_token uuid)
returns table("pregunta" text, "respuesta" text)
language sql security definer set search_path = public, pg_temp
as $$
  select ts."pregunta", ts."respuestaCorrecta"
  from tablon_secreto ts
  where p_token = (select "token" from anfitrion_secreto limit 1);
$$;

create or replace function anfitrion_guardar_pregunta_tablon(p_token uuid, p_pregunta text, p_respuesta text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;
  -- "where true": este proyecto bloquea cualquier UPDATE/DELETE sin
  -- WHERE (protección real, no un capricho -- ver la regla ya anotada
  -- en CLAUDE.md sobre esto mismo). tablon_secreto solo tiene una fila
  -- de todas formas ("id" boolean primary key), así que si de verdad
  -- es toda la tabla a propósito. Bug real encontrado en producción el
  -- 2026-08-25: sin esto, cada guardado fallaba con "UPDATE requires a
  -- WHERE clause" -- se me olvidó aplicar una regla que ya estaba
  -- documentada en este mismo archivo.
  update tablon_secreto set "pregunta" = p_pregunta, "respuestaCorrecta" = p_respuesta where true;
end;
$$;

-- ---------- Lado público: el tablón de solo lectura ----------

create or replace function tablon_verificar_token(p_token uuid)
returns boolean
language sql security definer set search_path = public, pg_temp
as $$ select p_token = (select "token" from tablon_secreto limit 1); $$;

-- Devuelve el TEXTO de la pregunta (público, hace falta mostrarlo) --
-- nunca la respuesta correcta. "" si el anfitrión no ha puesto ninguna
-- pregunta -- el tablón no pide nada en ese caso.
create or replace function tablon_obtener_pregunta(p_token uuid)
returns text
language sql security definer set search_path = public, pg_temp
as $$
  select case
    when p_token = (select "token" from tablon_secreto limit 1)
    then (select "pregunta" from tablon_secreto limit 1)
    else null
  end;
$$;

-- Compara sin mayúsculas ni espacios sobrantes -- nunca devuelve la
-- respuesta correcta en sí, solo si coincide o no.
create or replace function tablon_verificar_respuesta(p_token uuid, p_respuesta text)
returns boolean
language sql security definer set search_path = public, pg_temp
as $$
  select p_token = (select "token" from tablon_secreto limit 1)
    and lower(trim(coalesce(p_respuesta, ''))) = lower(trim((select "respuestaCorrecta" from tablon_secreto limit 1)));
$$;

-- Cambia de 1 a 2 parámetros (se añade p_respuesta) -- hay que borrar la
-- firma vieja antes, si no create or replace deja las dos funciones a
-- la vez y cualquier llamada con 1 argumento se vuelve ambigua (misma
-- lección de siempre, ver CLAUDE.md).
drop function if exists tablon_listar_novedades(uuid);

-- Exige TAMBIÉN la respuesta correcta, no solo el token -- así alguien
-- que llamara a esta función directamente (sin pasar por la pantalla de
-- la pregunta) tampoco obtendría datos reales. Si no hay pregunta
-- configurada ("respuestaCorrecta" = ''), cualquier respuesta vacía
-- coincide sola -- el tablón no pide nada en ese caso.
create or replace function tablon_listar_novedades(p_token uuid, p_respuesta text)
returns setof novedades
language sql security definer set search_path = public, pg_temp
as $$
  select n.* from novedades n
  where p_token = (select "token" from tablon_secreto limit 1)
    and lower(trim(coalesce(p_respuesta, ''))) = lower(trim((select "respuestaCorrecta" from tablon_secreto limit 1)))
    and n."publicada" = true
  order by n."creadaEn" desc;
$$;

grant execute on function anfitrion_obtener_token_tablon(uuid) to anon;
grant execute on function anfitrion_listar_novedades(uuid) to anon;
grant execute on function anfitrion_guardar_novedades(uuid, jsonb) to anon;
grant execute on function anfitrion_obtener_pregunta_tablon(uuid) to anon;
grant execute on function anfitrion_guardar_pregunta_tablon(uuid, text, text) to anon;
grant execute on function tablon_verificar_token(uuid) to anon;
grant execute on function tablon_obtener_pregunta(uuid) to anon;
grant execute on function tablon_verificar_respuesta(uuid, text) to anon;
grant execute on function tablon_listar_novedades(uuid, text) to anon;

-- ============================================================
-- 2026-08-25: refuerzos sobre el tablón, a petición del usuario tras ver
-- el enlace listo para compartir con ~140 personas.
-- ============================================================

-- Un colaborador logueado también puede ver el enlace del tablón (botón
-- en Portada.jsx, junto a "Mi cuenta"/"Cerrar sesión") -- mismo patrón de
-- seguridad que colaborador_mis_invitados: exige sesión real de ESE
-- colaborador, nunca solo el id suelto.
create or replace function colaborador_obtener_token_tablon(p_colaborador_id uuid)
returns uuid
language sql security definer set search_path = public, pg_temp
as $$
  select case
    when exists (
      select 1 from colaboradores c
      where c."id" = p_colaborador_id and c."authUserId" = auth.uid()
    )
    then (select "token" from tablon_secreto limit 1)
    else null
  end;
$$;
grant execute on function colaborador_obtener_token_tablon(uuid) to anon;

-- Enlace de invitación al grupo de WhatsApp (tipo chat.whatsapp.com/XXXX,
-- se genera desde la propia app de WhatsApp: Grupo → Info del grupo →
-- Invitar mediante enlace) -- a propósito NO es un número de teléfono: un
-- botón basado en número abriría un chat 1 a 1 con el anfitrión, lo que
-- dejaría a 140 personas escribiéndole directamente y anularía la figura
-- del colaborador como intermediario. Vive en `evento` (columna abierta,
-- sin sensibilidad real) porque el botón que la usa está en la ventana
-- Novedades del anfitrión, no en el tablón público.
alter table evento add column if not exists "enlaceGrupoWhatsapp" text not null default '';

-- Envoltorio SECURITY DEFINER para poder preguntar "¿eres el
-- anfitrión?" desde una política de Storage -- las políticas de RLS se
-- evalúan con los permisos de la propia conexión (authenticated), y
-- `anfitriones` está deliberadamente cerrada a cal y canto (revoke all
-- from anon, authenticated, más arriba) para que solo se pueda leer
-- desde dentro de una función con privilegios elevados, nunca por
-- consulta directa. Sin este envoltorio, cualquier política que
-- escribiera "exists (select 1 from anfitriones ...)" directamente
-- fallaba con "permission denied for table anfitriones" -- error real
-- encontrado en producción el 2026-08-25 al probar la subida de la
-- imagen de WhatsApp: el bucket llevaba vacío desde que se creó porque
-- ninguna subida llegaba a pasar la política.
create or replace function es_anfitrion()
returns boolean
language sql security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from anfitriones a where a."authUserId" = auth.uid());
$$;
revoke execute on function es_anfitrion() from public;
grant execute on function es_anfitrion() to authenticated;

-- ---------- Música ambiental (Supabase Storage) ----------
-- A diferencia de las imágenes (guardadas como base64 directamente en
-- columnas de texto -- ver evento.imagen), un archivo de audio pesa
-- demasiado para eso: guardarlo en una columna que el tablón público
-- vuelve a pedir cada minuto (mismo refresco que el resto de la app)
-- descargaría varios MB una y otra vez sin necesidad. Supabase Storage
-- (incluido gratis en cualquier proyecto) sirve cada archivo desde su
-- propia URL estable -- el navegador lo cachea solo, no pasa por la
-- tabla `evento` en absoluto.
insert into storage.buckets ("id", "name", "public")
values ('musica-ambiental', 'musica-ambiental', true)
on conflict ("id") do nothing;

-- Lectura pública (el tablón reproduce sin login) -- subir/borrar solo si
-- la cuenta con sesión iniciada está en la tabla `anfitriones` (mismo
-- criterio que mi_rol()). drop+create porque Postgres no admite "create
-- policy if not exists" -- necesario para que este bloque se pueda
-- volver a pegar entero sin fallar (mismo criterio que el resto del
-- archivo).
drop policy if exists "musica_ambiental_lectura_publica" on storage.objects;
create policy "musica_ambiental_lectura_publica"
on storage.objects for select
to public
using (bucket_id = 'musica-ambiental');

drop policy if exists "musica_ambiental_solo_anfitrion_escribe" on storage.objects;
create policy "musica_ambiental_solo_anfitrion_escribe"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'musica-ambiental'
  and es_anfitrion()
);

drop policy if exists "musica_ambiental_solo_anfitrion_borra" on storage.objects;
create policy "musica_ambiental_solo_anfitrion_borra"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'musica-ambiental'
  and es_anfitrion()
);

-- ---------- Miniatura para WhatsApp/Facebook (og:image) ----------
-- Mismo motivo que musica-ambiental: las etiquetas og:image de
-- index.html son ESTÁTICAS (el rastreador de WhatsApp lee el HTML sin
-- ejecutar React) y necesitan una URL http real, no el data: URI que usa
-- evento.imagen. Se sube siempre con el mismo nombre de archivo
-- ("portada.jpg", ver VentanaConfigDatosEvento.jsx) para que la URL
-- pública nunca cambie -- solo el archivo detrás.
insert into storage.buckets ("id", "name", "public")
values ('og-imagen', 'og-imagen', true)
on conflict ("id") do nothing;

drop policy if exists "og_imagen_lectura_publica" on storage.objects;
create policy "og_imagen_lectura_publica"
on storage.objects for select
to public
using (bucket_id = 'og-imagen');

drop policy if exists "og_imagen_solo_anfitrion_sube" on storage.objects;
create policy "og_imagen_solo_anfitrion_sube"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'og-imagen'
  and es_anfitrion()
);

-- También hace falta UPDATE (no solo INSERT): se sube siempre con
-- upsert:true (mismo nombre de archivo cada vez), y eso internamente
-- reemplaza el objeto existente en vez de crear uno nuevo.
drop policy if exists "og_imagen_solo_anfitrion_reemplaza" on storage.objects;
create policy "og_imagen_solo_anfitrion_reemplaza"
on storage.objects for update
to authenticated
using (
  bucket_id = 'og-imagen'
  and es_anfitrion()
)
with check (
  bucket_id = 'og-imagen'
  and es_anfitrion()
);

-- ============================================================
-- 2026-08-25: permisos por colaborador (empezando por poder editar el
-- texto de Novedades). A petición del usuario: quiere ir dando acceso a
-- partes concretas de la app a colaboradores concretos, no todo o nada
-- -- así que esto se diseña desde el principio como una LISTA de claves
-- de texto libre, no una columna booleana por función. Añadir una zona
-- nueva en el futuro es solo: 1) una clave nueva aquí abajo (documentada
-- como comentario), 2) un checkbox más en VentanaPermisos.jsx, 3)
-- comprobar esa clave donde corresponda en el cliente -- no hace falta
-- tocar el esquema otra vez.
--
-- Claves ya en uso:
--   "novedades_editar" -- puede abrir la ventana Novedades y editar el
--                         título/cuerpo de las que ya existen; el resto
--                         de controles de esa ventana (crear, borrar,
--                         publicar, marcar NOVEDADES/FAQ, enlace,
--                         WhatsApp, pregunta de acceso) quedan
--                         deshabilitados para quien solo tenga esta
--                         clave y no sea el anfitrión.
alter table colaboradores add column if not exists "permisos" jsonb not null default '[]'::jsonb;

-- El propio checkbox de VentanaPermisos.jsx impide crear/borrar/publicar
-- desde la pantalla, pero eso es solo la interfaz -- por si alguien
-- llamara a estas funciones directamente (sin pasar por ahí), el
-- permiso real se comprueba aquí también, igual que el resto de la app
-- nunca se fía solo de lo que oculta o deshabilita el cliente.
create or replace function colaborador_puede_editar_novedades(p_colaborador_id uuid)
returns boolean
language sql security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from colaboradores c
    where c."id" = p_colaborador_id
      and c."authUserId" = auth.uid()
      and c."permisos" ? 'novedades_editar'
  );
$$;

create or replace function colaborador_listar_novedades(p_colaborador_id uuid)
returns setof novedades
language sql security definer set search_path = public, pg_temp
as $$
  select n.* from novedades n
  where colaborador_puede_editar_novedades(p_colaborador_id)
  order by n."creadaEn" desc;
$$;

-- A propósito solo actualiza "titulo"/"cuerpo" de filas que YA existen
-- (por "id") -- nunca inserta, nunca borra, nunca toca
-- "publicada"/"esNovedad": el permiso es "editar el texto", no
-- "gestionar el tablón entero". Si el cliente mandara cualquier otro
-- campo distinto, se ignora sin más.
create or replace function colaborador_guardar_novedades(p_colaborador_id uuid, p_filas jsonb)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not colaborador_puede_editar_novedades(p_colaborador_id) then
    return;
  end if;

  update novedades n
  set "titulo" = coalesce(f->>'titulo', n."titulo"),
      "cuerpo" = coalesce(f->>'cuerpo', n."cuerpo")
  from jsonb_array_elements(p_filas) as f
  where n."id" = (f->>'id')::uuid;
end;
$$;

grant execute on function colaborador_puede_editar_novedades(uuid) to anon;
grant execute on function colaborador_listar_novedades(uuid) to anon;
grant execute on function colaborador_guardar_novedades(uuid, jsonb) to anon;

-- ---------- Cronograma / logística del día (Supabase Storage) ----------
-- Imagen única que el anfitrión sube y va REEMPLAZANDO según avanza el
-- proyecto -- mismo patrón que og-imagen (nombre de archivo fijo, para
-- que la URL pública no cambie nunca, solo el archivo detrás) en vez
-- de una columna base64 en `evento` (por el mismo motivo que
-- musica-ambiental: el tablón público la pediría de nuevo en cada
-- refresco de cada minuto). Se muestra en el tablón público -- a
-- petición del usuario, 2026-08-25.
insert into storage.buckets ("id", "name", "public")
values ('cronograma', 'cronograma', true)
on conflict ("id") do nothing;

drop policy if exists "cronograma_lectura_publica" on storage.objects;
create policy "cronograma_lectura_publica"
on storage.objects for select
to public
using (bucket_id = 'cronograma');

drop policy if exists "cronograma_solo_anfitrion_sube" on storage.objects;
create policy "cronograma_solo_anfitrion_sube"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'cronograma'
  and es_anfitrion()
);

-- Hace falta UPDATE además de INSERT: se sube siempre con upsert:true
-- (mismo nombre de archivo cada vez), y eso reemplaza el objeto
-- existente en vez de crear uno nuevo.
drop policy if exists "cronograma_solo_anfitrion_reemplaza" on storage.objects;
create policy "cronograma_solo_anfitrion_reemplaza"
on storage.objects for update
to authenticated
using (
  bucket_id = 'cronograma'
  and es_anfitrion()
)
with check (
  bucket_id = 'cronograma'
  and es_anfitrion()
);

drop policy if exists "cronograma_solo_anfitrion_borra" on storage.objects;
create policy "cronograma_solo_anfitrion_borra"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'cronograma'
  and es_anfitrion()
);
