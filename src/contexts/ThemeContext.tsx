import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type SidebarTheme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    sidebarTheme: SidebarTheme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');

    // Sidebar tem cor oposta ao tema principal
    const sidebarTheme: SidebarTheme = theme === 'light' ? 'dark' : 'light';

    // Carregar tema salvo do localStorage ao iniciar
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
    }, []);

    // Aplicar tema ao DOM quando mudar
    useEffect(() => {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, sidebarTheme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};