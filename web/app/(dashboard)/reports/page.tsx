import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-atc-text">Reports</h1>
        <p className="text-atc-text-muted mt-1">Ledgers and reports.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/reports/ar-ledger"
          className="flex items-center gap-4 rounded-lg border border-atc-border bg-white p-6 hover:bg-atc-bg-subtle transition-colors"
        >
          <div className="p-3 rounded-lg bg-atc-bg-alt text-atc-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-atc-text">AR Ledger</h2>
            <p className="text-sm text-atc-text-muted mt-0.5">Receivables (Ready to bill / Billed) by trip with aging.</p>
          </div>
        </Link>
        <Link
          href="/reports/ap-ledger"
          className="flex items-center gap-4 rounded-lg border border-atc-border bg-white p-6 hover:bg-atc-bg-subtle transition-colors"
        >
          <div className="p-3 rounded-lg bg-atc-bg-alt text-atc-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-atc-text">AP Ledger</h2>
            <p className="text-sm text-atc-text-muted mt-0.5">Payables to operators (not PAID) by trip with aging.</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
