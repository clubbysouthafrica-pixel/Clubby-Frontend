// Shared parsing for the STANDARD / IMAGE registration field.
//
// On submit the field value is serialised as a JSON array of data URLs so it
// stays a plain string (matching the rest of the registration form pipeline).
// Empty selections store "" so required-field validation still triggers. When a
// saved registration is re-hydrated the backend may hand back a real array, a
// JSON-encoded array, a single URL, or a bare storage key, so every shape is
// accepted here.

const IMAGE_EXTENSION_RE = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|svg)$/i;

/** A string that a browser can put straight into an <img src>. */
export function isRenderableImageSource(entry: string): boolean {
  return /^(https?:|data:|blob:)/i.test(entry);
}

/** Looks like an image (renderable source, or a storage key / path ending in an image extension). */
export function looksLikeImageReference(entry: string): boolean {
  if (!entry) return false;
  if (entry.startsWith("data:image/")) return true;
  const withoutQuery = entry.split("?")[0];
  return IMAGE_EXTENSION_RE.test(withoutQuery);
}

export function parseUploadedImages(
  value?: string | number | string[] | null,
): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof value !== "string" || !value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string");
    }
  } catch {
    // Not JSON - a single value stored as a data URL, hosted URL or storage key.
    if (
      value.startsWith("data:image") ||
      value.startsWith("http") ||
      looksLikeImageReference(value)
    ) {
      return [value];
    }
  }

  return [];
}

/**
 * Whether a submitted registration field value represents uploaded image(s).
 * Kept conservative for bare strings so a text answer that merely ends in
 * ".png" is not mistaken for an image field.
 */
export function isImageFieldValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return (
      value.length > 0 &&
      value.every(
        (entry) => typeof entry === "string" && looksLikeImageReference(entry),
      )
    );
  }

  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return (
          parsed.length > 0 &&
          parsed.every(
            (entry) =>
              typeof entry === "string" && looksLikeImageReference(entry),
          )
        );
      }
    } catch {
      // not JSON
    }
    return value.startsWith("data:image/");
  }

  return false;
}
