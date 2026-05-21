import { useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Folder,
  Loader2,
  Package,
  Receipt,
  Search,
  User,
  X,
} from "lucide-react";
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
import {
  useFetchClubStorage,
  useFetchClubStorageRequests,
} from "@/queries/admin-features/storage";
import { updateStorageRequestUnit } from "@/services/admin-features/storage";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

type StorageRequestStatus = "pending" | "approved" | "rejected";
type PaymentStatusFilter = "all" | "paid" | "unpaid";
type PaymentMethodFilter = "all" | "eft" | "card" | "other";
type StorageOccupancyStatus = "available" | "pending" | "booked";

type StorageRequest = {
  storage_request_id: string;
  storage_id: string;
  userId?: string;
  user_first_name?: string;
  user_surname?: string;
  memberName?: string;
  member_name?: string;
  first_name?: string;
  surname?: string;
  date?: string;
  createdAt?: string;
  costCents?: number;
  paid?: boolean;
  paymentMethod?: string;
  payment_method?: string;
  storage_name?: string;
  parent_storage_name?: string;
  status: StorageRequestStatus;
};

type StorageRequestsResponse = {
  items?: StorageRequest[];
  enable_storage?: boolean;
};

type StorageUnit = {
  storage_id: string;
  storage_name: string;
  parent_id?: string;
  price_cents?: number;
  grid_position?: number;
  layout_rows?: number;
  layout_columns?: number;
  booked_by_name?: string;
  bookedByName?: string;
  pending_booked?: boolean;
  pendingBooked?: boolean;
  is_booked?: boolean;
  isBooked?: boolean;
  occupancyStatus?: StorageOccupancyStatus;
};

type StorageResponse = {
  items?: StorageUnit[];
  enable_storage?: boolean;
};

type StorageLayout = {
  rows: number;
  columns: number;
  positions: Record<string, number>;
};

function formatAmount(cents?: number, currency: string = "ZAR") {
  if (typeof cents !== "number") {
    return "—";
  }

  const currencyLabel = currency.toUpperCase() === "ZAR" ? "R" : currency;

  return `${currencyLabel} ${(cents / 100).toFixed(2)}`;
}

function formatRequestDate(value?: string) {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString();
}

function getStatusBadgeClass(status: StorageRequestStatus) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-100 text-amber-800";
  }

  return "border-rose-200 bg-rose-100 text-rose-800";
}

function getPaymentBadgeClass(isPaid?: boolean) {
  return isPaid
    ? "border-emerald-200 bg-emerald-100 text-emerald-800"
    : "border-slate-200 bg-slate-100 text-slate-700";
}

function getUserDisplayName(request: StorageRequest) {
  const explicitName =
    `${request.user_first_name} ${request.user_surname}`

  if (explicitName?.trim()) {
    return explicitName.trim();
  }

  const firstName = request.first_name?.trim();
  const surname = request.surname?.trim();
  const combinedName = [firstName, surname].filter(Boolean).join(" ").trim();

  if (combinedName) {
    return combinedName;
  }

  return request.userId ? request.userId.substring(0, 8) : "Unknown user";
}

function getDefaultLayoutDimensions(unitCount: number) {
  const columns = Math.max(1, Math.min(4, unitCount >= 4 ? 4 : unitCount || 2));
  const rows = Math.max(1, Math.ceil(Math.max(unitCount, 1) / columns));

  return { rows, columns };
}

