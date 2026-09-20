import { useEffect, useState } from "react";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFetchRegistrationConfiguration } from "@/queries/admin/registration-configuration";
import { useUpdateRegistrationConfigurationMutation } from "@/mutations/admin/registration-configuration";

interface RegistrationSettingsDialogProps {
  clubAccountId: string;
}

export function RegistrationSettingsDialog({
  clubAccountId,
}: RegistrationSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [sendQrCodeEmail, setSendQrCodeEmail] = useState(false);
  const [savedSendQrCodeEmail, setSavedSendQrCodeEmail] = useState(false);

  const { data: registrationConfiguration, isLoading } = useFetchRegistrationConfiguration(
    clubAccountId,
    open,
  );
  const { mutate, isPending } = useUpdateRegistrationConfigurationMutation();

  useEffect(() => {
    if (registrationConfiguration) {
      const value = Boolean(registrationConfiguration.configuration.send_qr_code_email_on_registration);
      setSendQrCodeEmail(value);
      setSavedSendQrCodeEmail(value);
    }
  }, [registrationConfiguration]);

  const hasChanges = sendQrCodeEmail !== savedSendQrCodeEmail;

  const handleSave = () => {
    mutate(
      {
        club_account_id: clubAccountId,
        send_qr_code_email_on_registration: sendQrCodeEmail,
      },
      {
        onSuccess: () => {
          setSavedSendQrCodeEmail(sendQrCodeEmail);
          toast.success("Registration settings updated");
          setOpen(false);
        },
        onError: (error: unknown) => {
          const message =
            (
              error as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            )?.response?.data?.message ||
            (error as { message?: string })?.message ||
            "Failed to update registration settings";
          toast.error(message);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Registration settings"
          title="Registration settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Registration settings</DialogTitle>
          <DialogDescription>
            Configure how new member registrations are handled for your club.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-1">
                <Label htmlFor="send-qr-code-email" className="text-sm font-medium">
                  Email a QR code on registration
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a member successfully registers, include their membership
                  verification QR code in the confirmation email.
                </p>
              </div>
              <Switch
                id="send-qr-code-email"
                checked={sendQrCodeEmail}
                onCheckedChange={setSendQrCodeEmail}
                disabled={isPending}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isPending || !hasChanges}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
