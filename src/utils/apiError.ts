type ErrorPayload =
  | { message?: string; error?: string }
  | string
  | undefined;

export const getApiErrorMessage = (
  error: unknown,
  fallback = "An unexpected error occurred",
): string => {
  const apiError = error as { response?: { data?: ErrorPayload }; message?: string };
  const data = apiError?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const message = data.message ?? data.error;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (typeof apiError?.message === "string" && apiError.message.trim()) {
    return apiError.message;
  }

  return fallback;
};