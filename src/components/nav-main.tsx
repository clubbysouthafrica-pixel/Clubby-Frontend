"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom";

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    hasMissingFields?: boolean
    items?: {
      title: string
      url: string
      hasMissingFields?: boolean
    }[]
  }[]
}) {
  const location = useLocation()
  const pathname = location.pathname

  // Helper kept for potential parent matching; currently parent uses exact match and childActive uses exact child matches.
  // (Left here in case we later want startsWith behavior for opening groups.)
  // remove matchesUrl helper — subitems and parent use explicit checks below
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(() =>
    items.reduce((acc, it) => {
      acc[it.title] = Boolean(it.isActive)
      return acc
    }, {} as Record<string, boolean>)
  )

  // Sync open state when items' isActive changes (e.g., on route change)
  React.useEffect(() => {
    setOpenMap((prev) => {
      const next: Record<string, boolean> = { ...prev }
      for (const it of items) {
        // If the route marks this group active, ensure it's open; otherwise close it.
        next[it.title] = Boolean(it.isActive)
      }
      return next
    })
  }, [items])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Management</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            open={Boolean(openMap[item.title])}
            onOpenChange={(open) => setOpenMap((m) => ({ ...m, [item.title]: open }))}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                {/* Parent is active when parent url OR any child url exactly matches the pathname */}
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={
                    (item.url ? item.url === pathname : false) ||
                    (item.items ? item.items.some((s) => s.url === pathname) : false)
                  }
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.hasMissingFields && (
                    <span className="text-red-500 font-bold text-lg ml-1">*</span>
                  )}
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={subItem.url === pathname}>
                            <Link to={subItem.url} className="flex items-center">
                              <span>{subItem.title}</span>
                              {subItem.hasMissingFields && (
                                <span className="text-red-500 font-bold text-lg ml-1">*</span>
                              )}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
