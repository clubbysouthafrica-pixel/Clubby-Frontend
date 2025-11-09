import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { fetchImagePresignedUrl } from "@/services/image"
import { Loader2 } from "lucide-react"

interface ImageProps {
    title: string
    description: string
    presignedUrlApi: string
    className?: string
}

export default function MemberImageUploadDialog({ title, description, presignedUrlApi, className }: ImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [presignedUrl, setPresignedUrl] = useState<string>("")
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  useEffect(() => {
    const getImg = async () => {
      try {
        const { uploadUrl, fetchUrl } = await fetchImagePresignedUrl(presignedUrlApi)

        setPresignedUrl(uploadUrl)
        setImageUrl(fetchUrl)
      } catch (error) {
        console.error("Failed to fetch presigned URL", error)
      }
    }

    getImg()
  }, [presignedUrlApi])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
  }

  const upload = async () => {
    if (!selectedFile) return;

    try {
        setUploading(true)
        
        // 🔁 2. Upload the file to S3 using PUT
        const url = presignedUrl
        const uploadRes = await fetch(url, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": selectedFile.type,
          },
        })
  
        if (uploadRes.ok) {
            if (!imageUrl) setImageUrl(imagePreview)
            setOpenDialog(false)
        } else {
          console.error("Upload failed")
        }
      } catch (err) {
        console.error("Upload error:", err)
      } finally {
        setUploading(false)
      }
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <div className="w-full rounded-lg overflow-hidden h-36 cursor-pointer hover:shadow-xl" onClick={() => setOpenDialog(true)}>
          <img
            className={cn("w-full h-full object-center object-cover", className)}
            src={imageUrl || "https://github.com/shadcn.png"}
            alt="Profile"
          />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-2 border-primary rounded-xl shadow-lg">
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
            {imagePreview && <img src={imagePreview} alt="Preview" className="rounded-lg mt-2 h-32 w-full object-cover" />}
            {uploading && 
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={upload} disabled={uploading}>{uploading? "Uploading...": "Upload"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
