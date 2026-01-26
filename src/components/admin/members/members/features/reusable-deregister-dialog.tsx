import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, ChevronDownIcon, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useDeregisterMembersMutation } from "@/mutations/admin/useDeregisterMutation";
import { toast } from "sonner";
import { formatAmount } from "@/data/currencies";

interface ReusableDeregisterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemsList: {
    id: string;
    name: string;
    total_fee?: number;
    total_outstanding_amount?: number;
  }[];
  clubId: string;
  userIds: string[];
  onSuccessClose?: () => void;
  showOptionalMessage?: boolean;
  optionalMessageLabel?: string;
  optionalMessagePlaceholder?: string;
  confirmationText: string;
  submitButtonText?: string;
  submitButtonVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  currency?: string;
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
  currency = "ZAR",
}: ReusableDeregisterDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [itemQuery, setItemQuery] = useState("");
  const [message, setMessage] = useState("");
  const [displaySuccess, setDisplaySuccess] = useState(false);
  const [selectedRefunds, setSelectedRefunds] = useState<Set<string>>(
    new Set(),
  );
  const [isRefundExpanded, setIsRefundExpanded] = useState(false);
  const [isOptionalMessageExpanded, setIsOptionalMessageExpanded] =
    useState(false);

  const {
    mutate,
    isPending,
    isSuccess: mutationSuccess,
  } = useDeregisterMembersMutation();

  const getRefundAmount = (item: (typeof itemsList)[0]): number | null => {
    if (
      item.total_fee !== undefined &&
      item.total_outstanding_amount !== undefined
    ) {
      return item.total_fee - item.total_outstanding_amount;
    }
    return null;
  };

  const toggleRefund = (memberId: string) => {
    const newRefunds = new Set(selectedRefunds);
    if (newRefunds.has(memberId)) {
      newRefunds.delete(memberId);
    } else {
      newRefunds.add(memberId);
    }
    setSelectedRefunds(newRefunds);
  };

  const refundableMembers = itemsList.filter((item) => {
    const refundAmount = getRefundAmount(item);
    return refundAmount && refundAmount > 0;
  });

  useEffect(() => {
    setDisplaySuccess(mutationSuccess);
  }, [mutationSuccess]);

  useEffect(() => {
    if (!isOpen) {
      setConfirmed(false);
      setItemQuery("");
      setMessage("");
      setDisplaySuccess(false);
      setSelectedRefunds(new Set());
    }
  }, [isOpen]);

  const send = () => {
    mutate(
      {
        clubId: clubId,
        userIds: userIds,
        deregistration_reason: message.trim() || undefined,
        refunds: Array.from(selectedRefunds),
      },
      {
        onSuccess: () => {
          toast.success("Successfully unregistered members");
          setDisplaySuccess(true);
          setTimeout(() => {
            onOpenChange(false);
            onSuccessClose?.();
            window.location.reload();
          }, 500);
        },
        onError: () => toast.error("Something went wrong"),
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] md:max-w-[900px] flex flex-col max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description} ({itemsList.length}):
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {/* Members List Section */}
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <div className="p-2">
              <Input
                placeholder="Search items"
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className="max-h-[150px] overflow-y-auto divide-y divide-gray-100">
              {itemsList
                .filter((item) =>
                  `${item.name}`
                    .toLowerCase()
                    .includes(itemQuery.toLowerCase()),
                )
                .map((item) => {
                  const initials = item.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shadow-sm">
                        {initials}
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          Selected
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {refundableMembers.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsRefundExpanded(!isRefundExpanded)}
                className="flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronDownIcon
                  size={18}
                  className={`transition-transform ${isRefundExpanded ? "rotate-0" : "-rotate-90"}`}
                />
                <Label className="text-sm font-semibold text-gray-900 cursor-pointer mb-0">
                  Refund Members:
                </Label>
              </button>
              {isRefundExpanded && (
                <>
                  {selectedRefunds.size > 0 && (
                    <div className="flex flex-wrap gap-2 px-2 py-2">
                      {refundableMembers
                        .filter((item) => selectedRefunds.has(item.id))
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold"
                          >
                            <span>{item.name}</span>
                            <button
                              type="button"
                              onClick={() => toggleRefund(item.id)}
                              className="hover:text-blue-900 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="rounded-lg border-2 overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-200">
                      {refundableMembers.map((item) => {
                        const refundAmount = getRefundAmount(item);
                        const initials = item.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                              selectedRefunds.has(item.id) ? "bg-gray-50" : ""
                            }`}
                          >
                            <Checkbox
                              id={`refund-${item.id}`}
                              checked={selectedRefunds.has(item.id)}
                              onCheckedChange={() => toggleRefund(item.id)}
                            />
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-medium text-sm">
                                {item.name}
                              </span>
                              <span className="text-xs text-gray-600 font-medium">
                                Refund Amount:{" "}
                                {formatAmount(
                                  Number(refundAmount?.toFixed(2)),
                                  currency,
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Performing a refund doesn't actually refund the member. The
                    club data will just not reflect this registration's income
                    anymore and a refund request will be created.
                  </DialogDescription>
                </>
              )}
            </div>
          )}

          {showOptionalMessage && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() =>
                  setIsOptionalMessageExpanded(!isOptionalMessageExpanded)
                }
                className="flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronDownIcon
                  size={18}
                  className={`transition-transform ${isOptionalMessageExpanded ? "rotate-0" : "-rotate-90"}`}
                />
                <Label className="text-sm font-semibold text-gray-900 cursor-pointer mb-0">
                  {optionalMessageLabel}
                </Label>
              </button>
              {isOptionalMessageExpanded && (
                <>
                  <Textarea
                    id="message-field"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={optionalMessagePlaceholder}
                    className="min-h-20"
                  />
                  <DialogDescription className="text-xs text-muted-foreground">
                    If provided, this message will be included in the
                    notification to the member why they were deregistered.
                  </DialogDescription>
                </>
              )}
            </div>
          )}

          <div className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900">
              What happens next:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>
                This member will be placed in the members requiring
                reregistration table
              </li>
              <li>
                Reporting for the current season will still be supported for
                this registration
              </li>
              <li>
                The member will need to resubmit a new registration to rejoin
                the club
              </li>
              <li>
                When they resubmit, their original registration details will be
                pre-filled (if unchanged), and new fields will be empty
              </li>
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
              <AlertDescription>
                Action completed successfully.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
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
  );
}
