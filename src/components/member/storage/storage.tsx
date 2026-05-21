import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Package,
  Clock3,
  Receipt,
} from "lucide-react";
import {
  useFetchClubStorage,
  useFetchClubStorageRequests,
} from "@/queries/storage";
import clsx from "clsx";

type StorageOccupancyStatus = "available" | "pending" | "booked";

type StorageUnit = {
  id: string;
  name: string;
  parentId?: string | null;
  priceCents?: number;
  gridPosition?: number;
  gridRow?: number;
  gridColumn?: number;
  layoutRows?: number;
  layoutColumns?: number;
  isBooked: boolean;
  occupancyStatus: StorageOccupancyStatus;
  children?: StorageUnit[];
};

type StorageUnitResponse = {
  id?: string;
  storage_id?: string;
  name?: string;
  storage_name?: string;
  is_booked?: boolean;
  pending_booked?: boolean;
  pendingBooked?: boolean;
  isBooked?: boolean;
  parent_id?: string | null;
  price_cents?: number;
  priceCents?: number;
  grid_position?: number;
  gridPosition?: number;
  grid_row?: number;
  gridRow?: number;
  grid_column?: number;
  gridColumn?: number;
  layout_rows?: number;
  layoutRows?: number;
  layout_columns?: number;
  layoutColumns?: number;
};

type StorageQueryResponse = {
  items?: StorageUnitResponse[];
  units?: StorageUnitResponse[];
};

type StorageRequest = {
  storage_request_id: string;
  storage_id: string;
  createdAt: string;
  status: string;
  reason?: string;
  costCents?: number;
  paid?: boolean;
  paymentMethod?: string;
  payment_method?: string;
  cost_cents?: number;
  created_at?: string;
};

type StorageRequestsResponse = {
  items?: StorageRequest[];
};

const ACTIVE_STORAGE_REQUEST_STATUSES = new Set([
  "pending",
  "approved",
  "booked",
]);

function getStorageOccupancyStatus(unit: {
  pending_booked?: boolean;
  pendingBooked?: boolean;
  is_booked?: boolean;
  isBooked?: boolean;
}): StorageOccupancyStatus {
  if (unit.pending_booked || unit.pendingBooked) {
    return "pending";
  }

  if (unit.is_booked || unit.isBooked) {
    return "booked";
  }

  return "available";
}

function normalizeStorageUnit(u: StorageUnitResponse): StorageUnit {
  const occupancyStatus = getStorageOccupancyStatus(u);

  return {
    id: u.storage_id ?? u.id ?? "",
    name: u.storage_name ?? u.name ?? "Unknown Storage",
    isBooked: occupancyStatus === "booked",
    occupancyStatus,
    parentId:
      u.parent_id === null || u.parent_id === "" ? undefined : u.parent_id,
    priceCents:
      typeof u.price_cents === "number"
        ? u.price_cents
        : typeof u.priceCents === "number"
          ? u.priceCents
          : undefined,
    gridPosition:
      typeof u.grid_position === "number"
        ? u.grid_position
        : typeof u.gridPosition === "number"
          ? u.gridPosition
          : undefined,
    gridRow:
      typeof u.grid_row === "number"
        ? u.grid_row
        : typeof u.gridRow === "number"
          ? u.gridRow
          : undefined,
    gridColumn:
      typeof u.grid_column === "number"
        ? u.grid_column
        : typeof u.gridColumn === "number"
          ? u.gridColumn
          : undefined,
    layoutRows:
      typeof u.layout_rows === "number"
        ? u.layout_rows
        : typeof u.layoutRows === "number"
          ? u.layoutRows
          : undefined,
    layoutColumns:
      typeof u.layout_columns === "number"
        ? u.layout_columns
        : typeof u.layoutColumns === "number"
          ? u.layoutColumns
          : undefined,
  };
}

function getDefaultLayoutDimensions(unitCount: number) {
  const columns = Math.max(1, Math.min(4, unitCount >= 4 ? 4 : unitCount || 2));
  const rows = Math.max(1, Math.ceil(Math.max(unitCount, 1) / columns));

  return { rows, columns };
}

