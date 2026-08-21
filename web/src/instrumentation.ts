import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NODE_ENV === "production") {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      try {
        await import("../sentry.server.config");
      } catch (e) {
        console.warn("⚠️ Sentry server instrumentation error:", e);
      }
    }

    if (process.env.NEXT_RUNTIME === "edge") {
      try {
        await import("../sentry.edge.config");
      } catch (e) {
        console.warn("⚠️ Sentry edge instrumentation error:", e);
      }
    }
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  if (process.env.NODE_ENV === "production") {
    try {
      const Sentry = await import("@sentry/nextjs");
      return Sentry.captureRequestError(err, request, context);
    } catch {
      // Ignorar en caso de error en captura
    }
  }
};
