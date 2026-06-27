FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY geminiService.js ./
COPY clients/ ./clients/

CMD ["node", "server.js"]
