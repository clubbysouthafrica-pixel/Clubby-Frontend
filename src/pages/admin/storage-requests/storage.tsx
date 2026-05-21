import React, { useContext, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Trash,
  ArrowUpRight,
  AlertCircle,
  Loader2,
  Settings,
  Search,
  Boxes,
  ChevronDown,
  ChevronRight,
  Package,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  createStorageUnit,
  removeStorage,
  updateStorageUnitLayouts,
} from "@/services/admin-features/storage";
import { toast } from "sonner";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubStorage } from "@/queries/admin-features/storage";
import { updateClubDetails } from "@/services/admin/club";

type StorageUnit = {
  storage_id: string;
  storage_name: string;
  parent_id?: string;
  price_cents?: number;
  grid_position?: number;
  grid_row?: number;
  grid_column?: number;
  layout_rows?: number;
  layout_columns?: number;
  children?: StorageUnit[];
};

type StorageLayout = {
  rows: number;
  columns: number;
  positions: Record<string, number>;
};

const initialUnits: StorageUnit[] = [];
const STORAGE_LAYOUTS_KEY = "storage-unit-layouts";

function getDefaultLayoutDimensions(unitCount: number) {
  const columns = Math.max(1, Math.min(4, unitCount >= 4 ? 4 : unitCount || 2));
  const rows = Math.max(1, Math.ceil(Math.max(unitCount, 1) / columns));

  return { rows, columns };
}

