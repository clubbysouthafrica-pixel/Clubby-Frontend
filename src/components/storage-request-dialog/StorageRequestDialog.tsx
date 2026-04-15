import { useMemo, useState } from "react";
import { createStorageRequest } from "@/services/storage";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

type StorageItem = {
    id?: string;
    storage_id?: string;
    name?: string;
    storage_name?: string;
    priceCents?: number;
    price_cents?: number;
    storage_request_id?: string;
    storageRequestId?: string;
    date?: string;
    costCents?: number;
    cost_cents?: number;
    paymentMethod?: string;
    payment_method?: string;
    paid?: boolean;
    paymentIntentId?: string | null;
    payment_intent_id?: string | null;
    notes?: string | null;
    club_account_id?: string;
    clubAccountId?: string;
};

interface Props {
    clubAccountId: string;
    selectedStorageItem: StorageItem | null;
    setSelectedStorageItem: (item: StorageItem | null) => void;
}

export default function StorageRequestDialog({clubAccountId, selectedStorageItem, setSelectedStorageItem}: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const storageDetails = useMemo(() => {
        if (!selectedStorageItem) return null;
        const name = selectedStorageItem.storage_name ?? selectedStorageItem.name ?? "Selected storage";
        const id = selectedStorageItem.storage_id ?? selectedStorageItem.id ?? "—";
        const priceCents =
            typeof selectedStorageItem.price_cents === "number"
                ? selectedStorageItem.price_cents
                : typeof selectedStorageItem.priceCents === "number"
                    ? selectedStorageItem.priceCents
                    : undefined;
        return { name, id, priceCents };
    }, [selectedStorageItem]);

    const createStorageRequst = async() => {
        try {
            if (!selectedStorageItem) return;
            setIsSubmitting(true);
            await createStorageRequest({
                club_account_id: clubAccountId,
                storage_request_id:
                    selectedStorageItem.storage_request_id ??
                    selectedStorageItem.storageRequestId ??
                    undefined,
                storage_id: selectedStorageItem.storage_id ?? selectedStorageItem.id,
                date: selectedStorageItem.date ?? new Date().toISOString(),
                paymentMethod: "TBD",
                costCents:
                    selectedStorageItem.costCents ??
                    selectedStorageItem.cost_cents ??
                    selectedStorageItem.priceCents ??
                    selectedStorageItem.price_cents,
            });
            setSelectedStorageItem(null);
            // Optionally, you can add success handling here (e.g., show a success message)
        } catch (error) {
            console.error("Error creating storage request:", error);
            // Optionally, you can add error handling here (e.g., show an error message)
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
      <Dialog
        open={selectedStorageItem !== null}
        onOpenChange={(open) => !open && setSelectedStorageItem(null)}
        >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm your order</DialogTitle>
                        <DialogDescription>
                            Review the storage details below, then create your request.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg border bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Storage unit</div>
                                <div className="text-base font-semibold">
                                    {storageDetails?.name ?? "—"}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Price</div>
                                <div className="text-base font-semibold">
                                    {typeof storageDetails?.priceCents === "number"
                                        ? `ZAR ${(storageDetails.priceCents / 100).toFixed(2)}`
                                        : "—"}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                            Unit ID: {storageDetails?.id ?? "—"}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedStorageItem(null)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={createStorageRequst}
                            disabled={!selectedStorageItem || isSubmitting}
                        >
                            {isSubmitting ? "Creating..." : "Create request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
      </Dialog>
    )
}