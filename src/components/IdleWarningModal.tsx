import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';

interface IdleWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    timeoutSeconds?: number;
}

export const IdleWarningModal: React.FC<IdleWarningModalProps> = ({
    isOpen,
    onClose,
    onLogout,
    timeoutSeconds = 120,
}) => {
    const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);

    useEffect(() => {
        if (!isOpen) {
            setSecondsLeft(timeoutSeconds);
            return;
        }

        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, onLogout, timeoutSeconds]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins} minuto${mins !== 1 ? 's' : ''} e ${secs} segundo${secs !== 1 ? 's' : ''}`;
        }
        return `${secs} segundo${secs !== 1 ? 's' : ''}`;
    };

    const handleStayLoggedIn = () => {
        onClose();
    };

    const handleLogoutNow = () => {
        onLogout();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
            }
        }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <DialogTitle className="text-lg">Sessão prestes a expirar</DialogTitle>
                    </div>
                </DialogHeader>
                
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Sua sessão irá expirar por inatividade. Você será desconectado automaticamente em:
                    </p>
                    
                    <div className="flex items-center justify-center gap-3 py-4">
                        <Clock className="h-6 w-6 text-primary" />
                        <span className="text-3xl font-bold text-primary">
                            {formatTime(secondsLeft)}
                        </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center">
                        Clique em "Continuar conectado" para permanecer na sessão.
                    </p>
                </div>
                
                <DialogFooter className="gap-3 sm:gap-3">
                    <Button
                        variant="destructive"
                        onClick={handleLogoutNow}
                        className="flex-1"
                    >
                        Sair agora
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleStayLoggedIn}
                        className="flex-1"
                    >
                        Continuar conectado
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};