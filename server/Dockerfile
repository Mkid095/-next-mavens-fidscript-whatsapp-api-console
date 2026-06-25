FROM node:20-alpine
WORKDIR /app
COPY dist/ ./dist/
COPY openapi.json ./openapi.json
COPY package.json ./
COPY node_modules/ ./node_modules/
RUN npm install --omit=dev 2>/dev/null || true
EXPOSE 3099
ENV PORT=3099 NODE_ENV=production
ENV JWT_SECRET=fidscript-jwt-secret-change-in-production
ENV CORS_ORIGIN=*
ENV PLATFORM_URL=https://whatsapp.fidscript.com
ENV API_URL=https://api.whatsapp.fidscript.com
ENV API_INTERNAL_URL=http://fidscript-whatsapp-api:3099
ENV EVOLUTION_API_URL=http://nextmavens_evolution:8080
ENV EVOLUTION_API_KEY=94977bc1fcb107c79d0687caea800bdb74edd67b5022771fc85c22ee389ca7e8
ENV TUMA_BUSINESS_EMAIL=nextmavensoffice@gmail.com
ENV TUMA_API_KEY=tuma_22e5d0fff7b75e46b82bdb1cd6b31ee78dc209b58a7c8e177fed6d0b78890fd3_1781442356
ENV RESEND_API_KEY=re_2ZVSvdru_LENCaWda3nsgfTnhqRnHRdWy
ENV MAIL_FROM="FIDScript <noreply@whatsapp.fidscript.com>"
ENV DEPLOY_VERSION=1.0.0
CMD ["node", "dist/index.js"]
