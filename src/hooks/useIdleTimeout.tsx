import { useEffect, useRef, useState, useCallback } from 'react';

interface IdleTimeoutOptions {
    timeoutMinutes?: number;
    warningMinutes?: number;
    onLogout?: () => void;
    onWarning?: () => void;
}

export const useIdleTimeout = ({
    timeoutMinutes = 30,
    warningMinutes = 2,
    onLogout,
    onWarning,
}: IdleTimeoutOptions = {}) => {
    const [showWarning, setShowWarning] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = warningMinutes * 60 * 1000;

    const clearTimers = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (warningRef.current) {
            clearTimeout(warningRef.current);
            warningRef.current = null;
        }
    }, []);

    const handleLogout = useCallback(() => {
        clearTimers();
        setShowWarning(false);
        
        if (onLogout) {
            onLogout();
        }
    }, [clearTimers, onLogout]);

    const handleWarning = useCallback(() => {
        setShowWarning(true);
        if (onWarning) {
            onWarning();
        }
    }, [onWarning]);

    const resetTimer = useCallback(() => {
        clearTimers();
        setShowWarning(false);

        // Set warning timer
        warningRef.current = setTimeout(() => {
            handleWarning();
        }, timeoutMs - warningMs);

        // Set logout timer
        timeoutRef.current = setTimeout(() => {
            handleLogout();
        }, timeoutMs);
    }, [clearTimers, handleWarning, handleLogout, timeoutMs, warningMs]);

    const handleActivity = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    useEffect(() => {
        // List of events to track user activity
        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click',
            'keypress',
            'wheel',
        ];

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Start timer on mount
        resetTimer();

        // Cleanup on unmount
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            clearTimers();
        };
    }, [handleActivity, resetTimer, clearTimers]);

    return {
        showWarning,
        resetTimer,
        setShowWarning,
    };
};