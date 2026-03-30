import type { ReactNode } from 'react';

export type StatusTone = 'success' | 'warning' | 'danger' | 'pending' | 'neutral';

const toneClass: Record<StatusTone, string> = {
  success: 'chip chip-success',
  warning: 'chip chip-warning',
  danger: 'chip chip-danger',
  pending: 'chip chip-pending',
  neutral: 'chip chip-neutral',
};

export function humanizeEnum(s: string) {
  return s.replace(/_/g, ' ');
}

export function StatusChip({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return <span className={`${toneClass[tone]}${className ? ` ${className}` : ''}`}>{children}</span>;
}

export function billingStatusChipTone(status: string): StatusTone {
  const u = status.toUpperCase();
  if (u.includes('PAID')) return 'success';
  if (u.includes('READY')) return 'pending';
  if (u.includes('BILL')) return 'warning';
  return 'neutral';
}

export function payoutStatusChipTone(status: string): StatusTone {
  const u = status.toUpperCase();
  if (u.includes('PAID') || u.includes('RELEASED')) return 'success';
  if (u.includes('BLOCK') || u.includes('REJECT')) return 'danger';
  if (u.includes('READY') || u.includes('PENDING') || u.includes('APPROVED') || u.includes('BATCH')) return 'pending';
  return 'neutral';
}

export function incidentStatusTone(status: string): StatusTone {
  switch (status) {
    case 'CLOSED':
      return 'neutral';
    case 'RESOLVED':
      return 'success';
    case 'OPEN':
    case 'ACKNOWLEDGED':
      return 'warning';
    case 'IN_PROGRESS':
      return 'pending';
    default:
      return 'neutral';
  }
}

export function incidentSeverityTone(severity: string): StatusTone {
  switch (severity) {
    case 'CRITICAL':
      return 'danger';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'pending';
    default:
      return 'neutral';
  }
}

export function tripHighLevelTone(status: string): StatusTone {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    case 'IN_PROGRESS':
      return 'pending';
    case 'ASSIGNED':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function assignmentStatusTone(status: string): StatusTone {
  switch (status) {
    case 'ACCEPTED':
      return 'success';
    case 'DECLINED':
      return 'danger';
    case 'ASSIGNED_PENDING_ACCEPTANCE':
      return 'pending';
    default:
      return 'neutral';
  }
}

export function podStatusTone(status: string): StatusTone {
  const u = status.toUpperCase();
  if (u.includes('VERIFIED')) return 'success';
  if (u.includes('REJECT')) return 'danger';
  if (u.includes('PENDING') || u.includes('UPLOADED')) return 'pending';
  if (u.includes('NOT_UPLOADED')) return 'neutral';
  return 'neutral';
}

export function fleetEntityStatusTone(status: string): StatusTone {
  const u = status.toUpperCase();
  if (u.includes('ACTIVE') || u.includes('AVAILABLE')) return 'success';
  if (u.includes('INACTIVE') || u.includes('SUSPEND')) return 'warning';
  return 'neutral';
}

export function BillingStatusChip({ status }: { status: string }) {
  return <StatusChip tone={billingStatusChipTone(status)}>{humanizeEnum(status)}</StatusChip>;
}

export function PayoutStatusChip({ status }: { status: string }) {
  return <StatusChip tone={payoutStatusChipTone(status)}>{humanizeEnum(status)}</StatusChip>;
}

export function IncidentStatusChip({ status }: { status: string }) {
  return <StatusChip tone={incidentStatusTone(status)}>{humanizeEnum(status)}</StatusChip>;
}

export function IncidentSeverityChip({ severity }: { severity: string }) {
  return <StatusChip tone={incidentSeverityTone(severity)}>{severity}</StatusChip>;
}

export function FleetStatusChip({ status }: { status: string }) {
  return <StatusChip tone={fleetEntityStatusTone(status)}>{humanizeEnum(status)}</StatusChip>;
}

export function PodStatusChip({ status }: { status: string }) {
  return <StatusChip tone={podStatusTone(status)}>{humanizeEnum(status)}</StatusChip>;
}

export function arBatchStatusTone(status: string): StatusTone {
  switch (status) {
    case 'DEPOSITED':
      return 'success';
    case 'INVOICED':
      return 'warning';
    case 'PAYMENT_LIST_RECEIVED':
      return 'pending';
    case 'REVERSE_BILLING_RECEIVED':
      return 'pending';
    default:
      return 'neutral';
  }
}

export function ArBatchStatusChip({ status }: { status: string }) {
  return <StatusChip tone={arBatchStatusTone(status)}>{humanizeEnum(status)}</StatusChip>;
}
