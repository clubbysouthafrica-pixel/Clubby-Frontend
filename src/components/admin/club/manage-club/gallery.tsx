import { Button } from "@/components/ui/button";
import { useState } from "react";
import { uploadGalleryImage, removeGalleryImage } from "@/services/admin/club";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
}

export default function ClubGalleryEdit({
  clubId,
  galleryImages: initialGalleryImages = [],
}: {
  clubId: string;
  galleryImages?: GalleryImage[];
}) {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(
    initialGalleryImages,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<{
    id: string;
    index: number;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleGalleryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      setIsUploading(true);
      const files = Array.from(e.target.files);

      try {
        const uploadPromises = files.map((file) => {
          return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const base64String = event.target?.result as string;
              const imageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

              try {
                await uploadGalleryImage(clubId, base64String, imageId);
                setGalleryImages((prev) => [
                  ...prev,
                  {
                    id: imageId,
                    url: base64String,
                  },
                ]);
                resolve();
              } catch {
                toast.error(`Failed to upload ${file.name}`);
                reject();
              }
            };
            reader.onerror = () => {
              toast.error(`Error reading ${file.name}`);
              reject();
            };
            reader.readAsDataURL(file);
          });
        });

        await Promise.allSettled(uploadPromises);
        toast.success("Images uploaded successfully");
      } catch {
        toast.error("Error uploading images");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setImageToRemove({ id: galleryImages[idx].id, index: idx });
  };

  const confirmRemoveGalleryImage = async () => {
    if (!imageToRemove) return;

    setIsRemoving(true);
    try {
      await removeGalleryImage(clubId, imageToRemove.id);
      setGalleryImages((prev) =>
        prev.filter((_, i) => i !== imageToRemove.index),
      );
      toast.success("Image removed successfully");
    } catch {
      toast.error("Failed to remove image");
    } finally {
      setIsRemoving(false);
      setImageToRemove(null);
    }
  };

  return (
    <div>
      <Dialog open={!!imageToRemove} onOpenChange={(open) => !open && setImageToRemove(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this image from the gallery? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmRemoveGalleryImage}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <h3 className="mb-4 text-lg font-semibold">Club Gallery</h3>
      <label htmlFor="gallery-upload">
        <input
          id="gallery-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryImageUpload}
          disabled={isUploading}
          className="hidden"
        />
        <Button type="button" className="mb-6" asChild disabled={isUploading}>
          <span>{isUploading ? "Uploading..." : "Upload Images"}</span>
        </Button>
      </label>
      <div className="flex flex-wrap gap-5">
        {galleryImages.map((img, idx) => (
          <div
            key={img.id}
            className="relative rounded-lg overflow-hidden shadow-sm bg-muted transition-shadow hover:shadow-md"
          >
            <img
              src={img.url}
              alt={`Gallery image ${idx + 1}`}
              className="w-36 h-36 object-cover block transition-opacity"
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Remove image ${idx + 1}`}
              onClick={() => handleRemoveGalleryImage(idx)}
              disabled={isRemoving}
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
