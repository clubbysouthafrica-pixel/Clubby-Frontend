import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2Icon, UserX } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip"
import { useDeregisterMembersMutation } from "@/mutations/admin/useDeregisterMutation"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface ImageProps {
  clubId: string
  disabled: boolean
  dereigsterMembers: { user_id: string, name: string }[]
}

export default function DeregisterMembersDialog({ dereigsterMembers, clubId }: ImageProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState(false);

  const { mutate, isPending, isSuccess } = useDeregisterMembersMutation()

  const send = () => {
    const userIds = dereigsterMembers.map(member => { return member.user_id })
    mutate({clubId: clubId, userIds: userIds}, {
        onSuccess: () =>    {
            toast.success("Successfully unregistered members")
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
            <Button variant={"outline"} disabled={!dereigsterMembers.length} onClick={() => setOpenDialog(true)}>
              <UserX />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unregister selected members.</p>
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unregister Members</DialogTitle>
          <DialogDescription>This will unregister the selected members:</DialogDescription>
          <div className="max-h-40 overflow-y-auto border p-2 rounded-lg">
            <ul className="list-disc pl-5">
              {dereigsterMembers.map((member) => (
                <li key={member.user_id}>
                  <Label className="py-2">{member.name}</Label>
                </li>
              ))}
            </ul>
          </div>
        </DialogHeader>
        <div className="flex items-center gap-1">
          <Checkbox
            id="consent"
            onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
          />
          <DialogDescription className="text-black">I confirm to deregistering the selected members.</DialogDescription>
        </div>
        {
          isSuccess &&
          <Alert>
            <CheckCircle2Icon color="green" />
            <AlertTitle className="text-green-800">Successfully unregistered!</AlertTitle>
            <AlertDescription>
              Members successfully unregistered
            </AlertDescription>
          </Alert>
        }
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            variant="destructive"
            disabled={!confirmed || isPending || isSuccess}
            onClick={send}
          >
            {isPending ? "loading..." : "Unregister"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
