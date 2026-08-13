// Universal Notification Sound Synthesizer with Multi-Tone Chimes, Audio Unlock & Dynamic WAV Fallback

const playedSoundEventIds = new Set<string>();
let globalAudioCtx: AudioContext | null = null;
let autoUnlockAttached = false;

/**
 * Gets or initializes Web Audio API Context
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }
  return globalAudioCtx;
}

/**
 * Checks if AudioContext is currently suspended (autoplay blocked by browser)
 */
export function isAudioContextSuspended(): boolean {
  if (typeof window === 'undefined') return false;
  const ctx = getAudioContext();
  return !!ctx && ctx.state === 'suspended';
}

/**
 * Unlocks the Web Audio API context on user gesture
 */
export function unlockAudioContext(): boolean {
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => console.warn('[Sound] Audio resume error:', err));
      }
      // Play brief soft oscillator to confirm unlock
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      return true;
    }
  } catch (err) {
    console.warn('[Sound] Audio unlock exception:', err);
  }
  return false;
}

// Continuous gesture listener until audio context is running
if (typeof window !== 'undefined' && !autoUnlockAttached) {
  autoUnlockAttached = true;
  const autoUnlockHandler = () => {
    unlockAudioContext();
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('click', autoUnlockHandler);
      window.removeEventListener('touchstart', autoUnlockHandler);
      window.removeEventListener('keydown', autoUnlockHandler);
      window.removeEventListener('pointerdown', autoUnlockHandler);
    }
  };
  window.addEventListener('click', autoUnlockHandler);
  window.addEventListener('touchstart', autoUnlockHandler);
  window.addEventListener('keydown', autoUnlockHandler);
  window.addEventListener('pointerdown', autoUnlockHandler);
}

/**
 * Checks whether sound notifications are enabled in settings
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('digimoms_sound_enabled');
  return val !== 'false';
}

/**
 * Sets sound notification preference
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('digimoms_sound_enabled', enabled ? 'true' : 'false');
  if (enabled) {
    unlockAudioContext();
  }
}

/**
 * Checks whether notifications are enabled in settings
 */
export function isNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('digimoms_notifications_enabled');
  return val !== 'false';
}

/**
 * Sets notifications preference
 */
export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('digimoms_notifications_enabled', enabled ? 'true' : 'false');
}

/**
 * Gets notification volume level (0.0 to 1.0)
 */
export function getSoundVolume(): number {
  if (typeof window === 'undefined') return 0.9;
  const val = localStorage.getItem('digimoms_sound_volume');
  if (!val) return 0.9;
  const num = parseFloat(val);
  return isNaN(num) ? 0.9 : Math.max(0, Math.min(1, num));
}

/**
 * Sets notification volume level (0.0 to 1.0)
 */
export function setSoundVolume(vol: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(1, vol));
  localStorage.setItem('digimoms_sound_volume', clamped.toString());
}

export type SoundType = 
  | 'new_order'
  | 'order_accepted'
  | 'order_rejected'
  | 'cooking'
  | 'kitchen_ready'
  | 'order_served'
  | 'order_completed'
  | 'order_cancelled'
  | 'call_waiter'
  | 'cash_request'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'customer_joined'
  | 'customer_request'
  | 'general';

/**
 * Dynamically creates a clean PCM WAV Data URI chime as HTML5 Audio fallback
 */
function createChimeWavUri(freq1 = 880, freq2 = 1046, duration = 0.5): string {
  try {
    const sampleRate = 22050;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Uint8Array(44 + numSamples);
    
    // RIFF Header
    buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46;
    const fileSize = 36 + numSamples;
    buffer[4] = fileSize & 0xff; buffer[5] = (fileSize >> 8) & 0xff;
    buffer[6] = (fileSize >> 16) & 0xff; buffer[7] = (fileSize >> 24) & 0xff;
    buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // WAVE
    buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20; // fmt 
    buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0; // Subchunk1Size (16)
    buffer[20] = 1; buffer[21] = 0; // PCM format
    buffer[22] = 1; buffer[23] = 0; // Mono channel
    buffer[24] = sampleRate & 0xff; buffer[25] = (sampleRate >> 8) & 0xff;
    buffer[26] = (sampleRate >> 16) & 0xff; buffer[27] = (sampleRate >> 24) & 0xff;
    buffer[28] = sampleRate & 0xff; buffer[29] = (sampleRate >> 8) & 0xff;
    buffer[30] = (sampleRate >> 16) & 0xff; buffer[31] = (sampleRate >> 24) & 0xff;
    buffer[32] = 1; buffer[33] = 0; // BlockAlign
    buffer[34] = 8; buffer[35] = 0; // BitsPerSample
    buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61; // data
    buffer[40] = numSamples & 0xff; buffer[41] = (numSamples >> 8) & 0xff;
    buffer[42] = (numSamples >> 16) & 0xff; buffer[43] = (numSamples >> 24) & 0xff;
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const fade = Math.max(0, 1 - (t / duration));
      const val = (Math.sin(2 * Math.PI * freq1 * t) * 0.5 + Math.sin(2 * Math.PI * freq2 * t) * 0.5) * fade;
      buffer[44 + i] = Math.floor((val + 1) * 127.5);
    }
    
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  } catch {
    return '';
  }
}

