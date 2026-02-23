import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Tracing
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  
  // Entorno
  environment: process.env.NODE_ENV || "development",
  
  // Solo enviar en producción o si está configurado el DSN
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
