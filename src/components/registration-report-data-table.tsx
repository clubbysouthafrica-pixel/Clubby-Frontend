import { RegistrationReport, RegistrationReportDropDown, RegistrationReportRowDataItem, RegistrationRowData } from "@/interfaces/report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { formatAmount } from "@/data/currencies"
import { Label } from "./ui/label"
import "../index.css";

interface props {
  data: RegistrationReport
  currency: string
}

export function RegistrationReportData({ data, currency }: props) {
  if (!data || !data.report || (data.report as RegistrationReportDropDown[]).length === 0) {
    return (<Label>No data to display yet</Label>)
  }

  return (
    <div>
      <Tabs defaultValue={(data?.report as RegistrationReportDropDown[])[0]?.table_name}>
        <TabsList className="flex items-center w-full">
          <div className="flex-1 flex overflow-x-auto flex-nowrap custom-thin-scrollbar space-x-2">
            {(data?.report as RegistrationReportDropDown[]).map((c: any) => (
              <TabsTrigger className="w-[200px] flex-shrink-0 px-3 truncate !flex-none my-5" key={c.table_name} value={c.table_name}>
                {c.table_name.length > 20 ? `${c.table_name.slice(0, 20)}...` : c.table_name}
              </TabsTrigger>
            ))}
          </div>
        </TabsList>

        {(data?.report as RegistrationReportDropDown[]).map((c: any) => (
          <TabsContent key={c.table_name} value={c.table_name}>
            <Card className="p-4">
              {!c.rows?.length && !c?.data &&
                <div>No data to report</div>
              }
              {
                c?.data &&
                <div>
                  <p className="font-bold">
                    {c.table_name} - {c.fee_amount == 0 ? "Free" : `${formatAmount(c.fee_amount, currency)} each`}
                  </p>
                  <CardDescription>Report on: <strong>{c.table_name}</strong></CardDescription>
                  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                    <div className="flex gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                      <Card className="@container/card py-3 w-[100%]">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                          <CardDescription>Total</CardDescription>
                          <CardTitle className="text-l font-semibold tabular-nums">
                            {c.total.total}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="@container/card py-3 w-[100%]">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                          <CardDescription>Paid to Club</CardDescription>
                          <CardTitle className="text-l font-semibold tabular-nums">
                            {c.fee_amount == 0 ? "Free" : formatAmount(c.total.paid_to_club, currency)}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="@container/card py-3 w-[100%]">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                          <CardDescription>Pending</CardDescription>
                          <CardTitle className="text-l font-semibold tabular-nums">
                            {c.total.pending}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="@container/card py-3 w-[100%]">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                          <CardDescription>Due to Club</CardDescription>
                          <CardTitle className="text-l font-semibold tabular-nums">
                            {c.fee_amount == 0 ? "Free" : formatAmount(c.total.due_to_club, currency)}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </div>
                  </div>
                  {
                    c?.data && c.data.length > 0 &&
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="text-center">Date</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Paid</TableHead>
                            <TableHead className="text-center">Pending</TableHead>
                            <TableHead className="text-center">Due</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="font-semibold bg-gray-50">
                          {(c?.data as any).map((d: any) => (
                            <TableRow key={d.date}>
                              <TableCell className="font-medium text-center">{d.date}</TableCell>
                              <TableCell className="font-medium text-center">{d.total}</TableCell>
                              <TableCell className="text-center">{formatAmount(d.paid_to_club, currency)}</TableCell>
                              <TableCell className="font-medium text-center">{d.pending}</TableCell>
                              <TableCell className="text-center">{formatAmount(d.due_to_club, currency)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  }
                </div>
              }
              {
                c?.rows && c.rows.length > 0 &&
                <div className="mb-5">
                  <Tabs defaultValue={(c.rows[0]?.row_name)}>
                    <TabsList className="flex items-center w-full">
                      <div className="flex-1 flex overflow-x-auto flex-nowrap custom-thin-scrollbar space-x-2 py-1">
                        {c.rows.map((r: RegistrationRowData) => (
                          <TabsTrigger
                            key={r.row_name}
                            value={r.row_name}
                            className="w-[200px] flex-shrink-0 px-3 truncate !flex-none"
                          >
                            {r.row_name.length > 15
                              ? `${r.row_name.slice(0, 15)}...`
                              : r.row_name}
                          </TabsTrigger>
                        ))}
                      </div>
                    </TabsList>
                    {
                      c.rows?.map((r: RegistrationRowData) => (
                        <TabsContent key={r.row_name} value={r.row_name}>
                          <div className="px-2">
                            <p className="font-bold">
                              {r.row_name} - {r.fee_amount == 0 ? "Free" : `${formatAmount(r.fee_amount, currency)} each`}
                            </p>
                            <CardDescription>Report on: <strong>{r.row_name}</strong></CardDescription>
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
                                    <CardDescription>Paid to Club</CardDescription>
                                    <CardTitle className="text-l font-semibold tabular-nums">
                                      {
                                        r.fee_amount == 0 ? "Free" : formatAmount(r.total.paid_to_club, currency)
                                      }
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
                                    <CardDescription>Due to Club</CardDescription>
                                    <CardTitle className="text-l font-semibold tabular-nums">
                                      {r.fee_amount == 0 ? "Free" : formatAmount(r.total.due_to_club, currency)}
                                    </CardTitle>
                                  </CardHeader>
                                </Card>
                              </div>
                            </div>
                            {
                              r.data && r.data.length > 0 ?
                                <div className="overflow-hidden rounded-lg border">
                                  <Table>
                                    <TableHeader className="bg-muted sticky top-0 z-10">
                                      <TableRow>
                                        <TableHead className="text-center w-1/5">Date</TableHead>
                                        <TableHead className="text-center w-1/5">Total</TableHead>
                                        <TableHead className="text-center w-1/5">Paid</TableHead>
                                        <TableHead className="text-center w-1/5">Pending</TableHead>
                                        <TableHead className="text-center w-1/5">Due</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="font-semibold bg-gray-50">
                                      {r.data?.map((d: RegistrationReportRowDataItem) => (
                                        <TableRow key={d.date}>
                                          <TableCell className="font-medium text-center w-1/5">{d.date}</TableCell>
                                          <TableCell className="font-medium text-center w-1/5">{d.total}</TableCell>
                                          <TableCell className="text-center w-1/5">{formatAmount(d.paid_to_club, currency)}</TableCell>
                                          <TableCell className="font-medium text-center w-1/5">{d.pending}</TableCell>
                                          <TableCell className="text-center w-1/5">{formatAmount(d.due_to_club, currency)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                : null
                            }
                          </div>
                        </TabsContent>
                      ))
                    }
                  </Tabs>
                </div>
              }
            </Card>
          </TabsContent>
        ))}

      </Tabs>
    </div>
  )
}
