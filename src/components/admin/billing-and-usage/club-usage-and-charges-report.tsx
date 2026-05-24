import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Label } from "@/components/ui/label";
import { formatAmount } from "@/data/currencies";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import * as React from "react";

const REPORTING_METRICS = ["Registrations", "Emails", "Orders"];

type PaymentRecord = {
  month: string;
  month_paid: boolean;
  payment_date?: number;
  outstanding_amount?: number;
};

type MonthAmountData = {
  total_amount?: number;
  registration_amount?: number;
  email_amount?: number;
  order_amount?: number;
  outstanding_amount?: number;
};

type MetricMonthDatum = {
  name?: string;
  users?: number;
  emails?: number;
  sales?: number;
  charge?: number;
};

type BillingReportData = {
  Payments?: PaymentRecord[];
  overall_month_data?: Record<string, MonthAmountData>;
  Registrations?: { month_data?: MetricMonthDatum[] };
  Emails?: { month_data?: MetricMonthDatum[] };
  Orders?: { month_data?: MetricMonthDatum[] };
  total_charge?: number;
  total_registration_amount?: number;
  total_email_amount?: number;
  total_order_amount?: number;
  total_outstanding_amount?: number;
};

type ClubUsageAndChargesProps = {
  data: BillingReportData;
  currency: string;
  selectedMonth?: string;
  onMonthSelect?: (month: string) => void;
  clubName?: string;
};

type ReportingMetricKey = "Registrations" | "Emails" | "Orders";

function getCurrentYearMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function formatBillingMonth(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);

  if (!year || !month) {
    return yearMonth;
  }

  return new Date(year, month - 1, 1).toLocaleString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

function getMonthMetricValue(
  items: MetricMonthDatum[] | undefined,
  month: string,
  key: "users" | "emails" | "sales",
) {
  const value = items?.find((item) => item.name === month)?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getBillingPaymentLabel(isPaid: boolean, outstandingAmount: number, totalAmount: number) {
  if (isPaid || outstandingAmount <= 0) {
    return "Paid";
  }

  if (outstandingAmount < totalAmount) {
    return "Partially paid";
  }

  return "Awaiting payment";
}

function getBillingPaymentClassName(
  isPaid: boolean,
  outstandingAmount: number,
  totalAmount: number,
) {
  if (isPaid || outstandingAmount <= 0) {
    return "text-emerald-700";
  }

  if (outstandingAmount < totalAmount) {
    return "text-amber-700";
  }

  return "text-rose-700";
}

function downloadInvoicePdf(params: {
  month: string;
  clubName: string;
  currency: string;
  paymentDate?: number;
  registrationCount: number;
  registrationAmount: number;
  emailCount: number;
  emailAmount: number;
  salesCount: number;
  orderAmount: number;
  totalAmount: number;
}) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const left = 48;
  const right = pageWidth - 48;
  const tableWidth = right - left;
  const quantityColumnWidth = 90;
  const chargeColumnWidth = 130;
  const descriptionColumnWidth = tableWidth - quantityColumnWidth - chargeColumnWidth;
  const formattedBillingMonth = formatBillingMonth(params.month);
  const invoiceDate = new Date(
    params.paymentDate ?? Date.now(),
  ).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lineItems = [
    {
      description: "Registered users",
      detail: "Clubby registration charges",
      quantity: params.registrationCount,
      amount: params.registrationAmount,
    },
    {
      description: "Emails sent",
      detail: "Clubby email charges",
      quantity: params.emailCount,
      amount: params.emailAmount,
    },
    {
      description: "Sales made",
      detail: "Clubby order charges",
      quantity: params.salesCount,
      amount: params.orderAmount,
    },
  ];

  let y = 54;

  pdf.setFillColor(243, 244, 246);
  pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(229, 231, 235);
  pdf.rect(left, y, tableWidth, 420, "FD");

  pdf.setFillColor(17, 24, 39);
  pdf.rect(left, y, tableWidth, 4, "F");

  y += 32;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Invoice", left + 24, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(75, 85, 99);
  pdf.text(`Billing month: ${formattedBillingMonth} (${params.month})`, left + 24, y + 24);
  pdf.text(`Invoice date: ${invoiceDate}`, left + 24, y + 40);
  pdf.text(`Club: ${params.clubName}`, left + 24, y + 56);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Clubby", right - 24, y, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  pdf.text("Business number: 0727187289", right - 24, y + 24, {
    align: "right",
  });
  pdf.text("8 Avenue De Chevonnes", right - 24, y + 40, { align: "right" });
  pdf.text("Hout Bay Cape Town 7806", right - 24, y + 56, { align: "right" });

  y += 92;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(left, y, right, y);

  y += 28;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(55, 65, 81);
  const intro = `This invoice covers Clubby charges for ${params.clubName} for ${formattedBillingMonth}. The breakdown below includes registration charges, email charges, and sales-related charges for the billing period.`;
  const introLines = pdf.splitTextToSize(intro, tableWidth - 48);
  pdf.text(introLines, left + 24, y);

  y += introLines.length * 14 + 24;
  pdf.setFillColor(249, 250, 251);
  pdf.rect(left + 24, y, tableWidth - 48, 28, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  pdf.text("DESCRIPTION", left + 36, y + 18);
  pdf.text("QUANTITY", left + 24 + descriptionColumnWidth + quantityColumnWidth / 2, y + 18, {
    align: "center",
  });
  pdf.text("CHARGE", right - 36, y + 18, { align: "right" });

  y += 28;
  pdf.setFontSize(10);

  lineItems.forEach((item) => {
    pdf.setDrawColor(229, 231, 235);
    pdf.line(left + 24, y, right - 24, y);
    y += 18;

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(17, 24, 39);
    pdf.text(item.description, left + 36, y);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text(item.detail, left + 36, y + 14);

    pdf.setFontSize(10);
    pdf.setTextColor(17, 24, 39);
    pdf.text(
      String(item.quantity),
      left + 24 + descriptionColumnWidth + quantityColumnWidth / 2,
      y + 7,
      { align: "center" },
    );
    pdf.text(formatAmount(item.amount, params.currency), right - 36, y + 7, {
      align: "right",
    });

    y += 28;
  });

  pdf.setDrawColor(17, 24, 39);
  pdf.line(left + 24, y + 6, right - 24, y + 6);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Total", right - 170, y + 24, { align: "right" });
  pdf.setFontSize(16);
  pdf.text(formatAmount(params.totalAmount, params.currency), right - 36, y + 24, {
    align: "right",
  });

  pdf.save(`clubby-invoice-${params.month}.pdf`);
}

