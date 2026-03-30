'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Truck,
  MapPin,
  FileText,
  AlertTriangle,
  Percent,
  Landmark,
  BarChart3,
  Settings,
} from 'lucide-react'

interface SidebarProps {
  currentPath: string
  userRole: string
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['*'] },
  { path: '/fleet-acquisition', label: 'Fleet Acquisition', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FLEET_ACQUISITION'] },
  { path: '/dispatch', label: 'Dispatch', icon: MapPin, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATIONS_ACCOUNT_COORDINATOR'] },
  { path: '/trips', label: 'Trips', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATIONS_ACCOUNT_COORDINATOR', 'FINANCE_PERSONNEL', 'FINANCE_MANAGER', 'CFO'] },
  { path: '/incidents', label: 'Incidents', icon: AlertTriangle, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATIONS_ACCOUNT_COORDINATOR', 'FINANCE_PERSONNEL', 'FINANCE_MANAGER', 'CFO'] },
  { path: '/rates', label: 'Rates', icon: Percent, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE_PERSONNEL', 'FINANCE_MANAGER', 'CFO'] },
  { path: '/finance', label: 'Finance', icon: Landmark, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE_PERSONNEL', 'FINANCE_MANAGER', 'CFO'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['*'] },
  { path: '/admin', label: 'Admin', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
]

function pathMatches(currentPath: string, itemPath: string) {
  if (currentPath === itemPath) return true
  if (itemPath === '/') return false
  return currentPath.startsWith(`${itemPath}/`)
}

export default function Sidebar({ currentPath, userRole }: SidebarProps) {
  const filteredItems = menuItems.filter(item =>
    item.roles.includes('*') || item.roles.includes(userRole),
  )

  return (
    <aside className="w-64 min-h-[calc(100vh-64px)] border-r border-atc-border bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-lg font-heading font-bold text-atc-primary">Ace Truckers</h2>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Main">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive = pathMatches(currentPath, item.path)

            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atc-primary/35 focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-atc-bg-alt font-semibold text-atc-primary shadow-[inset_4px_0_0_0_#0E86C7] dark:bg-atc-primary/15 dark:text-[#9fdbff] dark:shadow-[inset_4px_0_0_0_#2BC0E4]'
                    : 'text-atc-text-muted hover:bg-atc-bg-subtle hover:text-atc-text dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100',
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'opacity-100' : 'opacity-90')} aria-hidden />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
