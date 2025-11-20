// utils/compressImage.ts
export type CompressOpts = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;        // 0..1 for lossy formats
  mimeType?: string;       // 'image/jpeg' | 'image/webp' | 'image/png' | etc.
  targetBytes?: number;    // optional soft cap (e.g., 300_000 for ~300 KB)
};

export async function compressImage(
  file: File,
  {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.92,
    mimeType,       // if not provided, we'll keep file.type (fallback to 'image/jpeg')
    targetBytes,
  }: CompressOpts = {}
): Promise<Blob> {
  // Prefer WebP if caller didn’t force a type and browser supports it
  const preferredType =
    mimeType ??
    (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp'
      ? file.type
      : 'image/jpeg');

  // Read as bitmap (handles EXIF orientation automatically in most modern browsers)
  const bitmap = await createImageBitmap(file);

  // Compute target size preserving aspect ratio
  let { width, height } = bitmap;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  // Use OffscreenCanvas if available (a bit faster), else normal canvas
  const canvas: HTMLCanvasElement | OffscreenCanvas =
    (globalThis as any).OffscreenCanvas
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height });

  // Draw with high-quality settings
  const ctx = (canvas as any).getContext('2d', { alpha: preferredType === 'image/png' });
  
  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Export with (optional) iterative quality trimming to try hit targetBytes
  async function toBlob(q: number): Promise<Blob> {
    const b: Blob | null = await new Promise((resolve) =>
      (canvas as any).toBlob
        ? (canvas as any).toBlob(resolve, preferredType, q)
        : resolve((canvas as any).convertToBlob({ type: preferredType, quality: q }))
    );
    if (!b) throw new Error('Compression failed');
    return b;
  }

  let q = quality;
  let out = await toBlob(q);

  if (targetBytes && out.size > targetBytes && /jpe?g|webp/.test(preferredType)) {
    // Binary search the quality a few steps, but maintain minimum quality of 0.85
    let lo = 0.85, hi = quality, attempts = 5;
    while (attempts-- > 0) {
      const mid = (lo + hi) / 2;
      const test = await toBlob(mid);
      if (test.size > targetBytes) {
        hi = mid;
      } else {
        lo = mid;
        out = test;
      }
    }
  }

  return out;
}
