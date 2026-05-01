import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Check,
  X,
  Folder,
  User,
  CreditCard,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubStorageRequests } from "@/queries/admin-features/storage";
import { updateStorageRequestUnit } from "@/services/admin-features/storage";
import { formatAmount } from "@/data/currencies";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const statusColors: any = {
  pending: "text-yellow-600",
  approved: "text-green-600",
  rejected: "text-red-600",
};

export default function StorageRequestsAdmin() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const { data, error } = useFetchClubStorageRequests(
    (club?.club_account_id as string) ?? undefined,
  );

  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "eft" | "card" | "other"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [copiedTransactionId, setCopiedTransactionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (data) setRequests(data?.items || []);
    setIsLoading(false);
  }, [data]);

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return requests.filter((req: any) => {
      if (q) {
        const matchesSearch =
          (req.userId && req.userId.toLowerCase().includes(q)) ||
          (req.storage_id && req.storage_id.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      if (statusFilter !== "all" && req.status !== statusFilter) return false;
      if (paymentFilter !== "all") {
        const pm = req.paymentMethod
          ? req.paymentMethod.toLowerCase()
          : "other";
        if (paymentFilter === "other") {
          if (pm === "eft" || pm === "card") return false;
        } else if (pm !== paymentFilter) return false;
      }
      return true;
    });
  }, [requests, searchTerm, statusFilter, paymentFilter]);

  const pendingPaymentRequests = useMemo(
    () => requests.filter((r) => !r.paid),
    [requests],
  );

  const handleMarkPaid = async (storageRequest: any, action: string) => {
    try {
      await updateStorageRequestUnit({
        club_account_id: club?.club_account_id as string,
        storage_request_id: storageRequest.storage_request_id,
        storage_id: storageRequest.storage_id,
        paid: true,
        payment_method: "EFT",
        status: action,
      });
      setRequests((prev: any[]) =>
        prev.map((req: any) =>
          req.storage_request_id === storageRequest.storage_request_id
            ? { ...req, paid: true, status: action }
            : req,
        ),
      );
      toast.success("Marked as paid successfully.");
    } catch (err) {
      toast.error("Failed to mark as paid. Please try again.");
      console.error(err);
    }
  };

  const handleRequestAction = async (storageRequest: any, action: string) => {
    try {
      await updateStorageRequestUnit({
        club_account_id: club?.club_account_id as string,
        storage_request_id: storageRequest.storage_request_id,
        storage_id: storageRequest.storage_id,
        paid: true,
        payment_method: "n/a",
        status: action,
      });
      setRequests((prev: any[]) =>
        prev.map((req: any) =>
          req.storage_request_id === storageRequest.storage_request_id
            ? { ...req, status: action, paid: false }
            : req,
        ),
      );
      toast.success("Request updated successfully.");
    } catch (err) {
      toast.error("Failed to update request. Please try again.");
      console.error(err);
    }
  };

  const handleClosePaymentDialog = () => setPaymentDialogOpen(false);

  return (
    <div className="space-y-6 p-5">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Storage Requests
          </h1>
          <p className="text-muted-foreground">
            Manage storage requests from users.
          </p>
        </div>

        <Card className="mb-6 rounded-[20px] border-slate-200/70 bg-slate-50/80 p-3 shadow-none">
          <div className="flex flex-wrap gap-3">
            <Input
              className="h-8 w-full bg-white text-xs sm:w-[320px]"
              placeholder="Search user or storage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-full justify-between rounded-full bg-white px-3 text-xs font-normal text-slate-700 hover:bg-slate-50 sm:w-[220px]"
                >
                  {statusFilter === "all"
                    ? "All statuses"
                    : statusFilter.charAt(0).toUpperCase() +
                      statusFilter.slice(1)}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { value: "all", label: "All" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ].map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={opt.value}
                    checked={statusFilter === opt.value}
                    onCheckedChange={() => setStatusFilter(opt.value as any)}
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => setStatusFilter("all")}
                >
                  Clear selection
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-full justify-between rounded-full bg-white px-3 text-xs font-normal text-slate-700 hover:bg-slate-50 sm:w-[220px]"
                >
                  {paymentFilter === "all"
                    ? "All payment types"
                    : paymentFilter.toUpperCase()}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Payment</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { value: "all", label: "All" },
                  { value: "eft", label: "EFT" },
                  { value: "card", label: "Card" },
                  { value: "other", label: "Other" },
                ].map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={opt.value}
                    checked={paymentFilter === opt.value}
                    onCheckedChange={() => setPaymentFilter(opt.value as any)}
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => setPaymentFilter("all")}
                >
                  Clear selection
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500">
              Apply filters to refine the storage requests view.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-slate-600">
                  Results:
                </label>
                <Badge className="rounded-full">
                  {filteredRequests.length}
                </Badge>
              </div>

              <Button
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    if (data) setRequests(data.items || []);
                    setIsLoading(false);
                  }, 300);
                }}
                className="h-8 rounded-full bg-zinc-700 px-4 text-xs text-white hover:bg-zinc-800"
              >
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        <div className="mb-4 flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setPaymentDialogOpen(true)}
              className="relative mr-2 rounded-full border border-slate-200 bg-slate-50 p-2.5 transition-colors hover:bg-slate-100 cursor-pointer"
              title="Pending payments"
            >
              <CreditCard className="h-4 w-4 text-slate-700" />
              {pendingPaymentRequests.length > 0 && (
                <span className="absolute right-0 top-0 inline-flex -translate-y-1/3 translate-x-1/3 items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {pendingPaymentRequests.length}
                </span>
              )}
            </button>
          </div>

          <h2 className="text-sm font-medium text-slate-500">
            Showing <span className="font-bold">{filteredRequests.length}</span>{" "}
            items
          </h2>
        </div>

        <Card className="rounded-[20px] border-slate-200/70 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:p-5">
          <CardContent className="p-0">
            <div className="overflow-x-auto rounded-[20px] border border-slate-200 max-w-full">
              <Table className="w-full table-auto">
                <TableHeader className="sticky top-0 z-10 bg-zinc-700 [&_tr]:border-zinc-600">
                  <TableRow>
                    <TableHead className="h-11 w-[40px] text-center text-slate-200"></TableHead>
                    <TableHead className="h-11 w-[160px] text-center text-xs text-slate-200">
                      User
                    </TableHead>
                    <TableHead className="h-11 w-[160px] text-center text-xs text-slate-200">
                      Storage Unit
                    </TableHead>
                    <TableHead className="h-11 w-[120px] text-center text-xs text-slate-200">
                      Date
                    </TableHead>
                    <TableHead className="h-11 w-[100px] text-center text-xs text-slate-200">
                      Cost
                    </TableHead>
                    <TableHead className="h-11 w-[100px] text-center text-xs text-slate-200">
                      Payment
                    </TableHead>
                    <TableHead className="h-11 w-[120px] text-center text-xs text-slate-200">
                      Status
                    </TableHead>
                    <TableHead className="h-11 w-[120px] text-center text-xs text-slate-200">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-sm text-slate-500"
                      >
                        Loading storage requests...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-sm text-red-600"
                      >
                        {(error as any)?.message ||
                          "Failed to load storage requests."}
                      </TableCell>
                    </TableRow>
                  ) : filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-sm text-slate-500"
                      >
                        No storage requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((req: any) => (
                      <Fragment key={req.storage_request_id}>
                        <TableRow className="h-12 border-slate-200 bg-white text-sm hover:bg-slate-50">
                          <TableCell className="text-center">
                            {/* placeholder for expand */}
                          </TableCell>
                          <TableCell className="text-center font-medium text-sm">
                            <div className="flex items-center gap-2 justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="max-w-[280px] break-words">
                                {req.userId}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-700">
                            <div className="flex items-center gap-2 justify-center">
                              <Folder className="h-4 w-4 text-primary" />
                              <span className="max-w-[280px] break-words">
                                {req.storage_id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-600">
                            {req.date || req.createdAt || "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-primary">
                              {typeof req.costCents === "number"
                                ? formatAmount(
                                    req.costCents / 100,
                                    club?.currency,
                                  )
                                : "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <p
                                className={`font-bold ${req.paid ? "text-green-700" : "text-red-700"}`}
                              >
                                {req.paid ? "Paid" : "Unpaid"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {req.paymentMethod === "eft"
                                  ? "EFT"
                                  : req.paymentMethod === "card"
                                    ? "Card"
                                    : req.paymentMethod || "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <span
                                className={`font-semibold text-xs ${statusColors[req.status] || ""}`}
                              >
                                {(req.status || "Unknown")
                                  .charAt(0)
                                  .toUpperCase() + (req.status || "").slice(1)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {!req.paid ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 rounded-full"
                                    onClick={() =>
                                      handleMarkPaid(req, "approved")
                                    }
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Mark Paid
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 rounded-full"
                                    onClick={() =>
                                      handleRequestAction(req, "rejected")
                                    }
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={paymentDialogOpen}
          onOpenChange={handleClosePaymentDialog}
        >
          <DialogContent className="sm:max-w-[640px] md:max-w-[768px]">
            <DialogHeader>
              <DialogTitle>Pending Payments</DialogTitle>
              <DialogDescription>
                Quick access to unpaid storage requests
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {pendingPaymentRequests.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  No pending payments.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingPaymentRequests.map((r: any) => (
                    <div
                      key={r.storage_request_id}
                      className="rounded-lg border p-3 bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{r.userId}</p>
                          <p className="text-xs text-slate-500">
                            Storage: {r.storage_id}
                          </p>
                          <p className="text-xs text-amber-700">
                            {r.costCents
                              ? formatAmount(r.costCents / 100, club?.currency)
                              : "—"}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full"
                            onClick={() => handleMarkPaid(r, "approved")}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-full"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                r.storage_request_id,
                              );
                              setCopiedTransactionId(r.storage_request_id);
                              setTimeout(
                                () => setCopiedTransactionId(null),
                                2000,
                              );
                            }}
                            title="Copy request ID"
                          >
                            {copiedTransactionId === r.storage_request_id ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClosePaymentDialog}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
