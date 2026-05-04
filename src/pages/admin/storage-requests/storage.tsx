import React, { useContext, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash, ArrowUpRight, AlertCircle, Loader2, Settings } from "lucide-react";
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
  children?: StorageUnit[];
};

const initialUnits: StorageUnit[] = [];

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
  const [parentFilter, setParentFilter] = useState<string | "all">("all");
  const [isSaving, setIsSaving] = useState(false);

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

  const allUnitsFlat = units; // Flat list of all units

  const filteredUnits =
    allUnitsFlat.length > 0
      ? allUnitsFlat?.filter(
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

  const tree = buildTree(units);

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Storage Management
            </h1>
            <p className="text-muted-foreground">
              Create and organize storage units and sub-units for bookings.
            </p>
          </div>

          <div className="flex gap-2">
            {storageEnabled && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowStorageSettings(true)}
                title="Storage settings"
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
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Storage
            </Button>
          </div>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Storage Units</CardTitle>
            <CardDescription>
              Organize your storage units. Add sub-units directly from each
              card.
            </CardDescription>
            {tree.length > 0 && (
              <div className="mt-4 flex space-x-4">
                <div className="flex flex-1 items-center gap-4 mb-4">
                  <Label
                    htmlFor="parent-filter"
                    className="text-sm font-medium"
                  >
                    Filter by Parent:
                  </Label>
                  <select
                    id="parent-filter"
                    value={parentFilter}
                    onChange={(e) => setParentFilter(e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="all">All Units</option>
                    <option value="top">Top-level Units</option>
                    {units
                      .filter((u) => !u.parent_id)
                      .map((u) => (
                        <option key={u.storage_id} value={u.storage_id}>
                          {u.storage_name}
                        </option>
                      ))}
                  </select>
                </div>
                <Input
                  type="text"
                  placeholder="Search storage units..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full flex-1"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                <span>Loading...</span>
              </div>
            ) : tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                <span>No storage units yet.</span>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Add your first storage unit
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                {filteredUnits.map((unit) => (
                  <div
                    key={unit.storage_id}
                    className="bg-white shadow-sm hover:shadow-lg rounded-xl p-6 flex flex-col border transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/*<Folder className="h-6 w-6 text-primary" />*/}
                        <span className="font-bold text-xl">
                          {unit.storage_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-muted-foreground text-sm flex items-center gap-1">
                        Price:
                      </span>
                      <span className="font-semibold text-lg">
                        {typeof unit.price_cents === "number"
                          ? `${(unit.price_cents / 100).toFixed(2)}`
                          : "—"}
                      </span>
                    </div>
                    {unit.parent_id && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-muted-foreground text-sm flex items-center gap-1">
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                          Parent:
                        </span>
                        <span className="font-medium text-blue-700">
                          {units.find((u) => u.storage_id === unit.parent_id)
                            ?.storage_name || "Unknown"}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
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
                        className="flex items-center gap-2"
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
                ))}
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
                        {filteredUnits.map((unit) => (
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
