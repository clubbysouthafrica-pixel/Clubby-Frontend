import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GeneralReport } from "@/interfaces/report";
import { formatAmount } from "@/data/currencies";
import { TrendingUp, Clock, Users, UserPlus } from "lucide-react";

interface props {
  report: GeneralReport;
  currency: string | undefined;
}

const cardData = (report: GeneralReport, currency: string | undefined) => [
  {
    label: "Total Revenue",
    value: formatAmount(report?.total_revenue, currency),
    icon: <TrendingUp className="h-7 w-7 text-green-600" />,
  },
  {
    label: "Pending Revenue",
    value: formatAmount(report?.total_pending_revenue, currency),
    icon: <Clock className="h-7 w-7 text-yellow-600" />,
  },
  {
    label: "Active Members",
    value: report?.total_active_members,
    icon: <Users className="h-7 w-7 text-blue-600" />,
  },
  {
    label: "Pending Members",
    value: report?.total_pending_members,
    icon: <UserPlus className="h-7 w-7 text-purple-600" />,
  },
];

export function HomeSectionCards({ report, currency }: props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {cardData(report, currency).map((card) => (
        <Card
          key={card.label}
          className="transition-shadow shadow-sm hover:shadow-lg border"
        >
          <CardHeader className="flex flex-row items-center gap-4 py-6">
            <div className="flex-shrink-0 rounded-full bg-muted p-2">
              {card.icon}
            </div>
            <div>
              <CardDescription className="uppercase text-xs tracking-wide font-medium text-muted-foreground mb-1">
                {card.label}
              </CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums">
                {card.value}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
