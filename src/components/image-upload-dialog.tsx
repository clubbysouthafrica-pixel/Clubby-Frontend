import { useState, useRef, useCallback } from "react";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
  EditIcon, 
  RotateCcw, 
  RotateCw, 
  Upload, 
  Image as ImageIcon,
  Check,
  ArrowLeft,
  Crop as CropIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { compressImage } from "@/utils/imageCompressor";
import { useQueryClient } from "@tanstack/react-query";
import ReactCrop, { 
  type Crop, 
  type PixelCrop,
  centerCrop, 
  makeAspectCrop 
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css';
import './image-upload-dialog.css';

interface ImageProps {
  title: string;
  description: string;
  presignedUrl: string;
  imageUrl: string;
  className?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'free' | 'original';
  allowNoCrop?: boolean;
}

// Helper function to get aspect ratio value
function getAspectRatioValue(aspectRatio: string): number | undefined {
  switch (aspectRatio) {
    case 'square':
      return 1;
    case 'landscape':
      return 16 / 9;
    case 'portrait':
      return 9 / 16;
    case 'free':
    case 'original':
      return undefined;
    default:
      return 1;
  }
}

// Helper function to create image from crop
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string,
  mimeType: string = 'image/png'
): Promise<{ file: File; blob: Blob }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Convert crop rect from rendered px -> natural px
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  // Make the output canvas match the natural-resolution crop
  canvas.width = Math.round(cropWidth);
  canvas.height = Math.round(cropHeight);

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve) => {
    const outType = mimeType === 'image/jpeg' || mimeType === 'image/webp'
      ? mimeType
      : 'image/png';

    const callback = (blob: Blob | null) => {
      if (!blob) throw new Error('Canvas is empty');
      const file = new File([blob], fileName, { type: blob.type });
      resolve({ file, blob });
    };

    if (outType === 'image/jpeg' || outType === 'image/webp') {
      canvas.toBlob(callback, outType, 1);
    } else {
      canvas.toBlob(callback, outType);
    }
  });
}


