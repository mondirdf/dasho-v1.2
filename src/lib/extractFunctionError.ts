export const extractFunctionErrorMessage = async (err: unknown, fallback: string) => {
  if (err instanceof Error) {
    const maybeContext = (err as Error & { context?: Response }).context;

    if (maybeContext) {
      try {
        const body = await maybeContext.clone().json();
        if (typeof body?.details === "string" && body.details.trim()) return body.details;
        if (typeof body?.error === "string" && body.error.trim()) return body.error;
      } catch {
        // no-op: fall back to error.message
      }
    }

    if (err.message?.trim()) return err.message;
  }

  return fallback;
};
