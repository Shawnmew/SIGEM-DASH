import React, { useState } from 'react';
import { 
    Eye, 
    Type, 
    Moon, 
    Sun, 
    X, 
    Check, 
    Minimize2,
    Maximize2,
    Accessibility
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface AccessibilityMenuProps {
    className?: string;
}

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, setFontSize, toggleHighContrast } = useAccessibility();
    const { theme, toggleTheme } = useTheme();

    const fontSizeOptions = [
        { value: 'normal' as const, label: 'Normal', icon: Minimize2 },
        { value: 'large' as const, label: 'Grande', icon: Type },
        { value: 'x-large' as const, label: 'Muito Grande', icon: Maximize2 },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button
                    className={cn(
                        "p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                        "focus:outline-none focus:ring-2 focus:ring-primary",
                        className
                    )}
                    aria-label="Menu de acessibilidade"
                    title="Opções de acessibilidade"
                >
                    <Accessibility className="h-5 w-5" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Accessibility className="h-5 w-5" />
                        Opções de Acessibilidade
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    {/* Tamanho da Fonte */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Type className="h-4 w-4" />
                            Tamanho da Fonte
                        </Label>
                        <div className="flex gap-2">
                            {fontSizeOptions.map(option => {
                                const Icon = option.icon;
                                const isActive = settings.fontSize === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setFontSize(option.value)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all",
                                            isActive 
                                                ? "border-primary bg-primary/10 text-primary" 
                                                : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                                        )}
                                        aria-label={`Fonte ${option.label.toLowerCase()}`}
                                        aria-pressed={isActive}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="text-sm">{option.label}</span>
                                        {isActive && <Check className="h-3 w-3" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Alto Contraste */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="high-contrast" className="flex items-center gap-2 cursor-pointer">
                            <Eye className="h-4 w-4" />
                            Alto Contraste
                        </Label>
                        <Switch
                            id="high-contrast"
                            checked={settings.highContrast}
                            onCheckedChange={toggleHighContrast}
                            aria-label="Ativar alto contraste"
                        />
                    </div>

                    {/* Tema Claro/Escuro */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="theme-toggle" className="flex items-center gap-2 cursor-pointer">
                            {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            Modo {theme === 'light' ? 'Claro' : 'Escuro'}
                        </Label>
                        <Switch
                            id="theme-toggle"
                            checked={theme === 'dark'}
                            onCheckedChange={toggleTheme}
                            aria-label="Alternar tema claro/escuro"
                        />
                    </div>

                    {/* Informações de Acessibilidade */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-muted-foreground">
                            ⚡ Navegue pelo teclado usando a tecla TAB.<br />
                            🔍 Use Ctrl + +/- para zoom.<br />
                            🖱️ Os elementos interativos têm foco visível.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};