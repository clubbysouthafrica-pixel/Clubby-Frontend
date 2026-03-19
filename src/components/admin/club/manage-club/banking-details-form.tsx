import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as UIDialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2, RefreshCw, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useResetPayFastDetailsMutation,
  useUpdatePayFastDetailsMutation,
} from "@/mutations/admin/payfast";
import {
  useUpdateClubDetailsMutation,
  useUpdateCustomPaymentMethodsMutation,
} from "@/mutations/admin/club";
import { useQueryClient } from "@tanstack/react-query";
import { ClubContext, ClubContextType } from "@/context/ClubContext";

interface BankDetails {
  bank?: string;
  account_number?: string;
  branch_code?: string;
  account_type?: string;
}

interface CustomPaymentIntegration {
  id: string;
  name: string;
  url: string;
}

interface PayFastDetails {
  merchant_id?: string;
  merchant_key?: string;
  passphrase?: string;
  auto_register_members_if_paid?: boolean;
}

interface BankingDetailsFormProps {
  club_account_id?: string;
  bankDetails?: BankDetails;
  payfastDetails?: PayFastDetails;
  payfastEnabled?: boolean;
  autoRegisterMembersIfPaid?: boolean;
  customPaymentMethods?: Array<{ name: string; url: string }>;
  onSave: (data: { bank_details: Required<BankDetails> }) => void;
  isPending?: boolean;
  onCompletionChange?: (isComplete: boolean) => void;
}

