import { Button } from "@/components/ui/button";
import { useFetchClubGallery } from "@/queries/gallery";
import { useEffect, useState } from "react";

export default function ClubGalleryEdit({ clubId }: { clubId: string }) {
  const [galleryImages, setGalleryImages] = useState<(File | string)[]>([]);
  const { data, isLoading } = useFetchClubGallery(clubId);

  useEffect(() => {
    if (data?.images) {
      setGalleryImages(data.images);
    }
  }, [data]);

  const handleGalleryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const res = await fetch("/admin/club/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId,
          imageKeys: files.map((file) => file.name),
        }),
      });

      if (!res.ok) {
        return;
      }

      const { signedUrls } = await res.json();
      await Promise.all(
        files.map((file) => {
          const match: { key: string; url: string } = signedUrls.find(
            (s: { key: string }) => s.key === file.name,
          );

          if (!match) return;

          return fetch(match.url, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
        }),
      );

      setGalleryImages((prev) => [
        ...prev,
        ...signedUrls.map((s: { key: string }) => s.key), // Or use the public URL if available
      ]);
    }
  };

  const handleRemoveGalleryImage = async (idx: number) => {
    const image = galleryImages[idx];
    const imageKey = typeof image === "string" ? image : image.name;
    const res = await fetch("/admin/club/gallery/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubId,
        imageKey,
      }),
    });
    if (res.ok) {
      setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
