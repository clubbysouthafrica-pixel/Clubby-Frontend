import { useContext, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";
import { RegistrationReportData } from "@/components/registration-report-data-table";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegistrationReportPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext
  ) as ClubContextType;
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [showOldFields, setShowOldFields] = useState<boolean>(false);

  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason);

  const { data, isLoading } = useRegistrationBillingReportingQuery(
    club?.club_account_id as string,
    seasonToFetch
  );

  const availableSeasons = club?.season_cycle
    ? Array.from({ length: club.season_cycle - 1 }, (_, i) => ({
        value: (club.season_cycle - i - 1).toString(),
        label: `Season ${club.season_cycle - i - 1}`,
      }))
    : [];

  const hasPreviousSeasons = availableSeasons.length > 0;

  if (clubLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Registration Billing
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Analyze each registration fee with monthly totals, pending counts,
          paid amounts and amounts due to your club.
        </p>
      </div>

      {/* Filters Section */}
      <div className="flex justify-center">
        <div className="space-y-3 w-fit">
          <div className="space-y-3">
            {/* Season Filter */}
            {hasPreviousSeasons && (
              <div className="space-y-2 bg-gray-100 rounded-lg p-3 w-[200px]">
                <div>
                  <Select
                    value={selectedSeason}
                    onValueChange={setSelectedSeason}
                  >
                    <SelectTrigger
                      id="season-select"
                      className="w-full text-center border-0 bg-white"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Season</SelectItem>
                      {availableSeasons.map((season) => (
                        <SelectItem key={season.value} value={season.value}>
                          {season.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2 flex justify-center">
              <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-gray-100">
                <Checkbox
                  id="show-old-fields"
                  checked={showOldFields}
                  onCheckedChange={(checked) =>
                    setShowOldFields(checked as boolean)
                  }
                />
                <Label
                  htmlFor="show-old-fields"
                  className="cursor-pointer text-sm font-medium"
                >
                  Show old fields
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && (
        <Card className="p-6 shadow-sm border-none shadow-none">
          {data && (
            <RegistrationReportData
              data={data}
              currency={club?.currency as string}
              showOldFields={showOldFields}
            />
          )}
        </Card>
      )}
    </div>
  );
}