export default function ImageUploadDialog({
  title,
  description,
  className,
  presignedUrl,
  imageUrl,
  aspectRatio = 'square',
  allowNoCrop = false,
}: ImageProps) {
  const queryClient = useQueryClient();
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  
  // Cropping states
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>("");
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(aspectRatio);
  const [skipCropping, setSkipCropping] = useState<boolean>(false);

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedMime, setCompressedMime] = useState<string | null>(null);

  // Helper function to get compression settings based on aspect ratio and use case
  const getCompressionSettings = (aspectRatio: string) => {
    switch (aspectRatio) {
      case 'landscape':
        // Cover photos - preserve original resolution and quality
        return {
          maxWidth: 99999, // No resolution limit - keep original size
          maxHeight: 99999,
          quality: 0.90,
          mimeType: 'image/webp', // WebP for better quality at same size
          // No targetBytes - maintain quality at all costs
        };
      case 'portrait':
        // Portrait images for stories/posts
        return {
          maxWidth: 99999, // No resolution limit
          maxHeight: 99999,
          quality: 0.90,
          mimeType: 'image/webp', // WebP for better quality
          // No targetBytes - maintain quality
        };
      case 'original':
        // Original size with high quality - no compression
        return {
          maxWidth: 99999, // No resolution limit
          maxHeight: 99999,
          quality: 0.90,
          mimeType: 'image/webp', // WebP for better quality
          // No targetBytes - maintain quality
        };
      case 'free':
        // Free crop with good quality
        return {
          maxWidth: 99999, // No resolution limit
          maxHeight: 99999,
          quality: 0.90,
          mimeType: 'image/webp', // WebP for better quality
          // No targetBytes - maintain quality
        };
      case 'square':
      default:
        // Profile pictures and avatars
        return {
          maxWidth: 99999, // No resolution limit
          maxHeight: 99999,
          quality: 0.90,
          mimeType: 'image/webp', // WebP for better quality
          // No targetBytes - maintain quality
        };
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      setImagePreview(imageUrl);
      setShowCropper(!allowNoCrop || selectedAspectRatio !== 'original');
      setCroppedImageUrl("");
      setRotation(0);
      setSkipCropping(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSkipCropping = useCallback(async () => {
    if (!selectedFile) return;

    try {
      // Use optimized compression settings for the selected aspect ratio
      const compressionSettings = getCompressionSettings(selectedAspectRatio);
      
      const compressedBlob = await compressImage(selectedFile, compressionSettings);

      setCompressedBlob(compressedBlob);
      setCompressedMime(compressedBlob.type || selectedFile.type);

      const originalUrl = URL.createObjectURL(compressedBlob);
      setCroppedImageUrl(originalUrl);
      setShowCropper(false);
      setSkipCropping(true);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }, [selectedFile, selectedAspectRatio]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const aspectRatioValue = getAspectRatioValue(selectedAspectRatio);
    
    if (aspectRatioValue) {
      // Set a default crop with the selected aspect ratio
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 100,
          },
          aspectRatioValue,
          width,
          height,
        ),
        width,
        height,
      );
      setCrop(crop);
    } else {
      // For free crop, set a default rectangular crop
      setCrop({
        unit: '%',
        x: 5,
        y: 5,
        width: 90,
        height: 90,
      });
    }
  }, [selectedAspectRatio]);

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !selectedFile) return;

    try {
      const { blob } = await getCroppedImg(
        imgRef.current,
        completedCrop,
        selectedFile.name,
        selectedFile.type
      );

      // Use optimized compression settings for the selected aspect ratio
      const compressionSettings = getCompressionSettings(selectedAspectRatio);
      
      const compressedBlob = await compressImage(new File([blob], selectedFile.name), compressionSettings);

      setCompressedBlob(compressedBlob);
      setCompressedMime(compressedBlob.type || selectedFile.type);

      const croppedUrl = URL.createObjectURL(compressedBlob);
      setCroppedImageUrl(croppedUrl);
      setShowCropper(false);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [completedCrop, selectedFile, selectedAspectRatio]);

  const handleRotate = (direction: 'left' | 'right') => {
    const newRotation = direction === 'left' ? rotation - 90 : rotation + 90;
    setRotation(newRotation);
  };

  const handleStartOver = () => {
    setImagePreview("");
    setCroppedImageUrl("");
    setShowCropper(false);
    setSelectedFile(null);
    setCompressedBlob(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
    setSelectedAspectRatio(aspectRatio);
    setSkipCropping(false);
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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
          handleStartOver(); // Reset state when closing
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

  const currentStep = !selectedFile ? 'select' : showCropper ? 'crop' : 'preview';

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <div className="group relative">
          <Avatar
            className={cn(
              "w-full h-full rounded-xl overflow-hidden cursor-pointer transition-all duration-500",
              "group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-primary/25",
              "ring-2 ring-transparent group-hover:ring-primary/20",
              className
            )}
          >
            <AvatarImage
              className={cn("w-full h-full object-center object-cover transition-all duration-500 group-hover:scale-105")}
              src={imageUrl}
            />
            <AvatarFallback className="w-full h-full object-center object-cover rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            </AvatarFallback>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
              <div className="bg-white/95 backdrop-blur-md rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75 shadow-xl border border-primary/20">
                <EditIcon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Avatar>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[650px] border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-xl shadow-2xl">
        {/* Header with Progress Steps */}
        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {title}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                currentStep === 'select' ? "bg-primary scale-125" : "bg-muted"
              )} />
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                currentStep === 'crop' ? "bg-primary scale-125" : "bg-muted"
              )} />
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                currentStep === 'preview' ? "bg-primary scale-125" : "bg-muted"
              )} />
            </div>
          </div>
          <DialogDescription className="text-muted-foreground">
            {currentStep === 'select' && description}
            {currentStep === 'crop' && `${selectedAspectRatio === 'original' ? 'Use the original image or crop' : 'Position and crop your image'} to get the perfect fit`}
            {currentStep === 'preview' && `Perfect! Your ${skipCropping ? 'original' : 'cropped'} image is ready to upload`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Step 1: File Selection */}
          {currentStep === 'select' && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                  <h3 className="text-lg font-semibold mb-2">Select your image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to browse
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="pointer-events-none bg-primary/10 border-primary/30 hover:bg-primary/20"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Image Cropping */}
          {currentStep === 'crop' && imagePreview && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CropIcon className="w-5 h-5 text-primary" />
                  <span className="font-medium">Crop & Adjust</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotate('left')}
                    disabled={uploading}
                    className="h-9 w-9 p-0 hover:bg-primary/10"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotate('right')}
                    disabled={uploading}
                    className="h-9 w-9 p-0 hover:bg-primary/10"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Aspect Ratio Selection */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Aspect Ratio:</span>
                <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Square (1:1)</SelectItem>
                    <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                    <SelectItem value="portrait">Portrait (9:16)</SelectItem>
                    <SelectItem value="free">Free Crop</SelectItem>
                    {allowNoCrop && <SelectItem value="original">Original Size</SelectItem>}
                  </SelectContent>
                </Select>
                {allowNoCrop && selectedAspectRatio === 'original' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipCropping}
                    disabled={uploading}
                    className="text-sm"
                  >
                    Use Original
                  </Button>
                )}
              </div>
              
              {selectedAspectRatio !== 'original' && (
                <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-muted/20 to-muted/10 p-4">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={getAspectRatioValue(selectedAspectRatio)}
                    minWidth={50}
                    minHeight={50}
                    className="max-h-80"
                  >
                    <img
                      ref={imgRef}
                      alt="Crop preview"
                      src={imagePreview}
                      style={{ 
                        transform: `rotate(${rotation}deg)`,
                        maxHeight: '320px',
                        width: 'auto',
                        borderRadius: '8px'
                      }}
                      onLoad={onImageLoad}
                      className="shadow-lg"
                    />
                  </ReactCrop>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 'preview' && croppedImageUrl && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-medium">
                  Perfect! {skipCropping ? 'Original image' : 'Cropped image'} ready to upload
                </span>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className={cn(
                    "shadow-2xl shadow-primary/20",
                    selectedAspectRatio === 'landscape' ? "w-60 h-36 rounded-2xl" :
                    selectedAspectRatio === 'portrait' ? "w-36 h-60 rounded-2xl" :
                    skipCropping ? "w-48 h-48 rounded-2xl" :
                    "w-40 h-40 rounded-2xl"
                  )}>
                    <AvatarImage
                      className="w-full h-full object-cover"
                      src={croppedImageUrl}
                    />
                    <AvatarFallback className="w-full h-full object-cover rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30" />
                  </Avatar>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {!skipCropping && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCropper(true)}
                      disabled={uploading}
                      className="flex items-center space-x-2 hover:bg-primary/10 border-primary/30"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Edit Crop</span>
                    </Button>
                  )}
                  {skipCropping && allowNoCrop && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCropper(true);
                        setSkipCropping(false);
                        setCroppedImageUrl("");
                      }}
                      disabled={uploading}
                      className="flex items-center space-x-2 hover:bg-primary/10 border-primary/30"
                    >
                      <CropIcon className="w-4 h-4" />
                      <span>Add Cropping</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 pt-6 border-t border-primary/10">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              onClick={handleStartOver}
              className="w-full sm:w-auto hover:bg-muted/50"
            >
              Cancel
            </Button>
          </DialogClose>
          
          {currentStep === 'crop' && selectedAspectRatio !== 'original' && (
            <Button
              onClick={handleCropComplete}
              disabled={uploading || !completedCrop}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          )}
          
          {currentStep === 'preview' && (
            <Button 
              onClick={upload} 
              disabled={uploading || !croppedImageUrl}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
