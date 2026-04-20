import { useEffect, useState, useCallback } from 'react';

interface AccessibilitySettings {
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'normal' | 'large' | 'x-large';
}

export const useAccessibility = () => {
    const [settings, setSettings] = useState<AccessibilitySettings>({
        reduceMotion: false,
        highContrast: false,
        fontSize: 'normal',
    });

    // Detect user preferences from system
    useEffect(() => {
        const mediaQueryReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mediaQueryHighContrast = window.matchMedia('(prefers-contrast: high)');

        const updateReduceMotion = () => {
            setSettings(prev => ({ ...prev, reduceMotion: mediaQueryReduceMotion.matches }));
        };

        const updateHighContrast = () => {
            setSettings(prev => ({ ...prev, highContrast: mediaQueryHighContrast.matches }));
        };

        updateReduceMotion();
        updateHighContrast();

        mediaQueryReduceMotion.addEventListener('change', updateReduceMotion);
        mediaQueryHighContrast.addEventListener('change', updateHighContrast);

        return () => {
            mediaQueryReduceMotion.removeEventListener('change', updateReduceMotion);
            mediaQueryHighContrast.removeEventListener('change', updateHighContrast);
        };
    }, []);

    // Load saved font size preference
    useEffect(() => {
        const savedFontSize = localStorage.getItem('fontSize') as 'normal' | 'large' | 'x-large';
        if (savedFontSize) {
            setSettings(prev => ({ ...prev, fontSize: savedFontSize }));
            document.documentElement.setAttribute('data-font-size', savedFontSize);
        }
    }, []);

    const setFontSize = useCallback((size: 'normal' | 'large' | 'x-large') => {
        setSettings(prev => ({ ...prev, fontSize: size }));
        localStorage.setItem('fontSize', size);
        document.documentElement.setAttribute('data-font-size', size);
    }, []);

    const toggleHighContrast = useCallback(() => {
        setSettings(prev => {
            const newValue = !prev.highContrast;
            if (newValue) {
                document.documentElement.classList.add('high-contrast');
            } else {
                document.documentElement.classList.remove('high-contrast');
            }
            return { ...prev, highContrast: newValue };
        });
    }, []);

    return { settings, setFontSize, toggleHighContrast };
};