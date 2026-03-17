'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  FileText,
  AlertTriangle,
  DollarSign,
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
  { path: '/dispatch', label: 'Dispatch', icon: ClipboardList, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATIONS_ACCOUNT_COORDINATOR'] },
  { path: '/trips', label: 'Trips', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATIONS_ACCOUNT_COORDINATOR', 'FINANCE_PERSONNEL', 'FINANCE_MANAGER', 'CFO'] },
  { path: '/incidents', label: 'Incidents', icon: AlertTriangle, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATIONS_ACCOUNT_COORDINATOR', 'FINANCE_PERSONNEL', 'FINANCE_MANAGER', 'CFO'] },
  { path: '/rates', label: 'Rates', icon: DollarSign, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE_PERSONNEL', 'FINANCE_MANAGER', 'CFO'] },
  { path: '/finance', label: 'Finance', icon: DollarSign, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE_PERSONNEL', 'FINANCE_MANAGER', 'CFO'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['*'] },
  { path: '/admin', label: 'Admin', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
]

export default function Sidebar({ currentPath, userRole }: SidebarProps) {
  const filteredItems = menuItems.filter(item => 
    item.roles.includes('*') || item.roles.includes(userRole)
  )

  return (
    <aside className="w-64 bg-white border-r border-atc-border min-h-[calc(100vh-64px)]">
      <div className="p-4">
        {/* Logo placeholder */}
        <div className="mb-6">
          <h2 className="text-lg font-heading font-bold text-atc-primary">Ace Truckers</h2>
        </div>

        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-atc-bg-alt text-atc-primary border-l-4 border-atc-primary'
                    : 'text-atc-text-muted hover:bg-atc-bg-subtle hover:text-atc-text'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
