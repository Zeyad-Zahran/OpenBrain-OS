import type { Locale } from './i18n';

export interface ModelConfig {
  id: string;
  name: string;
  repoId: string;
  size: string;
  description: string;
  arabicSupport: boolean;
  minRamGB: number;
  dtype?: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'smollm2-360m',
    name: 'SmolLM2 360M',
    repoId: 'HuggingFaceTB/SmolLM2-360M-Instruct',
    size: '~350 MB',
    description: 'Very small and fast. Best for testing. English-focused.',
    arabicSupport: false,
    minRamGB: 1,
  },
  {
    id: 'qwen2.5-0.5b',
    name: 'Qwen2.5 0.5B',
    repoId: 'onnx-community/Qwen2.5-0.5B-Instruct',
    size: '~300 MB',
    description: 'Small & multilingual. Supports Arabic, English, Chinese & more.',
    arabicSupport: true,
    minRamGB: 2,
    dtype: 'q4',
  },
  {
    id: 'qwen2.5-1.5b',
    name: 'Qwen2.5 1.5B',
    repoId: 'onnx-community/Qwen2.5-1.5B-Instruct',
    size: '~900 MB',
    description: 'Great quality. Excellent Arabic & multilingual support. Uses 4-bit quantization.',
    arabicSupport: true,
    minRamGB: 4,
    dtype: 'bnb4',
  },
  {
    id: 'smollm2-1.7b',
    name: 'SmolLM2 1.7B',
    repoId: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
    size: '~1.7 GB',
    description: 'Good English quality. Fast inference.',
    arabicSupport: false,
    minRamGB: 4,
  },
  {
    id: 'gemma-3-270m',
    name: 'Gemma 3 270M',
    repoId: 'onnx-community/gemma-3-270m-it-ONNX',
    size: '~200 MB',
    description: 'Google Gemma 3 ultra-small. Fast on weak devices. Multilingual incl. Arabic.',
    arabicSupport: true,
    minRamGB: 1,
    dtype: 'q4',
  },
  {
    id: 'gemma-3-1b',
    name: 'Gemma 3 1B',
    repoId: 'onnx-community/gemma-3-1b-it-ONNX',
    size: '~700 MB',
    description: 'Google Gemma 3. Strong multilingual & Arabic support. Balanced quality/speed.',
    arabicSupport: true,
    minRamGB: 3,
    dtype: 'q4',
  },
  {
    id: 'llama-3.2-1b',
    name: 'Llama 3.2 1B',
    repoId: 'onnx-community/Llama-3.2-1B-Instruct-q4f16',
    size: '~750 MB',
    description: 'Meta Llama 3.2. Multilingual (EN/DE/FR/ES/IT/PT/HI). Limited Arabic.',
    arabicSupport: false,
    minRamGB: 3,
    dtype: 'q4f16',
  },
  {
    id: 'gemma-4-e2b',
    name: 'Gemma 4 E2B (Experimental)',
    repoId: 'onnx-community/gemma-4-E2B-it-ONNX',
    size: '~2.5 GB',
    description: '⚠️ Experimental. Multimodal Gemma 4. Very large embeddings — may fail on most devices.',
    arabicSupport: true,
    minRamGB: 8,
    dtype: 'q4',
  },
];

export interface AppSettings {
  locale: Locale;
  assistantName: string;
  systemInstructions: string;
  temperature: number;
  maxTokens: number;
  selectedModelId: string;
}

const SETTINGS_KEY = 'openbrain-settings';

const DEFAULT_SETTINGS: AppSettings = {
  locale: 'en',
  assistantName: 'OpenBrain',
  systemInstructions: 'You are a helpful, knowledgeable AI assistant. You respond clearly and concisely. You support all languages and respond in the language the user writes in.',
  temperature: 0.7,
  maxTokens: 512,
  selectedModelId: 'qwen2.5-0.5b',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
