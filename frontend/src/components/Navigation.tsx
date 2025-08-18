'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = '' }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully', {
      description: 'See you next time!',
    })
    router.push('/')
  }

  const navItems = [
    { name: 'Sessions', path: '/sessions', active: pathname === '/sessions' },
    { name: 'Upload', path: '/upload', active: pathname === '/upload' },
    { name: 'Analysis', path: '/dashboard', active: pathname === '/dashboard' || pathname?.startsWith('/analysis') },
    { name: 'Settings', path: '/settings', active: pathname === '/settings' },
  ]

  return (
    <header className={`border-b bg-background ${className}`}>
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Paparazzi UAV</h1>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={item.active ? 'default' : 'ghost'}
                size="sm"
                onClick={() => router.push(item.path)}
                className={item.active ? '' : 'hover:bg-muted'}
              >
                {item.name}
              </Button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <span className="text-sm text-muted-foreground">
              Welcome, {user.username}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
