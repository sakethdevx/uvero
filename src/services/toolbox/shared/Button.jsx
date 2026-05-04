/**
 * Reusable Button component with multiple variants
 */
export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  icon = null,
  loading = false
}) {
  const baseClasses = 'relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:pointer-events-none';

  const variants = {
    primary: 'btn-accent shadow-xl shadow-indigo-500/10',
    secondary: 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white',
    outline: 'bg-transparent border-2 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-500/5',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-500 hover:text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && icon}
      {children}
    </button>
  );
}
