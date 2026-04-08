type ErrorPayload =
  | { message?: string; error?: string; errors?: string[] }
  | string
  | undefined;

export const getApiErrorMessage = (
  error: unknown,
  fallback = "An unexpected error occurred",
): string => {
  const apiError = error as { response?: { data?: ErrorPayload }; message?: string };
  const data = apiError?.response?.data;

  const formatValidationErrors = (errors: string[] | undefined) => {
    if (!Array.isArray(errors)) {
      return "";
    }

    const messages = errors
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);

    return messages.join(" ");
  };

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const message = data.message ?? data.error;
    const validationErrors = formatValidationErrors(data.errors);

    if (typeof message === "string" && message.trim() && validationErrors) {
      return `${message.trim()} ${validationErrors}`;
    }

    if (validationErrors) {
      return validationErrors;
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (typeof apiError?.message === "string" && apiError.message.trim()) {
    return apiError.message;
  }

  return fallback;
};