function normalizeChildLayout(childUnits: StorageUnit[]) {
  const fallback = getDefaultLayoutDimensions(childUnits.length);
  const columns = Math.max(
    1,
    childUnits[0]?.layoutColumns ?? fallback.columns,
  );
  const rows = Math.max(
    1,
    childUnits[0]?.layoutRows ?? fallback.rows,
    Math.ceil(Math.max(childUnits.length, 1) / columns),
  );
  const maxSlots = rows * columns;
  const usedSlots = new Set<number>();
  const positions: Record<string, number> = {};

  childUnits.forEach((unit) => {
    const preferredSlot = unit.gridPosition;

    if (
      typeof preferredSlot === "number" &&
      preferredSlot >= 1 &&
      preferredSlot <= maxSlots &&
      !usedSlots.has(preferredSlot)
    ) {
      positions[unit.id] = preferredSlot;
      usedSlots.add(preferredSlot);
    }
  });

  let nextAvailableSlot = 1;
  childUnits.forEach((unit) => {
    if (positions[unit.id]) {
      return;
    }

    while (usedSlots.has(nextAvailableSlot) && nextAvailableSlot <= maxSlots) {
      nextAvailableSlot += 1;
    }

    positions[unit.id] = nextAvailableSlot;
    usedSlots.add(nextAvailableSlot);
  });

  return { rows, columns, positions, slotCount: rows * columns };
}

function buildTree(units: StorageUnit[]): StorageUnit[] {
  const map: Record<string, StorageUnit & { children: StorageUnit[] }> = {};
  units.forEach((u) => {
    map[u.id] = { ...u, children: [] };
  });
  const roots: (StorageUnit & { children: StorageUnit[] })[] = [];
  units.forEach((u) => {
    const parentId = (u as StorageUnit).parentId || null;
    if (parentId && map[parentId]) {
      map[parentId].children.push(map[u.id]);
    } else {
      roots.push(map[u.id]);
    }
  });
  return roots;
}

