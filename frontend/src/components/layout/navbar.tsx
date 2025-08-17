'use client'

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Moon, 
  Sun, 
  Menu,
  FileText,
  BarChart3,
  Settings,
  User,
  Upload,
  Database
} from "lucide-react"

interface NavbarProps {
  className?: string
  onMenuToggle?: () => void
  sidebarOpen?: boolean
}

export function Navbar({ className, onMenuToggle, sidebarOpen }: NavbarProps) {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <nav className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span className="font-bold text-xl">PPZ-Logalyzer</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            href="/files" 
            className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <FileText className="h-4 w-4" />
            <span>Files</span>
          </Link>
          
          <Link 
            href="/upload" 
            className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-8 w-8 px-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
                <User className="h-4 w-4" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-8 w-8 px-0"
            onClick={onMenuToggle}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
