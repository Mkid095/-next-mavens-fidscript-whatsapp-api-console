FROM node:20-alpine
WORKDIR /app
COPY dist/ ./dist/
COPY package.json ./
COPY node_modules/ ./node_modules/
RUN npm install --omit=dev 2>/dev/null || true
EXPOSE 3099
ENV PORT=3099 NODE_ENV=production
ENV JWT_SECRET=fidscript-jwt-secret-change-in-production
ENV CORS_ORIGIN=*
ENV PAYHERO_API_URL=https://backend.payhero.co.ke/api/v2
ENV PAYHERO_BASIC_AUTH=Basic dmtEdDFyWWxaRzB0N0dSY0ZwbXI6RDh2WENlS1BHcWFXQWZyWmR1ZVNIcUtxSHVCc3ZBd29wdWViaERjVA==
ENV PAYHERO_CHANNEL_ID=7173
ENV PLATFORM_URL=https://whatsapp.fidscript.com
ENV API_URL=https://api.whatsapp.fidsapp.fidscript.com
ENV RESEND_API_KEY=re_2ZVSvdru_LENCaWda3nsgfTnhqRnHRdWy
ENV MAIL_FROM=FIDScript<noreply@whatsapp.fidscript.com>
ENV DEPLOY_VERSION=1.0.0
CMD ["node", "dist/index.js"]
