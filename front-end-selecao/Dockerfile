# syntax=docker/dockerfile:1.7

############################################
# Base
############################################
FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

############################################
# Deps
############################################
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

############################################
# Build
############################################
FROM base AS builder

# Variáveis públicas precisam existir no build (alinhado ao docker-compose e ao código)
ARG NEXT_PUBLIC_DJANGO_API_URL
ENV NEXT_PUBLIC_DJANGO_API_URL=${NEXT_PUBLIC_DJANGO_API_URL}

# Rewrites /media no next.config são fixados no build — deve bater com o Gunicorn na rede Docker.
ARG DJANGO_INTERNAL_ORIGIN=http://app_selecao_system:8000
ENV DJANGO_INTERNAL_ORIGIN=${DJANGO_INTERNAL_ORIGIN}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

############################################
# Runner
############################################
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002
# Docker define HOSTNAME como o ID do container; o Next standalone usa isso no bind.
# Sem 0.0.0.0, o publish da porta (ex.: host:3002 → container) não alcança o processo → RST / 502 no nginx.
ENV HOSTNAME=0.0.0.0

# usuário não-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Se estiver usando output: 'standalone' (RECOMENDADO)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# O otimizador de imagens do Next grava em .next/cache; o usuário nextjs precisa poder criar o diretório.
RUN mkdir -p /app/.next/cache && chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3002

CMD ["node", "server.js"]
