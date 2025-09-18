import { RegistrationReport } from "@/interfaces/report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { formatAmount } from "@/data/currencies"

interface props {
  data: RegistrationReport
  currency: string
}

export function RegistrationReportData({ data, currency }: props) {
    return (
      <div>
        
      <Tabs defaultValue={data?.report[0]?.table_name}>
        <TabsList>
          {data?.report?.map(c => (
            <TabsTrigger key={c.table_name} value={c.table_name}>{c.table_name}</TabsTrigger>
          ))}
        </TabsList>

        {data?.report?.map(c => (
          <TabsContent key={c.table_name} value={c.table_name}>
            <Card className="p-4">
              {!c.rows?.length &&
                <div>No data to report</div>
              }
              {
                c.rows?.map(r => (
                  <div key={r.row_name}>
                    <p className="font-bold">
                      {r.row_name}
                    </p>
                    {/* TOTALS HERE */}
                      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-0 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                          <Card className="@container/card">
                            <CardHeader>
                              <CardDescription>Fee Amount</CardDescription>
                              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {formatAmount(r.total.fee_amount, currency)}
                              </CardTitle>
                            </CardHeader>
                          </Card>
                          <Card className="@container/card">
                            <CardHeader>
                              <CardDescription>Due to Club</CardDescription>
                              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {formatAmount(r.total.due_to_club, currency)}
                              </CardTitle>
                            </CardHeader>
                          </Card>
                          <Card className="@container/card">
                            <CardHeader>
                              <CardDescription>Paid to Club</CardDescription>
                              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {formatAmount(r.total.paid_to_club, currency)}
                              </CardTitle>
                            </CardHeader>
                          </Card>
                        </div>
                      </div>



                    {/* TABLE HERE */}
                      <Table className="mb-6">
                        <TableCaption>Report on latest {r.row_name} items</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead>Paid</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {r.data?.map(d => (
                            <TableRow key={d.date}>
                              <TableCell className="font-medium">{d.date}</TableCell>
                              <TableCell>{formatAmount(d.due_to_club, currency)}</TableCell>
                              <TableCell>{formatAmount(d.paid_to_club, currency)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
