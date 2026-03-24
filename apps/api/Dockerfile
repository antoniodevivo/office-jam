FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN cd libs/db && bunx prisma generate
RUN bunx nx build api --configuration=production
RUN bunx tsc --outDir dist/apps/api/libs/db/generated \
  --rootDir libs/db/generated \
  --module commonjs --esModuleInterop --skipLibCheck \
  --moduleResolution node \
  libs/db/generated/client/*.ts libs/db/generated/client/internal/*.ts

FROM oven/bun:1-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist/apps/api ./dist/
COPY --from=builder /app/libs/db/prisma ./prisma/
COPY --from=builder /app/libs/db/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "cd /app && bunx prisma migrate deploy --config prisma.config.ts && bun dist/main.js"]
