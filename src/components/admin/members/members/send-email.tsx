import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle2Icon, SendIcon } from "lucide-react"
import { Textarea } from "../../../ui/textarea"
import { useEmailerProcessMutation } from "@/mutations/admin/useEmailerMutation"
import { Input } from "../../../ui/input"
import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip"
import { MessagesSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "../../../ui/table"

interface ImageProps {
  clubId: string
  contacts: { email: string, name: string }[]
  setlistActionItems: React.Dispatch<React.SetStateAction<{ email: string, name: string }[]>>
  setDeregisterMembers: React.Dispatch<React.SetStateAction<{ user_id: string, name: string }[]>>
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>
}

export default function SendEmailDialog({ contacts, clubId, setlistActionItems, setDeregisterMembers, setAllMembersSelected }: ImageProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [body, setBody] = useState("")
  const [subject, setSubject] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const { mutate, isPending, isSuccess: mutationSuccess } = useEmailerProcessMutation();
  
  useEffect(() => {
    setIsSuccess(mutationSuccess);
  }, [mutationSuccess]);

  const send = () => {
    if (!subject || !body || !contacts.length) return;

    mutate({
      subject,
      email_body: body,
      emails: contacts.map(item => item.email),
      club_account_id: clubId,
    })
  }

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open && isSuccess) {
      setSubject("");
      setBody("");
      setIsSuccess(false)
      setlistActionItems([])
      setDeregisterMembers([])
      setAllMembersSelected(false)
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant={"outline"} disabled={!contacts.length}>
              <SendIcon />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Send email to selected contacts</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>Mailing list ({contacts.length}):</DialogDescription>
          <div className="overflow-hidden rounded-lg border-b border-t">
            <div className="max-h-[100px] overflow-y-auto border-bottom px-2">
              <Table>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.email}>
                      <TableCell className="py-2">{contact.name} ({contact.email})</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="image">Subject</Label>
            <Input placeholder="Enter email subject" onChange={(v) => setSubject(v.target.value)} value={subject} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="image">Content</Label>
            <Textarea placeholder="Enter email content" onChange={(v) => setBody(v.target.value)} value={body} />
          </div>
        </div>
        {
          isSuccess &&
          <Alert>
            <CheckCircle2Icon color="green" />
            <AlertTitle className="text-green-800">Successfully sent!</AlertTitle>
            <AlertDescription>
              <span>
                Your email broadcast is being queued. Messages will be sent shortly. You can view any failed emails{" "}
                <span className="underline cursor-pointer">here</span>.
              </span>
            </AlertDescription>
          </Alert>
        }
        <DialogFooter>
          <Button className="w-full" type="submit" disabled={isPending || isSuccess} onClick={send}>{isPending ? "Sending..." : "Send"}
            <MessagesSquare className="w-4 h-4 mr-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
