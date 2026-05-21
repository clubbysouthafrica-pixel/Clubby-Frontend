import { useContext, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Folder, Settings } from "lucide-react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubStorageRequests } from "@/queries/admin-features/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateClubDetails } from "@/services/admin/club";
import { toast } from "sonner";

type StorageRequestRecord = {
  id?: string;
  request_id?: string;
  request_status?: string;
  status?: string;
  storageName?: string;
  storageId?: string;
  storage_name?: string;
  storage_id?: string;
  user?: string;
  requestedBy?: string;
  user_id?: string;
  date?: string;
  requested_at?: string;
  created_at?: string;
  costCents?: number;
  price_cents?: number;
  paid?: boolean;
  paymentMethod?: string;
  payment_method?: string;
  storage?: {
    name?: string;
    id?: string;
  };
};

type StorageRequestGroup = {
  id?: string;
  storage_id?: string;
  storageId?: string;
  storage_name?: string;
  storageName?: string;
  name?: string;
  requests?: StorageRequestRecord[];
};

const statusColors: Record<string, string> = {
  pending: "text-yellow-600",
  approved: "text-green-600",
  rejected: "text-red-600",
};

function formatAmount(cents?: number) {
  if (typeof cents !== "number") return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function MemberStorageRequests() {
  const { club, setClub } = useContext(ClubContext) as ClubContextType;
  const clubId = club?.club_account_id as string | undefined;
  const [showStorageSettings, setShowStorageSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const { data, isLoading, isError } = useFetchClubStorageRequests(
    clubId ?? undefined,
  );

  const storageRebookingProtectionEnabled =
    typeof club?.storage_rebooking_protection_enabled === "boolean"
      ? club.storage_rebooking_protection_enabled
      : true;

  // Normalize into flat requests array:
  // Supports two shapes:
  // 1) data.items => array of units { id, name, requests: [...] }
  // 2) data.items => array of request objects (already flat)
  const requests = useMemo(() => {
    if (!data) return [];

    const source = data as
      | { items?: StorageRequestGroup[] | StorageRequestRecord[] }
      | StorageRequestRecord[];
    const items = Array.isArray(source)
      ? source
      : Array.isArray(source.items)
        ? source.items
        : [];

    if (!Array.isArray(items)) return [];

    // Detect if items are units-with-requests (unit.requests present)
    if (
      items.length > 0 &&
      items[0] &&
      "requests" in items[0] &&
      Array.isArray(items[0].requests)
    ) {
      // Flatten unit.requests and attach storage info
      return (items as StorageRequestGroup[]).flatMap((unit) =>
        (unit.requests || []).map((req) => ({
          ...req,
          storageName: unit.storage_name ?? unit.name ?? unit.storageName,
          storageId: unit.storage_id ?? unit.id ?? unit.storageId,
        })),
      );
    }

    // Otherwise assume items are request objects already
    return (items as StorageRequestRecord[]).map((req) => ({
      ...req,
      // Ensure storageName/storageId exist if nested under different fields
      storageName: req.storage_name ?? req.storageName ?? req.storage?.name,
      storageId: req.storage_id ?? req.storageId ?? req.storage?.id,
    }));
  }, [data]);

  // Optional: if you want to show only the current user's requests, filter here.
  // For now we display all returned requests (the backend for member routes often returns only the user's requests).

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-6 px-4 text-center text-red-600">
        Unable to load your storage requests.
      </div>
    );
  }

  const handleToggleRebookingProtection = async (enabled: boolean) => {
    if (!clubId || !club) {
      toast.error("Unable to update storage settings right now.");
      return;
    }

    setIsSavingSettings(true);

    try {
      await updateClubDetails({
        club_account_id: clubId,
        storage_rebooking_protection_enabled: enabled,
      });

      setClub({
        ...club,
        storage_rebooking_protection_enabled: enabled,
      });

      toast.success(
        enabled
          ? "Storage rebooking protection enabled"
          : "Storage rebooking protection disabled",
      );
    } catch {
      toast.error("Failed to update storage settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Your Storage Requests</CardTitle>
            <CardDescription className="mt-1">
              Review storage requests and manage season rebooking protection.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowStorageSettings(true)}
            title="Storage settings"
            className="shrink-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              You have no storage requests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="min-w-[160px]">Storage</TableHead>
                    <TableHead className="min-w-[160px]">
                      Requested On
                    </TableHead>
                    <TableHead className="min-w-[120px]">Cost</TableHead>
                    <TableHead className="min-w-[120px]">Payment</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[140px] text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow
                      key={
                        r.id ??
                        r.request_id ??
                        `${r.storageId}-${r.user_id}-${r.date}`
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {r.storageName ?? r.storage_name ?? "Storage"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {r.user ?? r.requestedBy ?? ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs">
                          {r.date ?? r.requested_at ?? r.created_at ?? "—"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-primary">
                          {typeof r.costCents === "number"
                            ? formatAmount(r.costCents)
                            : typeof r.price_cents === "number"
                              ? formatAmount(r.price_cents)
                              : "—"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div
                            className={`font-semibold text-xs ${r.paid ? "text-green-600" : "text-red-600"}`}
                          >
                            {r.paid ? "Paid" : "Unpaid"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.paymentMethod ??
                              r.payment_method ??
                              (r.paid ? "—" : "—")}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`font-semibold text-xs ${statusColors[r.status ?? r.request_status ?? "pending"]}`}
                        >
                          {((r.status ?? r.request_status) || "pending")
                            .toString()
                            .charAt(0)
                            .toUpperCase() +
                            ((r.status ?? r.request_status) || "pending")
                              .toString()
                              .slice(1)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => {}}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showStorageSettings} onOpenChange={setShowStorageSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Storage Settings</DialogTitle>
            <DialogDescription>
              Control how existing storage holders are protected for the next season.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-base font-semibold">
                  Protect current users for next season
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  When enabled, a user&apos;s current storage can be blocked out so they get first chance to rebook it for the next season before someone else takes it.
                </p>
              </div>
              <Switch
                checked={storageRebookingProtectionEnabled}
                onCheckedChange={handleToggleRebookingProtection}
                disabled={isSavingSettings}
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
  );
}