/**
 * Fallback HTML5 Audio Element playback if Web Audio API fails
 */
function playFallbackAudio(type: SoundType): void {
  try {
    const vol = getSoundVolume();
    if (vol <= 0) return;
    let freq1 = 880;
    let freq2 = 1046;
    if (type === 'call_waiter' || type === 'cash_request') {
      freq1 = 987; freq2 = 1318;
    } else if (type === 'kitchen_ready' || type === 'payment_confirmed') {
      freq1 = 783; freq2 = 1046;
    }
    const dataUri = createChimeWavUri(freq1, freq2, 0.5);
    if (dataUri) {
      const audio = new Audio(dataUri);
      audio.volume = vol;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`[Sound] Fallback audio chime played successfully for event: ${type}`);
        }).catch((err) => {
          console.warn(`[Sound] Fallback audio.play() rejected by browser for event '${type}':`, err?.name, err?.message);
        });
      }
    }
  } catch (e) {
    console.warn('[Sound] Fallback audio exception:', e);
  }
}

/**
 * Executes a full diagnostic test of the audio system, logging detailed parameters to console
 */
export async function runAudioDiagnosticTest(): Promise<{
  success: boolean;
  message: string;
  details: Record<string, any>;
}> {
  console.group('🔊 Notification Sound Diagnostic Test');
  unlockAudioContext();
  
  const ctx = getAudioContext();
  const volume = getSoundVolume();
  const wavUri = createChimeWavUri(880, 1046, 0.5);
  const tempAudio = typeof window !== 'undefined' ? new Audio(wavUri) : null;
  
  if (tempAudio) {
    tempAudio.volume = volume;
  }

  const details: Record<string, any> = {
    audioUrlType: wavUri ? 'Generated PCM WAV Data URI' : 'None',
    audioReadyState: tempAudio ? tempAudio.readyState : -1,
    audioPaused: tempAudio ? tempAudio.paused : true,
    audioMuted: tempAudio ? tempAudio.muted : false,
    audioVolume: volume,
    audioContextState: ctx ? ctx.state : 'unavailable',
    soundEnabledSetting: isSoundEnabled(),
    notificationsEnabledSetting: isNotificationsEnabled(),
    timestamp: new Date().toISOString()
  };

  console.log('1. Sound Settings & State:', details);

  let synthSuccess = false;
  let audioPlaySuccess = false;
  let synthError: string | null = null;
  let audioPlayError: string | null = null;

  // Test 1: Web Audio API Oscillator
  try {
    if (ctx) {
      if (ctx.state === 'suspended') {
        console.warn('⚠️ AudioContext is currently SUSPENDED by browser autoplay policy. Attempting resume...');
        await ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3);
      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
      synthSuccess = true;
      console.log('✅ Web Audio API Oscillator chime initialized successfully! Context state:', ctx.state);
    }
  } catch (err: any) {
    synthError = err?.message || String(err);
    console.error('❌ Web Audio API Synthesis Failed:', err);
  }

  // Test 2: HTML5 Audio play() Promise Rejection Test
  if (tempAudio) {
    try {
      console.log('2. Attempting tempAudio.play()...');
      const playPromise = tempAudio.play();
      if (playPromise !== undefined) {
        await playPromise;
        audioPlaySuccess = true;
        console.log('✅ HTML5 Audio.play() Promise resolved successfully!');
        details.audioPausedAfterPlay = tempAudio.paused;
      }
    } catch (err: any) {
      audioPlayError = err?.name ? `${err.name}: ${err.message}` : String(err);
      console.error('❌ HTML5 Audio.play() Promise REJECTED by browser:', err);
      console.error('Diagnostic Cause: Browser Autoplay Policy blocked audio because user gesture was missing or restricted.');
    }
  }

  details.synthSuccess = synthSuccess;
  details.audioPlaySuccess = audioPlaySuccess;
  details.synthError = synthError;
  details.audioPlayError = audioPlayError;

  const overallSuccess = synthSuccess || audioPlaySuccess;
  const message = overallSuccess
    ? `Sound test passed! AudioContext state: ${ctx?.state || 'N/A'}`
    : `Audio blocked by browser autoplay security: ${audioPlayError || synthError}`;

  console.log('3. Final Diagnostic Outcome:', message);
  console.groupEnd();

  return {
    success: overallSuccess,
    message,
    details
  };
}

