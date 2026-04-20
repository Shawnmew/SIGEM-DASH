import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSoundAlert } from '@/hooks/useSoundAlert';

interface SoundAlertToggleProps {
    variant?: 'icon' | 'button';
    className?: string;
}

export const SoundAlertToggle: React.FC<SoundAlertToggleProps> = ({ variant = 'icon', className = '' }) => {
    const { enabled, setEnabled } = useSoundAlert({ pollingInterval: 30000 });

    const toggle = () => setEnabled(!enabled);

    if (variant === 'button') {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={toggle}
                className={`gap-2 ${className}`}
            >
                {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {enabled ? 'Alertas Sonoros Ativos' : 'Alertas Sonoros Desativados'}
            </Button>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={toggle}
                        className={`p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
                        aria-label={enabled ? 'Desativar alertas sonoros' : 'Ativar alertas sonoros'}
                    >
                        {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{enabled ? 'Alertas sonoros ativos' : 'Alertas sonoros desativados'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};