function normalizeStorageLayout(
  childUnits: StorageUnit[],
  layout?: StorageLayout,
): StorageLayout {
  const fallbackDimensions = getDefaultLayoutDimensions(childUnits.length);
  const columns = Math.max(
    1,
    layout?.columns ?? childUnits[0]?.layout_columns ?? fallbackDimensions.columns,
  );
  const rows = Math.max(
    1,
    layout?.rows ?? childUnits[0]?.layout_rows ?? fallbackDimensions.rows,
    Math.ceil(Math.max(childUnits.length, 1) / columns),
  );
  const maxSlots = rows * columns;
  const usedSlots = new Set<number>();
  const positions: Record<string, number> = {};

  childUnits.forEach((unit) => {
    const preferredSlot = layout?.positions[unit.storage_id] ?? unit.grid_position;

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

function buildTree(units: StorageUnit[]): StorageUnit[] {
  if (units.length === 0) return [];

  const map: { [id: string]: StorageUnit } = {};
  units.forEach((unit) => (map[unit.storage_id] = { ...unit, children: [] }));
  const roots: StorageUnit[] = [];
  units.forEach((unit) => {
    if (unit.parent_id) {
      map[unit.parent_id]?.children?.push(map[unit.storage_id]);
    } else {
      roots.push(map[unit.storage_id]);
    }
  });
  return roots;
}

// function filterTree(tree: StorageUnit[], term: string): StorageUnit[] {
//   if (!term) return tree;
//   const lowerTerm = term.toLowerCase();

//   return tree
//     .map((unit) => {
//       // Check if parent matches
//       const parentMatches = unit.name.toLowerCase().includes(lowerTerm);

//       // Filter children
//       const filteredChildren = unit.children
//         ? unit.children.filter((sub) =>
//             sub.name.toLowerCase().includes(lowerTerm),
//           )
//         : [];

//       // If parent matches or any children match, include them
//       if (parentMatches || filteredChildren.length > 0) {
//         return {
//           ...unit,
//           children: filteredChildren,
//         };
//       }
//       return null;
//     })
//     .filter(Boolean) as StorageUnit[];
// }

const StorageAdmin: React.FC = () => {
  const { club, setClub } = useContext(ClubContext) as ClubContextType;
  const [filter, setFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);
  const [showStorageSettings, setShowStorageSettings] = useState(false);
  const [isTogglingStorage, setIsTogglingStorage] = useState(false);

  const [units, setUnits] = useState<StorageUnit[]>(initialUnits);
  const [name, setName] = useState("");
  const [priceCents, setPriceCents] = useState(0);
  const [priceInput, setPriceInput] = useState("");
  const [parent_id, setparent_id] = useState<string | undefined>(undefined);
  const [editingStorage, setEditingStorage] = useState<StorageUnit | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parentFilter, setParentFilter] = useState<string | "all">("top");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [isUnitLayoutCollapsed, setIsUnitLayoutCollapsed] = useState(false);
  const [storageLayouts, setStorageLayouts] = useState<
    Record<string, StorageLayout>
  >({});

  const { data, isLoading } = useFetchClubStorage(
    club?.club_account_id as string,
  );

  const storageEnabled =
    typeof club?.enable_storage === "boolean"
      ? club.enable_storage
      : Boolean(data?.enable_storage);

  useEffect(() => {
    if (data) {
      setUnits(data.items);
      if (
        club &&
        typeof club.enable_storage !== "boolean" &&
        typeof data.enable_storage === "boolean"
      ) {
          setClub({
            ...club,
            enable_storage: data.enable_storage,
          });
      }
    }
  }, [club, data, setClub]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedLayouts = window.localStorage.getItem(STORAGE_LAYOUTS_KEY);
    if (!savedLayouts) {
      return;
    }

    try {
      setStorageLayouts(JSON.parse(savedLayouts) as Record<string, StorageLayout>);
    } catch {
      window.localStorage.removeItem(STORAGE_LAYOUTS_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_LAYOUTS_KEY,
      JSON.stringify(storageLayouts),
    );
  }, [storageLayouts]);

  const tree = buildTree(units);
  const allUnitsFlat = units;
  const activeParent =
    parentFilter !== "all" && parentFilter !== "top"
      ? units.find((unit) => unit.storage_id === parentFilter)
      : null;

  const visibleUnits =
    allUnitsFlat.length > 0
      ? allUnitsFlat.filter(
          (unit) =>
            (parentFilter === "all"
              ? true
              : (parentFilter === "top" && !unit.parent_id) ||
                (parentFilter !== "top" && unit.parent_id === parentFilter)) &&
            (!searchTerm ||
              unit.storage_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase())),
        )
      : [];

  const parentOptions = units.filter((unit) => {
    if (!filter) {
      return true;
    }

    return unit.storage_name.toLowerCase().includes(filter.toLowerCase());
  });

  const activeChildUnits = activeParent
    ? units.filter((unit) => unit.parent_id === activeParent.storage_id)
    : [];

  const activeParentLayout = activeParent
    ? normalizeStorageLayout(
        activeChildUnits,
        storageLayouts[activeParent.storage_id],
      )
    : null;

  const activeGridSlotCount = activeParentLayout
    ? activeParentLayout.rows * activeParentLayout.columns
    : 0;

  useEffect(() => {
    setIsUnitLayoutCollapsed(false);
  }, [activeParent?.storage_id]);

  const orderedVisibleUnits = activeParent
    ? [...visibleUnits].sort((left, right) => {
        const leftPosition = activeParentLayout?.positions[left.storage_id] ?? Number.MAX_SAFE_INTEGER;
        const rightPosition = activeParentLayout?.positions[right.storage_id] ?? Number.MAX_SAFE_INTEGER;

        if (leftPosition !== rightPosition) {
          return leftPosition - rightPosition;
        }

        return left.storage_name.localeCompare(right.storage_name);
      })
    : visibleUnits;

  const updateActiveParentLayout = (
    updater: (currentLayout: StorageLayout) => StorageLayout,
  ) => {
    if (!activeParent) {
      return;
    }

    setStorageLayouts((currentLayouts) => {
      const existingLayout =
        normalizeStorageLayout(
          activeChildUnits,
          currentLayouts[activeParent.storage_id],
        );

      return {
        ...currentLayouts,
        [activeParent.storage_id]: normalizeStorageLayout(
          activeChildUnits,
          updater(existingLayout),
        ),
      };
    });
  };

  const assignChildUnitToSlot = (childUnitId: string, slot: number | null) => {
    updateActiveParentLayout((currentLayout) => {
      if (slot === null) {
        return currentLayout;
      }

      const normalizedLayout = normalizeStorageLayout(
        activeChildUnits,
        currentLayout,
      );
      const nextPositions = { ...normalizedLayout.positions };
      const previousSlot = nextPositions[childUnitId];

      if (previousSlot === slot) {
        return normalizedLayout;
      }

      const occupyingUnitId = Object.entries(nextPositions).find(
        ([storageId, position]) =>
          storageId !== childUnitId && position === slot,
      )?.[0];

      nextPositions[childUnitId] = slot;

      if (occupyingUnitId) {
        const fallbackSlot =
          typeof previousSlot === "number"
            ? previousSlot
            : Array.from(
                { length: normalizedLayout.rows * normalizedLayout.columns },
                (_, index) => index + 1,
              ).find((candidateSlot) => {
                if (candidateSlot === slot) {
                  return false;
                }

                return !Object.entries(nextPositions).some(
                  ([storageId, position]) =>
                    storageId !== occupyingUnitId && position === candidateSlot,
                );
              });

        if (typeof fallbackSlot === "number") {
          nextPositions[occupyingUnitId] = fallbackSlot;
        } else {
          delete nextPositions[occupyingUnitId];
        }
      }

      return {
        ...normalizedLayout,
        positions: nextPositions,
      };
    });
  };

  const handleSaveActiveLayout = async () => {
    if (!activeParent || !club?.club_account_id || !activeParentLayout) {
      return;
    }

    const missingUnits = activeChildUnits.filter((unit) => {
      const slot = activeParentLayout.positions[unit.storage_id];
      return (
        typeof slot !== "number" ||
        slot < 1 ||
        slot > activeParentLayout.rows * activeParentLayout.columns
      );
    });

    if (missingUnits.length > 0) {
      toast.error(
        `Every child unit must be placed before saving. Missing: ${missingUnits
          .map((unit) => unit.storage_name)
          .join(", ")}`,
      );
      return;
    }

    setIsSavingLayout(true);
    try {
      await updateStorageUnitLayouts(
        activeChildUnits.map((unit) => {
          const gridPosition = activeParentLayout.positions[unit.storage_id];
          const gridRow = Math.ceil(gridPosition / activeParentLayout.columns);
          const gridColumn =
            ((gridPosition - 1) % activeParentLayout.columns) + 1;

          return {
            storage_id: unit.storage_id,
            storage_name: unit.storage_name,
            parent_id: unit.parent_id ?? null,
            price_cents:
              typeof unit.price_cents === "number" ? unit.price_cents : 0,
            club_account_id: club.club_account_id,
            grid_position: gridPosition,
            grid_row: gridRow,
            grid_column: gridColumn,
            layout_rows: activeParentLayout.rows,
            layout_columns: activeParentLayout.columns,
          };
        }),
      );

      setUnits((currentUnits) =>
        currentUnits.map((unit) => {
          if (unit.parent_id !== activeParent.storage_id) {
            return unit;
          }

          const gridPosition = activeParentLayout.positions[unit.storage_id];
          return {
            ...unit,
            grid_position: gridPosition,
            grid_row: Math.ceil(gridPosition / activeParentLayout.columns),
            grid_column: ((gridPosition - 1) % activeParentLayout.columns) + 1,
            layout_rows: activeParentLayout.rows,
            layout_columns: activeParentLayout.columns,
          };
        }),
      );

      setStorageLayouts((currentLayouts) => ({
        ...currentLayouts,
        [activeParent.storage_id]: activeParentLayout,
      }));

      toast.success("Child unit layout saved.");
    } catch {
      toast.error("Failed to save the child unit layout.");
    } finally {
      setIsSavingLayout(false);
    }
  };

  const activeGridSlots = activeParentLayout
    ? Array.from({ length: activeGridSlotCount }, (_, index) => {
        const slotNumber = index + 1;
        const assignedUnit = activeChildUnits.find(
          (unit) => activeParentLayout.positions[unit.storage_id] === slotNumber,
        );

        return {
          slotNumber,
          assignedUnit,
        };
      })
    : [];

  const handleRemoveUnit = async (id: string) => {
    try {
      await removeStorage(id);
      setUnits((prev) =>
        prev
          // Remove the unit itself
          .filter((u) => u.storage_id !== id)
          // Remove the unit from any parent's children
          .map((u) => ({
            ...u,
            children: u.children
              ? u.children.filter((child) => child.storage_id !== id)
              : [],
          })),
      );
    } catch {
      toast.error("Failed to remove unit");
    }
  };

  const setAllValNull = () => {
    setName("");
    setPriceCents(0);
    setPriceInput("");
    setparent_id("");
    setEditingStorage(null);
  };

  const addStorageUnit = async () => {
    // Basic validation
    if (!name || name.trim() === "") {
      // show UI error (toast/snackbar) or set a local error state
      toast.error("Name is required");
      return;
    }

    // Prevent selecting self as parent
    if (
      editingStorage &&
      parent_id &&
      editingStorage.storage_id === parent_id
    ) {
      toast.error("A unit cannot be its own parent");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        storage_id: editingStorage ? editingStorage.storage_id : null,
        storage_name: name.trim(),
        parent_id: parent_id ?? null,
        price_cents: typeof priceCents === "number" ? priceCents : 0,
        club_account_id: club?.club_account_id,
      };

      const res = await createStorageUnit(payload);

      // Expect res to be the created/updated unit. If your API returns differently,
      // adapt this check/res usage accordingly.
      if (!res) {
        throw new Error("No response from createStorageUnit");
      }

      // Normalize server response fields. Example: res.id or res.storage_id
      const serverId = res.id ?? res.storage_id ?? null;
      const serverName = res.name ?? name;
      const serverparent_id =
        res.parent_id ?? res.parent_id ?? parent_id ?? undefined;
      const serverPrice =
        typeof res.price_cents === "number" ? res.price_cents : priceCents;

      if (editingStorage) {
        // Update existing unit in local state using server values
        setUnits((prev) =>
          prev.map((u) =>
            u.storage_id === editingStorage.storage_id
              ? {
                  ...u,
                  storage_name: serverName,
                  parent_id:
                    serverparent_id === null ? undefined : serverparent_id,
                  price_cents: serverPrice,
                }
              : u,
          ),
        );
      } else {
        // Add new unit using server id if present, otherwise fallback to generated id
        const newId = serverId ?? Math.random().toString(36).substr(2, 9);
        setUnits((prev) => [
          ...prev,
          {
            storage_id: newId,
            storage_name: serverName,
            parent_id: serverparent_id === null ? undefined : serverparent_id,
            price_cents: serverPrice,
          },
        ]);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
      // Reset form after success or failure — you may prefer to only reset on success.
      setName("");
      setparent_id(undefined);
      setPriceInput("");
      setPriceCents(0);
      setEditingStorage(null);
      setIsDialogOpen(false);
    }
  };

  const handleToggleStorage = async (enabled: boolean) => {
    if (!club?.club_account_id) {
      return;
    }

    try {
      setIsTogglingStorage(true);
      const response = await updateClubDetails({
        club_account_id: club.club_account_id,
        enable_storage: enabled,
      });

      if (response?.message) {
        setClub({
          ...club,
          enable_storage: enabled,
        });
        toast.success(
          enabled
            ? "Storage enabled successfully"
            : "Storage disabled successfully",
        );
      } else {
        toast.error("Failed to update storage settings");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update storage settings",
      );
    } finally {
      setIsTogglingStorage(false);
    }
  };

  if (!club?.club_account_id) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Loading club details…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="overflow-hidden border-slate-200 bg-linear-to-br from-slate-50 via-white to-sky-50 shadow-sm">
        <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-700 shadow-sm">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Storage Management
                  </h1>
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                    {activeParent ? "Child view" : "Parent view"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 sm:text-base">
                  Organize parent containers, drill into sub-units, and manage storage pricing from one place.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Total units
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{units.length}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Parent containers
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {units.filter((unit) => !unit.parent_id).length}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Current view
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{visibleUnits.length}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {storageEnabled && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowStorageSettings(true)}
                title="Storage settings"
                className="h-11 w-11 rounded-xl border-slate-200 bg-white shadow-sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={() => {
                setName("");
                setPriceCents(0);
                setPriceInput("");
                setparent_id("");
                setEditingStorage(null);
                setIsDialogOpen(true);
              }}
              className="h-11 gap-2 rounded-xl bg-slate-900 px-5 text-white shadow-sm hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Create Storage
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {!storageEnabled && (
          <Card className="overflow-hidden border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm p-0">
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
                    Enable storage to make your units visible to members and start receiving storage requests.
                  </p>
                  <p className="pt-1 text-xs leading-snug text-amber-700/90">
                    Enabling storage and accepting paid storage requests incurs a
                    2% Clubby fee on each paid storage request. Free storage
                    requests do not incur any Clubby fees.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleToggleStorage(true)}
                disabled={isTogglingStorage}
                className="w-full bg-amber-700 text-white hover:bg-amber-800 sm:w-auto"
              >
                {isTogglingStorage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  "Enable Storage"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50/70 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900">Storage Units</CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                  Browse top-level storage units by default, then open a parent to
                  manage its sub-units.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                  {activeParent ? `Viewing ${activeParent.storage_name}` : "Top-level browsing"}
                </Badge>
                <Badge variant="outline" className="border-slate-300 text-slate-600">
                  {visibleUnits.length} shown
                </Badge>
                {activeParentLayout && (
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                    {activeParentLayout.rows} x {activeParentLayout.columns} layout
                  </Badge>
                )}
              </div>
            </div>
            {tree.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    {activeParent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-200 bg-white"
                        onClick={() => {
                          setParentFilter("top");
                          setSearchTerm("");
                        }}
                      >
                        Back to Parent Containers
                      </Button>
                    )}
                    {activeParent && (
                      <span className="text-sm text-slate-600">
                        Viewing children of {activeParent.storage_name}
                      </span>
                    )}
                  </div>
                  <div className="relative w-full lg:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder={
                        activeParent
                          ? "Search child storage units..."
                          : "Search parent storage units..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-white pl-9"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <Label htmlFor="parent-filter" className="text-sm font-medium text-slate-700">
                    Filter by Parent:
                  </Label>
                  <select
                    id="parent-filter"
                    value={parentFilter}
                    onChange={(e) => {
                      setParentFilter(e.target.value);
                      setSearchTerm("");
                    }}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none"
                  >
                    <option value="top">Top-level Units</option>
                    <option value="all">All Units</option>
                    {units
                      .filter((u) => !u.parent_id)
                      .map((u) => (
                        <option key={u.storage_id} value={u.storage_id}>
                          {u.storage_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="bg-white px-6 py-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-sm text-slate-500">
                <Loader2 className="mb-3 h-5 w-5 animate-spin" />
                <span>Loading storage units...</span>
              </div>
            ) : tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-sm text-slate-500">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                  <Package className="h-5 w-5" />
                </div>
                <span>No storage units yet.</span>
                <Button
                  className="mt-4 rounded-xl"
                  variant="outline"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Add your first storage unit
                </Button>
              </div>
            ) : visibleUnits.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-sm text-slate-500">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                  <Search className="h-5 w-5" />
                </div>
                <span>No storage units match this view.</span>
                <Button
                  className="mt-4 rounded-xl"
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="space-y-6 mt-2">
                {activeParentLayout && (
                  <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-sky-50 via-white to-slate-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <button
                            type="button"
                            className="flex items-center gap-2 text-left"
                            onClick={() => setIsUnitLayoutCollapsed((current) => !current)}
                            aria-expanded={!isUnitLayoutCollapsed}
                          >
                            {isUnitLayoutCollapsed ? (
                              <ChevronRight className="h-5 w-5 text-slate-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-slate-500" />
                            )}
                            <h3 className="text-lg font-semibold text-slate-900">
                              Unit Layout
                            </h3>
                          </button>
                          <p className="mt-1 text-sm text-slate-600">
                            {isUnitLayoutCollapsed
                              ? `Layout hidden. ${activeParentLayout.rows} rows, ${activeParentLayout.columns} columns, ${activeGridSlotCount} slots.`
                              : "Choose the grid size for this parent container and place each child unit into a specific slot."}
                          </p>
                        </div>
                        {isUnitLayoutCollapsed ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl border-slate-200 bg-white"
                            onClick={() => setIsUnitLayoutCollapsed((current) => !current)}
                          >
                            Show Layout
                          </Button>
                        ) : (
                          <div className="flex flex-wrap items-end gap-3 lg:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 rounded-xl border-slate-200 bg-white"
                              onClick={() => setIsUnitLayoutCollapsed((current) => !current)}
                            >
                              Hide Layout
                            </Button>
                            <Button
                              type="button"
                              onClick={handleSaveActiveLayout}
                              disabled={isSavingLayout || activeChildUnits.length === 0}
                              className="h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                            >
                              {isSavingLayout ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving Layout...
                                </>
                              ) : (
                                "Save Layout"
                              )}
                            </Button>
                            <div className="w-[104px] space-y-2">
                              <Label htmlFor="layout-rows" className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                                Rows
                              </Label>
                              <Input
                                id="layout-rows"
                                type="number"
                                min="1"
                                max="12"
                                value={activeParentLayout.rows}
                                onChange={(e) => {
                                  const nextRows = Math.max(1, Number(e.target.value) || 1);
                                  updateActiveParentLayout((currentLayout) => {
                                    const maxSlots = nextRows * currentLayout.columns;
                                    const nextPositions = Object.fromEntries(
                                      Object.entries(currentLayout.positions).filter(([, slot]) => slot <= maxSlots),
                                    );

                                    return {
                                      ...currentLayout,
                                      rows: nextRows,
                                      positions: nextPositions,
                                    };
                                  });
                                }}
                                className="h-11 rounded-xl border-slate-200"
                              />
                            </div>
                            <div className="w-[104px] space-y-2">
                              <Label htmlFor="layout-columns" className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                                Columns
                              </Label>
                              <Input
                                id="layout-columns"
                                type="number"
                                min="1"
                                max="12"
                                value={activeParentLayout.columns}
                                onChange={(e) => {
                                  const nextColumns = Math.max(1, Number(e.target.value) || 1);
                                  updateActiveParentLayout((currentLayout) => {
                                    const maxSlots = currentLayout.rows * nextColumns;
                                    const nextPositions = Object.fromEntries(
                                      Object.entries(currentLayout.positions).filter(([, slot]) => slot <= maxSlots),
                                    );

                                    return {
                                      ...currentLayout,
                                      columns: nextColumns,
                                      positions: nextPositions,
                                    };
                                  });
                                }}
                                className="h-11 rounded-xl border-slate-200"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {!isUnitLayoutCollapsed && (
                        <>
                          <div
                            className="grid gap-3"
                            style={{
                              gridTemplateColumns: `repeat(${activeParentLayout.columns}, minmax(0, 1fr))`,
                            }}
                          >
                            {activeGridSlots.map((slot) => (
                              <button
                                key={slot.slotNumber}
                                type="button"
                                className="flex min-h-24 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-slate-300"
                              >
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                                  Slot {slot.slotNumber}
                                </span>
                                {slot.assignedUnit ? (
                                  <>
                                    <span className="text-sm font-semibold text-slate-900">
                                      {slot.assignedUnit.storage_name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {typeof slot.assignedUnit.price_cents === "number"
                                        ? `R${(slot.assignedUnit.price_cents / 100).toFixed(2)}`
                                        : "No price"}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm text-slate-400">Empty slot</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {orderedVisibleUnits.map((unit) => {
                  const childCount = units.filter(
                    (child) => child.parent_id === unit.storage_id,
                  ).length;
                  const hasChildren = childCount > 0;

                  return (
                  <div
                    key={unit.storage_id}
                    className="flex h-full flex-col rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-700 shadow-sm">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block font-bold text-xl text-slate-900">
                            {unit.storage_name}
                          </span>
                          <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            {unit.parent_id ? "Sub-unit" : "Container"}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={hasChildren ? "border-sky-200 bg-sky-50 text-sky-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}
                      >
                        {hasChildren ? `${childCount} children` : "Priced unit"}
                      </Badge>
                    </div>
                    {hasChildren ? (
                      <div className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-sky-800">
                        This container holds {childCount} sub-unit{childCount === 1 ? "" : "s"}.
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                          Price:
                        </span>
                        <div className="mt-1 font-semibold text-2xl text-emerald-900">
                          {typeof unit.price_cents === "number"
                            ? `R${(unit.price_cents / 100).toFixed(2)}`
                            : "—"}
                        </div>
                      </div>
                    )}
                    {unit.parent_id && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                          Parent:
                        </span>
                        <span className="font-medium text-slate-700">
                          {units.find((u) => u.storage_id === unit.parent_id)
                            ?.storage_name || "Unknown"}
                        </span>
                      </div>
                    )}
                    {activeParentLayout && unit.parent_id === activeParent?.storage_id && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <Label
                          htmlFor={`slot-${unit.storage_id}`}
                          className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500"
                        >
                          Grid slot
                        </Label>
                        <select
                          id={`slot-${unit.storage_id}`}
                          value={activeParentLayout.positions[unit.storage_id] ?? ""}
                          onChange={(e) => {
                            assignChildUnitToSlot(unit.storage_id, Number(e.target.value));
                          }}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none"
                        >
                          {Array.from({ length: activeGridSlotCount }, (_, index) => index + 1).map((slotNumber) => {
                            const occupyingUnit = activeChildUnits.find(
                              (childUnit) =>
                                childUnit.storage_id !== unit.storage_id &&
                                activeParentLayout.positions[childUnit.storage_id] === slotNumber,
                            );

                            return (
                              <option key={slotNumber} value={slotNumber}>
                                Slot {slotNumber}
                                {occupyingUnit ? ` (${occupyingUnit.storage_name})` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                    <div className="mt-6 flex flex-wrap gap-2 pt-2">
                      {hasChildren && (
                        <Button
                          size="sm"
                          variant="default"
                          className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                          onClick={() => {
                            setParentFilter(unit.storage_id);
                            setSearchTerm("");
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                          View Sub Units
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-slate-200 bg-white"
                        onClick={() => {
                          setEditingStorage(null);
                          setName("");
                          setparent_id(unit.storage_id);
                          setPriceCents(0);
                          setPriceInput("");
                          setIsDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add Sub Unit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300"
                        onClick={() => {
                          setEditingStorage(unit);
                          setName(unit.storage_name);
                          setparent_id(unit.parent_id);
                          setPriceCents(unit.price_cents || 0);
                          setPriceInput(
                            unit.price_cents
                              ? (unit.price_cents / 100).toFixed(2)
                              : "",
                          );
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                )})}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center justify-between w-full">
                  <span>
                    {editingStorage ? "Edit Storage Unit" : "Add Storage Unit"}
                  </span>
                </div>
              </DialogTitle>

              <DialogDescription>
                {editingStorage
                  ? "Update the details of this storage unit."
                  : "Create a new storage unit or nest it under an existing one."}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addStorageUnit();
              }}
              className="space-y-5 pt-2"
            >
              <div>
                <Label htmlFor="storage-name">Storage Unit Name</Label>
                <Input
                  id="storage-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Storage 1"
                  required
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="storage-price">
                  Pricing
                  <span className="ml-2 text-xs text-muted-foreground">
                    {priceCents
                      ? `(Current: $${(priceCents / 100).toFixed(2)})`
                      : ""}
                  </span>
                </Label>
                <Input
                  id="storage-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPriceInput(val);
                    const cents = Math.round(parseFloat(val || "0") * 100);
                    setPriceCents(isNaN(cents) ? 0 : cents);
                  }}
                  placeholder="e.g. 25.00"
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Enter price. Will be stored as cents.
                </div>
              </div>
              <div>
                <Label htmlFor="parent-unit">Parent Unit</Label>
                <div className="relative mt-1">
                  <button
                    type="button"
                    className="w-full border rounded-full px-2 py-2 text-left bg-white cursor-pointer"
                    onClick={() => setDropdownOpen((open) => !open)}
                  >
                    {parent_id
                      ? units.find((u) => u.storage_id === parent_id)
                          ?.storage_name
                      : "No parent (top-level)"}
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border rounded shadow-lg">
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Filter units..."
                          className="w-full border rounded px-2 py-1 mb-2"
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <ul className="max-h-48 overflow-auto">
                        <li
                          className="px-4 py-2 cursor-pointer hover:bg-muted"
                          onClick={() => {
                            setparent_id(undefined);
                            setDropdownOpen(false);
                            setFilter("");
                          }}
                        >
                          No parent (top-level)
                        </li>
                        {parentOptions.map((unit) => (
                          <li
                            key={unit.storage_id}
                            className="px-4 py-2 cursor-pointer hover:bg-muted"
                            onClick={() => {
                              setparent_id(unit.storage_id);
                              setDropdownOpen(false);
                              setFilter("");
                            }}
                          >
                            {unit.storage_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="pt-4">
                <div className="w-full flex items-center justify-between gap-2">
                  {editingStorage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400"
                      onClick={() => {
                        setAllValNull();
                        setUnitToDelete(editingStorage.storage_id);
                        setIsDialogOpen(false);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash />
                    </Button>
                  )}
                </div>
                {/* Right side: Submit and Close buttons */}
                <div className="flex gap-2">
                  <Button type="submit" className="gap-2" disabled={isSaving}>
                    <Plus className="h-4 w-4" />
                    {editingStorage
                      ? "Update Storage Unit"
                      : "Add Storage Unit"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingStorage(null);
                      setAllValNull();
                    }}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this storage unit? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (unitToDelete) handleRemoveUnit(unitToDelete);
                  setDeleteDialogOpen(false);
                  setUnitToDelete(null);
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showStorageSettings} onOpenChange={setShowStorageSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Storage Settings</DialogTitle>
              <DialogDescription>
                Control whether storage units and requests are available for your club.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-base font-semibold">Enable Storage</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Toggle to enable or disable storage for your club.
                  </p>
                </div>
                <Switch
                  checked={storageEnabled}
                  onCheckedChange={handleToggleStorage}
                  disabled={isTogglingStorage}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStorageSettings(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StorageAdmin;
