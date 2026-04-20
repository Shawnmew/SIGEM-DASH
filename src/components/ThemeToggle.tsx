import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
    variant?: 'default' | 'sidebar' | 'icon-only';
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
    variant = 'default', 
    className = '' 
}) => {
    const { theme, toggleTheme } = useTheme();

    if (variant === 'sidebar') {
        return (
            <button
                onClick={toggleTheme}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full ${className}`}
            >
                {theme === 'light' ? (
                    <Moon className="h-4 w-4 flex-shrink-0" />
                ) : (
                    <Sun className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
            </button>
        );
    }

    if (variant === 'icon-only') {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={`rounded-full ${className}`}
                aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
                {theme === 'light' ? (
                    <Moon className="h-4 w-4" />
                ) : (
                    <Sun className="h-4 w-4" />
                )}
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            onClick={toggleTheme}
            className={`gap-2 ${className}`}
        >
            {theme === 'light' ? (
                <>
                    <Moon className="h-4 w-4" />
                    Modo Escuro
                </>
            ) : (
                <>
                    <Sun className="h-4 w-4" />
                    Modo Claro
                </>
            )}
        </Button>
    );
};