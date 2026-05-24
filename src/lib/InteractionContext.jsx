import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const InteractionContext = createContext(null);

export function InteractionProvider({ children }) {
  // states: 'idle', 'focused', 'processing', 'result', 'action'
  const [interactionState, setInteractionState] = useState('idle');

  const value = useMemo(() => ({
    interactionState,
    setInteractionState
  }), [interactionState]);

  return (
    <InteractionContext.Provider value={value}>
      {children}
    </InteractionContext.Provider>
  );
}

export function useInteraction() {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error('useInteraction must be used within an InteractionProvider');
  }
  return context;
}
