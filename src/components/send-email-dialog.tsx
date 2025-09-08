import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle2Icon, SendIcon } from "lucide-react"
import { Textarea } from "./ui/textarea"
import { useEmailerProcessMutation } from "@/mutations/admin/useEmailerMutation"
import { Input } from "./ui/input"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

interface ImageProps {
    clubId: string
    contacts: string[]
}

export default function SendEmailDialog({ contacts, clubId }: ImageProps) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [body, setBody] = useState("")
  const [subject, setSubject] = useState("")

  const { mutate, isPending, isSuccess } = useEmailerProcessMutation()

  const send = () => {
    if (!subject || !body || !contacts.length) return;

    mutate({
        subject,
        email_body: body,
        emails: contacts,
        club_account_id: clubId,
    })
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
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
          <DialogDescription>Selected Contacts ({contacts.length})</DialogDescription>
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
                    Your email has successfully been sent to all contacts.
                </AlertDescription>
            </Alert>
        }
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isPending || isSuccess} onClick={send}>{ isPending ? "Sending..." : "Send"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