export default function ClubUsageAndCharges({
  data,
  currency,
  selectedMonth,
  onMonthSelect,
  clubName,
}: ClubUsageAndChargesProps) {
  const [selectedTab, setSelectedTab] = useState("Registrations");
  const currentYearMonth = getCurrentYearMonth();
  const paymentStatusByMonth = useMemo(() => {
    const payments = data?.Payments ?? [];

    return new Map<string, PaymentRecord>(
      payments.map((payment) => [payment.month, payment]),
    );
  }, [data]);

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );
  const sortableId = React.useId();
  const previousMonthRows = useMemo(() => {
    const monthKeys = Object.keys(data.overall_month_data || {})
      .filter((month) => month <= currentYearMonth)
      .sort((left, right) => left.localeCompare(right));

    return monthKeys.map((month) => {
      const payment = paymentStatusByMonth.get(month);
      const isPaid = Boolean(payment?.month_paid);
      const registrationCount = getMonthMetricValue(
        data.Registrations?.month_data,
        month,
        "users",
      );
      const emailCount = getMonthMetricValue(
        data.Emails?.month_data,
        month,
        "emails",
      );
      const salesCount = getMonthMetricValue(
        data.Orders?.month_data,
        month,
        "sales",
      );
      const monthData = data.overall_month_data?.[month] ?? {};

      return {
        month,
        payment,
        isPaid,
        registrationCount,
        emailCount,
        salesCount,
        monthData,
        outstandingAmount:
          payment?.outstanding_amount ??
          monthData.outstanding_amount ??
          (isPaid ? 0 : monthData.total_amount ?? 0),
      };
    });
  }, [currentYearMonth, data, paymentStatusByMonth]);
  const previousMonthsTotals = useMemo(
    () =>
      previousMonthRows.reduce(
        (totals, row) => ({
          totalAmount: totals.totalAmount + (row.monthData.total_amount ?? 0),
          registrationAmount:
            totals.registrationAmount + (row.monthData.registration_amount ?? 0),
          emailAmount: totals.emailAmount + (row.monthData.email_amount ?? 0),
          orderAmount: totals.orderAmount + (row.monthData.order_amount ?? 0),
          outstandingAmount: totals.outstandingAmount + row.outstandingAmount,
        }),
        {
          totalAmount: 0,
          registrationAmount: 0,
          emailAmount: 0,
          orderAmount: 0,
          outstandingAmount: 0,
        },
      ),
    [previousMonthRows],
  );
  const isTableScrollable = previousMonthRows.length > 3;

  return (
    <div className="space-y-2.5">
      <Card className="w-full gap-1.5 rounded-[20px] border border-slate-200/70 bg-white/95 p-2 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:p-2.5">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full flex-col gap-2.5"
        >
          <div className="rounded-[16px] border border-slate-200/70 bg-slate-50/90 p-1 backdrop-blur">
            <Label htmlFor="view-selector" className="sr-only">
              View
            </Label>
            <TabsList className="h-auto gap-2 bg-transparent p-0">
              <TabsTrigger
                value="Registrations"
                className="h-7 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-medium text-zinc-700 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
              >
                Registrations
              </TabsTrigger>
              <TabsTrigger
                value="Emails"
                className="h-7 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-medium text-zinc-700 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
              >
                Emails
              </TabsTrigger>
              <TabsTrigger
                value="Orders"
                className="h-7 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-medium text-zinc-700 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
              >
                Shop
              </TabsTrigger>
            </TabsList>
          </div>

          {REPORTING_METRICS.map((metricKey) => {
            if (selectedTab !== metricKey) return null;

            const metricData = data[metricKey as ReportingMetricKey];

            if (!metricData) {
              return null;
            }

            return (
              <div key={metricKey}>
                <div className="grid gap-1.5 pb-2 md:grid-cols-3">
                  {Object.entries(metricData).map(([k, value]) => {
                    if (k === "month_data") return null;
                    if (metricKey === "Orders" && k === "sales") return null;

                    const displayValue =
                      typeof value === "number" || typeof value === "string"
                        ? value
                        : "-";

                    return (
                      <Card
                        key={k}
                        className="rounded-[16px] border border-slate-200/70 bg-slate-50/80 p-2 shadow-none"
                      >
                        <CardHeader className="flex flex-col items-center justify-center p-0 text-center">
                          <CardDescription className="text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                            {k}
                          </CardDescription>
                          <CardTitle className="mt-0.5 text-base font-semibold tabular-nums leading-tight text-zinc-900 md:text-lg">
                            {displayValue}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>

                <section className="rounded-[18px] border border-slate-200/70 bg-white p-2 shadow-sm md:p-2.5">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={metricData.month_data} barGap={10}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                      />
                      {metricKey !== "Orders" && (
                        <YAxis
                          yAxisId="left"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                      )}
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickFormatter={(value) => formatAmount(value, currency)}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "14px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
                          padding: "8px 10px",
                        }}
                        formatter={(value, name) => {
                          if (name === "Charges" || name === "Email Charges") {
                            return [
                              formatAmount(value as number, currency),
                              name,
                            ];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: 6, fontSize: 11 }} />
                      {metricKey !== "Orders" && (
                        <Bar
                          yAxisId="left"
                          radius={[8, 8, 0, 0]}
                          dataKey={metricKey === "Registrations" ? "users" : "emails"}
                          fill="#475569"
                          name={metricKey === "Registrations" ? "Users" : "Emails Sent"}
                        />
                      )}
                      <Bar
                        yAxisId="right"
                        radius={[8, 8, 0, 0]}
                        dataKey="charge"
                        fill="#d97706"
                        name="Charges"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </section>
              </div>
            );
          })}
        </Tabs>
      </Card>

      <div className="overflow-hidden rounded-[22px] border border-slate-200/70 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="bg-slate-50/95">
              <TableRow>
                <TableHead className="text-center w-1/6">Month</TableHead>
                <TableHead className="text-center w-1/7">
                  Registrations
                </TableHead>
                <TableHead className="text-center w-1/7">Emails</TableHead>
                <TableHead className="text-center w-1/7">Shop</TableHead>
                <TableHead className="text-center w-1/4">Payment</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          <div className={isTableScrollable ? "max-h-[360px] overflow-y-auto border-t border-slate-200/70" : "border-t border-slate-200/70"}>
            <Table>
              <TableBody>
                {previousMonthRows.map((row) => {
                  const {
                    month,
                    payment,
                    isPaid,
                    registrationCount,
                    emailCount,
                    salesCount,
                    monthData,
                    outstandingAmount,
                  } = row;
                  const totalAmount =
                    monthData.total_amount ??
                    (monthData.registration_amount ?? 0) +
                      (monthData.email_amount ?? 0) +
                      (monthData.order_amount ?? 0);
                  const paidAmount = Math.max(totalAmount - outstandingAmount, 0);
                  const canGenerateInvoice = isPaid && month !== currentYearMonth;
                  const paymentLabel = getBillingPaymentLabel(
                    isPaid,
                    outstandingAmount,
                    totalAmount,
                  );
                  const paymentClassName = getBillingPaymentClassName(
                    isPaid,
                    outstandingAmount,
                    totalAmount,
                  );

                  return (
                    <TableRow
                      key={month}
                      className={selectedMonth === month ? "bg-slate-50" : "bg-white"}
                    >
                      <TableCell className="w-1/6 py-2.5 text-center">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                          {month}
                        </span>
                      </TableCell>
                      <TableCell className="w-1/7 py-2.5 text-center text-sm">
                        {formatAmount(
                          monthData.registration_amount ?? 0,
                          currency
                        )}
                      </TableCell>
                      <TableCell className="w-1/7 py-2.5 text-center text-sm">
                        {formatAmount(
                          monthData.email_amount ?? 0,
                          currency
                        )}
                      </TableCell>
                      <TableCell className="w-1/7 py-2.5 text-center text-sm">
                        {formatAmount(
                          monthData.order_amount || 0,
                          currency
                        )}
                      </TableCell>
                      <TableCell className="w-1/4 py-2.5 text-center">
                        {isPaid ? (
                          <div className="space-y-1">
                            <p className={`font-bold ${paymentClassName}`}>
                              {paymentLabel}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatAmount(totalAmount, currency)} total
                            </p>
                            {canGenerateInvoice ? (
                              <button
                                type="button"
                                onClick={() =>
                                  downloadInvoicePdf({
                                    month,
                                    clubName: clubName ?? "your club",
                                    currency,
                                    paymentDate: payment?.payment_date,
                                    registrationCount,
                                    registrationAmount: monthData.registration_amount ?? 0,
                                    emailCount,
                                    emailAmount: monthData.email_amount ?? 0,
                                    salesCount,
                                    orderAmount: monthData.order_amount ?? 0,
                                    totalAmount,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                                title="Download invoice"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Invoice
                              </button>
                            ) : (
                              <p className="text-[11px] text-slate-500">
                                Invoice available after month end
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className={`font-bold ${paymentClassName}`}>
                              {paymentLabel}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatAmount(paidAmount, currency)} of {formatAmount(totalAmount, currency)}
                            </p>
                            <button
                              type="button"
                              onClick={() => onMonthSelect?.(month)}
                              className={selectedMonth === month
                                ? "inline-flex rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-800"
                                : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200 cursor-pointer"
                              }
                            >
                              Outstanding: {formatAmount(outstandingAmount, currency)}
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-slate-200/70 bg-zinc-700">
            <Table>
              <TableBody>
                <TableRow className="bg-zinc-700 font-semibold text-white hover:bg-zinc-700">
                  <TableCell className="w-1/6 py-2.5 text-center text-white">Total</TableCell>
                  <TableCell className="w-1/7 py-2.5 text-center">
                    {formatAmount(previousMonthsTotals.registrationAmount, currency)}
                  </TableCell>
                  <TableCell className="w-1/7 py-2.5 text-center">
                    {formatAmount(previousMonthsTotals.emailAmount, currency)}
                  </TableCell>
                  <TableCell className="w-1/7 py-2.5 text-center">
                    {formatAmount(previousMonthsTotals.orderAmount, currency)}
                  </TableCell>
                  <TableCell className="w-1/4 py-2.5 text-center text-white">
                    <div className="space-y-1">
                      <p className="font-bold text-white">
                        {formatAmount(previousMonthsTotals.totalAmount, currency)} total
                      </p>
                      <p className="text-[11px] font-medium text-slate-200">
                        Outstanding: {formatAmount(previousMonthsTotals.outstandingAmount, currency)}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
