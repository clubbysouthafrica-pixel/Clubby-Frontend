import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { GeneralReport } from "@/interfaces/report"
  import { formatAmount } from "@/data/currencies"
  
  interface props {
    report: GeneralReport
    currency: string
  }
  
  export function GeneralReportingSectionCards({ report, currency }: props) {
    return (
      <div className="flex gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
        <Card className="@container/card w-[100%]">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <CardDescription>Active Members</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums">
              {report?.total_active_members}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="@container/card w-[100%]">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <CardDescription>Registered Members</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums">
              {report?.total_registered_members}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="@container/card w-[100%]">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <CardDescription>Deregistered Members</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums">
              {report?.total_deregistered_members}
            </CardTitle>
          </CardHeader>
        </Card>
  
        <Card className="@container/card w-[100%]">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums">
              {formatAmount(report?.total_revenue, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
  
        <Card className="@container/card w-[100%]">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <CardDescription>Pending Members</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums">
              {report?.total_pending_members}
            </CardTitle>
          </CardHeader>
        </Card>
  
        <Card className="@container/card w-[100%]">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <CardDescription>Pending Revenue</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums">
              {formatAmount(
                report?.total_pending_revenue,
                currency
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }
  