function formatAmount(cents?: number, currency: string = "$"): string {
  if (typeof cents !== "number") return "—";
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

interface StorageProps {
  onSelectUnit?: (unit: StorageUnit) => void;
  onlyTopLevel?: boolean;
  clubId?: string | null;
  currency?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

function normalizeStorageRequest(request: StorageRequest): StorageRequest {
  return {
    ...request,
    createdAt: request.createdAt ?? request.created_at ?? "",
    costCents:
      typeof request.costCents === "number"
        ? request.costCents
        : typeof request.cost_cents === "number"
          ? request.cost_cents
          : undefined,
    paid: Boolean(request.paid),
  };
}

export default function MemberStorage({
  onSelectUnit,
  onlyTopLevel,
  clubId,
  currency = "ZAR",
}: StorageProps) {
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(false);
  const myStorageSectionRef = useRef<HTMLDivElement | null>(null);

  const { data: myRequests, isLoading: isRequestsLoading } =
    useFetchClubStorageRequests(clubId as string);

  const {
    data: fetchedUnits,
    isLoading,
    isError,
  } = useFetchClubStorage((clubId as string) ?? undefined);

  const unitsFlat: StorageUnit[] = useMemo(() => {
    if (!fetchedUnits) return [];
    if (Array.isArray(fetchedUnits)) {
      return (fetchedUnits as StorageUnitResponse[]).map(normalizeStorageUnit);
    }
    const items =
      (fetchedUnits as StorageQueryResponse).items ??
      (fetchedUnits as StorageQueryResponse).units;
    if (!Array.isArray(items)) return [];
    return items.map(normalizeStorageUnit);
  }, [fetchedUnits]);

  const requestItems = useMemo(
    () =>
      ((myRequests as StorageRequestsResponse | undefined)?.items ?? []).map(
        normalizeStorageRequest,
      ),
    [myRequests],
  );

  const userStorageIds = useMemo(
    () =>
      new Set(
        requestItems
          .filter((request) =>
            ACTIVE_STORAGE_REQUEST_STATUSES.has(request.status.toLowerCase()),
          )
          .map((request) => request.storage_id),
      ),
    [requestItems],
  );

  const tree = useMemo(() => buildTree(unitsFlat), [unitsFlat]);

  const activeParent = useMemo(
    () => tree.find((unit) => unit.id === activeParentId) ?? null,
    [activeParentId, tree],
  );

  const activeChildLayout = useMemo(
    () =>
      activeParent?.children?.length
        ? normalizeChildLayout(activeParent.children)
        : null,
    [activeParent],
  );

  const activeGridSlots = useMemo(() => {
    if (!activeParent?.children?.length || !activeChildLayout) {
      return [];
    }

    return Array.from({ length: activeChildLayout.slotCount }, (_, index) => {
      const slotNumber = index + 1;
      const assignedUnit = activeParent.children?.find(
        (child) => activeChildLayout.positions[child.id] === slotNumber,
      );

      return { slotNumber, assignedUnit };
    });
  }, [activeChildLayout, activeParent]);

  const activeGridRows = useMemo(() => {
    if (!activeChildLayout) {
      return [];
    }

    return Array.from({ length: activeChildLayout.rows }, (_, rowIndex) => ({
      rowNumber: rowIndex + 1,
      slots: activeGridSlots.slice(
        rowIndex * activeChildLayout.columns,
        (rowIndex + 1) * activeChildLayout.columns,
      ),
    }));
  }, [activeChildLayout, activeGridSlots]);

  const activeMapNeedsHorizontalScroll =
    (activeChildLayout?.columns ?? 0) > 2;

  const activeMapNeedsVerticalScroll = (activeChildLayout?.rows ?? 0) > 2;

  useEffect(() => {
    if (!activeParentId) {
      return;
    }

    const parentStillExists = tree.some((unit) => unit.id === activeParentId);
    if (!parentStillExists) {
      setActiveParentId(null);
    }
  }, [activeParentId, tree]);

  useEffect(() => {
    if (onlyTopLevel) {
      setActiveParentId(null);
    }
  }, [onlyTopLevel, unitsFlat]);

  if (isLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 px-4 text-center text-destructive">
        <XCircle className="inline-block mr-2 mb-1" /> Error loading storage
        units.
      </div>
    );
  }

  const handleSelect = (unit: StorageUnit) => {
    if (onSelectUnit) onSelectUnit(unit);
  };

  const getStorageName = (id: string) => {
    const unit = unitsFlat.find((u) => u.id === id);
    return unit ? unit.name : "Unknown Storage";
  };

  const getParentStorageName = (id: string) => {
    const unit = unitsFlat.find((u) => u.id === id);

    if (!unit?.parentId) {
      return null;
    }

    const parentUnit = unitsFlat.find((u) => u.id === unit.parentId);
    return parentUnit?.name ?? null;
  };

  const isUnitUnavailable = (unit: StorageUnit) =>
    unit.occupancyStatus !== "available";

  const isUnitPending = (unit: StorageUnit) => unit.occupancyStatus === "pending";

  const isUsersUnit = (unit: StorageUnit) => userStorageIds.has(unit.id);

  const paidRequestsCount = requestItems.filter((request) => request.paid).length;

  const pendingRequestsCount = requestItems.filter(
    (request) => request.status.toLowerCase() === "pending",
  ).length;

  const openStorageLayoutForUnit = (storageId: string) => {
    const unit = unitsFlat.find((entry) => entry.id === storageId);

    if (!unit) {
      return;
    }

    if (unit.parentId) {
      setActiveParentId(unit.parentId);
      return;
    }

    if (tree.some((entry) => entry.id === unit.id && entry.children?.length)) {
      setActiveParentId(unit.id);
      return;
    }

    if (onSelectUnit) {
      onSelectUnit(unit);
    }
  };

  const openMyStorage = () => {
    setShowRequests(true);
    myStorageSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="w-full">
      <div ref={myStorageSectionRef} className="mb-10 scroll-mt-4 sm:scroll-mt-6">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.22em]">
              Storage history
            </p>
            <button
              className="mt-1 flex items-center gap-2 text-base font-semibold leading-tight tracking-tight sm:text-3xl focus:outline-none"
              onClick={() => setShowRequests((v) => !v)}
              aria-expanded={showRequests}
              aria-controls="my-storage-requests-panel"
              type="button"
            >
              {showRequests ? (
                <ChevronDown className="h-5 w-5 transition-transform" />
              ) : (
                <ChevronRight className="h-5 w-5 transition-transform" />
              )}
              My Storage
            </button>
            <p className="hidden mt-1 text-sm leading-6 text-slate-500 sm:block">
              Review your requested units, payment state, and open the storage map where each unit belongs.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px] font-semibold sm:h-9 sm:px-4 sm:text-sm"
              onClick={openMyStorage}
            >
              <Receipt className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              View my storage
            </Button>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm">
              <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {requestItems.length} unit{requestItems.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center shadow-sm sm:px-3 sm:py-2.5 sm:text-left">
            <p className="flex min-h-7 items-center justify-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:min-h-0 sm:justify-start sm:text-[10px]">Units selected</p>
            <p className="mt-1 text-sm font-semibold text-slate-950 sm:text-base">{requestItems.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center shadow-sm sm:px-3 sm:py-2.5 sm:text-left">
            <p className="flex min-h-7 items-center justify-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:min-h-0 sm:justify-start sm:text-[10px]">Paid</p>
            <p className="mt-1 text-sm font-semibold text-slate-950 sm:text-base">{paidRequestsCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center shadow-sm sm:px-3 sm:py-2.5 sm:text-left">
            <p className="flex min-h-7 items-center justify-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:min-h-0 sm:justify-start sm:text-[10px]">Pending</p>
            <p className="mt-1 text-sm font-semibold text-slate-950 sm:text-base">{pendingRequestsCount}</p>
          </div>
        </div>
        {showRequests && (
          <div id="my-storage-requests-panel" className="mt-3 sm:mt-4">
            {isRequestsLoading ? (
              <Card className="overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)]">
                <CardContent className="flex min-h-40 flex-col items-center justify-center text-center text-slate-500 p-6">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="mt-3 text-sm">Loading your storage...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)]">
                  <CardHeader className="border-b border-slate-200/80 px-3 py-3 sm:px-4 sm:py-4">
                    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 sm:h-9 sm:w-9">
                          <Receipt className="h-4 w-4 text-slate-700" />
                        </div>
                        <div>
                          <CardTitle className="text-sm sm:text-base">My Storage</CardTitle>
                          <CardDescription className="text-[11px] sm:text-xs">
                            Review payment progress and open the matching storage layout from each request.
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowRequests(false)}>
                        Hide storage
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2.5 sm:p-4">
                    {requestItems.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                        <Receipt className="mx-auto h-10 w-10 text-slate-400" />
                        <p className="mt-4 text-lg font-semibold text-slate-900">No storage selected yet</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Reserve a storage unit and it will appear here with payment details and a link to its layout.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-1.5 xl:grid-cols-2 sm:gap-2">
                        {requestItems.map((req) => (
                          <div
                            key={req.storage_request_id}
                            className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-shadow hover:shadow-md sm:rounded-2xl sm:p-2.5"
                            onClick={() => openStorageLayoutForUnit(req.storage_id)}
                          >
                            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                              <div className="space-y-0.5">
                                <p className="text-[13px] font-semibold leading-tight text-slate-900 sm:text-sm">
                                  {getParentStorageName(req.storage_id) != null ? `${getParentStorageName(req.storage_id)} | ` : ""}{getStorageName(req.storage_id)}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 sm:text-xs">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock3 className="h-3 w-3" />
                                    {formatDate(req.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <span
                                  className={clsx(
                                    "inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none sm:px-2 sm:text-[11px]",
                                    req.status === "approved" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                                    req.status === "pending" && "border-amber-200 bg-amber-50 text-amber-700",
                                    req.status === "rejected" && "border-rose-200 bg-rose-50 text-rose-700",
                                    req.status === "booked" && "border-sky-200 bg-sky-50 text-sky-700",
                                  )}
                                >
                                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                </span>
                                <span
                                  className={clsx(
                                    "inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none sm:px-2 sm:text-[11px]",
                                    req.paid
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-slate-100 text-slate-700",
                                  )}
                                >
                                  {req.paid ? "Paid" : "Unpaid"}
                                </span>
                              </div>
                            </div>

                            <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 sm:gap-2">
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:rounded-xl sm:px-2.5 sm:py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Booked on</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-950 sm:text-sm">
                                  {formatDate(req.createdAt)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:rounded-xl sm:px-2.5 sm:py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Amount</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-950 sm:text-sm">
                                  {formatAmount(req.costCents, currency)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-1.5 grid gap-1.5 sm:gap-2">
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 sm:rounded-xl sm:px-2.5 sm:py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Layout</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-1 h-7 px-2.5 text-[10px] sm:h-8 sm:px-3 sm:text-xs"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openStorageLayoutForUnit(req.storage_id);
                                  }}
                                >
                                  Open storage map
                                </Button>
                              </div>
                            </div>

                            {req.status === "rejected" && req.reason ? (
                              <div className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700 sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-xs">
                                Reason: {req.reason}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-col items-start justify-between gap-1.5 sm:mb-8 sm:flex-row sm:items-center sm:gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Storage Units</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            Choose a parent unit to see its child layout and reserve an available space.
          </p>
        </div>
      </div>

      {activeParent && activeChildLayout ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-2.5 rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-stone-100 p-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                className="mb-1 h-auto p-0 text-slate-600 hover:bg-transparent hover:text-slate-900 sm:mb-2"
                onClick={() => setActiveParentId(null)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to parent units
              </Button>
              <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
                {activeParent.name}
              </h3>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-3 shadow-inner sm:p-6">
            <div className="mb-2 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Storage map
                </div>
                <div className="mt-1 hidden text-sm text-slate-600 sm:block">
                  Each bay shows the exact unit position in this storage section.
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] sm:gap-2 sm:text-xs">
                <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 font-semibold text-success">
                  Available
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">
                  Yours
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 font-semibold text-slate-600">
                  Not available
                </span>
              </div>
            </div>

            <div
              className={clsx(
                "space-y-2 sm:space-y-4",
                activeMapNeedsHorizontalScroll ? "overflow-x-auto" : "overflow-x-hidden",
                activeMapNeedsVerticalScroll && "max-h-[285px] overflow-y-auto pr-1 sm:max-h-none sm:overflow-y-visible sm:pr-0",
              )}
            >
              <div
                className="grid min-w-[190px] gap-1 sm:min-w-[640px] sm:gap-3"
                style={{
                  gridTemplateColumns: `30px repeat(${activeChildLayout.columns}, minmax(44px, 1fr))`,
                }}
              >
                <div />
                {Array.from({ length: activeChildLayout.columns }, (_, columnIndex) => (
                  <div
                    key={`column-${columnIndex + 1}`}
                    className="rounded-xl border border-slate-200 bg-white px-1 py-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
                  >
                    <span className="sm:hidden">C{columnIndex + 1}</span>
                    <span className="hidden sm:inline">Coloumn {columnIndex + 1}</span>
                  </div>
                ))}
              </div>

              {activeGridRows.map(({ rowNumber, slots }) => (
                <div
                  key={`row-${rowNumber}`}
                  className="grid min-w-[190px] gap-1 sm:min-w-[640px] sm:gap-3"
                  style={{
                    gridTemplateColumns: `30px repeat(${activeChildLayout.columns}, minmax(44px, 1fr))`,
                  }}
                >
                  <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm sm:rounded-2xl sm:text-xs sm:tracking-[0.16em]">
                    <span className="sm:hidden">R{rowNumber}</span>
                    <span className="hidden sm:inline">R{rowNumber}</span>
                  </div>
                  {slots.map(({ slotNumber, assignedUnit }) => {
              const isUnavailable = assignedUnit
                ? isUnitUnavailable(assignedUnit)
                : false;
              const isBooked = assignedUnit?.isBooked ?? false;
              const isPending = assignedUnit ? isUnitPending(assignedUnit) : false;
              const isOwnedByUser = assignedUnit ? isUsersUnit(assignedUnit) : false;

              return (
                <div
                  key={slotNumber}
                  className={clsx(
                    "flex min-h-[78px] flex-col justify-between rounded-xl border p-1.5 shadow-sm transition-all sm:min-h-44 sm:rounded-[24px] sm:p-4",
                    assignedUnit
                      ? "border-stone-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] hover:-translate-y-0.5 hover:shadow-md"
                      : "border-dashed border-slate-300 bg-slate-100/80",
                    assignedUnit && isUnavailable && "opacity-70",
                    (isPending || isBooked) && !isOwnedByUser && "border-slate-300 bg-slate-200 text-slate-500",
                    isPending && isOwnedByUser && "border-amber-200 bg-amber-50 text-amber-900",
                    isBooked && !isOwnedByUser && "border-slate-300 bg-slate-200 text-slate-500",
                    isBooked && isOwnedByUser && "border-emerald-200 bg-emerald-50 text-emerald-900",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400 sm:gap-2 sm:text-xs sm:tracking-[0.16em]">
                      <span>S{slotNumber}</span>
                      <span className="hidden sm:inline">
                        R{rowNumber}-B{slots.findIndex((slot) => slot.slotNumber === slotNumber) + 1}
                      </span>
                    </div>
                    {assignedUnit ? (
                      <>
                        <div className="mt-1 flex items-start gap-1 sm:mt-3 sm:gap-3">
                          <div className={clsx(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl",
                            isPending && isOwnedByUser
                              ? "border-amber-200 bg-amber-100 text-amber-700"
                              : (isPending || isBooked) && !isOwnedByUser
                                ? "border-slate-300 bg-slate-100 text-slate-500"
                              : isBooked && !isOwnedByUser
                              ? "border-slate-300 bg-slate-100 text-slate-500"
                              : isBooked && isOwnedByUser
                                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                              : "border-sky-200 bg-sky-100 text-sky-700",
                          )}>
                            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={clsx(
                              "text-[10px] font-semibold leading-tight sm:text-base",
                              ((isBooked || isPending) && !isOwnedByUser) ? "text-slate-500" : isPending ? "text-amber-900" : "text-slate-900",
                            )}>
                              {assignedUnit.name}
                            </div>
                            <div className={clsx(
                              "mt-0.5 text-[9px] sm:text-sm",
                              ((isBooked || isPending) && !isOwnedByUser) ? "text-slate-400" : isPending ? "text-amber-700" : "text-muted-foreground",
                            )}>
                              {formatAmount(assignedUnit.priceCents, currency)}
                            </div>
                            <div className="mt-0.5 hidden text-[10px] uppercase tracking-[0.16em] text-slate-400 sm:block sm:text-xs">
                              Unit reference {assignedUnit.id.slice(0, 6)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-1.5 sm:mt-4">
                          {assignedUnit.isBooked && isOwnedByUser ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 sm:px-2 sm:text-xs">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Your unit
                            </span>
                          ) : isPending && isOwnedByUser ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 sm:px-2 sm:text-xs">
                              Pending request
                            </span>
                          ) : assignedUnit.isBooked || isPending ? (
                            <span className="inline-flex items-center rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 sm:px-2 sm:text-xs">
                              <XCircle className="mr-1 h-3 w-3" />
                              Not available
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success sm:px-2 sm:text-xs">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Available
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-white/70 px-1.5 py-1.5 text-center text-[9px] text-muted-foreground sm:mt-6 sm:rounded-2xl sm:px-3 sm:py-4 sm:text-sm">
                        Empty
                      </div>
                    )}
                  </div>

                  {assignedUnit && !isBooked && !isPending ? (
                    <Button
                      size="sm"
                      className="mt-1.5 h-6 px-1.5 text-[9px] sm:mt-4 sm:h-9 sm:px-3 sm:text-sm"
                      onClick={() => handleSelect(assignedUnit)}
                      disabled={isUnavailable}
                    >
                      <ShoppingCart className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sm:hidden">Reserve</span>
                      <span className="hidden sm:inline">Reserve</span>
                    </Button>
                  ) : assignedUnit && (isBooked || isPending) ? (
                    <div
                      className={clsx(
                        "mt-1.5 text-[9px] font-medium uppercase tracking-[0.12em] sm:mt-4 sm:text-xs sm:tracking-[0.16em]",
                        isBooked && isOwnedByUser
                          ? "text-emerald-700"
                          : isPending && isOwnedByUser
                            ? "text-amber-700"
                            : "text-slate-400",
                      )}
                    >
                      {isBooked && isOwnedByUser
                        ? "This is your unit"
                        : isPending && isOwnedByUser
                          ? "Your request is pending"
                          : "Not available"}
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-slate-400">No unit in this bay</div>
                  )}
                </div>
              );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        {tree.map((parent) => {
          const hasChildren = parent.children && parent.children.length > 0;
          const isParentUnavailable = isUnitUnavailable(parent);
          const isParentBooked = parent.isBooked;
          const isParentPending = isUnitPending(parent);
          const isParentOwnedByUser = isUsersUnit(parent);
          const availableChildrenCount = hasChildren
            ? parent.children!.filter(
                (child) => child.occupancyStatus === "available",
              ).length
            : 0;
          const pendingChildrenCount = hasChildren
            ? parent.children!.filter(
                (child) => child.occupancyStatus === "pending",
              ).length
            : 0;
          const bookedChildrenCount = hasChildren
            ? parent.children!.filter((child) => child.occupancyStatus === "booked").length
            : 0;
          return (
            <Card
              key={parent.id}
              className={clsx(
                "flex flex-col rounded-3xl border border-muted-foreground/10 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-md transition hover:shadow-lg",
                isParentUnavailable && "opacity-70",
                isParentPending && "border-amber-200 bg-amber-50/70 text-amber-900",
                isParentBooked && "bg-slate-100 text-slate-500",
                hasChildren && "cursor-pointer",
              )}
              onClick={
                hasChildren ? () => setActiveParentId(parent.id) : undefined
              }
            >
              <CardHeader className="flex items-center gap-3">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">
                    {parent.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {hasChildren
                      ? `${parent.children!.length} units`
                      : "Single unit"}
                  </CardDescription>
                </div>
                {!hasChildren && (
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Price</span>
                    <span className="font-bold text-base">
                      {formatAmount(parent.priceCents, currency)}
                    </span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex flex-1 flex-col p-4 pt-2 sm:p-6 sm:pt-2">
                {hasChildren ? (
                  <>
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-muted-foreground sm:px-4 sm:py-4">
                      <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        Storage section preview
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 shadow-sm">
                          <div className="font-semibold uppercase tracking-[0.12em]">
                            Available
                          </div>
                          <div className="mt-1 text-sm font-semibold tracking-normal">
                            {availableChildrenCount}
                          </div>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 shadow-sm">
                          <div className="font-semibold uppercase tracking-[0.12em]">
                            Pending
                          </div>
                          <div className="mt-1 text-sm font-semibold tracking-normal">
                            {pendingChildrenCount}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-700 shadow-sm">
                          <div className="font-semibold uppercase tracking-[0.12em]">
                            Booked
                          </div>
                          <div className="mt-1 text-sm font-semibold tracking-normal">
                            {bookedChildrenCount}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        {availableChildrenCount} of {parent.children!.length} child units are currently available in this parent layout.
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3 sm:pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveParentId(parent.id);
                        }}
                      >
                        Open storage map
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Status
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {parent.isBooked && isParentOwnedByUser ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Your unit
                          </span>
                        ) : isParentPending && isParentOwnedByUser ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                            Pending request
                          </span>
                        ) : parent.isBooked || isParentPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                    {!isParentBooked && !isParentPending ? (
                      <Button
                        size="sm"
                        onClick={() => handleSelect(parent)}
                        disabled={isParentUnavailable}
                        onClickCapture={(event) => event.stopPropagation()}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Reserve
                      </Button>
                    ) : (
                      <div
                        className={clsx(
                          "text-xs font-medium uppercase tracking-[0.16em]",
                          isParentBooked && isParentOwnedByUser
                            ? "text-emerald-700"
                            : isParentPending && isParentOwnedByUser
                              ? "text-amber-700"
                              : "text-slate-400",
                        )}
                      >
                        {isParentBooked && isParentOwnedByUser
                          ? "This is your unit"
                          : isParentPending && isParentOwnedByUser
                            ? "Your request is pending"
                          : "Not available"}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}
