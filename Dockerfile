# Multi-stage build para optimizar tamaño
FROM public.ecr.aws/docker/library/node:24-alpine AS builder

# Instalar dependencias de build
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de todos los workspaces
RUN npm run build

# Limpiar dev dependencies
RUN npm prune --production

# Stage 2: Runtime
FROM public.ecr.aws/docker/library/node:22-alpine

# Instalar solo lo necesario para runtime
RUN apk add --no-cache tini

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Crear el directorio de datos con permisos antes de que se monte e inicie la DB
RUN mkdir -p /app/server/data && chown nodejs:nodejs /app/server/data

# Copiar solo lo necesario desde builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/client/dist ./client/dist
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=nodejs:nodejs /app/server/package.json ./server/
COPY --from=builder --chown=nodejs:nodejs /app/shared/dist ./shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/shared/package.json ./shared/

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Usar tini como init system
ENTRYPOINT ["/sbin/tini", "--"]

# Comando de inicio
CMD ["npm", "start"]
