// Portal sound effects using Web Audio API (no external files needed)

let audioCtx: AudioContext | null = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    return audioCtx;
}

/** Ladder portal: magical ascending shimmer (loud and distinct) */
export function playLadderSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. Ascending major arpeggio (C Major: C5, E5, G5, C6, E6, G6)
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; 
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine"; // Sine for purity
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        
        // Attack
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
        // Decay
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.8);
        
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 1.0);
    });

    // 2. Sparkle/Glissando effect (high pitch sweep)
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = "triangle"; // Triangle cuts through better than sine
    sweep.frequency.setValueAtTime(800, now);
    sweep.frequency.exponentialRampToValueAtTime(3000, now + 1.0);
    
    sweepGain.gain.setValueAtTime(0, now);
    sweepGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    sweep.connect(sweepGain).connect(ctx.destination);
    sweep.start(now);
    sweep.stop(now + 1.2);
}

/** Snake portal: ominous descending slide (dramatic) */
export function playSnakeSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. Sliding Drone (Sawtooth for edge)
    const slide = ctx.createOscillator();
    const slideGain = ctx.createGain();
    slide.type = "sawtooth";
    slide.frequency.setValueAtTime(600, now);
    slide.frequency.exponentialRampToValueAtTime(100, now + 1.2); // Long slide down
    
    slideGain.gain.setValueAtTime(0, now);
    slideGain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    slide.connect(slideGain).connect(ctx.destination);
    slide.start(now);
    slide.stop(now + 1.3);

    // 2. Low Rumble/Thud
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = "square"; // Aggressive low end
    rumble.frequency.setValueAtTime(80, now);
    rumble.frequency.linearRampToValueAtTime(30, now + 1.0);
    
    rumbleGain.gain.setValueAtTime(0.1, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    rumble.connect(rumbleGain).connect(ctx.destination);
    rumble.start(now);
    rumble.stop(now + 1.2);

    // 3. Wobbly dissonance (LFO effect simulation with second oscillator)
    const wobble = ctx.createOscillator();
    const wobbleGain = ctx.createGain();
    wobble.type = "sine";
    wobble.frequency.setValueAtTime(580, now); // Slightly off from 600
    wobble.frequency.exponentialRampToValueAtTime(90, now + 1.2);
    
    wobbleGain.gain.setValueAtTime(0, now);
    wobbleGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
    wobbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    wobble.connect(wobbleGain).connect(ctx.destination);
    wobble.start(now);
    wobble.stop(now + 1.3);
}

/** Dice roll click sound (shorter, crisper, more natural) */
export function playDiceRollSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Triangle is softer than square, sounds more like plastic hitting
    osc.type = "triangle";
    // Higher pitch variation for randomness
    osc.frequency.setValueAtTime(800 + Math.random() * 1000, now);
    
    // Very short pop
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
}

/** Dice result sound (triumphant ding) */
export function playDiceResultSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // High bell/chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.5);

    // Harmonics
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1760, now); // A6
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 1.0);
}

/** Winner Fanfare: Trumpet-like cheerful melody */
export function playWinSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // A simple fanfare melody: C - E - G - C5
    const notes = [
        { f: 523.25, d: 0.0, l: 0.15 }, // C5
        { f: 523.25, d: 0.15, l: 0.15 }, // C5
        { f: 523.25, d: 0.30, l: 0.15 }, // C5
        { f: 659.25, d: 0.45, l: 0.4 },  // E5
        { f: 523.25, d: 0.85, l: 0.15 }, // C5
        { f: 659.25, d: 1.00, l: 0.15 }, // E5
        { f: 783.99, d: 1.15, l: 0.6 },  // G5
    ];

    notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth"; // Brass-like
        osc.frequency.setValueAtTime(n.f, now + n.d);
        
        // Envelope
        gain.gain.setValueAtTime(0, now + n.d);
        gain.gain.linearRampToValueAtTime(0.15, now + n.d + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.d + n.l);

        // Lowpass filter for warmer sound
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2000;

        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start(now + n.d);
        osc.stop(now + n.d + n.l + 0.1);
    });
}

