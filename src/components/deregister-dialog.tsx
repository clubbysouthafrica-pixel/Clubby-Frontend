import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2Icon, UserX } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { useDeregisterAllMutation } from "@/mutations/admin/useDeregisterMutation"
import { toast } from "sonner"

interface ImageProps {
    clubId: string
    disabled: boolean
}

export default function DeregisterDialog({ clubId, disabled }: ImageProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const { mutate, isPending, isSuccess } = useDeregisterAllMutation()

  const send = () => {
    mutate(clubId, {
        onSuccess: () =>    {
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
          <Button variant={"outline"} disabled={disabled} onClick={() => setOpenDialog(true)}>
              <UserX />
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
          <Button type="submit" variant={"destructive"} disabled={isPending || isSuccess} onClick={send}>{ isPending ? "loading..." : "Unregister"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
