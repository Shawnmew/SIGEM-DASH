export const SESSION_CONFIG = {
    // Tempo em minutos para expiração da sessão (padrão: 30)
    timeoutMinutes: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || '30', 10),
    
    // Tempo em minutos para mostrar aviso antes de expirar (padrão: 2)
    warningMinutes: parseInt(import.meta.env.VITE_SESSION_WARNING_MINUTES || '2', 10),
    
    // URLs que não devem resetar o timer (ex: WebSocket, API polling)
    ignoreUrls: ['/api/ping', '/websocket'],
};