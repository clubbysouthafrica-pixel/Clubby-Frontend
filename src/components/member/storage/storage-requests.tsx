import React, { useContext, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Folder, User } from "lucide-react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubStorageRequests } from "@/queries/admin-features/storage";

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
  const { club } = useContext(ClubContext) as ClubContextType;
  const clubId = club?.club_account_id as string | undefined;

  const { data, isLoading, isError } = useFetchClubStorageRequests(
    clubId ?? undefined,
  );

  // Normalize into flat requests array:
  // Supports two shapes:
  // 1) data.items => array of units { id, name, requests: [...] }
  // 2) data.items => array of request objects (already flat)
  const requests = useMemo(() => {
    if (!data) return [];

    // If API returns { items: [...] }
    const items = (data as any).items ?? data;

    if (!Array.isArray(items)) return [];

    // Detect if items are units-with-requests (unit.requests present)
    if (
      items.length > 0 &&
      items[0] &&
      Array.isArray((items[0] as any).requests)
    ) {
      // Flatten unit.requests and attach storage info
      return (items as any[]).flatMap((unit) =>
        (unit.requests || []).map((req: any) => ({
          ...req,
          storageName: unit.storage_name ?? unit.name ?? unit.storageName,
          storageId: unit.storage_id ?? unit.id ?? unit.storageId,
        })),
      );
    }

    // Otherwise assume items are request objects already
    return (items as any[]).map((req) => ({
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

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Storage Requests</CardTitle>
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
                  {requests.map((r: any) => (
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
    </div>
  );
}
