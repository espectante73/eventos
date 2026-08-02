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
create table mesas (
  "numero"     integer primary key check ("numero" between 1 and 15),
  "capacidad"  integer not null default 10 check ("capacidad" >= 0)
);
insert into mesas ("numero", "capacidad")
  select n, 10 from generate_series(1, 15) as n;

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
-- 4b. ORDEN DE NOMBRES POR FAMILIA (diccionario: grupoFamiliar ->
--     array de ids de invitados, en el orden elegido a mano por el
--     anfitrión — para poner al esposo primero, etc., en la
--     invitación). Si una familia no tiene fila aquí, se usa el
--     orden por defecto.
-- ============================================================
create table orden_familias (
  "grupoFamiliar"  text primary key,
  "orden"          text[] not null default '{}'
);

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
  "plantillaPagoRegistrado"    text not null default 'Hola,<br><br><b>{colaborador}</b> ha completado todos los pagos de sus invitados asignados.'
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
  "id"              boolean primary key default true check ("id"),
  "resendApiKey"    text not null default '',
  "emailRemitente"  text not null default 'onboarding@resend.dev'
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
  "creadoEn"     timestamptz not null default now()
);
alter table avisos_enviados enable row level security;
revoke all on table avisos_enviados from anon, authenticated;

-- ============================================================
-- RLS: activada en las 9 tablas. evento/mesas/fotos_familiares/
-- orden_familias quedan abiertas (datos sin sensibilidad real).
-- invitados, colaboradores, anfitrion_secreto, config_secretos y
-- avisos_enviados NO tienen ninguna política — solo se pueden
-- tocar a través de las funciones de más abajo.
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

create or replace function enviar_email(p_para text, p_asunto text, p_html text)
returns void
language plpgsql security definer set search_path = public, net, pg_temp
as $$
begin
  if p_para is null or trim(p_para) = '' then
    return; -- sin email no hay a quién avisar
  end if;

  insert into avisos_enviados ("destinatario", "asunto") values (p_para, p_asunto);

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select "resendApiKey" from config_secretos limit 1),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', (select "emailRemitente" from config_secretos limit 1),
      'to', p_para,
      'subject', p_asunto,
      'html', p_html
    )
  );
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

  insert into colaboradores ("id", "nombre", "invitadoId", "email")
  select
    (f->>'id')::uuid, f->>'nombre', nullif(f->>'invitadoId','')::uuid,
    coalesce(f->>'email', '')
  from jsonb_array_elements(p_filas) as f
  on conflict ("id") do update
    set "nombre" = excluded."nombre",
        "invitadoId" = excluded."invitadoId",
        "email" = excluded."email";

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
  where "colaboradorId" = p_colaborador_id and "avisoPendiente" = true;

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
  where "colaboradorId" = p_colaborador_id and "avisoPendiente" = true;
end;
$$;

create or replace function anfitrion_guardar_invitados(p_token uuid, p_filas jsonb)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  r record;
  ids_a_marcar uuid[] := '{}';
begin
  if p_token is distinct from (select "token" from anfitrion_secreto limit 1) then
    return;
  end if;

  -- Se detecta ANTES de tocar nada (comparando contra el valor guardado),
  -- pero se marca DESPUÉS del insert/upsert de más abajo — así funciona
  -- también para invitados recién creados, que todavía no existen en la
  -- tabla en este punto.
  for r in
    select
      (f->>'id')::uuid as invitado_id,
      nullif(f->>'colaboradorId','')::uuid as nuevo_colaborador_id,
      i."colaboradorId" as anterior_colaborador_id
    from jsonb_array_elements(p_filas) as f
    left join invitados i on i."id" = (f->>'id')::uuid
  loop
    if r.nuevo_colaborador_id is not null
       and r.nuevo_colaborador_id is distinct from r.anterior_colaborador_id then
      ids_a_marcar := array_append(ids_a_marcar, r.invitado_id);
    end if;
  end loop;

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

  if array_length(ids_a_marcar, 1) > 0 then
    update invitados set "avisoPendiente" = true where "id" = any(ids_a_marcar);
  end if;

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
-- ============================================================
create or replace function colaborador_mi_perfil(p_colaborador_id uuid)
returns setof colaboradores
language sql security definer set search_path = public, pg_temp
as $$ select * from colaboradores where "id" = p_colaborador_id; $$;

create or replace function colaborador_mis_invitados(p_colaborador_id uuid)
returns setof invitados
language sql security definer set search_path = public, pg_temp
as $$ select * from invitados where "colaboradorId" = p_colaborador_id; $$;

