import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { IdleWarningModal } from '@/components/IdleWarningModal';
import { useAuth } from './AuthContext';

interface SessionContextType {
    isWarningOpen: boolean;
    closeWarning: () => void;
    resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};

interface SessionProviderProps {
    children: ReactNode;
    timeoutMinutes?: number;
    warningMinutes?: number;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
    children,
    timeoutMinutes = 30,
    warningMinutes = 2,
}) => {
    const [isWarningOpen, setIsWarningOpen] = useState(false);
    const { signOut } = useAuth();

    const handleLogout = async () => {
        // Clear session and logout
        await signOut();
        window.location.href = '/login';
    };

    const handleWarning = () => {
        setIsWarningOpen(true);
    };

    const closeWarning = () => {
        setIsWarningOpen(false);
    };

    const resetSession = () => {
        closeWarning();
    };

    useIdleTimeout({
        timeoutMinutes,
        warningMinutes,
        onLogout: handleLogout,
        onWarning: handleWarning,
    });

    return (
        <SessionContext.Provider value={{ isWarningOpen, closeWarning, resetSession }}>
            {children}
            <IdleWarningModal
                isOpen={isWarningOpen}
                onClose={closeWarning}
                onLogout={handleLogout}
                timeoutSeconds={warningMinutes * 60}
            />
        </SessionContext.Provider>
    );
};