import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2Icon, UserX } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip"
import { useDeregisterMembersMutation } from "@/mutations/admin/useDeregisterMutation"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

interface ImageProps {
  clubId: string
  dereigsterMembers: { user_id: string, name: string }[]
  setlistActionItems: React.Dispatch<React.SetStateAction<string[]>>
  setDeregisterMembers: React.Dispatch<React.SetStateAction<{ user_id: string, name: string }[]>>
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>
}

export default function DeregisterMembersDialog({ dereigsterMembers, clubId, setlistActionItems, setDeregisterMembers, setAllMembersSelected }: ImageProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false)

  const { mutate, isPending, isSuccess: mutationSuccess } = useDeregisterMembersMutation()

  useEffect(() => {
    setIsSuccess(mutationSuccess);
  }, [mutationSuccess]);

  const send = () => {
    const userIds = dereigsterMembers.map(member => { return member.user_id })
    mutate({ clubId: clubId, userIds: userIds }, {
      onSuccess: () => {
        toast.success("Successfully unregistered members")
        setOpenDialog(false)
        window.location.reload();
      },
      onError: () => toast.error("Something went wrong")
    })
  }

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open) {
      setConfirmed(false);

      if (isSuccess) {
        setIsSuccess(false)
        setlistActionItems([])
        setDeregisterMembers([])
        setAllMembersSelected(false)
      }
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
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
          <div className="overflow-hidden rounded-lg border my-2">
            <div className="max-h-[200px] overflow-y-auto">
              <Table>
                <TableBody>
                  {dereigsterMembers.map((member) => (
                    <TableRow key={member.user_id} className="even:bg-white odd:bg-gray-100">
                      <TableCell className="py-2">{member.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
