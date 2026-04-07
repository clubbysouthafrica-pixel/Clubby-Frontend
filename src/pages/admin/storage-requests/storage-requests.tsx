import React, { useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Check, X, Folder, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubStorageRequests } from "@/queries/admin-features/storage";
const statusColors = {
  pending: "text-yellow-600",
  approved: "text-green-600",
  rejected: "text-red-600",
};


export default function StorageRequestsAdmin() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const { data, isLoading } = useFetchClubStorageRequests(
    (club?.club_account_id as string) ?? undefined,
  );

  // Local state for storage requests
  const [requests, setRequests] = useState([]);

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "eft" | "card" | "other"
  >("all");


  useEffect(() => {
    if (data) setRequests(data?.items || []);
  }, [data]);

  // Memoized filtered list
  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return requests.filter((req) => {
      // Search by userId or storage_id (or add more fields as needed)
      if (q) {
        // You may want to fetch/display user name and storage name if available
        const matchesSearch =
          (req.userId && req.userId.toLowerCase().includes(q)) ||
          (req.storage_id && req.storage_id.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && req.status !== statusFilter) return false;

      // Payment method filter
      if (paymentFilter !== "all") {
        // normalize to expected values
        const pm = req.paymentMethod
          ? req.paymentMethod.toLowerCase()
          : "other";
        if (paymentFilter === "other") {
          if (pm === "eft" || pm === "card") return false;
        } else if (pm !== paymentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [requests, searchTerm, statusFilter, paymentFilter]);

  // TODO: Replace with backend mutation hooks if available
  const handleMarkPaid = async (requestId, action) => {
    // Example: await markPaidMutation.mutateAsync(requestId);
    setRequests((prev) =>
      prev.map((req) =>
        req.storage_request_id === requestId ? { ...req, paid: true, status: action } : req,
      ),
    );
  };

  const handleRequestAction = async (requestId, action) => {
    const paymentType = "EFT"
    // Example: await updateRequestStatusMutation.mutateAsync({ requestId, status: action });
    setRequests((prev) =>
      prev.map((req) =>
        req.storage_request_id === requestId ? { ...req, status: action } : req,
      ),
    );
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
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
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
                      <span className="text-xs">{req.date || req.createdAt}</span>
                    </TableCell>
                    {/* Storage Cost */}
                    <TableCell>
                      <span className="font-medium text-primary">
                        {typeof req.costCents === "number"
                          ? `$${(req.costCents / 100).toFixed(2)}`
                          : "—"}
                      </span>
                    </TableCell>
                    {/* Payment Status */}
                    <TableCell>
                      <div className="flex flex-col items-start">
                        <span
                          className={`font-semibold text-xs ${req.paid ? "text-green-600" : "text-red-600"}`}
                        >
                          {req.paid ? "Paid" : "Unpaid"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {req.paymentMethod === "eft"
                            ? "EFT"
                            : req.paymentMethod === "card"
                              ? "Card"
                              : req.paymentMethod}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell>
                      <span
                        className={`font-semibold text-xs ${statusColors[req.status]}`}
                      >
                        {req.status.charAt(0).toUpperCase() +
                          req.status.slice(1)}
                      </span>
                    </TableCell>
                    {/* Actions */}
                    <TableCell className="text-right">
                      {!req.paid && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            className="mr-2"
                            onClick={() =>
                              handleMarkPaid(
                                req.storage_request_id,
                                "approved",
                              )
                            }
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleRequestAction(
                                req.storage_request_id,
                                "rejected",
                              )
                            }
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
