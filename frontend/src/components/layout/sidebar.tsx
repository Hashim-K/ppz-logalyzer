'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3,
  FileText,
  Upload,
  Settings,
  Home,
  Activity,
  Layers,
  Filter,
  Save,
  Clock,
  AlertCircle
} from "lucide-react"

const navigationItems = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home,
        description: "Main overview and statistics"
      },
      {
        title: "Recent Files",
        href: "/files/recent",
        icon: Clock,
        description: "Recently processed files"
      }
    ]
  },
  {
    title: "File Management",
    items: [
      {
        title: "Upload Files",
        href: "/upload",
        icon: Upload,
        description: "Upload new log files"
      },
      {
        title: "All Files",
        href: "/files",
        icon: FileText,
        description: "Browse all log files"
      },
      {
        title: "Processing Queue",
        href: "/files/processing",
        icon: Activity,
        description: "View processing status",
        badge: "3" // Example badge
      }
    ]
  },
  {
    title: "Analysis",
    items: [
      {
        title: "Data Visualization",
        href: "/analysis/charts",
        icon: BarChart3,
        description: "Create and view charts"
      },
      {
        title: "Templates",
        href: "/analysis/templates",
        icon: Layers,
        description: "Analysis templates"
      },
      {
        title: "Filters",
        href: "/analysis/filters",
        icon: Filter,
        description: "Data filtering tools"
      },
      {
        title: "Saved Sessions",
        href: "/analysis/sessions",
        icon: Save,
        description: "Your analysis sessions"
      }
    ]
  },
  {
    title: "System",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Application settings"
      },
      {
        title: "System Status",
        href: "/system",
        icon: AlertCircle,
        description: "System health and logs"
      }
    ]
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex flex-col w-64 bg-background border-r", className)}>
      <div className="flex-1 overflow-auto py-4">
        <div className="px-3 space-y-6">
          {navigationItems.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-auto p-3",
                          isActive && "bg-secondary/80"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {item.title}
                              </span>
                              {item.badge && (
                                <Badge variant="secondary" className="h-5 text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </Button>
                    </Link>
                  )
                })}
              </div>
              {section !== navigationItems[navigationItems.length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
