import { useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Folder,
  User,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubStorageRequests } from "@/queries/admin-features/storage";
import { updateStorageRequestUnit } from "@/services/admin-features/storage";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

type StorageRequestStatus = "pending" | "approved" | "rejected";
type PaymentStatusFilter = "all" | "paid" | "unpaid";
type PaymentMethodFilter = "all" | "eft" | "card" | "other";

type StorageRequest = {
  storage_request_id: string;
  storage_id: string;
  userId?: string;
  date?: string;
  createdAt?: string;
  costCents?: number;
  paid?: boolean;
  paymentMethod?: string;
  payment_method?: string;
  status: StorageRequestStatus;
};

type StorageRequestsResponse = {
  items?: StorageRequest[];
};

const statusColors: Record<StorageRequestStatus, string> = {
  pending: "text-yellow-600",
  approved: "text-green-600",
  rejected: "text-red-600",
};

export default function StorageRequestsAdmin() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const clubAccountId = (club?.club_account_id as string) ?? undefined;
  const { data } = useFetchClubStorageRequests(
    clubAccountId,
  );

  const [requests, setRequests] = useState<StorageRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>(() => {
      const paymentStatus = searchParams.get("paymentStatus")?.toLowerCase();

      if (paymentStatus === "paid" || paymentStatus === "unpaid") {
        return paymentStatus;
      }

      return "all";
    });
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethodFilter>("all");

  useEffect(() => {
    const paymentStatus = searchParams.get("paymentStatus")?.toLowerCase();

    if (paymentStatus === "paid" || paymentStatus === "unpaid") {
      setPaymentStatusFilter(paymentStatus);
      return;
    }

    setPaymentStatusFilter("all");
  }, [searchParams]);

  useEffect(() => {
    if (data) {
      setRequests((data as StorageRequestsResponse).items || []);
    }
  }, [data]);

  const syncRequestUpdate = (
    storageRequestId: string,
    update: Partial<StorageRequest>,
  ) => {
    const applyUpdate = (requestItems: StorageRequest[]) =>
      requestItems.map((request) =>
        request.storage_request_id === storageRequestId
          ? { ...request, ...update }
          : request,
      );

    setRequests((prev) => applyUpdate(prev));

    queryClient.setQueryData(
      ["club/storage/requests", clubAccountId],
      (previous: StorageRequestsResponse | undefined) => {
        if (!previous?.items) {
          return previous;
        }

        return {
          ...previous,
          items: applyUpdate(previous.items),
        };
      },
    );
  };

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return requests.filter((req) => {
      if (q) {
        const matchesSearch =
          (req.userId && req.userId.toLowerCase().includes(q)) ||
          (req.storage_id && req.storage_id.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      if (statusFilter !== "all" && req.status !== statusFilter) return false;

      if (paymentStatusFilter === "paid" && !req.paid) return false;
      if (paymentStatusFilter === "unpaid" && req.paid) return false;

      if (paymentFilter !== "all") {
        const paymentMethod = req.paymentMethod ?? req.payment_method;
        const pm = paymentMethod
          ? paymentMethod.toLowerCase()
          : "other";

        if (paymentFilter === "other") {
          if (pm === "eft" || pm === "card") return false;
        } else if (pm !== paymentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [requests, searchTerm, statusFilter, paymentStatusFilter, paymentFilter]);

  const handleMarkPaid = async (
    storageRequest: StorageRequest,
    action: StorageRequestStatus,
  ) => {
    const paymentType = "EFT";

    try {
      await updateStorageRequestUnit({
        club_account_id: clubAccountId as string,
        storage_request_id: storageRequest.storage_request_id,
        storage_id: storageRequest.storage_id,
        paid: true,
        payment_method: paymentType,
        status: action,
      });

      syncRequestUpdate(storageRequest.storage_request_id, {
        paid: true,
        status: action,
        paymentMethod: paymentType,
        payment_method: paymentType,
      });

      toast.success("Marked as paid successfully.");
    } catch {
      toast.error("Failed to mark as paid. Please try again.");
    }
  };

  const handleRequestAction = async (
    storageRequest: StorageRequest,
    action: StorageRequestStatus,
  ) => {
    try {
      await updateStorageRequestUnit({
        club_account_id: clubAccountId as string,
        storage_request_id: storageRequest.storage_request_id,
        storage_id: storageRequest.storage_id,
        paid: false,
        payment_method: "n/a",
        status: action,
      });

      syncRequestUpdate(storageRequest.storage_request_id, {
        paid: false,
        status: action,
        paymentMethod: "n/a",
        payment_method: "n/a",
      });

      toast.success("Rejected successfully.");
    } catch {
      toast.error("Failed to reject. Please try again.");
    }
  };

  return (
    <div className="bg-gray-50 h-full">
      <div className="flex bg-white items-center justify-between border-b">
        <div className="max-w-7xl mx-auto w-full p-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Storage Requests
          </h1>
          <p className="text-muted-foreground">
            Manage storage requests from users.
          </p>
        </div>
      </div>
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="rounded-xl border bg-white overflow-x-auto">
          <div className="px-4 py-3 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Input
                placeholder="Search user or storage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-[220px]"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StorageRequestStatus | "all")
                }
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={paymentStatusFilter}
                onChange={(e) =>
                  setPaymentStatusFilter(e.target.value as PaymentStatusFilter)
                }
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All payment statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(e) =>
                  setPaymentFilter(e.target.value as PaymentMethodFilter)
                }
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All payment types</option>
                <option value="eft">EFT</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div>
                {filteredRequests.length} result
                {filteredRequests.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="min-w-[160px]">User</TableHead>
                <TableHead className="min-w-[160px]">Storage Unit</TableHead>
                <TableHead className="min-w-[120px]">Date</TableHead>
                <TableHead className="min-w-[100px]">Cost</TableHead>
                <TableHead className="min-w-[100px]">Payment</TableHead>
                <TableHead className="min-w-[120px]">Status</TableHead>
                <TableHead className="min-w-[200px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No storage requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.storage_request_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{req.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-primary" />
                        <span>{req.storage_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {req.date || req.createdAt}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary">
                        {typeof req.costCents === "number"
                          ? `$${(req.costCents / 100).toFixed(2)}`
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start">
                        <span
                          className={`font-semibold text-xs ${req.paid ? "text-green-600" : "text-red-600"}`}
                        >
                          {req.paid ? "Paid" : "Unpaid"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(req.paymentMethod ?? req.payment_method)?.toLowerCase() === "eft"
                            ? "EFT"
                            : (req.paymentMethod ?? req.payment_method)?.toLowerCase() === "card"
                              ? "Card"
                              : req.paymentMethod ?? req.payment_method}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`font-semibold text-xs ${statusColors[req.status]}`}
                      >
                        {req.status.charAt(0).toUpperCase() +
                          req.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {!req.paid && (
                        <>
                          <Button
                            size="sm"
                            className="mr-2"
                            onClick={() => handleMarkPaid(req, "approved")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRequestAction(req, "rejected")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
