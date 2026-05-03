import { Link } from 'react-router-dom';

export function AIServiceShell({ children, className = '', maxWidth = 'max-w-7xl' }) {
  return (
    <div className={`min-h-screen bg-surface-0 text-gray-900 transition-colors duration-500 dark:text-white ${className}`}>
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, var(--accent-subtle), transparent 34%), radial-gradient(circle at 50% 0%, var(--surface-1), transparent 42%)',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
      </div>
      <main className={`relative mx-auto ${maxWidth} px-3 pb-6 pt-4 sm:px-5 sm:pb-8 sm:pt-5 lg:px-6`}>
        {children}
      </main>
    </div>
  );
}

export function CompactServiceHeader({ eyebrow, title, description, actions, meta, className = '' }) {
  return (
    <div className={`glass-panel mb-4 px-4 py-3 animate-state-in sm:px-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--text-secondary)' }}>
              {eyebrow}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl">
              {title}
            </h1>
            {meta}
          </div>
          {description && (
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-500 dark:text-gray-400 sm:text-sm">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function AIBackLink({ to, children = 'Back' }) {
  return (
    <Link to={to} className="suggestion-chip mb-3">
      <span aria-hidden="true">←</span>
      <span>{children}</span>
    </Link>
  );
}

export function AIInlinePanel({ children, className = '' }) {
  return (
    <div className={`glass-panel p-4 shadow-sm animate-state-in sm:p-5 ${className}`}>
      {children}
    </div>
  );
}
