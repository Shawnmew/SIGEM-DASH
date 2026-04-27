// src/services/soundService.ts

let audioContext: AudioContext | null = null;
let enabled = true;

/**
 * Initialize AudioContext (required for Web Audio API)
 */
const initAudioContext = () => {
    if (!audioContext && typeof window !== 'undefined') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Resume on user interaction (browsers require user interaction to start audio)
        const resumeAudio = () => {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
        };
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
    }
    return audioContext;
};

/**
 * Play a beep sound using Web Audio API (fallback)
 */
const playBeep = () => {
    try {
        const context = initAudioContext();
        if (!context) return;

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 880; // 880 Hz
        gainNode.gain.value = 0.5;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 1);
        oscillator.stop(context.currentTime + 1);
    } catch (e) {
        console.error('Erro ao reproduzir beep:', e);
    }
};

/**
 * Load and play audio using Blob to avoid cache issues
 */
const loadAndPlay = async (path: string, volume: number = 0.5) => {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = volume;
        
        await audio.play();
        
        // Cleanup URL after play finishes
        audio.onended = () => URL.revokeObjectURL(url);
    } catch (error) {
        console.warn(`Falha ao carregar som de ${path}, usando beep:`, error);
        playBeep();
    }
};

/**
 * Play a critical alert sound
 */
const playCriticalSound = () => {
    if (!enabled) return;
    loadAndPlay('/sounds/alert-critical.mp3', 0.7);
};

/**
 * Play a urgent alert sound
 */
const playUrgentSound = () => {
    if (!enabled) return;
    loadAndPlay('/sounds/alert-urgent.mp3', 0.5);
};

/**
 * Set whether sound alerts are enabled
 */
export const setSoundAlertsEnabled = (value: boolean) => {
    enabled = value;
    localStorage.setItem('soundAlertsEnabled', String(value));
};

/**
 * Get current sound alerts status
 */
export const isSoundAlertsEnabled = (): boolean => {
    const saved = localStorage.getItem('soundAlertsEnabled');
    if (saved === null) return true; // default enabled
    return saved === 'true';
};

/**
 * Play alert based on type
 */
export const playAlertSound = (type: 'critico' | 'urgente' | 'aviso' | 'informativo') => {
    if (!enabled) return;

    switch (type) {
        case 'critico':
            playCriticalSound();
            break;
        case 'urgente':
            playUrgentSound();
            break;
        case 'aviso':
            // Optional: play softer sound or skip
            break;
        default:
            break;
    }
};

// Initialize on first user interaction
export const initSoundService = () => {
    // Preload audio context on first user click (handled in initAudioContext)
    document.addEventListener('click', () => {
        initAudioContext();
    }, { once: true });
};