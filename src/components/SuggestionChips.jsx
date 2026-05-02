import { useCallback } from 'react';

/**
 * SuggestionChips — Rendered after a successful action.
 * Shows 3-4 contextual next actions with staggered entry and premium hover.
 */
export default function SuggestionChips({ suggestions, onSelect }) {
  if (!suggestions?.length) return null;

  const handleSelect = useCallback((suggestion) => {
    // Intentional 150ms delay — feels deliberate, not instant
    setTimeout(() => onSelect(suggestion), 150);
  }, [onSelect]);

  return (
    <div className="mt-4 pt-3 animate-state-in" style={{ borderTop: '1px solid var(--border-glass)' }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5"
        style={{ color: 'var(--text-secondary)' }}
      >
        What's next?
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSelect(s)}
            className="suggestion-chip"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * ErrorRecovery — Smart error card with guided recovery actions.
 * Replaces generic "Error occurred" messages.
 */
export function ErrorRecovery({ title, message, suggestions, onSelect, onRetry }) {
  return (
    <div className="result-card">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          {message && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{message}</p>
          )}
        </div>
      </div>

      {suggestions?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                if (s.action === 'retry' && onRetry) { onRetry(); return; }
                onSelect?.(s);
              }}
              className="suggestion-chip"
              style={{ animationDelay: `${(i + 1) * 60}ms` }}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
