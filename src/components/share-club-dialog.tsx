import { useRef, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clipboard, ForwardIcon } from "lucide-react"
import QRCode from "react-qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import jsPDF from "jspdf";

interface ShareClubProps {
    clubId: string
}

export default function ShareClubDialog({ clubId }: ShareClubProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const onboardRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const hostValue = `${window.location.origin}`
  const profileLink = `${hostValue}/club/${clubId}`
  const onboardingLink = `${hostValue}/club/${clubId}/onboarding`

  const exportToPdf = (reference: React.RefObject<HTMLDivElement | null>) => {
    if (!reference.current) return;

    const svgElement = reference.current.querySelector("svg");
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);

    const img = new Image();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const svgDataUrl =
        "data:image/svg+xml;base64," +
        window.btoa(unescape(encodeURIComponent(svgString)));

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        if (context) {
            context.drawImage(img, 0, 0);
            const imgDataUrl = canvas.toDataURL("image/png");

            const pdf = new jsPDF();
            pdf.addImage(imgDataUrl, "PNG", 10, 10, 180, 180);
            pdf.save(`qr-code-camera.pdf`);
        }
    };

    img.onerror = () => {
        console.error("Failed to load SVG image for PDF export.");
    };

    img.src = svgDataUrl;
    };

    const copyCode = (link: string) => navigator.clipboard.writeText(link)
  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant={"outline"}>Share <ForwardIcon/></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Club Details</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="onboarding">
        <TabsList>
          <TabsTrigger value="onboarding">Onboarding Details</TabsTrigger>
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
        </TabsList>
        <TabsContent value="onboarding">
            <div className="grid gap-4">
            <div className="grid gap-3 py-4">
                <div className="bg-white mx-auto" ref={onboardRef}>
                    <QRCode value={onboardingLink}/>
                </div>
                <p className="underline text-xs" onClick={() => exportToPdf(onboardRef)}>Download qr code here</p>

                <div className="flex space-x-2">
                    <Input type="text" value={onboardingLink} disabled/>
                    <Button variant={"outline"} onClick={() => copyCode(onboardingLink)}><Clipboard/></Button>
                </div>
            </div>
            </div>
        </TabsContent>
        <TabsContent value="profile">

            <div className="grid gap-4 py-4">
            <div className="grid gap-3">
                <div className="bg-white mx-auto" ref={profileRef}>
                    <QRCode value={profileLink}/>
                </div>
                <p className="underline text-xs" onClick={() => exportToPdf(profileRef)}>Download qr code here</p>

                <div className="flex space-x-2">
                    <Input type="text" value={profileLink} disabled/>
                    <Button variant={"outline"} onClick={() => copyCode(profileLink)}><Clipboard/></Button>
                </div>
            </div>
            </div>
        </TabsContent>
      </Tabs>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
