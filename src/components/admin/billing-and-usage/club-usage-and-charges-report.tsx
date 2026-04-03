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
};

type MonthAmountData = {
  total_amount?: number;
  registration_amount?: number;
  email_amount?: number;
  order_amount?: number;
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
};

type ClubUsageAndChargesProps = {
  data: BillingReportData;
  currency: string;
  selectedMonth?: string;
  onMonthSelect?: (month: string) => void;
  clubName?: string;
};

type ReportingMetricKey = "Registrations" | "Emails" | "Orders";

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

  return (
    <div className="space-y-10">
      <Card className="p-5 w-full gap-2">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="view-selector" className="sr-only">
              View
            </Label>
            <TabsList>
              <TabsTrigger value="Registrations" className="w-[150px]">
                Registrations
              </TabsTrigger>
              <TabsTrigger value="Emails" className="w-[150px]">
                Emails
              </TabsTrigger>
              <TabsTrigger value="Orders" className="w-[150px]">
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
                <div className="flex gap-4 pb-4 px-8 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                  {Object.entries(metricData).map(([k, value]) => {
                    if (k === "month_data") return null;

                    const displayValue =
                      typeof value === "number" || typeof value === "string"
                        ? value
                        : "-";

                    return (
                      <Card key={k} className="@container/card w-[100%]">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                          <CardDescription>{k}</CardDescription>
                          <CardTitle className="text-xl font-semibold tabular-nums">
                            {displayValue}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>

                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metricData.month_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => formatAmount(value, currency)}
                    />
                    <Tooltip
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
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey={metricKey === "Registrations" ? "users" : metricKey === "Emails" ? "emails" : "sales"}
                      fill="#4caf50"
                      name={metricKey === "Registrations" ? "Users" : metricKey === "Emails" ? "Emails Sent" : "Sales"}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="charge"
                      fill="#ff9800"
                      name="Charges"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </Tabs>
      </Card>

      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-center w-1/6">Month</TableHead>
                <TableHead className="text-center w-1/6">
                  Total Charge
                </TableHead>
                <TableHead className="text-center w-1/6">
                  Registrations
                </TableHead>
                <TableHead className="text-center w-1/6">Emails</TableHead>
                <TableHead className="text-center w-1/6">Shop</TableHead>
                <TableHead className="text-center w-1/6">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(data.overall_month_data || {}).map((month) => {
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

                return (
                <TableRow
                  key={month}
                  className={selectedMonth === month ? "bg-slate-50" : undefined}
                >
                  <TableCell className="text-center w-1/6">{month}</TableCell>
                  <TableCell className="text-center w-1/6">
                    {formatAmount(
                      monthData.total_amount ?? 0,
                      currency
                    )}
                  </TableCell>
                  <TableCell className="text-center w-1/6">
                    {formatAmount(
                      monthData.registration_amount ?? 0,
                      currency
                    )}
                  </TableCell>
                  <TableCell className="text-center w-1/6">
                    {formatAmount(
                      monthData.email_amount ?? 0,
                      currency
                    )}
                  </TableCell>
                  <TableCell className="text-center w-1/6">
                    {formatAmount(
                      monthData.order_amount || 0,
                      currency
                    )}
                  </TableCell>
                  <TableCell className="text-center w-1/6">
                    {isPaid ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          Paid
                        </span>
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
                              totalAmount:
                                monthData.total_amount ??
                                (monthData.registration_amount ?? 0) +
                                  (monthData.email_amount ?? 0) +
                                  (monthData.order_amount ?? 0),
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                          title="Download invoice"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Invoice
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMonthSelect?.(month)}
                        className={selectedMonth === month
                          ? "inline-flex rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-800"
                          : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200 cursor-pointer"
                        }
                      >
                        Unpaid
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              );})}
              <TableRow className="font-semibold bg-gray-50">
                <TableCell className="text-center w-1/6">Total</TableCell>
                <TableCell className="text-center w-1/6">
                  {formatAmount(data.total_charge, currency)}
                </TableCell>
                <TableCell className="text-center w-1/6">
                  {formatAmount(data.total_registration_amount, currency)}
                </TableCell>
                <TableCell className="text-center w-1/6">
                  {formatAmount(data.total_email_amount, currency)}
                </TableCell>
                <TableCell className="text-center w-1/6">
                  {formatAmount(data.total_order_amount, currency)}
                </TableCell>
                <TableCell className="text-center w-1/6">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}
