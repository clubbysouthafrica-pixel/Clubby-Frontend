import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2Icon, MessagesSquare } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useEmailerProcessMutation } from "@/mutations/admin/useEmailerMutation"
import { toast } from "sonner"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"

interface ReusableSendEmailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  contactsList: { email: string; name: string }[]
  clubId: string
  onSuccessClose?: () => void
}

export default function ReusableSendEmailDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  contactsList,
  clubId,
  onSuccessClose,
}: ReusableSendEmailDialogProps) {
  const [contactQuery, setContactQuery] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [displaySuccess, setDisplaySuccess] = useState(false)

  const { mutate, isPending, isSuccess: mutationSuccess } = useEmailerProcessMutation()

  useEffect(() => {
    setDisplaySuccess(mutationSuccess)
  }, [mutationSuccess])

  useEffect(() => {
    if (!isOpen) {
      // Reset all state when dialog closes
      setContactQuery("")
      setSubject("")
      setBody("")
      setDisplaySuccess(false)
    }
  }, [isOpen])

  const send = () => {
    const plain = body.replace(/<[^>]*>/g, "").trim()
    if (!subject || !plain || !contactsList.length) {
      toast.error(
        "Please provide a subject, message content and at least one contact."
      )
      return
    }

    mutate({
      subject,
      email_body: body,
      emails: contactsList.map((item) => item.email),
      club_account_id: clubId,
    },
    {
      onSuccess: () => {
        toast.success("Email broadcast queued successfully")
        setDisplaySuccess(true)
        setTimeout(() => {
          onOpenChange(false)
          onSuccessClose?.()
        }, 500)
      },
      onError: () => toast.error("Something went wrong"),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto rounded-[24px] p-3 sm:max-w-[640px] sm:p-6 md:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description} ({contactsList.length}):
          </DialogDescription>
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="p-2">
              <Input
                placeholder="Search for contact"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
                className="mb-1.5 h-8 text-xs sm:mb-2"
              />
            </div>
            <div className="max-h-[112px] overflow-y-auto divide-y divide-gray-100 pr-1 sm:max-h-[120px] sm:pr-2 scrollable-list">
              {contactsList
                .filter((contact) =>
                  `${contact.name} ${contact.email}`.toLowerCase().includes(contactQuery.toLowerCase())
                )
                .map((contact) => {
                  const initials = contact.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                  return (
                    <div
                      key={contact.email}
                      className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 sm:gap-3 sm:px-3"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-white shadow-sm sm:h-8 sm:w-8 sm:text-sm">
                        {initials}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-xs sm:text-sm">{contact.name}</span>
                        <span className="truncate text-[11px] text-muted-foreground sm:text-xs">
                          {contact.email}
                        </span>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 sm:px-2 sm:text-xs">
                          Selected
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </DialogHeader>

        <div className="w-full space-y-3 sm:space-y-4">
          <div className="grid gap-2 sm:gap-3">
            <Label htmlFor="subject" className="text-xs sm:text-sm">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-8 text-xs sm:text-sm"
            />
          </div>
          <div className="grid gap-2 sm:gap-3 border:none">
            <ReactQuill
              className="mobile-email-editor border"
              theme="snow"
              value={body}
              onChange={(val: string) => setBody(val)}
              placeholder="Enter content"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "clean"],
                ],
              }}
            />
          </div>
          <style jsx global>{`
            .ql-container {
              border: none;
              position: relative !important;
              z-index: 0 !important;
              width: 100% !important;
            }
            .ql-toolbar {
              position: relative !important;
              z-index: 1;
              border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            }
            .ql-editor {
              position: relative !important;
              z-index: 1;
              height: 300px;
              max-height: 300px;
              overflow-y: auto;
            }
            @media (max-width: 639px) {
              .mobile-email-editor .ql-toolbar {
                padding: 6px;
              }
              .mobile-email-editor .ql-editor {
                height: 180px;
                max-height: 180px;
                font-size: 12px;
              }
            }
            .scrollable-list::-webkit-scrollbar { width: 8px; }
            .scrollable-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 9999px; }
            .scrollable-list { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.08) transparent; }
          `}</style>
        </div>

        {displaySuccess && (
          <Alert>
            <CheckCircle2Icon color="green" />
            <AlertTitle className="text-green-800">
              Successfully sent!
            </AlertTitle>
            <AlertDescription>
              <span>
                Your email broadcast is being queued. Messages will be sent
                shortly.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="relative z-20 gap-2 bg-background sm:gap-0">
          <Button
            className="relative z-30 h-8 w-full text-xs sm:h-10 sm:text-sm"
            type="button"
            disabled={
              isPending ||
              displaySuccess ||
              !subject ||
              body === "<p><br></p>" ||
              !contactsList.length
            }
            onClick={(e) => {
              e.stopPropagation()
              send()
            }}
          >
            {isPending ? "Sending..." : "Send"}
            <MessagesSquare className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
