# AGENTS.md — online-shop (iOS Pro)

Next.js 15 App Router e-commerce (React 18, Prisma 5 / Postgres, NextAuth v5 beta, Tailwind, Zustand). Paquete único, sin monorepo, sin suite de tests. Código, comentarios y UI en español.

## Arranque / setup
- Copiar `.env.template` → `.env` y `npm install`.
- Base de datos: `podman-compose up` (es **Podman**, no Docker, aunque exista `docker-compose.yml`). Postgres expone el host `localhost:6543` → 5432 en el contenedor; datos persistentes en `./postgres` (gitignoreado).
- **`.env.template` NO define `DATABASE_URL`**, pero `prisma/schema.prisma` y `src/lib/prisma.ts` la exigen. Agregarla a mano en `.env`: `DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:6543/<DB_NAME>`.
- Orden: migrar `npx prisma migrate dev` → seed `npm run seed` → `npm run dev`. El seed corre con `ts-node src/seed/seedNew.ts` y su propio `src/seed/tsconfig.json` (`module: commonjs`).

## Comandos exactos
- `npm run dev` · `npm run build` · `npm start` · `npm run lint` (= `next lint`).
- `npm run build` = `npm run prisma:deploy` (`npx prisma migrate deploy && prisma generate`) + `next build`; `build:staging` además ejecuta seed.
- No hay script de test ni de typecheck. Verificar tipos con `npx tsc --noEmit --pretty false --skipLibCheck`.

## Arquitectura / convenciones no obvias
- `@/*` → `./src/*`. Las server actions se reexportan en el barrel `src/actions/index.ts`; la UI importa desde `@/actions`, no de archivos sueltos.
- Cliente Prisma singleton en `src/lib/prisma.ts` (global en no-producción; log de queries en development).
- Auth: NextAuth v5 beta, configuración en `src/auth.config.ts` (Credentials + Google), `basePath: /api/auth`, `pages.signIn: /auth/login`.
- `reactStrictMode: false` en `next.config.mjs` es **intencional** (la galería Swiper thumbs se rompe con el doble montaje de Strict Mode en dev) — no "corregirlo".
- `next.config.mjs`: único hostname remoto de imágenes permitido es `res.cloudinary.com`; serverActions con `bodySizeLimit: '10mb'` (subida de fotos de producto) y `allowedOrigins` con devtunnels/ngrok.
- `src/middleware.ts` rechaza requests con headers `x-middleware-subrequest` o `next-resume` — no eliminar.
- `.github/*` está en `.gitignore` salvo `workflows/`; por eso las instrucciones locales (p. ej. `copilot-instructions.md`) no se versionan. El cron `.github/workflows/cron-clean-sessions.yml` llama `CRON_URL` cada 10 min con `Authorization: Bearer <CRON_SECRET>` y header de bypass de Vercel.

## Reglas de dominio (fáciles de romper)
- Borrado lógico mediante `isEnabled` en `Product` y `ProductVariant`.
  - Toda lectura pública debe filtrar `isEnabled: true` (productos/variantes, categorías, métodos de pago, búsqueda, menú). No quitar esos `where`.
  - El admin ve variantes desactivadas con `getProductBySlug(slug, { includeDisabledVariants: true })`.
  - Listado admin de productos ordena activos primero: `orderBy: [{ isEnabled: 'desc' }, ...]`.
- Borrado de variantes (`src/actions/product/save-update-product.ts`): una variante persistida que falta en el payload se **desactiva** (`isEnabled: false`) si tiene cualquier relación (`orderItem` / `stockMovement` / `stockReservation`, count > 0); si no tiene ninguna, se **borra físicamente**. En el formulario, los borrados se marcan `pendingRemoval` (fila visible, "Guardar para aplicar" / "Deshacer") y se omiten del payload hasta guardar.
- Errores de stock: mensaje descriptivo en ambos pagos (offline y Mercado Pago): `Stock insuficiente para <título>. Disponible: X, Solicitado: Y`. `placeOrder` solo propaga desde su `catch` mensajes conocidos (prefijo `Stock insuficiente para`, cantidades, empresa no configurada); el resto cae al mensaje genérico.
- Archivos SQL de migración deben ser UTF-8 **sin BOM**: con BOM Prisma falla con `P3006` al aplicar la shadow DB.
