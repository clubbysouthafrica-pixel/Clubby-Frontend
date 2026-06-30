import { useContext, useRef, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";
import { RegistrationReportData } from "@/components/registration-report-data-table";
import {
  RegistrationReportDropDown,
  RegistrationReportRowDataItem,
  RegistrationRowData,
} from "@/interfaces/report";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Download } from "lucide-react";

export default function RegistrationReportingPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const reportingSectionRef = useRef<HTMLElement | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [showOldFields, setShowOldFields] = useState<boolean>(true);

  const seasonCycle = (club as { season_cycle?: number } | null)?.season_cycle;
  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason, 10);
  const availableSeasons = seasonCycle
    ? Array.from({ length: seasonCycle - 1 }, (_, index) => ({
        value: (seasonCycle - index - 1).toString(),
        label: `Season ${seasonCycle - index - 1}`,
      }))
    : [];

  const { data: registrationBillingData, isLoading: registrationBillingLoading } =
    useRegistrationBillingReportingQuery(
      club?.club_account_id as string,
      seasonToFetch,
    );

  const scrollReportingSectionIntoView = () => {
    window.setTimeout(() => {
      reportingSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  };

  const handleDownloadRegistrationBillingReport = () => {
    if (!registrationBillingData) return;

    const report = Array.isArray(registrationBillingData.report)
      ? (registrationBillingData.report as RegistrationReportDropDown[])
      : [];
    const csvSections: string[] = [];

    report.forEach((item: RegistrationReportDropDown, index: number) => {
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
        item.rows.forEach((row: RegistrationRowData) => {
          const optionName = row.row_name + (row.old_field ? " (OLD)" : "");
          csvSections.push(
            `"Option: ${optionName}","Fee: ${row.fee_amount || "Custom/Free"}"`,
          );
          csvSections.push(
            '"Date","Total","Paid to Club","Pending","Due to Club"',
          );

          if (row.data && row.data.length > 0) {
            row.data.forEach((dataItem: RegistrationReportRowDataItem) => {
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
          '"Date","Total","Paid to Club","Pending","Due to Club"',
        );

        item.data.forEach((dataItem: RegistrationReportRowDataItem) => {
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

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section
        ref={reportingSectionRef}
        className="px-6 py-8"
      >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Registration Reporting
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review registration revenue trends, pending balances, and field-level billing performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableSeasons.length > 0 && (
              <Select
                value={selectedSeason}
                onValueChange={(value) => {
                  setSelectedSeason(value);
                  scrollReportingSectionIntoView();
                }}
              >
                <SelectTrigger className="h-9 w-[160px] border-slate-200 bg-white text-sm text-slate-700 shadow-none">
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
            )}
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 text-sm text-slate-600">
              <Switch
                id="show-old-registration-fields"
                checked={showOldFields}
                onCheckedChange={(checked) => {
                  setShowOldFields(checked);
                  scrollReportingSectionIntoView();
                }}
              />
              <span>Show old fields</span>
            </label>
            <button
              onClick={handleDownloadRegistrationBillingReport}
              disabled={!registrationBillingData}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              title="Download registration billing data as CSV"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {registrationBillingLoading ? (
          <div className="flex min-h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : registrationBillingData ? (
          <RegistrationReportData
            data={registrationBillingData}
            currency={club?.currency as string}
            showOldFields={showOldFields}
            onInteract={scrollReportingSectionIntoView}
          />
        ) : (
          <div className="flex min-h-48 items-center justify-center text-sm text-slate-400">
            No registration billing data available.
          </div>
        )}
      </section>
    </div>
  );
}
