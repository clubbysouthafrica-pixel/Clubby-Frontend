import { useContext, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { useDeregisterAllMutation } from "@/mutations/admin/useDeregisterMutation"
import { toast } from "sonner"
import { AuthContext, AuthContextType } from "@/context/AuthContext"
import {useNavigate} from "react-router-dom";

interface ImageProps {
    clubId: string
    dereigsterMembers: { user_id: string, name: string }[]
    setlistActionItems: React.Dispatch<React.SetStateAction<string[]>>
    setDeregisterMembers: React.Dispatch<React.SetStateAction<{ user_id: string, name: string }[]>>
    setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>
}

export default function DeregisterSeasonDialog({ clubId }: ImageProps) {
    const { logout } = useContext(AuthContext) as AuthContextType;

    const navigate = useNavigate()

    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [confirmed, setConfirmed] = useState(false);

    const { mutate, isPending, isSuccess } = useDeregisterAllMutation()

    const send = () => {
        mutate({ clubId: clubId }, {
            onSuccess: () => {
                toast.success("Season restart is in progress...")
                logout()
                navigate("/admin/login")
            },
            onError: (error: any) => toast.error(error.response.message)
        })
    }

    const handleOpenChange = (open: boolean) => {
        setOpenDialog(open);
        if (!open) {
            setConfirmed(false);
        }
    };

    return (
        <Dialog open={openDialog} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant={"outline"} onClick={() => setOpenDialog(true)}>
                            <RotateCcw />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="mr-2">
                        <p>Start new season (resets club data).</p>
                    </TooltipContent>
                </Tooltip>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Start New Club Season</DialogTitle>
                    <DialogDescription>
                        <span>
                            Starting a new season will archive all current season data and deregister all existing club members.
                        </span>
                        <br />
                        <br />
                        <span>
                            This action is intended to prepare the club for a fresh season with new member registrations and updated data.
                        </span>
                        <br />
                        <br />
                        <span className="text-red-600">
                            ⚠️ This process is irreversible. Archived data will remain accessible in a read-only format, but current members will lose access and must register again for the new season.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-1">
                    <Checkbox
                        id="consent"
                        onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
                    />
                    <DialogDescription className="text-black">I understand that starting a new season will archive all existing season data and permanently remove all registered members.</DialogDescription>
                </div>
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
                        {isPending ? "loading..." : "Start new season"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
