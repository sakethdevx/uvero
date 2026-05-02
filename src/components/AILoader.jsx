import { useState, useEffect } from 'react';

/**
 * AILoader — Signature loading component with 3 modes:
 * - orb: Glowing breathing circle
 * - steps: Multi-stage progress indicator
 * - shimmer: Content placeholder
 */
export default function AILoader({ mode = 'orb', steps = [], currentStep = 0, label = 'Processing...' }) {
  if (mode === 'shimmer') {
    return <ShimmerLoader />;
  }

  if (mode === 'steps') {
    return <StepsLoader steps={steps} currentStep={currentStep} />;
  }

  return <OrbLoader label={label} />;
}

/* ── Orb Mode ── */
function OrbLoader({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8">
      {/* Orb */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full animate-glow-pulse" />
        
        {/* Main orb */}
        <div className="relative w-16 h-16 rounded-full animate-orb-breathe"
          style={{
            background: 'radial-gradient(circle at 35% 35%, var(--accent), rgba(99,102,241,0.4))',
            boxShadow: '0 0 40px var(--accent-subtle), inset 0 0 20px rgba(255,255,255,0.1)',
          }}
        >
          {/* Inner highlight */}
          <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/30 blur-sm" />
        </div>

        {/* Particle ring */}
        <div className="absolute inset-[-8px] rounded-full border border-dashed animate-spin-slow"
          style={{ borderColor: 'var(--accent-subtle)' }}
        />
      </div>

      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

/* ── Steps Mode ── */
function StepsLoader({ steps, currentStep }) {
  return (
    <div className="flex flex-col items-center gap-5 py-6">
      {/* Small orb */}
      <div className="w-10 h-10 rounded-full animate-orb-breathe"
        style={{
          background: 'radial-gradient(circle at 35% 35%, var(--accent), rgba(99,102,241,0.4))',
          boxShadow: '0 0 24px var(--accent-subtle)',
        }}
      />

      {/* Steps list */}
      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isComplete = i < currentStep;
          
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                isActive ? 'glass-subtle' : ''
              }`}
            >
              {/* Indicator */}
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                isComplete
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'animate-glow-pulse'
                    : ''
              }`}
                style={isActive ? { background: 'var(--accent)', color: 'white' } : !isComplete ? { background: 'var(--surface-2)', color: 'var(--text-secondary)' } : {}}
              >
                {isComplete ? '✓' : isActive ? '◉' : '○'}
              </div>

              {/* Text */}
              <span className={`text-sm font-medium transition-colors duration-300 ${
                isComplete
                  ? 'text-green-600 dark:text-green-400 line-through opacity-60'
                  : isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-600'
              }`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Shimmer Mode ── */
function ShimmerLoader() {
  return (
    <div className="space-y-3 py-4 w-full">
      <div className="h-4 rounded-lg shimmer-bg w-3/4" />
      <div className="h-4 rounded-lg shimmer-bg w-1/2" />
      <div className="h-10 rounded-xl shimmer-bg w-full" />
      <div className="h-4 rounded-lg shimmer-bg w-2/3" />
    </div>
  );
}
