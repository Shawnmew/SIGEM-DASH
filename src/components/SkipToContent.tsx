import React from 'react';
import { cn } from '@/lib/utils';

interface SkipToContentProps {
    contentId?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({ contentId = 'main-content' }) => {
    return (
        <a
            href={`#${contentId}`}
            className={cn(
                "sr-only focus:not-sr-only",
                "fixed top-4 left-4 z-50",
                "bg-primary text-white px-4 py-2 rounded-md",
                "text-sm font-medium shadow-lg",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
        >
            Pular para o conteúdo principal
        </a>
    );
};