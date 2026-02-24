import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5e37095bde709d45edf2f809f5547beb@o4510354522701824.ingest.us.sentry.io/4510937571328000",

  // Adds request headers and IP for users
  sendDefaultPii: true,

  // Capture 100% in dev, 20% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,

  // Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});

// This export will instrument router navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
