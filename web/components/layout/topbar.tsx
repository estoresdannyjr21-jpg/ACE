'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Bell, Search, LogOut } from 'lucide-react'

interface TopbarProps {
  user: { firstName: string; lastName: string; role: string }
}

export default function Topbar({ user }: TopbarProps) {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchInputRef.current?.value?.trim()
    if (q) {
      router.push(`/trips?q=${encodeURIComponent(q)}`)
    } else {
      router.push('/trips')
    }
  }

  return (
    <header className="h-16 bg-white border-b border-atc-border flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-heading font-semibold text-atc-text">Ace Truckers Corp</h1>
        </div>

        {/* Global Search: navigates to Trips with q param (trip ref search) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-atc-text-muted pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              name="q"
              placeholder="Search trip ref (e.g. TR-...)"
              className="w-full pl-10 pr-4 py-2 border border-atc-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-atc-accent"
              aria-label="Search trips by reference"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-atc-text-muted hover:text-atc-text hover:bg-atc-bg-subtle rounded-md">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-atc-danger rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-atc-text">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-atc-text-muted">{user.role.replace(/_/g, ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-atc-text-muted hover:text-atc-text hover:bg-atc-bg-subtle rounded-md"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