function normalizeStorageLayout(childUnits: StorageUnit[]): StorageLayout {
  const fallbackDimensions = getDefaultLayoutDimensions(childUnits.length);
  const columns = Math.max(
    1,
    childUnits[0]?.layout_columns ?? fallbackDimensions.columns,
  );
  const rows = Math.max(
    1,
    childUnits[0]?.layout_rows ?? fallbackDimensions.rows,
    Math.ceil(Math.max(childUnits.length, 1) / columns),
  );
  const maxSlots = rows * columns;
  const usedSlots = new Set<number>();
  const positions: Record<string, number> = {};

  childUnits.forEach((unit) => {
    const preferredSlot = unit.grid_position;

    if (
      typeof preferredSlot === "number" &&
      preferredSlot >= 1 &&
      preferredSlot <= maxSlots &&
      !usedSlots.has(preferredSlot)
    ) {
      positions[unit.storage_id] = preferredSlot;
      usedSlots.add(preferredSlot);
    }
  });

  let nextAvailableSlot = 1;
  childUnits.forEach((unit) => {
    if (positions[unit.storage_id]) {
      return;
    }

    while (usedSlots.has(nextAvailableSlot) && nextAvailableSlot <= maxSlots) {
      nextAvailableSlot += 1;
    }

    positions[unit.storage_id] = nextAvailableSlot;
    usedSlots.add(nextAvailableSlot);
  });

  return {
    rows,
    columns,
    positions,
  };
}

function getStorageOccupancyStatus(unit: StorageUnit): StorageOccupancyStatus {
  if (unit.pending_booked || unit.pendingBooked) {
    return "pending";
  }

  if (unit.is_booked || unit.isBooked) {
    return "booked";
  }

  return "available";
}

function getBookedByName(unit: StorageUnit) {
  return unit.booked_by_name ?? unit.bookedByName ?? "";
}

