import { RegistrationReport, RegistrationReportDropDown, RegistrationReportRowDataItem, RegistrationRowData } from "@/interfaces/report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { formatAmount } from "@/data/currencies"
import { Label } from "./ui/label"

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
        <TabsList>
          {(data?.report as RegistrationReportDropDown[]).map((c: any) => (
            <TabsTrigger key={c.table_name} value={c.table_name}>{c.table_name}</TabsTrigger>
          ))}
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
                    {c.table_name}
                  </p>
                  <CardDescription>Report on latest {c.table_name}</CardDescription>
                  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                    <div className="flex gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                      <Card className="@container/card w-[100%]">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                          <CardDescription>Paid to Club</CardDescription>
                          <CardTitle className="text-xl font-semibold tabular-nums">
                            {formatAmount(c.total.paid_to_club, currency)}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="@container/card w-[100%]">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                          <CardDescription>Due to Club</CardDescription>
                          <CardTitle className="text-xl font-semibold tabular-nums">
                            {formatAmount(c.total.due_to_club, currency)}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card className="@container/card w-[100%]">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                          <CardDescription>Fee Amount</CardDescription>
                          <CardTitle className="text-xl font-semibold tabular-nums">
                            {formatAmount(c.fee_amount, currency)}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="text-center">Date</TableHead>
                          <TableHead className="text-center">Paid</TableHead>
                          <TableHead className="text-center">Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="font-semibold bg-gray-50">
                        {(c?.data as any).map((d: any) => (
                          <TableRow key={d.date}>
                            <TableCell className="font-medium text-center">{d.date}</TableCell>
                            <TableCell className="text-center">{formatAmount(d.paid_to_club, currency)}</TableCell>
                            <TableCell className="text-center">{formatAmount(d.due_to_club, currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              }
              {
                c.rows?.map((r: RegistrationRowData, index: number) => (
                  <div key={r.row_name} className={index + 1 === c.rows.length ? "" : "mb-5"}>
                    <p className="font-bold">
                      {r.row_name}
                    </p>
                    <CardDescription>Report on latest {r.row_name} items</CardDescription>
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                      <div className="flex gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                        <Card className="@container/card w-[100%]">
                          <CardHeader className="flex flex-col items-center justify-center text-center">
                            <CardDescription>Paid to Club</CardDescription>
                            <CardTitle className="text-xl font-semibold tabular-nums">
                              {formatAmount(r.total.paid_to_club, currency)}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        <Card className="@container/card w-[100%]">
                          <CardHeader className="flex flex-col items-center justify-center text-center">
                            <CardDescription>Due to Club</CardDescription>
                            <CardTitle className="text-xl font-semibold tabular-nums">
                              {formatAmount(r.total.due_to_club, currency)}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                        <Card className="@container/card w-[100%]">
                          <CardHeader className="flex flex-col items-center justify-center text-center">
                            <CardDescription>Fee Amount</CardDescription>
                            <CardTitle className="text-xl font-semibold tabular-nums">
                              {formatAmount(r.total.fee_amount, currency)}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="text-center">Date</TableHead>
                            <TableHead className="text-center">Paid</TableHead>
                            <TableHead className="text-center">Due</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="font-semibold bg-gray-50">
                          {r.data?.map((d: RegistrationReportRowDataItem) => (
                            <TableRow key={d.date}>
                              <TableCell className="font-medium text-center">{d.date}</TableCell>
                              <TableCell className="text-center">{formatAmount(d.paid_to_club, currency)}</TableCell>
                              <TableCell className="text-center">{formatAmount(d.due_to_club, currency)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))
              }
            </Card>
          </TabsContent>
        ))}

      </Tabs>
    </div>
  )
}
