FROM node:20-alpine
WORKDIR /app
COPY server/dist/ ./dist/
COPY server/package.json ./
COPY server/node_modules/ ./node_modules/
RUN npm install --omit=dev 2>/dev/null || true
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production
ENV NATS_URL=nats://fidscript_nats:4222
CMD ["node", "dist/chatbot-worker/index.js"]