-- Solo puede tocar estos 6 campos, y solo si el invitado es
-- realmente suyo — el resto de columnas de p_cambios, si vinieran,
-- se ignoran sin más.
create or replace function colaborador_guardar_invitado(
  p_colaborador_id uuid, p_invitado_id uuid, p_cambios jsonb
)
returns setof invitados
language sql security definer set search_path = public, pg_temp
as $$
  update invitados set
    "anioNacimiento" = coalesce(p_cambios->>'anioNacimiento', "anioNacimiento"),
    "anioBoda"       = coalesce(p_cambios->>'anioBoda', "anioBoda"),
    "email"          = coalesce(p_cambios->>'email', "email"),
    "cancion"        = coalesce(p_cambios->>'cancion', "cancion"),
    "alergias"       = coalesce(p_cambios->>'alergias', "alergias"),
    "observaciones"  = coalesce(p_cambios->>'observaciones', "observaciones")
  where "id" = p_invitado_id and "colaboradorId" = p_colaborador_id
  returning *;
$$;

-- No se puede marcar como pagado (p_pagado = true) si al invitado le
-- faltan sus datos obligatorios (año de nacimiento y alergias) — quitar
-- el pago (p_pagado = false) sigue permitido siempre.
create or replace function colaborador_marcar_pagado(
  p_colaborador_id uuid, p_invitado_id uuid, p_pagado boolean
)
returns setof invitados
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  actualizado invitados;
begin
  if p_pagado then
    perform 1 from invitados
    where "id" = p_invitado_id and "colaboradorId" = p_colaborador_id
      and coalesce("anioNacimiento", '') <> '' and coalesce("alergias", '') <> '';
    if not found then
      return;
    end if;
  end if;

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
  tentativa integer;
  total integer;
  completos integer;
begin
  -- Si todavía tiene algún invitado en tentativa (sin confirmar) entre los
  -- suyos, no se avisa — el anfitrión quiere el informe final, no uno por
  -- cada tanda de confirmados que se vaya completando.
  select count(*) into tentativa
  from invitados
  where "colaboradorId" = p_colaborador_id and "confirmado" = false;

  select count(*), count(*) filter (
    where coalesce("anioNacimiento", '') <> '' and coalesce("alergias", '') <> ''
  )
  into total, completos
  from invitados
  where "colaboradorId" = p_colaborador_id and "confirmado" = true;

  if tentativa = 0 and total > 0 and total = completos then
    perform enviar_email(
      (select "emailAnfitrion" from evento limit 1),
      'Datos completados',
      replace(
        (select "plantillaDatosCompletados" from evento limit 1),
        '{colaborador}', coalesce((select "nombre" from colaboradores where "id" = p_colaborador_id), '')
      ) || '<br><br><small>Aviso automático de la app de invitados del evento.</small>'
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
  tentativa integer;
  total integer;
  pagados integer;
begin
  select count(*) into tentativa
  from invitados
  where "colaboradorId" = p_colaborador_id and "confirmado" = false;

  select count(*), count(*) filter (where "pagado")
  into total, pagados
  from invitados
  where "colaboradorId" = p_colaborador_id and "confirmado" = true;

  if tentativa = 0 and total > 0 and total = pagados then
    perform enviar_email(
      (select "emailAnfitrion" from evento limit 1),
      'Pagos completos',
      replace(
        (select "plantillaPagoRegistrado" from evento limit 1),
        '{colaborador}', coalesce((select "nombre" from colaboradores where "id" = p_colaborador_id), '')
      ) || '<br><br><small>Aviso automático de la app de invitados del evento.</small>'
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

-- Permisos de ejecución (los permisos de tabla siguen revocados,
-- solo estas funciones son alcanzables):
grant execute on function anfitrion_verificar_token(uuid) to anon;
grant execute on function anfitrion_listar_colaboradores(uuid) to anon;
grant execute on function anfitrion_listar_invitados(uuid) to anon;
grant execute on function anfitrion_guardar_colaboradores(uuid, jsonb) to anon;
grant execute on function anfitrion_guardar_invitados(uuid, jsonb) to anon;
grant execute on function anfitrion_avisar_colaborador(uuid, uuid) to anon;
grant execute on function anfitrion_listar_avisos_enviados(uuid) to anon;
grant execute on function colaborador_mi_perfil(uuid) to anon;
grant execute on function colaborador_mis_invitados(uuid) to anon;
grant execute on function colaborador_guardar_invitado(uuid, uuid, jsonb) to anon;
grant execute on function colaborador_marcar_pagado(uuid, uuid, boolean) to anon;
grant execute on function colaborador_confirmar_datos_completos(uuid) to anon;
grant execute on function colaborador_confirmar_pagos_completos(uuid) to anon;
