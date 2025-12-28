import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2Icon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useDeregisterMembersMutation } from "@/mutations/admin/useDeregisterMutation"
import { toast } from "sonner"

interface ReusableDeregisterDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  itemsList: { id: string; name: string }[]
  clubId: string
  userIds: string[]
  onSuccessClose?: () => void
  showOptionalMessage?: boolean
  optionalMessageLabel?: string
  optionalMessagePlaceholder?: string
  confirmationText: string
  submitButtonText?: string
  submitButtonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export default function ReusableDeregisterDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  itemsList,
  clubId,
  userIds,
  onSuccessClose,
  showOptionalMessage = true,
  optionalMessageLabel = "Optional message",
  optionalMessagePlaceholder = "Add a short note (optional)",
  confirmationText,
  submitButtonText = "Confirm",
  submitButtonVariant = "destructive",
}: ReusableDeregisterDialogProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [itemQuery, setItemQuery] = useState("")
  const [message, setMessage] = useState("")
  const [displaySuccess, setDisplaySuccess] = useState(false)

  const { mutate, isPending, isSuccess: mutationSuccess } = useDeregisterMembersMutation()

  useEffect(() => {
    setDisplaySuccess(mutationSuccess)
  }, [mutationSuccess])

  useEffect(() => {
    if (!isOpen) {
      // Reset all state when dialog closes
      setConfirmed(false)
      setItemQuery("")
      setMessage("")
      setDisplaySuccess(false)
    }
  }, [isOpen])

  const send = () => {
    mutate(
      {
        clubId: clubId,
        userIds: userIds,
        deregistration_reason: message.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Successfully unregistered members")
          setDisplaySuccess(true)
          setTimeout(() => {
            onOpenChange(false)
            onSuccessClose?.()
            window.location.reload()
          }, 500)
        },
        onError: () => toast.error("Something went wrong"),
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] md:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description} ({itemsList.length}):
          </DialogDescription>
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden mb-2">
            <div className="p-2">
              <Input
                placeholder="Search items"
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className="max-h-[80px] overflow-y-auto divide-y divide-gray-100 pr-2 scrollable-list">
              {itemsList
                .filter((item) =>
                  `${item.name}`.toLowerCase().includes(itemQuery.toLowerCase())
                )
                .map((item) => {
                  const initials = item.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shadow-sm">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          Selected
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </DialogHeader>

        {showOptionalMessage && (
          <div className="mt-3 space-y-1">
            <Label htmlFor="message-field" className="text-sm">
              {optionalMessageLabel}
            </Label>
            <Textarea
              id="message-field"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={optionalMessagePlaceholder}
              className="min-h-20"
            />
            <DialogDescription className="text-xs text-muted-foreground">
              If provided, this message will be included in the notification to the member why they were deregistered.
            </DialogDescription>
          </div>
        )}

        <div className="mt-4 space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-900">What happens next:</p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>This member will be placed in the members requiring reregistration table</li>
            <li>Reporting for the current season will still be supported for this registration</li>
            <li>The member will need to resubmit a new registration to rejoin the club</li>
            <li>When they resubmit, their original registration details will be pre-filled (if unchanged), and new fields will be empty</li>
          </ul>
        </div>

        <div className="flex items-center gap-1">
          <Checkbox
            id="consent"
            onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
          />
          <DialogDescription className="text-black">
            {confirmationText}
          </DialogDescription>
        </div>

        {displaySuccess && (
          <Alert>
            <CheckCircle2Icon color="green" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription>Action completed successfully.</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            variant={submitButtonVariant}
            disabled={!confirmed || isPending || displaySuccess}
            onClick={send}
          >
            {isPending ? "Loading..." : submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
