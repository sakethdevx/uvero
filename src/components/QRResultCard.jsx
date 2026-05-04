import React from 'react';
import SuggestionChips from './SuggestionChips';

/**
 * Reusable Result Card for QR Tools.
 * Standardizes the layout, trust signals, and actions for both generated and decoded QR codes.
 */
export default function QRResultCard({
  title = "✓ QR generated",
  trustBadge = "🔒 Generated locally",
  suggestions,
  onSuggestionSelect,
  children,
  footerAction,
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        {title.startsWith('✓') ? (
            <>
                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{title.replace('✓ ', '')}</p>
            </>
        ) : (
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {children}
      </div>

      {/* Footer / Suggestions / Trust */}
      <div className="pt-2 flex flex-col gap-3">
        {suggestions && suggestions.length > 0 && (
          <SuggestionChips suggestions={suggestions} onSelect={onSuggestionSelect} />
        )}
        
        {trustBadge && (
          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {trustBadge}
          </p>
        )}

        {footerAction && (
          <div className="mt-1">
            {footerAction}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sub-component for displaying a generated QR code with standard download actions.
 */
QRResultCard.Generated = function QRGenerated({
  dataUrl,
  onDownloadPNG,
  onDownloadSVG,
  onCopyImage,
  copied
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-5 items-start">
      <div className="w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center p-2">
        <img src={dataUrl} alt="QR Code" className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 w-full flex flex-col gap-2.5">
        <button onClick={onDownloadPNG} className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PNG
        </button>
        <div className="flex gap-2">
          {onDownloadSVG && (
              <button onClick={onDownloadSVG} className="flex-1 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors">
                Download SVG
              </button>
          )}
          {onCopyImage && (
              <button onClick={onCopyImage} className="flex-1 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1">
                {copied ? (
                    <>
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        Copied
                    </>
                ) : 'Copy Image'}
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Sub-component for displaying decoded QR text and relevant actions.
 */
QRResultCard.Decoded = function QRDecoded({
  text,
  type, // 'url', 'wifi', 'text'
  onCopy,
  copied,
}) {
  const isUrl = type === 'url' || text.startsWith('http');
  const isWifi = type === 'wifi' || text.startsWith('WIFI:');

  const getActions = () => {
    const actions = [];
    if (isUrl) {
      actions.push({ label: 'Open URL', href: text, icon: '🔗' });
    }
    if (isWifi) {
      // Basic WiFi parser
      const ssid = text.match(/S:([^;]+)/)?.[1];
      actions.push({ label: `Join ${ssid || 'WiFi'}`, onClick: () => alert('Please use your system settings to connect to: ' + ssid), icon: '📶' });
    }
    return actions;
  };

  const actions = getActions();

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 break-all font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 select-all border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
        {text}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              Copied!
            </>
          ) : 'Copy Text'}
        </button>
        
        {actions.map((action, i) => (
          <a
            key={i}
            href={action.href}
            onClick={action.onClick}
            target={action.href ? "_blank" : undefined}
            rel={action.href ? "noopener noreferrer" : undefined}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold rounded-xl hover:border-violet-400 dark:hover:border-violet-500/50 transition-colors cursor-pointer"
          >
            {action.icon} {action.label}
          </a>
        ))}
      </div>
    </div>
  );
};