/** Loser Sound: "Wah wah wah waaaah" */
export function playLoseSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [
        { f: 392.00, d: 0.0, l: 0.4 }, // G4
        { f: 369.99, d: 0.4, l: 0.4 }, // F#4
        { f: 349.23, d: 0.8, l: 0.4 }, // F4
        { f: 329.63, d: 1.2, l: 1.0 }, // E4
    ];

    notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.f, now + n.d);
        // Pitch bend down at the end of each note
        osc.frequency.linearRampToValueAtTime(n.f - 10, now + n.d + n.l);

        gain.gain.setValueAtTime(0, now + n.d);
        gain.gain.linearRampToValueAtTime(0.1, now + n.d + 0.1);
        gain.gain.linearRampToValueAtTime(0.001, now + n.d + n.l);

        osc.connect(gain).connect(ctx.destination);
        osc.start(now + n.d);
        osc.stop(now + n.d + n.l);
    });
}

/** Avatar step sound */
export function playStepSound() {

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Low thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
}

/** Treasure chest discovery: magical sparkle + coin jingle */
export function playTreasureSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Sparkle arpeggio (E5, G#5, B5, E6)
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.7);
    });

    // Coin shimmer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = "triangle";
    shimmer.frequency.setValueAtTime(2000, now + 0.5);
    shimmer.frequency.exponentialRampToValueAtTime(4000, now + 1.0);
    shimmerGain.gain.setValueAtTime(0, now + 0.5);
    shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.6);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    shimmer.connect(shimmerGain).connect(ctx.destination);
    shimmer.start(now + 0.5);
    shimmer.stop(now + 1.3);
}

/** Card use: woosh + impact */
export function playCardUseSound() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Woosh sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2500;

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Impact hit
    const hit = ctx.createOscillator();
    const hitGain = ctx.createGain();
    hit.type = "sine";
    hit.frequency.setValueAtTime(300, now + 0.2);
    hit.frequency.exponentialRampToValueAtTime(80, now + 0.4);
    hitGain.gain.setValueAtTime(0.2, now + 0.2);
    hitGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    hit.connect(hitGain).connect(ctx.destination);
    hit.start(now + 0.2);
    hit.stop(now + 0.6);
}


// ============================
// Ambient Background Music
// ============================

let ambientInterval: ReturnType<typeof setInterval> | null = null;
let isMuted = false;

/** 
 * Start generative ambient music (C Major Pentatonic: C, D, E, G, A)
 * Soft sine waves with long attack/release for dreamy atmosphere.
 */
export function startAmbientMusic() {
    if (ambientInterval) return; // Already running

    const ctx = getAudioContext();
    const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4-C5 range

    const playRandomNote = () => {
        if (isMuted || ctx.state === 'suspended') return;

        const now = ctx.currentTime;
        const freq = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)];
        const duration = 2.0 + Math.random() * 2.0; // 2-4 seconds

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner();

        osc.type = "sine";
        osc.frequency.value = freq;

        // Random pan position
        panner.pan.value = (Math.random() * 2) - 1; 

        // Very soft volume for background
        const maxVol = 0.05; 

        // Envelope (Fade In -> Sustain -> Fade Out)
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(maxVol, now + 1.0); // Slow attack
        gain.gain.linearRampToValueAtTime(maxVol, now + duration - 1.0);
        gain.gain.linearRampToValueAtTime(0, now + duration); // Slow release

        osc.connect(panner).connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    };

    // Play a note every 1-2 seconds
    playRandomNote(); // Immediate start
    ambientInterval = setInterval(playRandomNote, 1500);
}

export function stopAmbientMusic() {
    if (ambientInterval) {
        clearInterval(ambientInterval);
        ambientInterval = null;
    }
}

export function toggleMute() {
    isMuted = !isMuted;
    
    // Also resume context if it was suspended (browser policy)
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    
    // Mute mainly affects future notes in startAmbientMusic
    // But let's also mute globally if needed (optional)
    // present implementation checks isMuted before playing new notes
    return isMuted;
}

export function getMuteState() {
    return isMuted;
}
