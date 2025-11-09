import {
  RegistrationReport,
  RegistrationReportDropDown,
  RegistrationReportRowDataItem,
  RegistrationRowData,
} from "@/interfaces/report";
import { RegistrationBillingChart } from "@/components/admin/reporting/general-reporting/charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { formatAmount } from "@/data/currencies";
import { Label } from "./ui/label";
import "../index.css";

interface props {
  data: RegistrationReport;
  currency: string;
}

export function RegistrationReportData({ data, currency }: props) {
  if (
    !data ||
    !data.report ||
    (data.report as RegistrationReportDropDown[]).length === 0
  ) {
    return <Label>No data to display yet</Label>;
  }

  return (
    <div>
      <Tabs
        defaultValue={
          (data?.report as RegistrationReportDropDown[])[0]?.table_name
        }
      >
        <TabsList className="flex justify-center flex-wrap gap-2 h-10 mx-auto">
          {(data?.report as RegistrationReportDropDown[]).map(
            (c: RegistrationReportDropDown) => (
              <TabsTrigger
                className="px-3 h-8 text-sm whitespace-nowrap truncate w-[240px]"
                key={c.table_name}
                value={c.table_name}
              >
                {c.table_name.length > 20
                  ? `${c.table_name.slice(0, 20)}...`
                  : c.table_name}
              </TabsTrigger>
            )
          )}
        </TabsList>

        {(data?.report as RegistrationReportDropDown[]).map(
          (c: RegistrationReportDropDown) => (
            <TabsContent key={c.table_name} value={c.table_name}>
              <Card className="p-4 border-none shadow-none">
                {!c.rows?.length && !c?.data && <div>No data to report</div>}
                {c?.data && (
                  <div>
                    <div className="flex flex-col w-full items-center pb-4">
                      <p className="font-bold">
                        {c.table_name} -{" "}
                        {(c.fee_amount ?? 0) === 0
                          ? "Free"
                          : `${formatAmount(c.fee_amount ?? 0, currency)} each`}
                      </p>
                    </div>
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                      <div className="flex gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                        <Card className="@container/card py-3 w-[100%]">
                          <CardHeader className="flex flex-col items-center justify-center text-center">
                            <CardDescription>Total</CardDescription>
                            <CardTitle className="text-l font-semibold tabular-nums">
                              {c.total?.total ?? 0}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        <Card className="@container/card py-3 w-[100%]">
                          <CardHeader className="flex flex-col items-center justify-center text-center">
                            <CardDescription>Paid to Club</CardDescription>
                            <CardTitle className="text-l font-semibold tabular-nums">
                              {(c.fee_amount ?? 0) === 0
                                ? "Free"
                                : formatAmount(
                                    c.total?.paid_to_club ?? 0,
                                    currency
                                  )}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        <Card className="@container/card py-3 w-[100%]">
                          <CardHeader className="flex flex-col items-center justify-center text-center">
                            <CardDescription>Pending</CardDescription>
                            <CardTitle className="text-l font-semibold tabular-nums">
                              {c.total?.pending ?? 0}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        <Card className="@container/card py-3 w-[100%]">
                          <CardHeader className="flex flex-col items-center justify-center text-center">
                            <CardDescription>Due to Club</CardDescription>
                            <CardTitle className="text-l font-semibold tabular-nums">
                              {(c.fee_amount ?? 0) === 0
                                ? "Free"
                                : formatAmount(
                                    c.total?.due_to_club ?? 0,
                                    currency
                                  )}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                      </div>
                    </div>
                    {c?.data && c.data.length > 0 && (
                      <div className="space-y-4">
                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                          <RegistrationBillingChart
                            data={c.data as RegistrationReportRowDataItem[]}
                            currency={currency}
                          />
                        </div>
                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                          <Table>
                            <TableHeader className="bg-muted/60">
                              <TableRow>
                                <TableHead className="text-center">
                                  Date
                                </TableHead>
                                <TableHead className="text-center">
                                  Total
                                </TableHead>
                                <TableHead className="text-center">
                                  Paid
                                </TableHead>
                                <TableHead className="text-center">
                                  Pending
                                </TableHead>
                                <TableHead className="text-center">
                                  Due
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium">
                              {(c?.data as RegistrationReportRowDataItem[]).map(
                                (d) => (
                                  <TableRow
                                    key={d.date}
                                    className="hover:bg-muted/40"
                                  >
                                    <TableCell className="text-center">
                                      {d.date}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {d.total}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {formatAmount(d.paid_to_club, currency)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {d.pending}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {formatAmount(d.due_to_club, currency)}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {c?.rows && c.rows.length > 0 && (
                  <div className="mb-5">
                    <div className="flex flex-col w-full items-center py-2">
                      <p className="font-bold w-full text-center">
                        {c.table_name}
                      </p>
                    </div>
                    <Tabs defaultValue={c.rows[0]?.row_name}>
                      <TabsList className="flex justify-center h-10 flex-wrap gap-2 mx-auto py-1">
                        {c.rows.map((r: RegistrationRowData) => (
                          <TabsTrigger
                            key={r.row_name}
                            value={r.row_name}
                            className="px-3 h-8 text-sm whitespace-nowrap truncate w-[240px]"
                          >
                            {r.row_name.length > 15
                              ? `${r.row_name.slice(0, 15)}...`
                              : r.row_name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <div className="flex flex-col w-full items-center py-4">
                        <p className="font-bold w-full text-center">
                          {c.rows[0]?.row_name}
                        </p>
                      </div>
                      {c.rows?.map((r: RegistrationRowData) => (
                        <TabsContent key={r.row_name} value={r.row_name}>
                          <div className="px-2">
                            <div className="flex flex-col w-full items-center py-4">
                              <p className="font-bold w-full text-center">
                                {r.row_name} -{" "}
                                {r.fee_amount == 0
                                  ? "Free"
                                  : `${formatAmount(
                                      r.fee_amount,
                                      currency
                                    )} each`}
                              </p>
                            </div>
                            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                              <div className="flex gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                                <Card className="@container/card py-3 w-[100%]">
                                  <CardHeader className="flex flex-col items-center justify-center text-center">
                                    <CardDescription>Total</CardDescription>
                                    <CardTitle className="text-l font-semibold tabular-nums">
                                      {r.total.total}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>
                                <Card className="@container/card py-3 w-[100%]">
                                  <CardHeader className="flex flex-col items-center justify-center text-center">
                                    <CardDescription>
                                      Paid to Club
                                    </CardDescription>
                                    <CardTitle className="text-l font-semibold tabular-nums">
                                      {r.fee_amount == 0
                                        ? "Free"
                                        : formatAmount(
                                            r.total.paid_to_club,
                                            currency
                                          )}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>
                                <Card className="@container/card py-3 w-[100%]">
                                  <CardHeader className="flex flex-col items-center justify-center text-center">
                                    <CardDescription>Pending</CardDescription>
                                    <CardTitle className="text-l font-semibold tabular-nums">
                                      {r.total.pending}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>
                                <Card className="@container/card py-3 w-[100%]">
                                  <CardHeader className="flex flex-col items-center justify-center text-center">
                                    <CardDescription>
                                      Due to Club
                                    </CardDescription>
                                    <CardTitle className="text-l font-semibold tabular-nums">
                                      {r.fee_amount == 0
                                        ? "Free"
                                        : formatAmount(
                                            r.total.due_to_club,
                                            currency
                                          )}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>
                              </div>
                            </div>
                            {r.data && r.data.length > 0 && (
                              <div className="space-y-4">
                                <div className="rounded-xl border bg-card p-4 shadow-sm">
                                  <RegistrationBillingChart
                                    data={
                                      r.data as RegistrationReportRowDataItem[]
                                    }
                                    currency={currency}
                                  />
                                </div>
                                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                                  <Table>
                                    <TableHeader className="bg-muted/60">
                                      <TableRow>
                                        <TableHead className="text-center w-1/5">
                                          Date
                                        </TableHead>
                                        <TableHead className="text-center w-1/5">
                                          Total
                                        </TableHead>
                                        <TableHead className="text-center w-1/5">
                                          Paid
                                        </TableHead>
                                        <TableHead className="text-center w-1/5">
                                          Pending
                                        </TableHead>
                                        <TableHead className="text-center w-1/5">
                                          Due
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="font-medium">
                                      {r.data.map(
                                        (d: RegistrationReportRowDataItem) => (
                                          <TableRow
                                            key={d.date}
                                            className="hover:bg-muted/40"
                                          >
                                            <TableCell className="text-center w-1/5">
                                              {d.date}
                                            </TableCell>
                                            <TableCell className="text-center w-1/5">
                                              {d.total}
                                            </TableCell>
                                            <TableCell className="text-center w-1/5">
                                              {formatAmount(
                                                d.paid_to_club,
                                                currency
                                              )}
                                            </TableCell>
                                            <TableCell className="text-center w-1/5">
                                              {d.pending}
                                            </TableCell>
                                            <TableCell className="text-center w-1/5">
                                              {formatAmount(
                                                d.due_to_club,
                                                currency
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        )
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                )}
              </Card>
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}
