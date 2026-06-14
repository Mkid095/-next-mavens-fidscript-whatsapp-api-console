module.exports = {
  apps: [{
    name: 'fidscript-api',
    script: 'dist/index.js',
    cwd: '/home/ken/fidscript-whatsapp/server',
    env: {
      PORT: 3099,
      NODE_ENV: 'production',
      JWT_SECRET: 'fidscript-jwt-secret-change-in-production',
      CORS_ORIGIN: '*',
      PAYHERO_API_URL: 'https://backend.payhero.co.ke/api/v2',
      PAYHERO_BASIC_AUTH: 'Basic dmtEdDFyWWxaRzB0N0dSY0ZwbXI6RDh2WENlS1BHcWFXQWZyWmR1ZVNIcUtxSHVCc3ZBd29wdWViaERjVA==',
      PAYHERO_CHANNEL_ID: '7173',
      PLATFORM_URL: 'https://whatsapp.fidscript.com'
    },
    error_file: '/tmp/fidscript-err.log',
    out_file: '/tmp/fidscript-out.log',
    time: true
  }]
}