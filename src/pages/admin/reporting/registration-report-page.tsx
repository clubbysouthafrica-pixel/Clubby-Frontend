import { useContext, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";
import { RegistrationReportData } from "@/components/registration-report-data-table";
import { Card } from "@/components/ui/card";
import { Loader2, Download, BarChart3 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegistrationReportPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [showOldFields, setShowOldFields] = useState<boolean>(false);

  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason);

  const { data, isLoading } = useRegistrationBillingReportingQuery(
    club?.club_account_id as string,
    seasonToFetch,
  );

  const availableSeasons = club?.season_cycle
    ? Array.from({ length: club.season_cycle - 1 }, (_, i) => ({
        value: (club.season_cycle - i - 1).toString(),
        label: `Season ${club.season_cycle - i - 1}`,
      }))
    : [];

  const hasPreviousSeasons = availableSeasons.length > 0;

  const handleDownloadReport = () => {
    if (!data) return;

    // Build CSV content from registration report data
    const report = Array.isArray(data.report) ? data.report : [];
    const csvSections: string[] = [];

    report.forEach((item: any, index: number) => {
      if (index > 0) {
        csvSections.push("");
        csvSections.push("");
      }
      const fieldName =
        item.table_name +
        (item.old_field ? " (OLD FIELD - PREVIOUSLY EXISTED)" : "");
      csvSections.push(`"========== ${fieldName} =========="`);
      csvSections.push("");

      if (item.rows && item.rows.length > 0) {
        item.rows.forEach((row: any) => {
          const optionName = row.row_name + (row.old_field ? " (OLD)" : "");
          csvSections.push(
            `"Option: ${optionName}","Fee: ${row.fee_amount || "Custom/Free"}"`,
          );
          csvSections.push(
            `"Date","Total","Paid to Club","Pending","Due to Club"`,
          );

          if (row.data && row.data.length > 0) {
            row.data.forEach((dataItem: any) => {
              csvSections.push(
                `"${dataItem.date}","${dataItem.total}","${dataItem.paid_to_club}","${dataItem.pending}","${dataItem.due_to_club}"`,
              );
            });
          }
          csvSections.push(
            `"TOTAL","${row.total.total}","${row.total.paid_to_club}","${row.total.pending}","${row.total.due_to_club}"`,
          );
          csvSections.push("");
        });
      } else if (item.data && item.data.length > 0) {
        csvSections.push(`"Fee: ${item.fee_amount || "Custom/Free"}"`);
        csvSections.push(
          `"Date","Total","Paid to Club","Pending","Due to Club"`,
        );

        item.data.forEach((dataItem: any) => {
          csvSections.push(
            `"${dataItem.date}","${dataItem.total}","${dataItem.paid_to_club}","${dataItem.pending}","${dataItem.due_to_club}"`,
          );
        });

        csvSections.push(
          `"TOTAL","${item.total?.total || 0}","${item.total?.paid_to_club || 0}","${item.total?.pending || 0}","${item.total?.due_to_club || 0}"`,
        );
      }
    });

    const csvContent = csvSections.join("\n");
    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    element.href = URL.createObjectURL(file);
    const timestamp = new Date().toISOString().split("T")[0];
    element.download = `Registration_Billing_Report_${timestamp}.csv`;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (clubLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-inner">
              <BarChart3 className="h-7 w-7 text-primary" />
            </span>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Registration Billing
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
                Analyze each registration fee with monthly totals, pending
                counts, paid amounts, and amounts due to your club.
              </p>
            </div>
          </div>
          {hasPreviousSeasons && (
            <div className="w-full md:w-auto">
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-full md:w-[220px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
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
          )}
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              Loading registration billing...
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
          <Tabs defaultValue="billing" className="w-full">
            {/* Tab Navigation (for extensibility, only one tab for now) */}
            <div className="sticky top-[88px] z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
              <TabsList className="flex gap-2 bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="billing"
                  className="px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Billing
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="py-8">
              <TabsContent value="billing" className="animate-fade-in">
                <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 mb-8 border border-slate-100 dark:border-slate-800">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm px-4 py-3 flex items-center gap-3">
                      <Checkbox
                        id="show-old-fields"
                        checked={showOldFields}
                        onCheckedChange={(checked) =>
                          setShowOldFields(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="show-old-fields"
                        className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Show old fields
                      </Label>
                    </div>
                  </div>
                  {data && (
                    <div className="flex flex-col gap-4">
                      <RegistrationReportData
                        data={data}
                        currency={club?.currency as string}
                        showOldFields={showOldFields}
                      />
                      <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                        <button
                          onClick={handleDownloadReport}
                          className="inline-flex items-center gap-2 px-5 py-3 text-base font-semibold rounded-lg bg-primary/90 text-white hover:bg-primary transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          title="Download report data as CSV"
                        >
                          <Download className="h-5 w-5" />
                          Export Report
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      )}
    </div>
  );
}
