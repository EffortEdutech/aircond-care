import type { Instrumentation } from "next";

/**
 * Every unhandled server error becomes one JSON line in the Vercel runtime logs, so it can be
 * searched (event = "request_error") without a paid error-tracking service.
 * Only the path (no query string), route and error type are logged: no headers, cookies or form data.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const digest = typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : undefined;
  console.error(
    JSON.stringify({
      level: "error",
      event: "request_error",
      at: new Date().toISOString(),
      message: error.message.slice(0, 500),
      name: error.name,
      digest,
      method: request.method,
      path: request.path.split("?")[0],
      route: context.routePath,
      routeType: context.routeType,
      stack: error.stack?.split("\n").slice(0, 6).join("\n"),
    }),
  );
};
