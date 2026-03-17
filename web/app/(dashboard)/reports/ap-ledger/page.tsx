'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { ArrowLeft } from 'lucide-react'

interface LedgerRow {
  tripFinanceId: string
  tripId: string
  internalRef: string
  runsheetDate: string
  operatorName?: string
  clientAccountName?: string
  serviceCategoryName?: string
  payoutStatus: string | null
  payoutDueDate: string | null
  amount: number
  agingBucket: string
}

export default function APLedgerPage() {
  const [ledger, setLedger] = useState<LedgerRow[]>([])
  const [totalPayable, setTotalPayable] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dateTo = new Date()
    const dateFrom = new Date(dateTo)
    dateFrom.setMonth(dateFrom.getMonth() - 3)
    api
      .get('/finance/reports/ap-ledger', {
        params: {
          dateFrom: dateFrom.toISOString().split('T')[0],
          dateTo: dateTo.toISOString().split('T')[0],
        },
      })
      .then((r) => {
        setLedger(r.data.ledger ?? [])
        setTotalPayable(r.data.totalPayable ?? 0)
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load AP ledger'))
      .finally(() => setLoading(false))
  }, [])

  function formatDate(s: string | null) {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/finance"
          className="p-2 rounded-md hover:bg-atc-bg-subtle text-atc-text-muted hover:text-atc-text"
          aria-label="Back to Finance"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-atc-text">AP Ledger</h1>
          <p className="text-sm text-atc-text-muted">Payables to operators (not PAID). Last 3 months.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-atc-danger">{error}</div>
      )}

      {!error && (
        <>
          <div className="rounded-lg border border-atc-border bg-white p-4">
            <p className="text-sm text-atc-text-muted">Total payable</p>
            <p className="text-2xl font-heading font-bold text-atc-text">
              ₱{totalPayable.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 rounded-full border-2 border-atc-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-atc-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-atc-border bg-atc-bg-subtle">
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Trip</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Operator</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Client</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Runsheet date</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Payout status</th>
                      <th className="text-left py-3 px-4 font-semibold text-atc-text">Aging</th>
                      <th className="text-right py-3 px-4 font-semibold text-atc-text">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-atc-text-muted">
                          No AP ledger entries for the period.
                        </td>
                      </tr>
                    ) : (
                      ledger.map((row) => (
                        <tr key={row.tripFinanceId} className="border-b border-atc-border hover:bg-atc-bg-subtle/50">
                          <td className="py-3 px-4">
                            <Link href={`/trips/${row.tripId}`} className="text-atc-primary hover:underline font-medium">
                              {row.internalRef}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-atc-text-muted">{row.operatorName ?? '—'}</td>
                          <td className="py-3 px-4 text-atc-text-muted">{row.clientAccountName ?? '—'}</td>
                          <td className="py-3 px-4">{formatDate(row.runsheetDate)}</td>
                          <td className="py-3 px-4">{row.payoutStatus?.replace(/_/g, ' ') ?? '—'}</td>
                          <td className="py-3 px-4">{row.agingBucket}</td>
                          <td className="py-3 px-4 text-right font-medium">
                            ₱{row.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}