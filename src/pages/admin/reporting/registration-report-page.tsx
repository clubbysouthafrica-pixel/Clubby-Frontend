import { useContext, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";
import { RegistrationReportData } from "@/components/registration-report-data-table";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegistrationReportPage() {
  const { club, isLoading: clubLoading } = useContext(ClubContext) as ClubContextType;
  const [selectedSeason, setSelectedSeason] = useState<string>("current");

  const seasonToFetch = selectedSeason === "current" ? undefined : parseInt(selectedSeason);

  const { data, isLoading } = useRegistrationBillingReportingQuery(club?.club_account_id as string, seasonToFetch);

  const availableSeasons = club?.season_cycle ? Array.from(
    { length: club.season_cycle - 1 },
    (_, i) => ({
      value: (club.season_cycle - i - 1).toString(),
      label: `Season ${club.season_cycle - i - 1}`,
    })
  ) : [];

  const hasPreviousSeasons = availableSeasons.length > 0;

  if (clubLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Registration Billing</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Analyze each registration fee with monthly totals, pending counts, paid amounts and amounts due to your club.</p>
      </div>

      {hasPreviousSeasons && (
        <div className="flex justify-center">
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

      {isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && (
        <Card className="p-6 shadow-sm border-none shadow-none">
          {data && <RegistrationReportData data={data} currency={club?.currency as string} />}
        </Card>
      )}
    </div>
  );
}