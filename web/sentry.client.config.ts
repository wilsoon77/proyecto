import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Tracing
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  
  // Replay (grabación de sesiones)
  replaysSessionSampleRate: 0.1, // 10% de sesiones grabadas
  replaysOnErrorSampleRate: 1.0, // 100% de sesiones con errores grabadas
  
  // Entorno
  environment: process.env.NODE_ENV || "development",
  
  // Solo enviar en producción o si está configurado el DSN
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Ignorar errores comunes de navegador que no son útiles
  ignoreErrors: [
    // Errores de red
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // Errores de extensiones de navegador
    "ResizeObserver loop",
    // Errores de cancelación
    "AbortError",
  ],
});
