import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,

  // Adds request headers and IP for users
    sendDefaultPii: false,

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
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}

// This export will instrument router navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
