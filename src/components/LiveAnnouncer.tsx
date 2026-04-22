import React, { useEffect, useState, createContext, useContext, ReactNode, useCallback, useRef } from 'react';

interface LiveAnnouncerContextType {
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextType | undefined>(undefined);

export const useLiveAnnouncer = () => {
    const context = useContext(LiveAnnouncerContext);
    if (!context) {
        throw new Error('useLiveAnnouncer must be used within a LiveAnnouncerProvider');
    }
    return context;
};

interface LiveAnnouncerProviderProps {
    children: ReactNode;
}

export const LiveAnnouncerProvider: React.FC<LiveAnnouncerProviderProps> = ({ children }) => {
    const [politeMessage, setPoliteMessage] = useState('');
    const [assertiveMessage, setAssertiveMessage] = useState('');
    
    // Usar ref para evitar re-renderizações desnecessárias
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        // Limpar timeout anterior
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        if (priority === 'polite') {
            setPoliteMessage(message);
            timeoutRef.current = setTimeout(() => setPoliteMessage(''), 3000);
        } else {
            setAssertiveMessage(message);
            timeoutRef.current = setTimeout(() => setAssertiveMessage(''), 3000);
        }
    }, []);

    return (
        <LiveAnnouncerContext.Provider value={{ announce }}>
            {children}
            <div 
                aria-live="polite" 
                aria-atomic="true"
                className="sr-only"
                role="status"
            >
                {politeMessage}
            </div>
            <div 
                aria-live="assertive" 
                aria-atomic="true"
                className="sr-only"
                role="alert"
            >
                {assertiveMessage}
            </div>
        </LiveAnnouncerContext.Provider>
    );
};