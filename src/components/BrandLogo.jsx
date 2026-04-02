import React from 'react'

/**
 * BrandLogo
 * Single source of truth for rendering the updated Uvero logo (public/file.svg).
 * Uses CSS mask so the icon can inherit any color via `text-*` Tailwind classes
 * while keeping the underlying SVG shape consistent everywhere.
 */
export default function BrandLogo({
  showText = true,
  className = '',
  iconClassName = 'w-10 h-10 sm:w-11 sm:h-11',
  colorClassName = 'text-primary-500 dark:text-primary-200',
  textClassName = 'text-2xl sm:text-[26px]',
  label = 'Uvero',
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} aria-label={label}>
      <span
        aria-hidden="true"
        className={`${iconClassName} ${colorClassName}`}
        style={{
          backgroundColor: 'currentColor',
          maskImage: 'url(/file.svg)',
          WebkitMaskImage: 'url(/file.svg)',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          display: 'inline-block',
        }}
      />

      {showText && (
        <span className={`font-bold tracking-tight ${textClassName}`}>
          <span className={`${colorClassName} drop-shadow-sm`}>Uvero</span>
        </span>
      )}
    </div>
  )
}
