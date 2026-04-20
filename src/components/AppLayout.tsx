import { ReactNode, useEffect, useRef } from 'react';
import { AppSidebar } from './AppSidebar';
import { SoundAlertToggle } from '@/components/SoundAlertToggle';
import { AccessibilityMenu } from '@/components/AccessibilityMenu';
import { SkipToContent } from '@/components/SkipToContent';
import { LiveAnnouncerProvider, useLiveAnnouncer } from '@/components/LiveAnnouncer';
import { useLocation } from 'react-router-dom';

function AppLayoutContent({ children }: { children: ReactNode }) {
    const { announce } = useLiveAnnouncer();
    const location = useLocation();
    const mainContentRef = useRef<HTMLDivElement>(null);

    // Announce page changes to screen readers
    useEffect(() => {
        const pageTitle = document.title || 'SIGEM';
        announce(`Navegou para: ${pageTitle}`);
        
        // Focus main content on route change
        if (mainContentRef.current) {
            mainContentRef.current.focus();
        }
    }, [location.pathname, announce]);

    return (
        <div className="flex min-h-screen w-full bg-background">
            <SkipToContent contentId="main-content" />
            <AppSidebar />
            <main 
                id="main-content"
                ref={mainContentRef}
                className="flex-1 min-w-0 lg:ml-0 focus:outline-none"
                tabIndex={-1}
                role="main"
                aria-label="Conteúdo principal"
            >
                <div className="p-4 lg:p-6 max-w-7xl mx-auto">
                    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
                        <AccessibilityMenu />
                        <SoundAlertToggle variant="button" className="shadow-lg" />
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}

export function AppLayout({ children }: { children: ReactNode }) {
    return (
        <LiveAnnouncerProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </LiveAnnouncerProvider>
    );
}