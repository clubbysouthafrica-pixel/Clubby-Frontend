import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImageOff, Loader2, X } from "lucide-react";
import {
  isRenderableImageSource,
  parseUploadedImages,
} from "@/helpers/registration/parse-uploaded-images";

interface RegistrationFieldImagesProps {
  /** The registration field `value` - an array of keys/URLs, a JSON array string, or a single string. */
  value: unknown;
  /**
   * Resolves a bare storage key (not already an http/data/blob source) into a
   * viewable URL. Omit when the backend already returns viewable URLs.
   */
  resolveImageUrl?: (key: string) => Promise<string | null>;
  alt?: string;
  className?: string;
}

type Resolution = string | null | undefined; // undefined = not attempted, null = failed

function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
      />
    </div>,
    document.body,
  );
}

export function RegistrationFieldImages({
  value,
  resolveImageUrl,
  alt = "Uploaded image",
  className,
}: RegistrationFieldImagesProps) {
  const refs = parseUploadedImages(value as string | number | string[] | null);
  const refsKey = refs.join("|");

  const [resolved, setResolved] = useState<Record<string, Resolution>>({});
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!resolveImageUrl) return;

    const pending = refs.filter(
      (ref) =>
        !isRenderableImageSource(ref) && resolvedRef.current[ref] === undefined,
    );
    if (pending.length === 0) return;

    let cancelled = false;
    Promise.all(
      pending.map(async (key) => [key, await resolveImageUrl(key)] as const),
    ).then((entries) => {
      if (cancelled) return;
      setResolved((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsKey, resolveImageUrl]);

  if (refs.length === 0) {
    return <p className="text-sm italic text-slate-500">No image uploaded.</p>;
  }

  return (
    <>
      <div className={className ?? "flex flex-wrap gap-3"}>
        {refs.map((ref, index) => {
          const src = isRenderableImageSource(ref) ? ref : resolved[ref];
          const tileKey = `${ref}-${index}`;

          // Still resolving (a resolver exists and hasn't returned yet).
          if (src === undefined) {
            return (
              <div
                key={tileKey}
                className="flex h-28 w-28 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"
              >
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            );
          }

          // No resolver, or resolution failed - show the reference so it isn't lost.
          if (!src) {
            return (
              <div
                key={tileKey}
                className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 text-center"
                title={ref}
              >
                <ImageOff className="h-5 w-5 text-slate-400" />
                <span className="w-full break-all text-[10px] leading-tight text-slate-500">
                  {ref.split("/").pop() || ref}
                </span>
              </div>
            );
          }

          return (
            <button
              key={tileKey}
              type="button"
              onClick={() => setLightboxSrc(src)}
              className="group relative block h-28 w-28 cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
            >
              <img
                src={src}
                alt={`${alt} ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
          );
        })}
      </div>

      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt={alt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