/**
 * Plays a synthesized notification sound for any event
 * @param type Sound tone preset
 * @param eventId Unique ID to prevent duplicate audio plays for the same event
 */
export function playNotificationSound(type: SoundType, eventId?: string): void {
  if (!isSoundEnabled()) return;

  if (eventId) {
    if (playedSoundEventIds.has(eventId)) {
      console.log(`[Sound] Event ${eventId} sound already played, skipping duplicate.`);
      return;
    }
    playedSoundEventIds.add(eventId);
    if (playedSoundEventIds.size > 300) {
      const arr = Array.from(playedSoundEventIds);
      arr.slice(0, 100).forEach(id => playedSoundEventIds.delete(id));
    }
  }

  const volume = getSoundVolume();
  if (volume <= 0) return;

  // Always attempt to unlock context on trigger
  unlockAudioContext();

  try {
    const ctx = getAudioContext();
    if (!ctx) {
      playFallbackAudio(type);
      return;
    }

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        playFallbackAudio(type);
      }).catch(() => {
        playFallbackAudio(type);
      });
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const masterGain = volume * 0.65; // High, crisp volume

    switch (type) {
      case 'new_order':
        // Loud 4-note arpeggio chime (C5 -> E5 -> G5 -> C6) played twice for high urgency
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.24);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.36);
        osc.frequency.setValueAtTime(523.25, now + 0.55);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.67);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.79);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.91);
        gain.gain.setValueAtTime(masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
        playFallbackAudio(type);
        break;

      case 'cash_request':
        // High attention alert chime (G5 -> C6 square pulse)
        osc.type = 'square';
        osc.frequency.setValueAtTime(783.99, now);
        osc.frequency.setValueAtTime(1046.50, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.35);
        osc.frequency.setValueAtTime(1046.50, now + 0.5);
        gain.gain.setValueAtTime(masterGain * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        playFallbackAudio(type);
        break;

      case 'payment_confirmed':
        // Joyful major triad (D5 -> F#5 -> A5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(739.99, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.24);
        gain.gain.setValueAtTime(masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        playFallbackAudio(type);
        break;

      case 'call_waiter':
        // Double loud ping alert
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(880, now + 0.2);
        osc.frequency.setValueAtTime(1174.66, now + 0.4);
        gain.gain.setValueAtTime(masterGain, now);
        gain.gain.setValueAtTime(0.001, now + 0.15);
        gain.gain.setValueAtTime(masterGain, now + 0.2);
        gain.gain.setValueAtTime(0.001, now + 0.35);
        gain.gain.setValueAtTime(masterGain, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
        playFallbackAudio(type);
        break;

      case 'kitchen_ready':
        // Clear bell chime (E5 -> B5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.18);
        gain.gain.setValueAtTime(masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
        playFallbackAudio(type);
        break;

      case 'order_accepted':
        // Soft positive chime (C5 -> G5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
        gain.gain.setValueAtTime(masterGain * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'cooking':
        // Triple rising pulse (F5 -> A5 -> C6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(698.46, now);
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2);
        gain.gain.setValueAtTime(masterGain * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;

      case 'order_served':
        // Warm double chime (A5 -> D6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880.00, now);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15);
        gain.gain.setValueAtTime(masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'order_completed':
        // Complete fanfare (C5 -> E5 -> G5 -> C6 -> E6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3);
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.4);
        gain.gain.setValueAtTime(masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;

      case 'order_cancelled':
      case 'order_rejected':
      case 'payment_failed':
        // Low descending warning alert (E4 -> A3)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(329.63, now);
        osc.frequency.exponentialRampToValueAtTime(220.00, now + 0.25);
        gain.gain.setValueAtTime(masterGain * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'customer_joined':
      case 'customer_request':
        // Soft double ding (D5 -> A5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880.00, now + 0.15);
        gain.gain.setValueAtTime(masterGain * 0.7, now);
        gain.gain.setValueAtTime(0.001, now + 0.12);
        gain.gain.setValueAtTime(masterGain * 0.7, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;

      default:
        // Standard chime (G5 -> C6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(783.99, now);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15);
        gain.gain.setValueAtTime(masterGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
    }
  } catch (err) {
    console.warn('[Sound] Primary synth error, using fallback:', err);
    playFallbackAudio(type);
  }
}

