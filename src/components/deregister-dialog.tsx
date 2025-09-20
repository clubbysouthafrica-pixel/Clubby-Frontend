import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2Icon, Users, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { useDeregisterAllMutation } from "@/mutations/admin/useDeregisterMutation"
import { toast } from "sonner"
import { Checkbox } from "./ui/checkbox"

interface ImageProps {
  clubId: string
  disabled: boolean
}

export default function DeregisterAllDialog({ clubId, disabled }: ImageProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState(false);

  const { mutate, isPending, isSuccess } = useDeregisterAllMutation()

  const send = () => {
    mutate(clubId, {
      onSuccess: () => {
        toast.success("Successfully unregistered all members")
        setOpenDialog(false)
      },
      onError: () => toast.error("Something went wrong")
    })
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => setOpenDialog(true)}
              className="relative"
            >
              <Users />
              <X className="absolute -right-0 h-3 w-3 scale-55 transform text-black" strokeWidth={3}  />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unregister all members.</p>
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unregister All Members</DialogTitle>
          <DialogDescription>This will unregister all the existing registered members</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-1">
          <Checkbox
            id="consent"
            onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
          />
          <DialogDescription className="text-black">I confirm to deregistering all members.</DialogDescription>
        </div>
        {
          isSuccess &&
          <Alert>
            <CheckCircle2Icon color="green" />
            <AlertTitle className="text-green-800">Successfully unregistered!</AlertTitle>
            <AlertDescription>
              All members has been successfully unregistered
            </AlertDescription>
          </Alert>
        }
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" variant={"destructive"} disabled={!confirmed || isPending || isSuccess} onClick={send}>{isPending ? "loading..." : "Unregister"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
