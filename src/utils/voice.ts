import { loadSettings } from './storage';

let voiceEnabled = localStorage.getItem('aidm_voice') !== 'false';
let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let speakingQueue: string[] = [];
let isSpeaking = false;

export function isVoiceEnabled(): boolean {
  return voiceEnabled;
}

export function setVoiceEnabled(enabled: boolean): void {
  voiceEnabled = enabled;
  localStorage.setItem('aidm_voice', String(enabled));
  if (!enabled) stopSpeaking();
}

export function stopSpeaking(): void {
  speakingQueue = [];
  isSpeaking = false;
  // Stop ElevenLabs audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  // Stop browser speech
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

// ============ Text cleanup ============

function cleanText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold**
    .replace(/\*([^*]+)\*/g, '$1')        // *italic*
    .replace(/__([^_]+)__/g, '$1')        // __bold__
    .replace(/_([^_]+)_/g, '$1')          // _italic_
    .replace(/#{1,6}\s*/g, '')            // headings
    .replace(/\[.*?\]/g, '')              // [brackets]
    .replace(/[{}]/g, '')                 // stray braces
    .replace(/```[\s\S]*?```/g, '')       // code blocks
    .replace(/`([^`]+)`/g, '$1')          // inline code
    .replace(/\n{3,}/g, '\n\n')           // excessive newlines
    .trim();
}

// Split text into natural sentences for pacing
function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or newline
  const raw = text.split(/(?<=[.!?…])\s+|(?<=\n)\n/);
  const sentences: string[] = [];
  for (const s of raw) {
    const trimmed = s.trim();
    if (trimmed.length > 0) sentences.push(trimmed);
  }
  return sentences;
}

// ============ Main speak function ============

export function speakDM(text: string): void {
  if (!voiceEnabled || typeof window === 'undefined') return;

  stopSpeaking();

  const clean = cleanText(text);
  if (!clean) return;

  const settings = loadSettings();

  if (settings.elevenLabsApiKey) {
    speakElevenLabs(clean, settings.elevenLabsApiKey, settings.elevenLabsVoiceId);
  } else {
    speakBrowserEnhanced(clean);
  }
}

// ============ ElevenLabs TTS ============

async function speakElevenLabs(text: string, apiKey: string, voiceId: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.4,          // Lower = more expressive/dramatic
            similarity_boost: 0.75,
            style: 0.6,              // More stylistic variation
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn('ElevenLabs failed, falling back to browser voice:', response.status);
      speakBrowserEnhanced(text);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
    };

    await audio.play();
  } catch (e) {
    console.warn('ElevenLabs error, falling back to browser voice:', e);
    speakBrowserEnhanced(text);
  }
}

// ============ Enhanced browser TTS ============
// Speaks sentence-by-sentence with pauses for drama

function speakBrowserEnhanced(text: string): void {
  if (!window.speechSynthesis) return;

  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return;

  speakingQueue = [...sentences];
  isSpeaking = true;
  speakNext();
}

function speakNext(): void {
  if (!isSpeaking || speakingQueue.length === 0) {
    isSpeaking = false;
    return;
  }

  const sentence = speakingQueue.shift()!;
  const utterance = new SpeechSynthesisUtterance(sentence);
  const voice = getDMVoice();
  if (voice) utterance.voice = voice;

  // Vary pacing based on content
  const isDialogue = sentence.includes('"') || sentence.includes('\u201C');
  const isExclamation = sentence.endsWith('!');
  const isQuestion = sentence.endsWith('?');
  const isEllipsis = sentence.endsWith('...');
  const isShort = sentence.length < 30;

  // Base: slightly slow, deep pitch
  utterance.rate = 0.92;
  utterance.pitch = 0.82;
  utterance.volume = 1;

  if (isDialogue) {
    // Slightly different tone for character speech
    utterance.rate = 0.95;
    utterance.pitch = 0.95;
  } else if (isExclamation) {
    // Urgent / exciting moments
    utterance.rate = 1.0;
    utterance.pitch = 0.88;
    utterance.volume = 1;
  } else if (isQuestion) {
    utterance.rate = 0.9;
    utterance.pitch = 0.9;
  } else if (isShort) {
    // Short dramatic statements — slow down
    utterance.rate = 0.82;
    utterance.pitch = 0.78;
  }

  currentUtterance = utterance;

  utterance.onend = () => {
    currentUtterance = null;
    // Add a natural pause between sentences
    const pause = isEllipsis ? 800 : isExclamation ? 400 : isShort ? 500 : 250;
    setTimeout(() => speakNext(), pause);
  };

  utterance.onerror = () => {
    currentUtterance = null;
    // Try to continue even if one sentence fails
    setTimeout(() => speakNext(), 100);
  };

  window.speechSynthesis.speak(utterance);
}

// ============ Voice selection ============

function getDMVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Prefer deep, dramatic English voices
  const preferred = [
    'Google UK English Male',
    'Microsoft Mark - English (United States)',
    'Microsoft David - English (United States)',
    'Daniel',
    'Alex',
    'Rishi',
    'Google US English',
  ];
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  return voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'))
    || voices.find(v => v.lang.startsWith('en'))
    || voices[0]
    || null;
}

// ============ Available ElevenLabs voices (for settings UI) ============

export const ELEVEN_LABS_VOICES = [
  // Male voices
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Deep, narrative' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', desc: 'Warm, well-rounded' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', desc: 'Gruff, crisp' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Authoritative, British' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', desc: 'Intense, transatlantic' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', desc: 'Articulate, commanding' },
  // Female voices
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Soft, warm storyteller' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Calm, clear narrator' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Emily', desc: 'Bright, expressive' },
  { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', desc: 'Energetic, animated' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', desc: 'Rich, theatrical' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', desc: 'Strong, confident' },
];

// Preload browser voices
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
