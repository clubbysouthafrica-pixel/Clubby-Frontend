import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2Icon, UserX } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip"
import { useDeregisterMembersMutation } from "@/mutations/admin/useDeregisterMutation"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "../../../ui/input"

interface ImageProps {
  clubId: string
  dereigsterMembers: { user_id: string, name: string }[]
  selectedTab: string
  setlistActionItems: React.Dispatch<React.SetStateAction<{ email: string, name: string }[]>>
  setDeregisterMembers: React.Dispatch<React.SetStateAction<{ user_id: string, name: string }[]>>
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>
}

export default function DeregisterMembersDialog({ selectedTab, dereigsterMembers, clubId, setlistActionItems, setDeregisterMembers, setAllMembersSelected }: ImageProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false)
  const [memberQuery, setMemberQuery] = useState("")

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
            <Button variant={"outline"} disabled={!dereigsterMembers.length || selectedTab !== "registered-members"} onClick={() => setOpenDialog(true)}>
              <UserX />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Deregister selected members</p>
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
  <DialogContent className="sm:max-w-[640px] md:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>Deregister Members</DialogTitle>
          <DialogDescription>Deregistration list ({dereigsterMembers.length}):</DialogDescription>
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden mb-2">
            <div className="p-2">
              <Input placeholder="Search for member" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} className="mb-2" />
            </div>
            {/* make list compact and scroll only when > 2 items */}
            <div className={`${dereigsterMembers.length > 2 ? 'max-h-[100px] overflow-y-auto' : 'max-h-[64px]'} divide-y divide-gray-100 pr-2 scrollable-list`}>
              {dereigsterMembers
                .filter((m) => `${m.name}`.toLowerCase().includes(memberQuery.toLowerCase()))
                .map((member) => {
                const initials = member.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div key={member.user_id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shadow-sm">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{member.name}</span>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">To be deregistered</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <DialogDescription>
            <span>
              This action will remove all currently registered club members from the system. Member access will be revoked, and they will no longer be able to log in or participate in club activities.
            </span>
            <br />
            <br />
            <span>
              Use this action if you need to reset your member list, clean up inactive accounts, or prepare for new registrations.
            </span>
            <br />
            <br />
            <span className="text-red-600">
              ⚠️ This action is irreversible. All member associations will be removed. You may re-invite or members may re-register manually afterward.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-1">
          <Checkbox
            id="consent"
            onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
          />
          <DialogDescription className="text-black">I understand that this action will permanently deregister all current club members.</DialogDescription>
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
            {isPending ? "loading..." : "Deregister"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
