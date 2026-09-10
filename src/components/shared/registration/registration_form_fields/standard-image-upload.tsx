import { useEffect, useRef, useState } from "react";
import { CameraIcon, ImagePlusIcon, Loader2, XIcon } from "lucide-react";
import { parseUploadedImages } from "@/helpers/registration/parse-uploaded-images";
import RequiredLabel from "./required-label";

interface Field {
  field_id: string;
  field_name: string;
  field_type: string;
  input_type: string;
  placeholder?: string;
  required?: boolean;
  value?: string | number;
}

interface StandardFieldInputProps {
  field: Field;
  currentPageIndex: number;
  pages: any[];
  setFieldValue: (
    pageIndex: number,
    fieldId: string,
    updater: (f: any) => any,
  ) => void;
  /** Allow capturing a selfie from the device camera. Disabled in the form builder preview. */
  enableCamera?: boolean;
}

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const cameraSupported = () =>
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === "function";

export default function StandardImageUpload({
  field,
  currentPageIndex,
  pages,
  setFieldValue,
  enableCamera = true,
}: StandardFieldInputProps) {
  const images = parseUploadedImages(field.value);
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const targetPageIndex = pages[currentPageIndex]?.page_index ?? currentPageIndex;
  const showCamera = enableCamera && cameraSupported();
  const atCapacity = images.length >= MAX_IMAGES;

  const commit = (next: string[]) => {
    setFieldValue(targetPageIndex, field.field_id, (f) => ({
      ...f,
      value: next.length > 0 ? JSON.stringify(next) : "",
    }));
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const closeCamera = () => {
    stopStream();
    setIsCameraOpen(false);
    setCapturedPreview(null);
    setCameraError("");
  };

  // Acquire / release the camera stream while the capture panel is open and
  // not currently showing a still preview.
  useEffect(() => {
    if (!isCameraOpen || capturedPreview) return;

    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const name =
          err && typeof err === "object" && "name" in err
            ? (err as { name?: string }).name
            : undefined;
        setCameraError(
          name === "NotAllowedError" || name === "SecurityError"
            ? "Camera access was denied. Allow it in your browser, or upload an image instead."
            : "Could not access the camera. You can upload an image instead.",
        );
      });

    return () => {
      active = false;
      stopStream();
    };
  }, [isCameraOpen, capturedPreview]);

  // Safety net: release the camera if the component unmounts while open.
  useEffect(() => stopStream, []);

  const handleFiles = async (fileList: FileList | File[] | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    setError("");

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    const accepted: File[] = [];
    for (const file of files.slice(0, remainingSlots)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only image files (PNG, JPG, WEBP or GIF) are allowed.");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Each image must be 5MB or smaller.");
        continue;
      }
      accepted.push(file);
    }

    if (files.length > remainingSlots) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
    }

    if (accepted.length === 0) return;

    setIsReading(true);
    try {
      const dataUrls = await Promise.all(
        accepted.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            }),
        ),
      );
      commit([...images, ...dataUrls]);
    } catch {
      setError("Something went wrong reading your images. Please try again.");
    } finally {
      setIsReading(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    stopStream(); // freeze on the captured frame
    setCapturedPreview(dataUrl);
  };

  const usePhoto = () => {
    if (!capturedPreview) return;
    if (atCapacity) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
      closeCamera();
      return;
    }
    setError("");
    commit([...images, capturedPreview]);
    closeCamera();
  };

  const removeImage = (index: number) => {
    setError("");
    commit(images.filter((_, i) => i !== index));
  };

  const selfieButtonClasses =
    "inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="space-y-2" key={field.field_id}>
      <RequiredLabel
        htmlFor={field.field_id}
        required={field.required}
        className="block text-base font-medium text-gray-900"
      >
        {field.field_name}
      </RequiredLabel>

      {field.placeholder && (
        <p className="text-sm text-gray-500">{field.placeholder}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {isCameraOpen && (
        <div className="space-y-3 rounded-md border border-gray-200 bg-gray-900 p-3">
          {cameraError ? (
            <div className="space-y-3 rounded-md bg-white p-4 text-center">
              <p className="text-sm text-red-600">{cameraError}</p>
              <button
                type="button"
                onClick={closeCamera}
                className={selfieButtonClasses + " mx-auto"}
              >
                Close camera
              </button>
            </div>
          ) : capturedPreview ? (
            <>
              <img
                src={capturedPreview}
                alt="Selfie preview"
                className="mx-auto max-h-72 w-auto rounded-md object-contain"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={usePhoto}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Use photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPreview(null);
                    setCameraError("");
                  }}
                  className={selfieButtonClasses}
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-gray-200 transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="mx-auto max-h-72 w-auto rounded-md bg-black object-contain"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <CameraIcon className="h-4 w-4" />
                  Capture
                </button>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-gray-200 transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {images.length === 0 ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            disabled={isReading}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors ${
              isDragging
                ? "border-blue-400 bg-blue-50 text-blue-600"
                : "border-gray-300 bg-gray-50 text-gray-500 hover:border-blue-400 hover:text-blue-600"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isReading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlusIcon className="h-6 w-6" />
            )}
            <span className="text-sm font-medium">
              Click to upload or drag &amp; drop images
            </span>
            <span className="text-xs">
              PNG, JPG, WEBP or GIF · up to 5MB each · {images.length}/
              {MAX_IMAGES}
            </span>
          </button>

          {showCamera && (
            <>
              <p className="text-center text-xs text-gray-400">
                or don&apos;t have a photo?
              </p>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setCameraError("");
                  setCapturedPreview(null);
                  setIsCameraOpen(true);
                }}
                disabled={isCameraOpen}
                className={selfieButtonClasses + " w-full justify-center"}
              >
                <CameraIcon className="h-4 w-4" />
                Take a selfie
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={`space-y-3 rounded-md border-2 border-dashed p-3 transition-colors ${
            isDragging ? "border-blue-400 bg-blue-50" : "border-transparent"
          }`}
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((src, index) => (
              <div
                key={`${field.field_id}-image-${index}`}
                className="group relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-100"
              >
                <img
                  src={src}
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  title="Remove image"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={() => {
                if (images.length === 1) {
                  setError("");
                  commit([]);
                }
                inputRef.current?.click();
              }}
              disabled={atCapacity || isReading}
              className={selfieButtonClasses}
            >
              {isReading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlusIcon className="h-4 w-4" />
              )}
              {images.length === 1 ? "Replace image" : "Add more images"}
            </button>
            {showCamera && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setCameraError("");
                  setCapturedPreview(null);
                  setIsCameraOpen(true);
                }}
                disabled={atCapacity || isCameraOpen}
                className={selfieButtonClasses}
              >
                <CameraIcon className="h-4 w-4" />
                Take a selfie
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setError("");
                commit([]);
              }}
              disabled={isReading}
              className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XIcon className="h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