export default function StorageRequestsAdmin() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const clubAccountId = (club?.club_account_id as string) ?? undefined;
  const { data, isLoading } = useFetchClubStorageRequests(clubAccountId);
  const [isStatusView, setIsStatusView] = useState(false);
  const { data: storageData, isLoading: isLoadingStorage } = useFetchClubStorage(
    clubAccountId ?? "",
    isStatusView,
  );

  const [requests, setRequests] = useState<StorageRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [activeStatusParentId, setActiveStatusParentId] = useState<string | null>(null);
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
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

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

  const storageUnits = useMemo(() => {
    const items = ((storageData as StorageResponse | undefined)?.items ?? []).map(
      (unit) => ({
        ...unit,
        occupancyStatus: getStorageOccupancyStatus(unit),
      }),
    );

    return items;
  }, [storageData]);

  const activeStatusParent = activeStatusParentId
    ? storageUnits.find((unit) => unit.storage_id === activeStatusParentId) ?? null
    : null;

  const activeStatusChildren = useMemo(
    () =>
      activeStatusParent
        ? storageUnits.filter((unit) => unit.parent_id === activeStatusParent.storage_id)
        : [],
    [activeStatusParent, storageUnits],
  );

  const activeStatusLayout = useMemo(
    () => (activeStatusParent ? normalizeStorageLayout(activeStatusChildren) : null),
    [activeStatusChildren, activeStatusParent],
  );

  const statusGridSlots = useMemo(
    () =>
      activeStatusLayout
        ? Array.from(
            { length: activeStatusLayout.rows * activeStatusLayout.columns },
            (_, index) => {
              const slotNumber = index + 1;

              return {
                slotNumber,
                assignedUnit: activeStatusChildren.find(
                  (unit) => activeStatusLayout.positions[unit.storage_id] === slotNumber,
                ),
              };
            },
          )
        : [],
    [activeStatusChildren, activeStatusLayout],
  );

  const visibleStatusUnits = useMemo(() => {
    const q = statusSearchTerm.trim().toLowerCase();
    const sourceUnits = activeStatusParent
      ? activeStatusChildren
      : storageUnits.filter((unit) => !unit.parent_id);

    return sourceUnits.filter((unit) => {
      if (!q) {
        return true;
      }

      return unit.storage_name.toLowerCase().includes(q);
    });
  }, [activeStatusChildren, activeStatusParent, statusSearchTerm, storageUnits]);

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
          (req.storage_id && req.storage_id.toLowerCase().includes(q)) ||
          (req.storage_name && req.storage_name.toLowerCase().includes(q)) ||
          (req.parent_storage_name &&
            req.parent_storage_name.toLowerCase().includes(q)) ||
          getUserDisplayName(req).toLowerCase().includes(q);

        if (!matchesSearch) {
          return false;
        }
      }

      if (statusFilter !== "all" && req.status !== statusFilter) {
        return false;
      }

      if (paymentStatusFilter === "paid" && !req.paid) {
        return false;
      }

      if (paymentStatusFilter === "unpaid" && req.paid) {
        return false;
      }

      if (paymentFilter !== "all") {
        const paymentMethod = req.paymentMethod ?? req.payment_method;
        const normalizedPaymentMethod = paymentMethod
          ? paymentMethod.toLowerCase()
          : "other";

        if (paymentFilter === "other") {
          if (
            normalizedPaymentMethod === "eft" ||
            normalizedPaymentMethod === "card"
          ) {
            return false;
          }
        } else if (normalizedPaymentMethod !== paymentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [requests, searchTerm, statusFilter, paymentStatusFilter, paymentFilter]);

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );

  const approvedCount = useMemo(
    () => requests.filter((request) => request.status === "approved").length,
    [requests],
  );

  const revenueCents = useMemo(
    () =>
      requests.reduce(
        (sum, request) => sum + (request.paid ? request.costCents ?? 0 : 0),
        0,
      ),
    [requests],
  );

  const pendingRevenueCents = useMemo(
    () =>
      requests.reduce(
        (sum, request) =>
          sum + (request.status === "pending" ? request.costCents ?? 0 : 0),
        0,
      ),
    [requests],
  );

  const toggleStatusView = () => {
    setIsStatusView((current) => {
      const next = !current;

      if (next) {
        setActiveStatusParentId(null);
        setStatusSearchTerm("");
      }

      return next;
    });
  };

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
    <div className="space-y-6 p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Requests</h1>
          <p className="text-muted-foreground">
            Manage storage requests, payment state, and approval flow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={isStatusView ? "default" : "outline"}
            className={isStatusView
              ? "rounded-full bg-zinc-700 px-4 text-white hover:bg-zinc-800"
              : "rounded-full border-slate-200 bg-white px-4 text-slate-700"}
            onClick={toggleStatusView}
          >
            <Boxes className="mr-2 h-4 w-4" />
            {isStatusView ? "Back to Requests" : "View Current Storage Status"}
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
            <Receipt className="h-4 w-4" />
            {requests.length} total request{requests.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {(data as StorageRequestsResponse | undefined)?.enable_storage === false && (
        <Card className="mb-6 overflow-hidden border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-0 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-700" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-amber-950 sm:text-base">
                  Storage is currently disabled
                </p>
                <p className="max-w-2xl text-sm leading-snug text-amber-800">
                  Go to the storage page to enable storage before managing requests.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/storage")}
              className="w-full bg-amber-700 text-white hover:bg-amber-800 sm:w-auto"
            >
              Go to Storage
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Revenue
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {formatAmount(revenueCents, club?.currency ?? "ZAR")}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                Pending
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-950">{pendingCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Approved
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-950">{approvedCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-700">
              <Check className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                Pending revenue
              </p>
              <p className="mt-2 text-2xl font-bold text-sky-950">
                {formatAmount(pendingRevenueCents, club?.currency ?? "ZAR")}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-700">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {isStatusView ? (
        <div className="space-y-6">
          <Card className="rounded-[20px] border-slate-200/70 bg-slate-50/80 p-3 shadow-none">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {activeStatusParent && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full border-slate-200 bg-white px-3 text-xs"
                    onClick={() => {
                      setActiveStatusParentId(null);
                      setStatusSearchTerm("");
                    }}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Parent Units
                  </Button>
                )}
                <div className="relative w-full sm:w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={activeStatusParent ? "Search child storage units..." : "Search parent storage units..."}
                    value={statusSearchTerm}
                    onChange={(e) => setStatusSearchTerm(e.target.value)}
                    className="h-8 bg-white pl-9 text-xs"
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {activeStatusParent
                  ? `Viewing ${activeStatusParent.storage_name}`
                  : `Showing ${visibleStatusUnits.length} parent unit${visibleStatusUnits.length === 1 ? "" : "s"}`}
              </div>
            </div>
          </Card>

          <Card className="rounded-[20px] border-slate-200/70 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:p-5">
            <CardContent className="p-0">
              {isLoadingStorage ? (
                <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading storage status...
                </div>
              ) : storageUnits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-500">
                  <Package className="mb-3 h-5 w-5" />
                  No storage units found.
                </div>
              ) : activeStatusParent && activeStatusLayout ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-stone-100 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-950">{activeStatusParent.storage_name}</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        View each child unit in its current saved layout and status.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {activeStatusChildren.filter((unit) => unit.occupancyStatus === "available").length} available
                      </span>
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {activeStatusChildren.filter((unit) => unit.occupancyStatus === "pending").length} pending
                      </span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {activeStatusChildren.filter((unit) => unit.occupancyStatus === "booked").length} booked
                      </span>
                    </div>
                  </div>

                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${activeStatusLayout.columns}, minmax(0, 1fr))`,
                    }}
                  >
                    {statusGridSlots.map((slot) => {
                      const occupancyStatus = slot.assignedUnit?.occupancyStatus ?? "available";
                      const isBooked = occupancyStatus === "booked";
                      const isPending = occupancyStatus === "pending";

                      return (
                        <div
                          key={slot.slotNumber}
                          className={`flex min-h-28 flex-col justify-between rounded-2xl border p-4 shadow-sm ${
                            slot.assignedUnit
                              ? isBooked
                                ? "border-slate-300 bg-slate-200 text-slate-700"
                                : isPending
                                  ? "border-amber-200 bg-amber-50 text-amber-900"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : "border-dashed border-slate-200 bg-slate-50 text-slate-400"
                          }`}
                        >
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Slot {slot.slotNumber}
                            </div>
                            {slot.assignedUnit ? (
                              <>
                                <div className="mt-2 text-sm font-semibold">{slot.assignedUnit.storage_name}</div>
                                <div className="mt-1 text-xs">
                                  {typeof slot.assignedUnit.price_cents === "number"
                                    ? formatAmount(slot.assignedUnit.price_cents, club?.currency ?? "ZAR")
                                    : "No price"}
                                </div>
                                {getBookedByName(slot.assignedUnit) ? (
                                  <div className="mt-1 text-xs text-slate-600">
                                    {isPending ? "Pending for" : isBooked ? "Booked by" : "Held by"} {getBookedByName(slot.assignedUnit)}
                                  </div>
                                ) : null}
                              </>
                            ) : (
                              <div className="mt-2 text-sm">Empty slot</div>
                            )}
                          </div>
                          {slot.assignedUnit && (
                            <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-semibold ${
                              isBooked
                                ? "bg-slate-300 text-slate-700"
                                : isPending
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {isBooked ? "Booked" : isPending ? "Pending" : "Available"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleStatusUnits.map((unit) => {
                    const childUnits = storageUnits.filter((child) => child.parent_id === unit.storage_id);
                    const bookedCount = childUnits.filter((child) => child.occupancyStatus === "booked").length;
                    const pendingCount = childUnits.filter((child) => child.occupancyStatus === "pending").length;
                    const availableCount = childUnits.filter((child) => child.occupancyStatus === "available").length;

                    return (
                      <div
                        key={unit.storage_id}
                        className="flex h-full flex-col rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-700 shadow-sm">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-slate-950">{unit.storage_name}</div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Parent container
                              </div>
                            </div>
                          </div>
                          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {childUnits.length} units
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 shadow-sm">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em]">Available</div>
                            <div className="mt-1 text-lg font-semibold text-emerald-950">{availableCount}</div>
                          </div>
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 shadow-sm">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em]">Pending</div>
                            <div className="mt-1 text-lg font-semibold text-amber-950">{pendingCount}</div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 shadow-sm">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em]">Booked</div>
                            <div className="mt-1 text-lg font-semibold text-slate-950">{bookedCount}</div>
                          </div>
                        </div>

                        <p className="mt-4 text-sm text-slate-600">
                          Open this container to view the live status of each child unit.
                        </p>

                        <div className="mt-auto pt-5">
                          <Button
                            type="button"
                            className="rounded-full bg-zinc-700 text-white hover:bg-zinc-800"
                            onClick={() => {
                              setActiveStatusParentId(unit.storage_id);
                              setStatusSearchTerm("");
                            }}
                          >
                            <ChevronRight className="mr-1 h-4 w-4" />
                            View Current Status
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {visibleStatusUnits.length === 0 && (
                    <div className="col-span-full flex items-center justify-center py-16 text-sm text-slate-500">
                      No storage units match this view.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <Card className="mb-6 rounded-[20px] border-slate-200/70 bg-slate-50/80 p-3 shadow-none">
            <div className="flex flex-wrap gap-3">
              <div className="relative w-full sm:w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search user or storage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 bg-white pl-9 text-xs"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StorageRequestStatus | "all")
                }
                className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none sm:w-[180px]"
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
                className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none sm:w-[180px]"
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
                className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none sm:w-[180px]"
              >
                <option value="all">All payment types</option>
                <option value="eft">EFT</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-500">
                Filter the storage request workspace by member, storage unit, payment state, or approval state.
              </p>
              <h2 className="text-sm font-medium text-slate-500">
                Showing <span className="font-bold text-slate-900">{filteredRequests.length}</span> request
                {filteredRequests.length !== 1 ? "s" : ""}
              </h2>
            </div>
          </Card>

          <Card className="rounded-[20px] border-slate-200/70 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:p-5">
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-[20px] border border-slate-200">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-zinc-700 [&_tr]:border-zinc-600">
                    <TableRow>
                      <TableHead className="h-11 w-[170px] text-center text-xs text-slate-200">
                        Name
                      </TableHead>
                      <TableHead className="h-11 w-[170px] text-center text-xs text-slate-200">
                        Storage Unit
                      </TableHead>
                      <TableHead className="h-11 w-[140px] text-center text-xs text-slate-200">
                        Date
                      </TableHead>
                      <TableHead className="h-11 w-[170px] text-center text-xs text-slate-200">
                        Payment
                      </TableHead>
                      <TableHead className="h-11 w-[140px] text-center text-xs text-slate-200">
                        Status
                      </TableHead>
                      <TableHead className="h-11 w-[170px] text-center text-xs text-slate-200">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading storage requests...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                          No storage requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((req) => (
                        <TableRow
                          key={req.storage_request_id}
                          className="border-slate-200 bg-white text-sm hover:bg-slate-50"
                        >
                          <TableCell className="text-center align-middle">
                            <div className="flex items-center justify-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="group min-w-0 text-left">
                                <div className="font-medium text-slate-900">
                                  {getUserDisplayName(req)}
                                </div>
                                {req.userId ? (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <span className="font-mono">
                                      {req.userId.substring(0, 8).toUpperCase()}...
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        navigator.clipboard.writeText(req.userId ?? "");
                                        setCopiedUserId(req.userId ?? null);
                                        setTimeout(() => setCopiedUserId(null), 2000);
                                      }}
                                      title="Copy full User ID"
                                      className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                    >
                                      {copiedUserId === req.userId ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-500">User ID unavailable</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            <div className="flex items-center justify-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700">
                                <Folder className="h-4 w-4" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium text-slate-900">
                                  {req.storage_name ?? req.storage_id}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {req.parent_storage_name ?? "No parent storage"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            <span className="text-sm text-slate-700">
                              {formatRequestDate(req.date || req.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${getPaymentBadgeClass(req.paid)}`}
                              >
                                {req.paid ? "Paid" : "Unpaid"}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {formatAmount(req.costCents, club?.currency ?? "ZAR")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusBadgeClass(req.status)}`}
                            >
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            {!req.paid ? (
                              <div className="flex justify-center gap-2">
                                <Button
                                  size="sm"
                                  className="h-8 rounded-full bg-zinc-700 px-3 text-xs text-white hover:bg-zinc-800"
                                  onClick={() => handleMarkPaid(req, "approved")}
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  Mark Paid
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 rounded-full px-3 text-xs"
                                  onClick={() => handleRequestAction(req, "rejected")}
                                >
                                  <X className="mr-1 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold`}
                              >
                                No action required.
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
