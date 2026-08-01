# Eventos — libro de invitados

Aplicación para gestionar invitados, colaboradores, mesas y pagos de un evento
(pensada originalmente para una boda). Empezó como un boceto ("Artifact") en
Claude.ai y ahora es una web real: **Vite + React**, con **Supabase**
(Postgres) como base de datos compartida entre el anfitrión y sus
colaboradores, desplegada en **Vercel**.

## El boceto (`app-eventos-v2.jsx`)

Ese archivo suelto en la raíz del repo **no se usa para la web real** — es
una copia autocontenida pensada para pegarse en un Artifact de Claude.ai y
seguir probando ideas de lógica/UX rápidamente, sin montar nada. La web de
verdad vive en `src/`.

## Poner en marcha el proyecto en local

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env` y rellena los dos valores con los de tu
   proyecto de Supabase (Project Settings → API):
   ```bash
   cp .env.example .env
   ```
3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Configurar Supabase (una sola vez)

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. Abre el editor SQL del proyecto (Database → SQL Editor) y pega/ejecuta
   todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
3. Copia la **Project URL** y la clave **`anon` `public`** (Project Settings
   → API) a tu `.env` local. **Nunca** uses ni compartas la clave
   `service_role` — esa da acceso total sin restricciones.

## Desplegar (Vercel)

1. Conecta este repositorio de GitHub a un proyecto nuevo en
   [vercel.com](https://vercel.com) (detecta Vite automáticamente).
2. En los ajustes del proyecto en Vercel, añade las mismas dos variables de
   entorno que en tu `.env` local (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`).
3. Cada `git push` a `main` despliega una versión nueva automáticamente.

## Cómo funcionan los roles

No hay usuarios ni contraseñas: cada persona accede mediante un enlace.

- La URL base de la web = vista de **anfitrión** (acceso completo).
- `?rol=<id-del-colaborador>` = vista de **colaborador**, restringida de
  verdad a nivel de base de datos a sus invitados asignados (no solo
  ocultada en la pantalla — ver `supabase/schema.sql`).

## Estado del proyecto

- ✅ Web básica funcionando (este commit): datos compartidos vía Supabase,
  aislamiento real entre colaboradores, despliegue automático.
- ⏳ Pendiente (fase 2): avisos automáticos por email (Resend) cuando se
  asigna un invitado a un colaborador, o cuando este completa datos/registra
  un pago.