export function BankingDetailsForm({
  club_account_id,
  bankDetails,
  payfastDetails,
  payfastEnabled = false,
  customPaymentMethods = [],
  onSave,
  autoRegisterMembersIfPaid: initialAutoRegisterMembersIfPaid = false,
  isPending = false,
  onCompletionChange,
}: BankingDetailsFormProps) {
  const { club } = useContext(ClubContext) as ClubContextType;
  const clubAccountId = (club_account_id ?? club?.club_account_id) as string;
  const queryClient = useQueryClient();

  const { mutate: mutateUpdatePayFast, isPending: updatePayFastLoading } =
    useUpdatePayFastDetailsMutation();
  const { mutate: mutateResetPayFast, isPending: resetPayFastLoading } =
    useResetPayFastDetailsMutation();
  const {
    mutate: mutateUpdateClubDetails,
    isPending: updateClubDetailsLoading,
  } = useUpdateClubDetailsMutation();
  const {
    mutate: mutateUpdateCustomPayments,
    isPending: updateCustomPaymentsLoading,
  } = useUpdateCustomPaymentMethodsMutation();

  const [bank, setBank] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [accountType, setAccountType] = useState("");

  const [payfastMerchantId, setPayfastMerchantId] = useState("");
  const [payfastMerchantKey, setPayfastMerchantKey] = useState("");
  const [payfastPassphrase, setPayfastPassphrase] = useState("");
  const [autoRegisterMembersIfPaid, setAutoRegisterMembersIfPaid] =
    useState(false);
  const [savedAutoRegisterMembersIfPaid, setSavedAutoRegisterMembersIfPaid] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"eft" | "payfast" | "custom">(
    "eft",
  );
  const [customPaymentName, setCustomPaymentName] = useState("");
  const [customPaymentUrl, setCustomPaymentUrl] = useState("");
  const [customPayments, setCustomPayments] = useState<
    CustomPaymentIntegration[]
  >([]);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    if (bankDetails) {
      setBank(bankDetails.bank || "");
      setBankAccountNumber(bankDetails.account_number || "");
      setBranchCode(bankDetails.branch_code || "");
      setAccountType(bankDetails.account_type || "");
    }
    if (customPaymentMethods && customPaymentMethods.length > 0) {
      const loadedPayments: CustomPaymentIntegration[] =
        customPaymentMethods.map((method, index) => ({
          id: `existing-${index}`,
          name: method.name,
          url: method.url,
        }));
      setCustomPayments(loadedPayments);
    }
    // Reset completion state when loading bankDetails from server
    if (bankDetails) {
      const isComplete = !!(
        bankDetails.bank &&
        bankDetails.account_number &&
        bankDetails.branch_code &&
        bankDetails.account_type
      );
      onCompletionChange?.(isComplete);
    }
    if (payfastDetails) {
      setPayfastMerchantId(payfastDetails.merchant_id || "");
      setPayfastMerchantKey(payfastDetails.merchant_key || "");
      setPayfastPassphrase(payfastDetails.passphrase || "");
    }
    setAutoRegisterMembersIfPaid(initialAutoRegisterMembersIfPaid);
    setSavedAutoRegisterMembersIfPaid(initialAutoRegisterMembersIfPaid);
  }, [
    bankDetails,
    customPaymentMethods,
    onCompletionChange,
    payfastDetails,
    initialAutoRegisterMembersIfPaid,
  ]);

  useEffect(() => {
    // Check if all EFT fields are filled in
    const isComplete = !!(
      bank &&
      bankAccountNumber &&
      branchCode &&
      accountType
    );
    onCompletionChange?.(isComplete);
  }, [bank, bankAccountNumber, branchCode, accountType, onCompletionChange]);

  const getApiErrorMessage = (err: unknown): string => {
    type ErrorPayload =
      | { message?: string; error?: string }
      | string
      | undefined;
    const e = err as { response?: { data?: ErrorPayload }; message?: string };
    const data = e?.response?.data;
    let msg: string | undefined;
    if (typeof data === "string") {
      msg = data;
    } else if (data && typeof data === "object") {
      const obj = data as { message?: string; error?: string };
      msg = obj.message ?? obj.error;
    }
    return msg ?? e?.message ?? "An unexpected error occurred";
  };

  const payfastToggleValueChanged =
    autoRegisterMembersIfPaid !== savedAutoRegisterMembersIfPaid;

  const isSavePayFastDisabled =
    updatePayFastLoading ||
    updateClubDetailsLoading ||
    (payfastEnabled && !payfastToggleValueChanged);

  const handleSavePayFast = async () => {
    const payfastPayload = {
      club_account_id: clubAccountId,
      ...((!payfastEnabled || payfastMerchantId) && {
        merchant_id: payfastMerchantId,
      }),
      ...((!payfastEnabled || payfastMerchantKey) && {
        merchant_key: payfastMerchantKey,
      }),
      ...((!payfastEnabled || payfastPassphrase) && {
        passphrase: payfastPassphrase,
      }),
    };

    const saveAutoRegisterSetting = () => {
      if (!payfastToggleValueChanged) {
        return queryClient.invalidateQueries({
          queryKey: ["getClubDetails", clubAccountId],
        });
      }

      return new Promise<void>((resolve, reject) => {
        mutateUpdateClubDetails(
          {
            club_account_id: clubAccountId,
            auto_register_members_if_paid: autoRegisterMembersIfPaid,
          },
          {
            onSuccess: async () => {
              setSavedAutoRegisterMembersIfPaid(autoRegisterMembersIfPaid);
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          },
        );
      });
    };

    if (!payfastEnabled && !payfastMerchantId && !payfastMerchantKey) {
      toast.error("Please enter your PayFast merchant ID and merchant key.");
      return;
    }

    if (!payfastEnabled) {
      mutateUpdatePayFast(
        payfastPayload,
        {
          onSuccess: async () => {
            try {
              await saveAutoRegisterSetting();
              toast.success("PayFast settings saved.");
            } catch (error) {
              toast.error(getApiErrorMessage(error));
            }
          },
          onError: (error) => toast.error(getApiErrorMessage(error)),
        },
      );
      return;
    }

    if (!payfastToggleValueChanged) {
      toast.success("No PayFast setting changes to save.");
      return;
    }

    try {
      await saveAutoRegisterSetting();
      toast.success("PayFast settings saved.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleResetPayFast = async () => {
    mutateResetPayFast(
      {
        club_account_id: clubAccountId,
      },
      {
        onSuccess: async () => {
          toast.success("PayFast details reset.");
          await queryClient.invalidateQueries({
            queryKey: ["getClubDetails", clubAccountId],
          });
          setResetDialogOpen(false);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const handleAddCustomPayment = () => {
    if (!customPaymentName.trim() || !customPaymentUrl.trim()) {
      toast.error("Please fill in both payment name and URL");
      return;
    }

    try {
      new URL(customPaymentUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    const newPayment: CustomPaymentIntegration = {
      id: Date.now().toString(),
      name: customPaymentName,
      url: customPaymentUrl,
    };

    const updatedPayments = [...customPayments, newPayment];
    setCustomPayments(updatedPayments);
    setCustomPaymentName("");
    setCustomPaymentUrl("");

    // Save to backend
    mutateUpdateCustomPayments(
      {
        clubAccountId: clubAccountId,
        customPaymentMethods: updatedPayments.map((p) => ({
          name: p.name,
          url: p.url,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Custom payment method added and saved");
          queryClient.invalidateQueries({
            queryKey: ["getClubDetails", clubAccountId],
          });
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
          // Revert on error
          setCustomPayments(customPayments);
        },
      },
    );
  };

  const handleRemoveCustomPayment = (id: string) => {
    const updatedPayments = customPayments.filter((p) => p.id !== id);
    setCustomPayments(updatedPayments);

    // Save to backend
    mutateUpdateCustomPayments(
      {
        clubAccountId: clubAccountId,
        customPaymentMethods: updatedPayments.map((p) => ({
          name: p.name,
          url: p.url,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Custom payment method removed and saved");
          queryClient.invalidateQueries({
            queryKey: ["getClubDetails", clubAccountId],
          });
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
          // Revert on error
          setCustomPayments([
            ...updatedPayments,
            customPayments.find((p) => p.id === id)!,
          ]);
        },
      },
    );
  };

  const handleSave = () => {
    onSave({
      bank_details: {
        bank,
        account_number: bankAccountNumber,
        branch_code: branchCode,
        account_type: accountType,
      },
    });
  };

  return (
    <Card className="h-[630px] border-0 shadow-none pb-5">
      <CardHeader className="sticky top-0 p-6 bg-white flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Banking Details</CardTitle>
          <CardDescription>
            Configure your payment methods. Click save when you&apos;re done.
          </CardDescription>
        </div>
        {activeTab === "eft" && (
          <Button onClick={handleSave} disabled={isPending} variant="outline">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save banking details"
            )}
          </Button>
        )}
        {activeTab === "custom" && (
          <Button onClick={handleSave} disabled={isPending} variant="outline">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save custom integration"
            )}
          </Button>
        )}
        {activeTab === "payfast" && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSavePayFast}
              disabled={isSavePayFastDisabled}
            >
              {updatePayFastLoading || updateClubDetailsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save PayFast settings"
              )}
            </Button>
            {payfastEnabled && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetDialogOpen(true)}
                  disabled={resetPayFastLoading}
                >
                  <RefreshCw className="h-4 w-4" /> Remove PayFast
                </Button>
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset PayFast details?</DialogTitle>
                      <DialogDescription>
                        This will remove your saved PayFast credentials and
                        disconnect PayFast from your club. You can reconfigure at
                        any time.
                      </DialogDescription>
                    </DialogHeader>
                    <UIDialogFooter>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setResetDialogOpen(false)}
                        disabled={resetPayFastLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        type="button"
                        onClick={handleResetPayFast}
                        disabled={resetPayFastLoading}
                      >
                        {resetPayFastLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          "Confirm reset"
                        )}
                      </Button>
                    </UIDialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="grid gap-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "eft" | "payfast")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="eft">EFT</TabsTrigger>
            <TabsTrigger value="payfast">PayFast</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          {activeTab === "eft" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Electronic Funds Transfer (EFT) allows members to pay directly
              into your club's bank account. These details will be displayed to
              members for manual transfers.
            </p>
          )}
          {activeTab === "payfast" && (
            <p className="mt-2 text-sm text-muted-foreground">
              PayFast is a South African payment gateway that enables secure
              online payments (card, Instant EFT, more). Connect your merchant
              to accept online payments for your club.{" "}
              <a
                href="https://www.payfast.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                Create a merchant account
              </a>
              .
            </p>
          )}
          {activeTab === "custom" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Add a custom payment integration. Provide the name of your payment
              method and a URL where members can be directed to complete their
              payment.
            </p>
          )}
          <TabsContent value="eft" className="space-y-4 mt-4">
            <div className="grid gap-3">
              <Label htmlFor="bank">
                Bank
                {!bank && (
                  <span className="text-red-500 font-bold text-lg ml-2">*</span>
                )}
              </Label>
              <Input
                id="bank"
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="Set bank"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="account-number">
                Account Number
                {!bankAccountNumber && (
                  <span className="text-red-500 font-bold text-lg ml-2">*</span>
                )}
              </Label>
              <Input
                id="account-number"
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="Set bank account number"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="branch-code">
                Branch Code
                {!branchCode && (
                  <span className="text-red-500 font-bold text-lg ml-2">*</span>
                )}
              </Label>
              <Input
                id="branch-code"
                type="text"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                placeholder="Set bank branch code"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="account-type">
                Account Type
                {!accountType && (
                  <span className="text-red-500 font-bold text-lg ml-2">*</span>
                )}
              </Label>
              <Input
                id="account-type"
                type="text"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                placeholder="Set bank account type"
              />
            </div>
          </TabsContent>
          <TabsContent value="payfast" className="space-y-4 mt-4">
            <div className="space-y-4">
              {payfastEnabled && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>PayFast setup complete</AlertTitle>
                  <AlertDescription>
                    Your PayFast merchant is connected. You can update the
                    automatic registration setting below or reset to reconfigure
                    at any time.
                  </AlertDescription>
                </Alert>
              )}

              {!payfastEnabled && (
                <>
                <div className="grid gap-3">
                  <Label htmlFor="merchant-id">Merchant ID</Label>
                  <Input
                    id="merchant-id"
                    type="text"
                    value={payfastMerchantId}
                    onChange={(e) => setPayfastMerchantId(e.target.value)}
                    placeholder="Enter PayFast merchant ID"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="merchant-key">Merchant Key</Label>
                  <Input
                    id="merchant-key"
                    type="text"
                    value={payfastMerchantKey}
                    onChange={(e) => setPayfastMerchantKey(e.target.value)}
                    placeholder="Enter PayFast merchant key"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="passphrase">Passphrase (Optional)</Label>
                  <Input
                    id="passphrase"
                    type="text"
                    value={payfastPassphrase}
                    onChange={(e) => setPayfastPassphrase(e.target.value)}
                    placeholder="Enter PayFast passphrase"
                  />
                </div>
                </>
              )}

              {payfastEnabled && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="payfast-auto-register-members"
                        className="text-sm font-medium"
                      >
                        Automatically register members after successful PayFast payment
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        If enabled, members who pay successfully through PayFast will be registered automatically.
                        If this setting does not exist yet for this club, it defaults to off.
                      </p>
                    </div>
                    <Switch
                      id="payfast-auto-register-members"
                      checked={autoRegisterMembersIfPaid}
                      onCheckedChange={setAutoRegisterMembersIfPaid}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="custom" className="space-y-4 mt-4">
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <AlertTitle className="text-blue-900 dark:text-blue-100">
                How Custom Payments Work
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                When you add a custom payment method, a button will appear on
                the registration page for members. Clicking the button will
                redirect them to your specified URL where they can complete
                payment.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
              <div>
                <Label htmlFor="custom-payment-name">Payment Method Name</Label>
                <Input
                  id="custom-payment-name"
                  type="text"
                  value={customPaymentName}
                  onChange={(e) => setCustomPaymentName(e.target.value)}
                  placeholder="e.g., Stripe, Square, Custom Gateway"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The name displayed on the button to members
                </p>
              </div>
              <div>
                <Label htmlFor="custom-payment-url">Payment URL</Label>
                <Input
                  id="custom-payment-url"
                  type="url"
                  value={customPaymentUrl}
                  onChange={(e) => setCustomPaymentUrl(e.target.value)}
                  placeholder="https://example.com/pay"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The URL where members will be redirected to pay
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAddCustomPayment}
                disabled={updateCustomPaymentsLoading}
                className="w-full"
              >
                {updateCustomPaymentsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </>
                )}
              </Button>
            </div>

            {customPayments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Custom Payment Methods ({customPayments.length})
                </Label>
                <div className="space-y-2">
                  {customPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-start justify-between p-3 border rounded-lg bg-white dark:bg-slate-900 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{payment.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {payment.url}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomPayment(payment.id)}
                        disabled={updateCustomPaymentsLoading}
                        className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        {updateCustomPaymentsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
