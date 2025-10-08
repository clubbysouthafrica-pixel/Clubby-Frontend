import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { fetchImagePresignedUrl } from "@/services/admin/image"
import { EditIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { compressImage } from "@/utils/imageCompressor"
import { Skeleton } from "./ui/skeleton"

interface ImageProps {
  title: string
  description: string
  presignedUrlApi: string
  className?: string
}

const loadingIcon = 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif';

export default function ImageUploadDialog({ title, description, presignedUrlApi, className }: ImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [presignedUrl, setPresignedUrl] = useState<string>("")
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedMime, setCompressedMime] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getImg = async () => {
      setLoading(true)
      try {
        const { uploadUrl, fetchUrl } = await fetchImagePresignedUrl(presignedUrlApi)
        setPresignedUrl(uploadUrl)
        setImageUrl(fetchUrl)
      } catch (error) {
        console.error("Failed to fetch presigned URL", error)
      }
      setLoading(false)
    }

    getImg()
  }, [presignedUrlApi])

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

      const contentType = compressedMime || selectedFile?.type || "application/octet-stream";

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: compressedBlob,
        headers: { "Content-Type": contentType },
      });

      if (uploadRes.ok) {
        if (!imageUrl) setImageUrl(imagePreview);
        const { fetchUrl } = await fetchImagePresignedUrl(presignedUrlApi)
        setImageUrl(fetchUrl)
        setOpenDialog(false);
      } else {
        console.error("Upload failed");
      }
    } catch (err) {
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        {
          loading ?
            <Skeleton className="h-full min-h-36 w-full rounded-full" /> :
            <Avatar className="w-full rounded-lg overflow-hidden max-h-36 h-full cursor-pointer hover:shadow-xl relative">
              <AvatarImage className={cn("w-full object-center object-cover", className)} src={imageUrl} />
              <AvatarFallback className="w-full object-center object-cover min-h-36 rounded-lg"></AvatarFallback>
              <EditIcon className="absolute top-1/2 left-1/2 bg-white rounded-full p-1 w-6 h-6 -translate-y-1/2 -translate-x-1/2 opacity-80 shadow-md" />
            </Avatar>
        }
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="image">Profile Image</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            {imagePreview && !uploading &&
              <Avatar className="w-full rounded-lg overflow-hidden max-h-36 h-full cursor-pointer hover:shadow-xl relative">
                <AvatarImage className={cn("w-full object-center object-cover", className)} src={imagePreview} />
                <AvatarFallback className="w-full object-center object-cover min-h-36 rounded-lg"></AvatarFallback>
                <EditIcon className="absolute top-1/2 left-1/2 bg-white rounded-full p-1 w-6 h-6 -translate-y-1/2 -translate-x-1/2 opacity-80 shadow-md" />
              </Avatar>}
            {uploading && <img src={loadingIcon} alt="Preview" className="rounded-lg mt-2 h-32 w-full object-cover" />}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={upload} disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
