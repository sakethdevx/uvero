import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * FullscreenOverlay
 * 
 * A standardized, reusable full-screen portal overlay component for Uvero.
 * Encapsulates:
 * 1. React Portal directly to document.body (bypasses parent stacking contexts & paddings)
 * 2. Safe Area Insets (PWA standalone mode, iOS notch, Dynamic Island, home indicator)
 * 3. Automatic body scroll locking while active
 * 4. Keyboard Escape key dismissal handler
 * 5. Dynamic Viewport Height (h-dvh) for mobile browser address bar safety
 * 
 * @param {boolean} isOpen - Whether the overlay is active
 * @param {function} onClose - Optional callback when Escape key is pressed
 * @param {string} className - Optional styling overrides
 * @param {React.ReactNode} children - Overlay content
 */
export default function FullscreenOverlay({
    isOpen = true,
    onClose,
    className = '',
    children
}) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const overlayContent = (
        <div
            className={`fixed inset-0 z-[9999] bg-white dark:bg-[#0d1117] h-dvh w-screen overflow-hidden flex flex-col animate-state-in text-gray-900 dark:text-white ${className}`}
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                paddingLeft: 'env(safe-area-inset-left, 0px)',
                paddingRight: 'env(safe-area-inset-right, 0px)',
            }}
        >
            {children}
        </div>
    );

    return createPortal(overlayContent, document.body);
}
