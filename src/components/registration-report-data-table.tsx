import { useState, useMemo } from "react";
import {
  RegistrationReport,
  RegistrationReportDropDown,
  RegistrationReportRowDataItem,
  RegistrationRowData,
} from "@/interfaces/report";
import {
  RegistrationBillingChart,
  StackedRegistrationBillingChart,
} from "@/components/admin/reporting/general-reporting/charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";
import { formatAmount } from "@/data/currencies";
import "../index.css";

interface Props {
  data: RegistrationReport;
  currency: string;
  showOldFields?: boolean;
  onInteract?: () => void;
}

const ALL_OPTIONS = "__all__";

export function RegistrationReportData({
  data,
  currency,
  showOldFields = true,
  onInteract,
}: Props) {
  const filteredReport = useMemo(
    () =>
      showOldFields
        ? (data?.report as RegistrationReportDropDown[])
        : (data?.report as RegistrationReportDropDown[]).filter(
            (c) => !c.old_field && !c.old_option,
          ),
    [data, showOldFields],
  );

  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    () => filteredReport[0]?.field_id ?? "",
  );
  const [selectedRowId, setSelectedRowId] = useState<string>(ALL_OPTIONS);

  const selectedField =
    filteredReport.find((c) => c.field_id === selectedFieldId) ??
    filteredReport[0];

  const handleFieldChange = (value: string) => {
    setSelectedFieldId(value);
    setSelectedRowId(ALL_OPTIONS);
    onInteract?.();
  };

  const filteredRows = useMemo<RegistrationRowData[]>(() => {
    if (!selectedField?.rows) return [];
    return showOldFields
      ? selectedField.rows
      : selectedField.rows.filter((r) => !r.old_field);
  }, [selectedField, showOldFields]);

  const stackedSeries = useMemo(() => {
    if (!filteredRows.length) return [];
    if (selectedRowId === ALL_OPTIONS) {
      return filteredRows.map((r) => ({
        name: r.row_name,
        data: r.data as RegistrationReportRowDataItem[],
      }));
    }
    const row = filteredRows.find((r) => r.option_order_id === selectedRowId);
    if (!row) return [];
    return [
      {
        name: row.row_name,
        data: row.data as RegistrationReportRowDataItem[],
      },
    ];
  }, [filteredRows, selectedRowId]);

  const summaryStats = useMemo(() => {
    if (!selectedField) return { paid: 0, due: 0, pending: 0, total: 0 };

    if (filteredRows.length > 0) {
      if (selectedRowId === ALL_OPTIONS) {
        return filteredRows.reduce(
          (acc, r) => ({
            paid: acc.paid + (r.total?.paid_to_club ?? 0),
            due: acc.due + (r.total?.due_to_club ?? 0),
            pending: acc.pending + (r.total?.pending ?? 0),
            total: acc.total + (r.total?.total ?? 0),
          }),
          { paid: 0, due: 0, pending: 0, total: 0 },
        );
      }
      const row = filteredRows.find((r) => r.option_order_id === selectedRowId);
      return {
        paid: row?.total?.paid_to_club ?? 0,
        due: row?.total?.due_to_club ?? 0,
        pending: row?.total?.pending ?? 0,
        total: row?.total?.total ?? 0,
      };
    }

    return {
      paid: selectedField.total?.paid_to_club ?? 0,
      due: selectedField.total?.due_to_club ?? 0,
      pending: selectedField.total?.pending ?? 0,
      total: selectedField.total?.total ?? 0,
    };
  }, [selectedField, filteredRows, selectedRowId]);

  if (!data || !data.report || filteredReport.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-100 text-sm text-slate-400">
        No registration billing data available.
      </div>
    );
  }

  const selectedRow =
    selectedRowId !== ALL_OPTIONS
      ? filteredRows.find((r) => r.option_order_id === selectedRowId)
      : null;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Summary stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Collected", value: formatAmount(summaryStats.paid, currency) },
            { label: "Total Due", value: formatAmount(summaryStats.due, currency) },
            { label: "Pending", value: formatAmount(summaryStats.pending, currency) },
            { label: "Total Billed", value: formatAmount(summaryStats.total, currency) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Selectors + title row */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Category selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Category</label>
            <Select
              value={selectedField?.field_id ?? ""}
              onValueChange={handleFieldChange}
            >
              <SelectTrigger className="h-9 w-[220px] border-slate-200 bg-white text-sm text-slate-700 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredReport.map((c) => (
                  <SelectItem key={c.field_id} value={c.field_id}>
                    <span className="flex items-center gap-2">
                      <span>{c.table_name}</span>
                      {(c.old_field || c.old_option) && (
                        <Badge
                          variant="destructive"
                          className="py-0 px-1 text-[10px]"
                        >
                          Old
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Option selector — only when rows exist */}
          {filteredRows.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Option</label>
              <Select
                value={selectedRowId}
                onValueChange={(v) => {
                  setSelectedRowId(v);
                  onInteract?.();
                }}
              >
                <SelectTrigger className="h-9 w-[220px] border-slate-200 bg-white text-sm text-slate-700 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTIONS}>All options (stacked)</SelectItem>
                  {filteredRows.map((r) => (
                    <SelectItem key={r.option_order_id} value={r.option_order_id}>
                      <span className="flex items-center gap-2">
                        <span>{r.row_name}</span>
                        {r.old_field && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="destructive"
                                className="py-0 px-1 text-[10px]"
                              >
                                Old
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              This option no longer exists in the current
                              registration form
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active label */}
          <div className="ml-auto text-right">
            <p className="text-sm font-semibold text-slate-900">
              {selectedField?.table_name}
              {selectedRow
                ? ` — ${selectedRow.row_name}`
                : filteredRows.length > 0
                  ? " — All options"
                  : ""}
            </p>
            <p className="text-xs text-slate-400">Monthly registration billing</p>
          </div>
        </div>

        {/* Chart */}
        {filteredRows.length > 0 ? (
          stackedSeries.length > 0 ? (
            <StackedRegistrationBillingChart
              series={stackedSeries}
              currency={currency}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-slate-100 text-sm text-slate-400">
              No data available for this selection.
            </div>
          )
        ) : selectedField?.data ? (
          <RegistrationBillingChart
            data={selectedField.data as RegistrationReportRowDataItem[]}
            currency={currency}
          />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-100 text-sm text-slate-400">
            No data available.
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
