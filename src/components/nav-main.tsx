"use client"
import { type LucideIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    hubUrl?: string
    icon?: LucideIcon
    isActive?: boolean
    items?: { title: string; url: string }[]
  }[]
}) {
  const navigate = useNavigate()

  return (
    <SidebarGroup className="p-0">
      <SidebarMenu className="gap-0">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={item.isActive}
              onClick={() => navigate((item as { hubUrl?: string }).hubUrl ?? item.url)}
              className={cn(
                "h-11 w-full cursor-pointer rounded-none px-4 text-base",
                item.isActive
                  ? "bg-slate-100 font-medium text-slate-900 hover:bg-slate-100"
                  : "font-normal text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {item.icon && <item.icon className="h-[15px] w-[15px] shrink-0 text-inherit" />}
              <span className="truncate">{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
