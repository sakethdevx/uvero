import { useState, useEffect } from 'react';

/**
 * AILoader — Signature loading component with 3 modes:
 * - orb: Glowing breathing circle
 * - steps: Multi-stage progress indicator
 * - shimmer: Content placeholder
 * 
 * All modes wrapped in smooth fade-in to prevent flicker.
 */
export default function AILoader({ mode = 'orb', steps = [], currentStep = 0, label = 'Processing...' }) {
  const [visible, setVisible] = useState(false);

  // Smooth entrance — prevents flicker on fast operations
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const content = (() => {
    if (mode === 'shimmer') return <ShimmerLoader />;
    if (mode === 'steps') return <StepsLoader steps={steps} currentStep={currentStep} />;
    return <OrbLoader label={label} />;
  })();

  return (
    <div className={`transition-opacity duration-300 ease-apple ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {content}
    </div>
  );
}

/* ── Orb Mode ── */
function OrbLoader({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      {/* Orb */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full animate-glow-pulse" />
        
        {/* Main orb */}
        <div className="relative w-14 h-14 rounded-full animate-orb-breathe"
          style={{
            background: 'radial-gradient(circle at 35% 35%, var(--accent), rgba(99,102,241,0.4))',
            boxShadow: '0 0 40px var(--accent-subtle), inset 0 0 20px rgba(255,255,255,0.1)',
          }}
        >
          {/* Inner highlight */}
          <div className="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-white/30 blur-sm" />
        </div>

        {/* Particle ring */}
        <div className="absolute inset-[-6px] rounded-full border border-dashed animate-spin-slow"
          style={{ borderColor: 'var(--accent-subtle)' }}
        />
      </div>

      {/* Label */}
      <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </div>
  );
}

/* ── Steps Mode ── */
function StepsLoader({ steps, currentStep }) {
  return (
    <div className="flex flex-col items-center gap-4 py-5">
      {/* Small orb */}
      <div className="w-9 h-9 rounded-full animate-orb-breathe"
        style={{
          background: 'radial-gradient(circle at 35% 35%, var(--accent), rgba(99,102,241,0.4))',
          boxShadow: '0 0 24px var(--accent-subtle)',
        }}
      />

      {/* Steps list */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isComplete = i < currentStep;
          
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-400 ${
                isActive ? 'glass-subtle' : ''
              }`}
              style={{
                opacity: isComplete ? 0.5 : isActive ? 1 : 0.35,
                transform: isActive ? 'scale(1)' : 'scale(0.98)',
                transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
              }}
            >
              {/* Indicator */}
              <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-400 ${
                isComplete
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'animate-glow-pulse'
                    : ''
              }`}
                style={{
                  width: '18px', height: '18px',
                  ...(isActive ? { background: 'var(--accent)', color: 'white' } : !isComplete ? { background: 'var(--surface-2)', color: 'var(--text-secondary)' } : {}),
                }}
              >
                {isComplete ? '✓' : isActive ? '◉' : '○'}
              </div>

              {/* Text */}
              <span className={`text-[13px] font-medium transition-all duration-400 ${
                isComplete
                  ? 'text-green-600 dark:text-green-400 line-through'
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
      <div className="h-3.5 rounded-lg shimmer-bg w-3/4" />
      <div className="h-3.5 rounded-lg shimmer-bg w-1/2" />
      <div className="h-9 rounded-xl shimmer-bg w-full" />
      <div className="h-3.5 rounded-lg shimmer-bg w-2/3" />
    </div>
  );
}
