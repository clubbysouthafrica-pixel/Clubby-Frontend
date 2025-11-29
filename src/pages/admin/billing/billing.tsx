import { useContext, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useMcsBillingReportingQuery } from "@/queries/admin/useReporting";
import ClubUsageAndCharges from "@/components/admin/billing-and-usage/club-usage-and-charges-report";
import { formatAmount } from "@/data/currencies";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BillingPage() {
    const { club } = useContext(ClubContext) as ClubContextType;
    const [selectedSeason, setSelectedSeason] = useState<string>("current");
    
    const seasonToFetch = selectedSeason === "current" ? undefined : parseInt(selectedSeason);
    
    const { data, isLoading } = useMcsBillingReportingQuery(
        club?.club_account_id as string,
        seasonToFetch
    );

    const availableSeasons = club?.season_cycle ? Array.from(
        { length: club.season_cycle - 1 },
        (_, i) => ({
            value: (club.season_cycle - i - 1).toString(),
            label: `Season ${club.season_cycle - i - 1}`,
        })
    ) : [];

    const hasPreviousSeasons = availableSeasons.length > 0;

    if (isLoading || !data) {
        return (
            <div className="p-5 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }
    return (
        <div className="p-5">
            {hasPreviousSeasons && (
                <div className="flex justify-center mb-6">
                    <div className="w-full max-w-xs">
                        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                            <SelectTrigger className="w-full">
                                <div className="flex-1 text-center">
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="text-center">
                                <SelectItem value="current" className="text-center">Current Season</SelectItem>
                                {availableSeasons.map((season) => (
                                    <SelectItem key={season.value} value={season.value} className="text-center">
                                        {season.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
            <h3 className="text-xl font-bold mb-4 pb-2">You Owe Clubby: {formatAmount(data.report.total_outstanding_amount, club?.currency)}</h3>
            <div className="@container/main flex flex-1 flex-col gap-1">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                    <ClubUsageAndCharges
                        data={data.report ?? {}}
                        currency={club?.currency ?? "ZAR"}
                    />
                </div>
            </div>
        </div>
    );
}