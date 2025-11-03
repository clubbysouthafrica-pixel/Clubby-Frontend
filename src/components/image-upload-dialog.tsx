import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EditIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { compressImage } from "@/utils/imageCompressor";
import { useQueryClient } from "@tanstack/react-query";

interface ImageProps {
  title: string;
  description: string;
  presignedUrl: string;
  imageUrl: string;
  className?: string;
}

export default function ImageUploadDialog({
  title,
  description,
  className,
  presignedUrl,
  imageUrl,
}: ImageProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedMime, setCompressedMime] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blob = await compressImage(file, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.8,
      targetBytes: 300_000,
    });

    setSelectedFile(file);
    setCompressedBlob(blob);
    setCompressedMime(blob.type || file.type);

    const localUrl = URL.createObjectURL(blob);
    setImagePreview(localUrl);
  };

  const upload = async () => {
    if (!compressedBlob) return;

    try {
      setUploading(true);

      const contentType =
        compressedMime || selectedFile?.type || "application/octet-stream";

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: compressedBlob,
        headers: { "Content-Type": contentType },
      });

      if (uploadRes.ok) {
        // Invalidate the specific club query to refetch with new image URLs
        await queryClient.invalidateQueries({ queryKey: ["getClub"] });
        
        // Add a small delay to ensure S3 propagation, then close dialog
        setTimeout(() => {
          setOpenDialog(false);
        }, 500);
      } else {
        console.error("Upload failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Avatar
          className={cn(
            "w-full h-full rounded-lg overflow-hidden cursor-pointer hover:shadow-xl relative",
            className
          )}
        >
          <AvatarImage
            className={cn("w-full h-full object-center object-cover")}
            src={imageUrl}
          />
          <AvatarFallback className="w-full h-full object-center object-cover rounded-lg bg-muted/30" />
          <EditIcon className="absolute top-1/2 left-1/2 bg-white rounded-full p-1 w-6 h-6 -translate-y-1/2 -translate-x-1/2 opacity-80 shadow-md" />
        </Avatar>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="image">Profile Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {imagePreview && !uploading && (
              <Avatar
                className={cn(
                  "w-full h-full rounded-lg overflow-hidden cursor-pointer hover:shadow-xl relative",
                  className
                )}
              >
                <AvatarImage
                  className="w-full h-full object-center object-cover"
                  src={imagePreview}
                />
                <AvatarFallback className="w-full h-full object-center object-cover rounded-lg bg-muted/30" />
                <EditIcon className="absolute top-1/2 left-1/2 bg-white rounded-full p-1 w-6 h-6 -translate-y-1/2 -translate-x-1/2 opacity-80 shadow-md" />
              </Avatar>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={upload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
