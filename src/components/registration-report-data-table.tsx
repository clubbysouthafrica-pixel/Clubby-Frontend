import {
  RegistrationReport,
  RegistrationReportDropDown,
  RegistrationReportRowDataItem,
  RegistrationRowData,
} from "@/interfaces/report";
import { RegistrationBillingChart } from "@/components/admin/reporting/general-reporting/charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { formatAmount } from "@/data/currencies";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";
import "../index.css";

interface props {
  data: RegistrationReport;
  currency: string;
  showOldFields?: boolean;
}

export function RegistrationReportData({
  data,
  currency,
  showOldFields = true,
}: props) {
  const sectionTabsListClass =
    "inline-flex h-auto max-w-full flex-wrap justify-start gap-2 bg-transparent p-0";
  const sectionTabsTriggerClass =
    "h-8 max-w-full rounded-full border border-slate-200 bg-white px-3.5 text-left text-xs font-medium text-slate-600 shadow-none transition data-[state=active]:border-zinc-700 data-[state=active]:bg-zinc-700 data-[state=active]:text-white";

  const isCustomAmount = (
    total: any,
    fee_amount: number | null | undefined,
  ) => {
    if (fee_amount && fee_amount > 0) return false;
    return total && (total.paid_to_club > 0 || total.due_to_club > 0);
  };

  const isFree = (total: any, fee_amount: number | null | undefined) => {
    if (fee_amount && fee_amount > 0) return false;
    return (
      fee_amount === null ||
      fee_amount === 0 ||
      fee_amount === undefined ||
      (total &&
        total.paid_to_club === 0 &&
        total.due_to_club === 0 &&
        total.total === 0)
    );
  };

  // Filter out old fields if showOldFields is false
  const filteredReport = showOldFields
    ? (data?.report as RegistrationReportDropDown[])
    : (data?.report as RegistrationReportDropDown[]).filter(
        (c) => !c.old_field && !c.old_option,
      );

  if (!data || !data.report || filteredReport.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-[20px] border border-slate-200 bg-white text-sm text-slate-500">
        No data to display yet
      </div>
    );
  }

  const getFeeSummaryLabel = (
    total: any,
    feeAmount: number | null | undefined,
  ) => {
    if (isCustomAmount(total, feeAmount)) {
      return "Custom Amount";
    }

    if (isFree(total, feeAmount)) {
      return "Free";
    }

    return `${formatAmount(feeAmount ?? 0, currency)} each`;
  };

  const renderTrendSection = (trendData: RegistrationReportRowDataItem[]) => (
    <div className="space-y-4">
      <RegistrationBillingChart data={trendData} currency={currency} />
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Tabs defaultValue={filteredReport[0]?.field_id} className="space-y-4">
          <div className="rounded-[18px] border border-slate-200/70 bg-slate-50/90 p-1.5 backdrop-blur">
          <TabsList className={sectionTabsListClass}>
            {filteredReport.map((c: RegistrationReportDropDown) => (
              <TabsTrigger
                className={sectionTabsTriggerClass}
                key={c.field_id}
                value={c.field_id}
              >
                <span className="flex max-w-full items-center gap-2">
                  <span className="truncate">
                  {c.table_name.length > 20
                    ? `${c.table_name.slice(0, 20)}...`
                    : c.table_name}
                  </span>
                  {(c.old_field || c.old_option) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="destructive"
                          className="text-xs py-0 px-1"
                        >
                          Old
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        This field no longer exists in the current registration
                        form
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          </div>

          {filteredReport.map((c: RegistrationReportDropDown) => (
            <TabsContent key={c.field_id} value={c.field_id} className="mt-0">
              <Card className="rounded-[20px] border border-slate-200/70 bg-white p-4 shadow-sm md:p-5">
                {!c.rows?.length && !c?.data && (
                  <div className="flex min-h-32 items-center justify-center text-sm text-slate-500">
                    No data to report
                  </div>
                )}
                {c?.data && (
                  <div className="space-y-4">
                    <div className="mb-3 flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                          {c.table_name} - {getFeeSummaryLabel(c.total, c.fee_amount)}
                        </h3>
                        {(c.old_field || c.old_option) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive">Old Field</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              This field no longer exists in the current registration
                              form
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Monthly registration billing totals, collected revenue, and
                        outstanding balances for this field.
                      </p>
                    </div>
                    {c?.data && c.data.length > 0 && (
                      renderTrendSection(c.data as RegistrationReportRowDataItem[])
                    )}
                  </div>
                )}
                {c?.rows && c.rows.length > 0 && (
                  <div className="space-y-4">
                    <div className="mb-3 flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                          {c.table_name}
                        </h3>
                        {(c.old_field || c.old_option) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive">Old Field</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              This field no longer exists in the current
                              registration form
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Break down each option within this field using the same
                        registration billing graph and side insights.
                      </p>
                    </div>
                    {(() => {
                      const filteredRows = showOldFields
                        ? c.rows
                        : c.rows.filter((r) => !r.old_field);
                      return filteredRows.length > 0 ? (
                        <Tabs
                          defaultValue={filteredRows[0]?.option_order_id}
                          className="space-y-4"
                        >
                          <div className="rounded-[18px] border border-slate-200/70 bg-slate-50/90 p-1.5 backdrop-blur">
                          <TabsList className={sectionTabsListClass}>
                            {filteredRows.map((r: RegistrationRowData) => (
                              <TabsTrigger
                                key={r.option_order_id}
                                value={r.option_order_id}
                                className={sectionTabsTriggerClass}
                              >
                                <span className="flex max-w-full items-center gap-2">
                                  <span className="truncate">
                                  {r.row_name.length > 15
                                    ? `${r.row_name.slice(0, 15)}...`
                                    : r.row_name}
                                  </span>
                                  {r.old_field && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant="destructive"
                                          className="text-xs py-0 px-1"
                                        >
                                          Old
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        This field no longer exists in the
                                        current registration form
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </span>
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          </div>
                          {filteredRows?.map((r: RegistrationRowData) => (
                            <TabsContent
                              key={r.option_order_id}
                              value={r.option_order_id}
                              className="mt-0"
                            >
                              <div className="space-y-4 pt-1">
                                <div className="mb-3 flex flex-col gap-0.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                                      {r.row_name} - {getFeeSummaryLabel(r.total, r.fee_amount)}
                                    </h3>
                                  </div>
                                  <p className="text-[11px] text-stone-500">
                                    Monthly billing activity and collections for this
                                    registration option.
                                  </p>
                                </div>
                                {r.data && r.data.length > 0 && (
                                  renderTrendSection(
                                    r.data as RegistrationReportRowDataItem[],
                                  )
                                )}
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      ) : (
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                          No active fields to display
                        </div>
                      );
                    })()}
                  </div>
                )}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
