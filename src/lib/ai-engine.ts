import type { ChatMessage } from './db';
import type { AppSettings } from './settings';
import { AVAILABLE_MODELS } from './settings';

type ProgressCallback = (progress: { status: string; progress?: number; file?: string }) => void;
type TokenCallback = (token: string) => void;

let currentPipeline: any = null;
let currentModelId: string | null = null;
let isLoading = false;

export function getWebGPUSupport(): boolean {
  return 'gpu' in navigator;
}

/** Estimate device RAM in GB (rough heuristic) */
export function getDeviceMemoryGB(): number {
  // navigator.deviceMemory is available in Chrome
  if ('deviceMemory' in navigator) {
    return (navigator as any).deviceMemory as number;
  }
  // Fallback: assume 4GB
  return 4;
}

/** Suggest the best model ID based on device capabilities */
export function suggestBestModel(): string {
  const ram = getDeviceMemoryGB();
  if (ram >= 8) return 'qwen2.5-1.5b';
  if (ram >= 4) return 'qwen2.5-0.5b';
  return 'smollm2-360m';
}

/** Check if a model's files are already in Cache Storage */
export async function isModelCached(repoId: string): Promise<boolean> {
  try {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      const hasModelFiles = keys.some(
        (req) => req.url.includes('huggingface.co') && req.url.includes(repoId.replace('/', '%2F'))
      );
      if (hasModelFiles) return true;
      // Also check unencoded path
      const hasModelFiles2 = keys.some(
        (req) => req.url.includes(repoId)
      );
      if (hasModelFiles2) return true;
    }
  } catch {
    // Cache API not available
  }
  return false;
}

export async function loadModel(
  modelId: string,
  onProgress?: ProgressCallback
): Promise<boolean> {
  if (isLoading) return false;
  if (currentModelId === modelId && currentPipeline) return true;

  isLoading = true;
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) {
    isLoading = false;
    return false;
  }

  try {
    const { pipeline, env } = await import('@huggingface/transformers');
    
    env.allowLocalModels = false;

    const device = getWebGPUSupport() ? 'webgpu' : 'wasm';

    onProgress?.({ status: 'loading', progress: 0 });

    const pipelineOptions: any = {
      device,
      progress_callback: (p: any) => {
        if (p.status === 'progress' && p.progress != null) {
          onProgress?.({ status: 'downloading', progress: p.progress, file: p.file });
        } else if (p.status === 'ready') {
          onProgress?.({ status: 'ready', progress: 100 });
        }
      },
    };

    // Use dtype if specified (for quantized models)
    if (model.dtype) {
      pipelineOptions.dtype = model.dtype;
    }

    currentPipeline = await pipeline('text-generation', model.repoId, pipelineOptions);

    currentModelId = modelId;
    isLoading = false;
    onProgress?.({ status: 'ready', progress: 100 });
    return true;
  } catch (err) {
    console.error('Model loading failed:', err);
    isLoading = false;
    onProgress?.({ status: 'error' });
    return false;
  }
}

export function isModelLoaded(): boolean {
  return currentPipeline !== null;
}

export function getLoadedModelId(): string | null {
  return currentModelId;
}

export async function generateResponse(
  messages: ChatMessage[],
  settings: AppSettings,
  onToken?: TokenCallback,
  pdfContext?: string
): Promise<string> {
  if (!currentPipeline) {
    throw new Error('No model loaded');
  }

  let systemContent = `You are ${settings.assistantName}. ${settings.systemInstructions}`;
  
  if (pdfContext) {
    systemContent += `\n\nDocument context:\n${pdfContext}`;
  }

  const chatMessages = [
    { role: 'system' as const, content: systemContent },
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  try {
    let streamerCallback: any = undefined;
    if (onToken) {
      const { TextStreamer, AutoTokenizer } = await import('@huggingface/transformers');
      const model = AVAILABLE_MODELS.find(m => m.id === currentModelId);
      if (model) {
        try {
          const tokenizer = await AutoTokenizer.from_pretrained(model.repoId);
          streamerCallback = new TextStreamer(tokenizer, {
            skip_prompt: true,
            callback_function: (text: string) => {
              onToken(text);
            },
          });
        } catch {
          // Fallback: no streaming
        }
      }
    }

    const genOptions: any = {
      max_new_tokens: settings.maxTokens,
      temperature: settings.temperature,
      do_sample: settings.temperature > 0,
      return_full_text: false,
    };

    if (streamerCallback) {
      genOptions.streamer = streamerCallback;
    }

    const output = await currentPipeline(chatMessages, genOptions);

    const text = output?.[0]?.generated_text ?? '';
    return typeof text === 'string' ? text : text?.content ?? '';
  } catch (err) {
    console.error('Generation failed:', err);
    throw err;
  }
}

export function unloadModel() {
  currentPipeline = null;
  currentModelId = null;
}
