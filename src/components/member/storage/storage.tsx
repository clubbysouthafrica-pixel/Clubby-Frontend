import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import {
  useFetchClubStorage,
  useFetchClubStorageRequests,
} from "@/queries/storage";
import clsx from "clsx";

type StorageUnit = {
  id: string;
  name: string;
  parentId?: string | null;
  priceCents?: number;
  isBooked: boolean;
  children?: StorageUnit[];
};

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

export default function MemberStorage({
  onSelectUnit,
  onlyTopLevel,
  clubId,
  currency = "ZAR",
}: StorageProps) {
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(true);

  // Example usage
  const { data: myRequests = [], isLoading: isRequestsLoading } =
    useFetchClubStorageRequests(clubId as string);

  const {
    data: fetchedUnits,
    isLoading,
    isError,
  } = useFetchClubStorage((clubId as string) ?? undefined);

  const unitsFlat: StorageUnit[] = useMemo(() => {
    if (!fetchedUnits) return [];
    if (Array.isArray(fetchedUnits)) {
      return (fetchedUnits as any).map((u: any) => ({
        id: u.storage_id ?? u.id,
        name: u.storage_name ?? u.name,
        isBooked: !!u.is_booked || !!u.isBooked,
        parentId:
          u.parent_id === null || u.parent_id === "" ? undefined : u.parent_id,
        priceCents:
          typeof u.price_cents === "number"
            ? u.price_cents
            : typeof u.priceCents === "number"
              ? u.priceCents
              : undefined,
      }));
    }
    const items = (fetchedUnits as any).items ?? (fetchedUnits as any).units;
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => ({
      id: u.storage_id ?? u.id,
      name: u.storage_name ?? u.name,
      isBooked: !!u.is_booked || !!u.isBooked,
      parentId:
        u.parent_id === null || u.parent_id === "" ? undefined : u.parent_id,
      priceCents:
        typeof u.price_cents === "number"
          ? u.price_cents
          : typeof u.priceCents === "number"
            ? u.priceCents
            : undefined,
    })) as StorageUnit[];
  }, [fetchedUnits]);

  const tree = useMemo(() => buildTree(unitsFlat), [unitsFlat]);

  useEffect(() => {
    if (onlyTopLevel) setExpandedParent(null);
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

  return (
    <div className="w-full">
      <div className="mb-10">
        <button
          className="flex items-center gap-2 text-xl font-bold mb-4 focus:outline-none"
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
          My Storage Requests
        </button>
        {showRequests && (
          <div id="my-storage-requests-panel">
            {isRequestsLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                You have no storage requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRequests.map((req: any) => (
                  <Card key={req.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {req.unitName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Requested on {formatDate(req.requestedAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="mb-2 text-sm">
                          Status:{" "}
                          <span
                            className={clsx(
                              "inline-block px-2 py-0.5 rounded-full text-xs font-semibold",
                              req.status === "approved" &&
                                "bg-success/10 text-success",
                              req.status === "pending" &&
                                "bg-warning/10 text-warning",
                              req.status === "rejected" &&
                                "bg-destructive/10 text-destructive",
                              req.status === "booked" &&
                                "bg-primary/10 text-primary",
                            )}
                          >
                            {req.status.charAt(0).toUpperCase() +
                              req.status.slice(1)}
                          </span>
                        </div>
                        {req.status === "rejected" && req.reason && (
                          <div className="text-xs text-destructive">
                            Reason: {req.reason}
                          </div>
                        )}
                      </div>
                      {/* Optionally, add a cancel or view details button here */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Storage Units</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reserve or manage your club’s storage units.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {tree.map((parent) => {
          const hasChildren = parent.children && parent.children.length > 0;
          return (
            <Card
              key={parent.id}
              className={clsx(
                "flex flex-col shadow-md rounded-xl border border-muted-foreground/10 transition hover:shadow-lg",
                parent.isBooked && "opacity-70",
              )}
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

              <CardContent className="flex-1 flex flex-col p-6 pt-2">
                {hasChildren ? (
                  <>
                    {/* Expanded children */}
                    {expandedParent === parent.id && (
                      <div className="mb-4 grid grid-cols-1 gap-3">
                        {parent.children!.map((child) => (
                          <div
                            key={child.id}
                            className={clsx(
                              "flex items-center justify-between p-3 rounded-lg border bg-muted/50",
                              child.isBooked
                                ? "opacity-60 border-destructive/30"
                                : "border-muted-foreground/10",
                            )}
                          >
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {child.name}
                                {child.isBooked ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold ml-2">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Booked
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold ml-2">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Available
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatAmount(child.priceCents, currency)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSelect(child)}
                              disabled={child.isBooked}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Reserve
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1" />

                    {/* Expand/Collapse button at bottom */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-muted-foreground/10">
                      <span className="text-sm text-muted-foreground">
                        {expandedParent === parent.id
                          ? "Hide units"
                          : "View units"}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedParent(
                            expandedParent === parent.id ? null : parent.id,
                          )
                        }
                      >
                        {expandedParent === parent.id ? "Hide" : "Expand"}
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
                        {parent.isBooked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                            <XCircle className="h-3 w-3 mr-1" />
                            Booked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSelect(parent)}
                      disabled={parent.isBooked}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Reserve
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
