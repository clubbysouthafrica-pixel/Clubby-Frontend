import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ClubGalleryEdit() {
  const [galleryImages, setGalleryImages] = useState<(File | string)[]>([]);

  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGalleryImages((prev) => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">Club Gallery</h3>
      <label htmlFor="gallery-upload">
        <input
          id="gallery-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryImageUpload}
          className="hidden"
        />
        <Button type="button" className="mb-6" asChild>
          <span>Upload Images</span>
        </Button>
      </label>
      <div className="flex flex-wrap gap-5">
        {galleryImages.map((img, idx) => (
          <div
            key={idx}
            className="relative rounded-lg overflow-hidden shadow-sm bg-muted transition-shadow hover:shadow-md"
          >
            <img
              src={typeof img === "string" ? img : URL.createObjectURL(img)}
              alt={`Gallery image ${idx + 1}`}
              className="w-36 h-36 object-cover block transition-opacity"
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Remove image ${idx + 1}`}
              onClick={() => handleRemoveGalleryImage(idx)}
              className="absolute top-2 right-2 bg-black/60 text-white hover:bg-black/80 rounded-full"
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
