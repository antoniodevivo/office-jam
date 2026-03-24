FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN cd libs/db && npx prisma generate
RUN npx nx build api --configuration=production
RUN npx tsc --outDir dist/apps/api/libs/db/generated \
  --rootDir libs/db/generated \
  --module commonjs --esModuleInterop --skipLibCheck \
  --moduleResolution node \
  libs/db/generated/client/*.ts libs/db/generated/client/internal/*.ts

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist/apps/api ./dist/
COPY --from=builder /app/libs/db/prisma ./prisma/
COPY --from=builder /app/libs/db/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "cd /app && npx prisma migrate deploy --config prisma.config.ts && node dist/main.js"]
