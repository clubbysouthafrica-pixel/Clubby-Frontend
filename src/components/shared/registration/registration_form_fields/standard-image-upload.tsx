import { useRef, useState } from "react";
import { ImagePlusIcon, Loader2, XIcon } from "lucide-react";
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

export default function StandardImageUpload({
  field,
  currentPageIndex,
  pages,
  setFieldValue,
}: StandardFieldInputProps) {
  const images = parseUploadedImages(field.value);
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const targetPageIndex = pages[currentPageIndex]?.page_index ?? currentPageIndex;

  const commit = (next: string[]) => {
    setFieldValue(targetPageIndex, field.field_id, (f) => ({
      ...f,
      value: next.length > 0 ? JSON.stringify(next) : "",
    }));
  };

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

  const removeImage = (index: number) => {
    setError("");
    commit(images.filter((_, i) => i !== index));
  };

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

      {images.length === 0 ? (
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
            PNG, JPG, WEBP or GIF · up to 5MB each · {images.length}/{MAX_IMAGES}
          </span>
        </button>
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
              disabled={images.length >= MAX_IMAGES || isReading}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlusIcon className="h-4 w-4" />
              )}
              {images.length === 1 ? "Replace image" : "Add more images"}
            </button>
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
