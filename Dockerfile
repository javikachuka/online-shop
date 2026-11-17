# Imagen única para develop y producción.
# Lo que cambia entre entornos son los NEXT_PUBLIC_* (se incrustan en el build)
# y las variables de runtime, que Dokploy las inyecta al arrancar el contenedor.

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables públicas: se graban en el bundle, por eso hay un build por entorno.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG NEXT_PUBLIC_WHATSAPP_MESSAGE
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_PUBLIC_WHATSAPP_MESSAGE=$NEXT_PUBLIC_WHATSAPP_MESSAGE \
    NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID \
    NEXT_TELEMETRY_DISABLED=1

# No ejecutamos `npm run build`: ese script corre `prisma migrate deploy` y
# necesitaría una DB durante el build. Las migraciones se aplican al arrancar.
# Prisma valida las env vars del schema durante `generate`, pero no conecta:
# alcanza con una URL válida y descartable. La real la inyecta Dokploy en runtime.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate \
    && npx next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
RUN apk add --no-cache openssl \
    && addgroup -S nodejs \
    && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nextjs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=nextjs:nextjs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nextjs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nextjs /app/src/seed ./src/seed

USER nextjs
EXPOSE 3000

# DATABASE_URL y el resto de secretos los inyecta Dokploy en runtime.
# El seed NO se ejecuta acá (es destructivo): se corre a mano una sola vez.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start"]
