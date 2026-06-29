FROM node:22-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/components.json ./components.json
COPY --from=builder /app/eslint.config.mjs ./eslint.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
