class AudioSynthesizer {
    private ctx: AudioContext | null = null;
    private sfxVolume = 0.5;
    private musicVolume = 0.5;
    private bgm: HTMLAudioElement | null = null;
    private currentTrackSrc = '/bgm/endless_fairway_run.mp3';

    private getContext(): AudioContext {
        if (!this.ctx) {
            // @ts-ignore
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    setSFXVolume(vol: number) {
        this.sfxVolume = vol;
    }

    setMusicVolume(vol: number) {
        this.musicVolume = vol;
        if (this.bgm) {
            this.bgm.volume = vol;
        }
    }

    startBGM() {
        if (this.bgm) return;
        // BGM soundtrack path
        this.bgm = new Audio(this.currentTrackSrc);
        this.bgm.loop = true;
        this.bgm.volume = this.musicVolume;

        const playPromise = this.bgm.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay blocked. Bind interaction listener to play soundtrack
                const startOnInteract = () => {
                    if (this.bgm) {
                        this.bgm.play().catch(() => {});
                    }
                    window.removeEventListener('click', startOnInteract);
                    window.removeEventListener('keydown', startOnInteract);
                };
                window.addEventListener('click', startOnInteract);
                window.addEventListener('keydown', startOnInteract);
            });
        }
    }

    setBGMTrack(src: string) {
        if (this.currentTrackSrc === src) return;
        this.currentTrackSrc = src;
        if (this.bgm) {
            const wasPlaying = !this.bgm.paused;
            this.bgm.pause();
            this.bgm.src = src;
            this.bgm.load();
            this.bgm.volume = this.musicVolume;
            if (wasPlaying) {
                this.bgm.play().catch(() => {});
            }
        }
    }

    playShoot(power: number) {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            // Scale frequency based on stroke power
            const baseFreq = 150 + power * 300;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
            
            gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01 * this.sfxVolume, now + 0.15);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.16);
        } catch (e) {
            console.error("Audio error", e);
        }
    }

    playBounce() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.setValueAtTime(120, now + 0.04);
            
            gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01 * this.sfxVolume, now + 0.08);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {
            console.error(e);
        }
    }

    playBumper() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            
            // Neon high pitch chime
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); // A5
            
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1320, now); // E6 fifth harmonic
            
            gain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01 * this.sfxVolume, now + 0.25);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.25);
            osc2.stop(now + 0.25);
        } catch (e) {
            console.error(e);
        }
    }

    playGate() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.linearRampToValueAtTime(1760, now + 0.2);
            
            gain.gain.setValueAtTime(0.05 * this.sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.005 * this.sfxVolume, now + 0.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.21);
        } catch (e) {
            console.error(e);
        }
    }

    playWaterSkim() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.linearRampToValueAtTime(400, now + 0.1);
            
            gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01 * this.sfxVolume, now + 0.1);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.11);
        } catch (e) {
            console.error(e);
        }
    }

    playWaterSink() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
            
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.005 * this.sfxVolume, now + 0.4);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.41);
        } catch (e) {
            console.error(e);
        }
    }

    playCupSink() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            
            // Golf cup rattle (low square wave) + sweet arpeggio jingle
            const rattle = ctx.createOscillator();
            const rGain = ctx.createGain();
            rattle.type = 'triangle';
            rattle.frequency.setValueAtTime(90, now);
            rattle.frequency.exponentialRampToValueAtTime(200, now + 0.15);
            rGain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
            rGain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, now + 0.15);
            
            rattle.connect(rGain);
            rGain.connect(ctx.destination);
            rattle.start(now);
            rattle.stop(now + 0.15);
            
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const noteOsc = ctx.createOscillator();
                const noteGain = ctx.createGain();
                noteOsc.type = 'sine';
                noteOsc.frequency.setValueAtTime(freq, now + 0.15 + i * 0.08);
                
                noteGain.gain.setValueAtTime(0.08 * this.sfxVolume, now + 0.15 + i * 0.08);
                noteGain.gain.exponentialRampToValueAtTime(0.005 * this.sfxVolume, now + 0.35 + i * 0.08);
                
                noteOsc.connect(noteGain);
                noteGain.connect(ctx.destination);
                
                noteOsc.start(now + 0.15 + i * 0.08);
                noteOsc.stop(now + 0.4 + i * 0.08);
            });
        } catch (e) {
            console.error(e);
        }
    }

    playMulligan() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
            
            gain.gain.setValueAtTime(0.01 * this.sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.08 * this.sfxVolume, now + 0.15);
            gain.gain.linearRampToValueAtTime(0.001 * this.sfxVolume, now + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.3);
        } catch (e) {
            console.error(e);
        }
    }

    playTick() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1600, now);
            
            gain.gain.setValueAtTime(0.015 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001 * this.sfxVolume, now + 0.04);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.045);
        } catch (e) {}
    }

    playScoreTick(pitch: number = 800) {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(pitch, now);
            osc.frequency.exponentialRampToValueAtTime(pitch * 1.3, now + 0.035);
            gain.gain.setValueAtTime(0.04 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001 * this.sfxVolume, now + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.065);
        } catch (e) {}
    }

    playParBonus(parDiff: number) {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            // Choose fanfare notes based on par result
            let notes: number[];
            let vol = 0.1;
            if (parDiff <= -2) { // Eagle/Albatross - BIG fanfare
                notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
                vol = 0.15;
            } else if (parDiff === -1) { // Birdie
                notes = [523.25, 659.25, 783.99, 1046.50];
            } else if (parDiff === 0) { // Par
                notes = [440, 554.37, 659.25, 880];
            } else if (parDiff === 1) { // Bogey - neutral
                notes = [349.23, 440, 523.25];
                vol = 0.07;
            } else { // Double bogey - descending sad notes
                notes = [523.25, 440, 349.23, 277.18];
                vol = 0.07;
            }
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.09);
                gain.gain.setValueAtTime(vol * this.sfxVolume, now + i * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.001 * this.sfxVolume, now + i * 0.09 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.09);
                osc.stop(now + i * 0.09 + 0.35);
            });
        } catch (e) {}
    }

    playCash() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'square';
            osc1.frequency.setValueAtTime(987.77, now); // B5
            osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1975.53, now); // B6
            osc2.frequency.setValueAtTime(2637.02, now + 0.08); // E7
            
            gain.gain.setValueAtTime(0.04 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001 * this.sfxVolume, now + 0.3);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.3);
            osc2.stop(now + 0.3);
        } catch (e) {}
    }

    playTalkBlip() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            // Retro speech voice pitch with slight variation
            const pitch = 140 + Math.random() * 60;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(pitch, now);
            
            gain.gain.setValueAtTime(0.06 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001 * this.sfxVolume, now + 0.05);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {}
    }

    playHoleInOneFanfare() {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
            const vol = 0.18;
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = i % 2 === 0 ? 'square' : 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.07);
                gain.gain.setValueAtTime(vol * this.sfxVolume, now + i * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001 * this.sfxVolume, now + i * 0.07 + 0.4);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.07);
                osc.stop(now + i * 0.07 + 0.45);
            });
        } catch (e) {}
    }
}

export const audio = new AudioSynthesizer();
