"use client";

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;

  private init() {
    if (typeof window !== "undefined" && !this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  private playTone(
    frequency: number,
    type: OscillatorType,
    duration: number,
    volume: number = 0.1,
  ) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

    // Envelope
    gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  // Soft "pop" for chat messages
  public playMessageSound() {
    this.playTone(800, "sine", 0.1, 0.2);
    setTimeout(() => this.playTone(1200, "sine", 0.15, 0.15), 50);
  }

  // Sleek "whoosh/chime" for joining room
  public playJoinSound() {
    this.playTone(440, "sine", 0.3, 0.1);
    setTimeout(() => this.playTone(554, "sine", 0.3, 0.1), 100);
    setTimeout(() => this.playTone(659, "sine", 0.4, 0.1), 200);
  }

  // Subtle click for reactions
  public playReactionSound() {
    this.playTone(1500, "triangle", 0.05, 0.05);
  }

  // Leave sound
  public playLeaveSound() {
    this.playTone(600, "sine", 0.2, 0.1);
    setTimeout(() => this.playTone(400, "sine", 0.3, 0.1), 100);
  }
}

export const sounds = new SoundManager();
