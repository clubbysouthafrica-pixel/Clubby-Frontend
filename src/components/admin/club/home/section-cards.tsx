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
    icon: <Users className="h-5 w-5 text-blue-600 sm:h-7 sm:w-7" />,
    iconClassName: "bg-blue-50",
  },
  {
    label: "Pending Members",
    value: totalPendingMembers ?? 0,
    icon: <UserPlus className="h-5 w-5 text-purple-600 sm:h-7 sm:w-7" />,
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
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
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
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-3 py-3 pb-1.5 sm:gap-4 sm:px-6 sm:py-6 sm:pb-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium leading-4 text-slate-600 sm:text-sm">{card.label}</p>
                  <CardTitle className="mt-1 text-xl font-semibold text-slate-900 tabular-nums sm:mt-2 sm:text-3xl">
                    {card.value}
                  </CardTitle>
                </div>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconClassName} sm:h-12 sm:w-12 sm:rounded-xl`}
                >
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
                <p className="hidden text-xs text-slate-500 sm:block sm:text-sm">
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
