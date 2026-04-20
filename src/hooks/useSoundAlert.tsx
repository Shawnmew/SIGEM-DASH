import { useEffect, useRef, useState, useCallback } from 'react';
import { dashboardService, RecentAlert } from '@/services/dashboardService';
import { playAlertSound, isSoundAlertsEnabled, setSoundAlertsEnabled } from '@/services/soundService';

interface SoundAlertOptions {
    pollingInterval?: number; // milliseconds
    enabled?: boolean;
}

export const useSoundAlert = ({ pollingInterval = 30000, enabled: initialEnabled = true }: SoundAlertOptions = {}) => {
    const [enabled, setEnabled] = useState(initialEnabled);
    const previousAlertsRef = useRef<RecentAlert[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load saved preference
    useEffect(() => {
        const saved = isSoundAlertsEnabled();
        setEnabled(saved);
    }, []);

    // Save preference when changed
    useEffect(() => {
        setSoundAlertsEnabled(enabled);
    }, [enabled]);

    const checkForNewCriticalAlerts = useCallback(async () => {
        if (!enabled) return;

        try {
            const alerts = await dashboardService.getRecentAlerts(10); // get last 10 alerts
            const previousIds = new Set(previousAlertsRef.current.map(a => a.id));
            const newCriticalAlerts = alerts.filter(a => 
                !previousIds.has(a.id) && 
                (a.tipo === 'critico' || a.tipo === 'urgente')
            );

            for (const alert of newCriticalAlerts) {
                playAlertSound(alert.tipo);
            }

            previousAlertsRef.current = alerts;
        } catch (error) {
            console.error('Erro ao verificar novos alertas:', error);
        }
    }, [enabled]);

    const startPolling = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(checkForNewCriticalAlerts, pollingInterval);
        // Immediate check on start
        checkForNewCriticalAlerts();
    }, [checkForNewCriticalAlerts, pollingInterval]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (enabled) {
            startPolling();
        } else {
            stopPolling();
        }

        return () => {
            stopPolling();
        };
    }, [enabled, startPolling, stopPolling]);

    return { enabled, setEnabled };
};