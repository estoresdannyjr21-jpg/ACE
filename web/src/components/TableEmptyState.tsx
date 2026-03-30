type TableEmptyStateProps = {
  message: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Empty list / table body replacement (Phase 2.4) */
export function TableEmptyState({ message, hint, actionLabel, onAction }: TableEmptyStateProps) {
  return (
    <div className="empty-state empty-state--panel" role="status">
      <p className="empty-state-message">{message}</p>
      {hint && <p className="text-muted empty-state-hint">{hint}</p>}
      {actionLabel && onAction && (
        <div className="empty-state-action">
          <button type="button" className="btn btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
