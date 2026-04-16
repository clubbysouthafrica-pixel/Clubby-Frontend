import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";

interface props {
  totalActiveMembers?: number;
  totalPendingMembers?: number;
  onActiveMembersClick?: () => void;
  onPendingMembersClick?: () => void;
}

const cardData = (
  totalActiveMembers: number | undefined,
  totalPendingMembers: number | undefined,
) => [
  {
    label: "Active Members",
    value: totalActiveMembers ?? 0,
    icon: <Users className="h-7 w-7 text-blue-600" />,
    iconClassName: "bg-blue-50",
  },
  {
    label: "Pending Members",
    value: totalPendingMembers ?? 0,
    icon: <UserPlus className="h-7 w-7 text-purple-600" />,
    iconClassName: "bg-purple-50",
  },
];

export function HomeSectionCards({
  totalActiveMembers,
  totalPendingMembers,
  onActiveMembersClick,
  onPendingMembersClick,
}: props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cardData(totalActiveMembers, totalPendingMembers).map((card) => {
        const handleClick =
          card.label === "Active Members"
            ? onActiveMembersClick
            : onPendingMembersClick;

        return (
          <button
            key={card.label}
            type="button"
            className="text-left"
            onClick={handleClick}
          >
            <Card className="border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.label}</p>
                  <CardTitle className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">
                    {card.value}
                  </CardTitle>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconClassName}`}
                >
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-500">
                  {card.label === "Active Members"
                    ? "Registered members for the current season."
                    : "Registrations still waiting to be completed."}
                </p>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
