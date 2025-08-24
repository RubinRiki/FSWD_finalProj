import React from 'react';

export default function DataPanel({
  state,             // { loading, error, data }
  emptyText = 'No data.',
  loadingText = 'Loading…',
  onRetry,
  isEmpty,           // optional: (data) => boolean
  className,
  children,
}) {
  const empty =
    typeof isEmpty === 'function'
      ? isEmpty(state?.data)
      : Array.isArray(state?.data)
        ? state.data.length === 0
        : !state?.data;

  if (state?.loading) {
    return (
      <div className={className || 'cd-notice'} role="status" aria-live="polite">
        <div className="cd-spinner" aria-hidden />
        <span>{loadingText}</span>
      </div>
    );
  }

  if (state?.error) {
    return (
      <div className={className || 'cd-notice error'} role="alert">
        <span>{state.error}</span>
        {onRetry && <button className="cd-btn" onClick={onRetry}>Retry</button>}
      </div>
    );
  }

  if (empty) {
    return <div className={className || 'cd-notice empty'}>{emptyText}</div>;
  }

  return <>{children}</>;
}
