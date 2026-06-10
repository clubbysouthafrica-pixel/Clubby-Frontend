import { type LucideIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface SectionHubItem {
  title: string
  description: string
  url: string
  icon: LucideIcon
  iconClassName?: string
}

interface SectionHubProps {
  title: string
  description: string
  items: SectionHubItem[]
}

export function SectionHub({ title, description, items }: SectionHubProps) {
  const navigate = useNavigate()

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-base leading-relaxed text-slate-500">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className="group flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl",
                item.iconClassName ?? "bg-primary/10 text-primary",
              )}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-primary">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
