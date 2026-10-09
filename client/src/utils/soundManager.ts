class SoundManager {
    private context: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private enabled: boolean = true;

    // Volume Levels (0.0 to 1.0)
    private volumes = {
        master: 0.5,
        sfx: 1.0,
        music: 1.0
    };

    constructor() {
        // Initialize on first interaction usually, but we can setup structure
        // Browser policy requires user interaction to start AudioContext
    }

    private init() {
        if (!this.context) {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.updateMasterGain(); // Set initial gain
            this.masterGain.connect(this.context.destination);
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    private updateMasterGain() {
        if (this.masterGain && this.context) {
            // Smooth transition to avoid pops
            this.masterGain.gain.setTargetAtTime(this.volumes.master, this.context.currentTime, 0.02);
        }
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled && this.masterGain && this.context) {
            this.masterGain.gain.setTargetAtTime(0, this.context.currentTime, 0.02);
        } else if (enabled) {
            this.updateMasterGain();
        }
    }

    public setVolume(type: 'master' | 'sfx' | 'music', value: number) {
        this.volumes[type] = Math.max(0, Math.min(1, value));
        if (type === 'master') {
            this.updateMasterGain();
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, volumeMultiplier: number = 1.0, isMusic: boolean = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.context || !this.masterGain) return;

        // Check channel volume (Optimization: skip if 0)
        const channelVolume = isMusic ? this.volumes.music : this.volumes.sfx;
        if (channelVolume <= 0 || this.volumes.master <= 0) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime + startTime);

        // Frequency sweep for movement and dice
        if ((type === 'sine' || type === 'triangle') && duration > 0.05) {
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.context.currentTime + startTime + duration);
        }

        // Apply Channel Volume * Specific Effect Multiplier
        // Master volume is handled by the masterGain node
        const targetGain = channelVolume * volumeMultiplier;

        gain.gain.setValueAtTime(0, this.context.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(targetGain, this.context.currentTime + startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.context.currentTime + startTime);
        osc.stop(this.context.currentTime + startTime + duration);
    }

    public playClick() {
        this.playTone(800, 'sine', 0.1, 0, 0.8);
    }

    public playMove() {
        // Even more impactful thud: lower frequency and longer duration
        this.playTone(120, 'triangle', 0.2, 0, 1.8); // Deep thud
        this.playTone(900, 'sine', 0.06, 0.01, 0.8); // Bright click
    }

    public playTurn() {
        // Chime
        this.playTone(500, 'sine', 0.3, 0, 0.7);
        this.playTone(750, 'sine', 0.3, 0.1, 0.7);
    }

    public playDiceRoll() {
        // Slowed down dice roll to match ~0.6s animation
        // 8 faster clicks spreading over 0.5s
        for (let i = 0; i < 8; i++) {
            const delay = i * 0.07; // ~560ms total
            this.playTone(200 + Math.random() * 400, 'square', 0.04, delay, 0.4);
        }
    }

    public playError() {
        // Buzz
        this.playTone(150, 'sawtooth', 0.3);
    }

    public playChat() {
        // Ping
        this.playTone(1200, 'sine', 0.15);
    }

    public playJoin() {
        // Rise
        this.playTone(400, 'sine', 0.2);
        this.playTone(600, 'sine', 0.2, 0.1);
    }
}

export const soundManager = new SoundManager();
