import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import { useFetchClubStorage } from "@/queries/storage";

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

export default function MemberStorage({
  onSelectUnit,
  onlyTopLevel,
  clubId,
  currency = "ZAR",
}: StorageProps) {
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  // fetch hook - always called (pass possibly undefined clubId)
  // fetch hook - always called with undefined if no clubId (so react-query 'enabled' works)
  const {
    data: fetchedUnits,
    isLoading,
    isError,
  } = useFetchClubStorage((clubId as string) ?? undefined);

  // Normalize fetchedUnits into the StorageUnit[] shape the component expects
  const unitsFlat: StorageUnit[] = useMemo(() => {
    if (!fetchedUnits) return [];

    // If API returns an array directly
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

    // If API returns { items: [...] }
    const items = (fetchedUnits as any).items ?? (fetchedUnits as any).units;
    if (!Array.isArray(items)) return [];

    const normalized = items.map((u: any) => ({
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

    return normalized;
  }, [fetchedUnits]);

  const tree = useMemo(() => buildTree(unitsFlat), [unitsFlat]);

  // side effects (unrelated to hooks order)
  useEffect(() => {
    if (onlyTopLevel) setExpandedParent(null);
  }, [onlyTopLevel, unitsFlat]);

  // --- early UI returns after hooks are declared ---
  if (isLoading) {
    return (
      <div className="py-10 flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 px-4 text-center text-red-600">
        Error loading storage units.
      </div>
    );
  }

  // helpers & handlers (not hooks)
  const handleSelect = (unit: StorageUnit) => {
    if (onSelectUnit) {
      onSelectUnit(unit);
      return;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Available Storage Units</h2>
          <p className="text-sm text-muted-foreground">
            Browse and select a storage unit to reserve or checkout.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tree.map((parent) => {
          const hasChildren = parent.children && parent.children.length > 0;
          return (
            <Card key={parent.id} className="p-4 flex flex-col">
              <CardHeader className="flex items-start justify-between gap-4 p-0 mb-3">
                <div className="flex items-center gap-3">
                  {/* <div className="rounded-full bg-primary/10 p-2">
                    <Folder className="h-5 w-5 text-primary" />
                  </div> */}
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {parent.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {hasChildren
                        ? `${parent.children!.length} units available`
                        : "Available unit"}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right min-w-[120px]">
                  {!hasChildren && (
                    <div className="text-sm">
                      <div className="text-muted-foreground text-xs">Price</div>
                      <div className="font-semibold">
                        {formatAmount(parent.priceCents, currency)}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col flex-1">
                {hasChildren ? (
                  <>
                    <div className="mb-3">
                      <div className="text-sm text-muted-foreground mb-2">
                        Click to view individual units
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setExpandedParent(
                              expandedParent === parent.id ? null : parent.id,
                            )
                          }
                        >
                          {expandedParent === parent.id
                            ? "Hide units"
                            : "View units"}
                        </Button>
                      </div>
                    </div>

                    {expandedParent === parent.id && (
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {parent.children!.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between p-3 bg-muted/10 rounded"
                          >
                            <div>
                              <div className="font-medium">{child.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatAmount(child.priceCents)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSelect(child)}
                                disabled={child.isBooked}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Select
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Price</div>
                      <div className="font-semibold">
                        {formatAmount(parent.priceCents, currency)}
                      </div>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        onClick={() => handleSelect(parent)}
                        disabled={parent.isBooked}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Select
                      </Button>
                    </div>
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
