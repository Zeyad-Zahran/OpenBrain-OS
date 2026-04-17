/// <reference lib="webworker" />

import { AVAILABLE_MODELS, type ModelConfig } from './settings';

let currentPipeline: any = null;
let currentModelId: string | null = null;
let isLoading = false;
let abortController: AbortController | null = null;

const CORE_MODEL_FILES = ['config.json', 'tokenizer_config.json'];
const TOKENIZER_FILE_CANDIDATES = ['tokenizer.json', 'tokenizer.model'];

function getWebGPUSupport(): boolean {
  return 'gpu' in self;
}

function getWeightFileForModel(model: ModelConfig): string {
  switch (model.dtype) {
    case 'q4':
      return 'onnx/model_q4.onnx';
    case 'bnb4':
      return 'onnx/model_bnb4.onnx';
    case 'q4f16':
      return 'onnx/model_q4f16.onnx';
    case 'fp16':
      return 'onnx/model_fp16.onnx';
    case 'int8':
      return 'onnx/model_int8.onnx';
    default:
      return 'onnx/model.onnx';
  }
}

function matchesRepoFile(url: string, repoId: string, filePath: string): boolean {
  const normalizedUrl = url.toLowerCase();
  const normalizedFilePath = filePath.toLowerCase();
  const repoVariants = [repoId, repoId.replace('/', '%2F')].map((value) => value.toLowerCase());

  return repoVariants.some((repoVariant) => normalizedUrl.includes(repoVariant))
    && normalizedUrl.includes(normalizedFilePath);
}

async function getTransformersCacheKeys(): Promise<readonly Request[]> {
  try {
    const cache = await caches.open('transformers-cache');
    return await cache.keys();
  } catch {
    try {
      const cacheNames = await caches.keys();
      const keys: Request[] = [];

      for (const cacheName of cacheNames) {
        if (!cacheName.includes('transformers')) continue;
        const cache = await caches.open(cacheName);
        keys.push(...(await cache.keys()));
      }

      return keys;
    } catch {
      return [];
    }
  }
}

function hasCachedRepoFile(keys: readonly Request[], repoId: string, filePath: string): boolean {
  return keys.some((req) => matchesRepoFile(req.url, repoId, filePath));
}

async function checkModelCached(model: ModelConfig): Promise<boolean> {
  try {
    const keys = await getTransformersCacheKeys();
    if (keys.length === 0) return false;

    const hasCoreFiles = CORE_MODEL_FILES.every((file) => hasCachedRepoFile(keys, model.repoId, file));
    const hasTokenizer = TOKENIZER_FILE_CANDIDATES.some((file) => hasCachedRepoFile(keys, model.repoId, file));
    const hasWeights = hasCachedRepoFile(keys, model.repoId, getWeightFileForModel(model));

    return hasCoreFiles && hasTokenizer && hasWeights;
  } catch {}
  return false;
}

async function deleteModelFromCache(repoId: string): Promise<boolean> {
  try {
    const cacheNames = await caches.keys();
    let deleted = false;
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      for (const req of keys) {
        if (req.url.includes(repoId.replace('/', '%2F')) || req.url.includes(repoId)) {
          await cache.delete(req);
          deleted = true;
        }
      }
    }
    return deleted;
  } catch {}
  return false;
}

async function createTextGenerationPipeline(model: ModelConfig, requestId: string, localFilesOnly: boolean) {
  const { pipeline, env } = await import('@huggingface/transformers');

  env.allowLocalModels = localFilesOnly;
  env.allowRemoteModels = true;
  env.useBrowserCache = true;

  const device = getWebGPUSupport() ? 'webgpu' : 'wasm';

  const pipelineOptions: any = {
    device,
    local_files_only: localFilesOnly,
    progress_callback: (p: any) => {
      if (p.status === 'progress' && p.progress != null) {
        self.postMessage({ type: 'load-progress', requestId, data: { status: 'downloading', progress: p.progress, file: p.file } });
      } else if (p.status === 'ready') {
        self.postMessage({ type: 'load-progress', requestId, data: { status: 'ready', progress: 100 } });
      }
    },
  };

  if (model.dtype) {
    pipelineOptions.dtype = model.dtype;
  }

  return pipeline('text-generation', model.repoId, pipelineOptions);
}

async function handleLoadModel(modelId: string, requestId: string) {
  if (isLoading) {
    self.postMessage({ type: 'load-result', requestId, success: false, error: 'Another model is loading' });
    return;
  }
  if (currentModelId === modelId && currentPipeline) {
    self.postMessage({ type: 'load-result', requestId, success: true });
    return;
  }

  isLoading = true;

  // Unload current model first
  if (currentPipeline) {
    try {
      if (currentPipeline.dispose) await currentPipeline.dispose();
    } catch {}
    currentPipeline = null;
    currentModelId = null;
  }

  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) {
    isLoading = false;
    self.postMessage({ type: 'load-result', requestId, success: false, error: 'Model not found' });
    return;
  }

  try {
    self.postMessage({ type: 'load-progress', requestId, data: { status: 'loading', progress: 0 } });

    const isCached = await checkModelCached(model);

    if (isCached) {
      try {
        currentPipeline = await createTextGenerationPipeline(model, requestId, true);
      } catch (cacheLoadError) {
        console.warn('Worker: Cached activation incomplete, resuming model download.', cacheLoadError);
        self.postMessage({ type: 'load-progress', requestId, data: { status: 'downloading', progress: 0 } });
        currentPipeline = await createTextGenerationPipeline(model, requestId, false);
      }
    } else {
      currentPipeline = await createTextGenerationPipeline(model, requestId, false);
    }

    currentModelId = modelId;
    isLoading = false;
    self.postMessage({ type: 'load-progress', requestId, data: { status: 'ready', progress: 100 } });
    self.postMessage({ type: 'load-result', requestId, success: true });
  } catch (err: any) {
    console.error('Worker: Model loading failed:', err);
    isLoading = false;
    currentPipeline = null;
    currentModelId = null;
    self.postMessage({ type: 'load-progress', requestId, data: { status: 'error' } });
    self.postMessage({ type: 'load-result', requestId, success: false, error: err?.message ?? 'Loading failed' });
  }
}

async function handleGenerate(requestId: string, messages: any[], systemContent: string, maxTokens: number, temperature: number) {
  if (!currentPipeline) {
    self.postMessage({ type: 'generate-error', requestId, error: 'No model loaded' });
    return;
  }

  abortController = new AbortController();

  const chatMessages = [
    { role: 'system' as const, content: systemContent },
    ...messages.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  try {
    let streamerCallback: any = undefined;

    try {
      const { TextStreamer, AutoTokenizer } = await import('@huggingface/transformers');
      const model = AVAILABLE_MODELS.find((m) => m.id === currentModelId);
      if (model) {
        const tokenizer = await AutoTokenizer.from_pretrained(model.repoId);
        streamerCallback = new TextStreamer(tokenizer, {
          skip_prompt: true,
          callback_function: (text: string) => {
            if (abortController?.signal.aborted) return;
            self.postMessage({ type: 'generate-token', requestId, token: text });
          },
        });
      }
    } catch {}

    const genOptions: any = {
      max_new_tokens: maxTokens,
      temperature,
      do_sample: temperature > 0,
      return_full_text: false,
    };

    if (streamerCallback) {
      genOptions.streamer = streamerCallback;
    }

    const output = await currentPipeline(chatMessages, genOptions);

    if (abortController?.signal.aborted) {
      self.postMessage({ type: 'generate-aborted', requestId });
      return;
    }

    const text = output?.[0]?.generated_text ?? '';
    const result = typeof text === 'string' ? text : text?.content ?? '';
    self.postMessage({ type: 'generate-result', requestId, text: result });
  } catch (err: any) {
    if (abortController?.signal.aborted) {
      self.postMessage({ type: 'generate-aborted', requestId });
      return;
    }
    console.error('Worker: Generation failed:', err);
    self.postMessage({ type: 'generate-error', requestId, error: err?.message ?? 'Generation failed' });
  } finally {
    abortController = null;
  }
}

async function handleCheckCached(requestId: string) {
  const result: Record<string, boolean> = {};
  for (const model of AVAILABLE_MODELS) {
    result[model.id] = await checkModelCached(model);
  }
  self.postMessage({ type: 'cache-result', requestId, cached: result });
}

async function handleDeleteCache(modelId: string, requestId: string) {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) {
    self.postMessage({ type: 'delete-cache-result', requestId, success: false });
    return;
  }
  // Unload if this model is currently active
  if (currentModelId === modelId) {
    try { if (currentPipeline?.dispose) await currentPipeline.dispose(); } catch {}
    currentPipeline = null;
    currentModelId = null;
  }
  const success = await deleteModelFromCache(model.repoId);
  self.postMessage({ type: 'delete-cache-result', requestId, success });
}

self.addEventListener('message', (e: MessageEvent) => {
  const { type, requestId } = e.data;

  switch (type) {
    case 'load-model':
      handleLoadModel(e.data.modelId, requestId);
      break;
    case 'generate':
      handleGenerate(requestId, e.data.messages, e.data.systemContent, e.data.maxTokens, e.data.temperature);
      break;
    case 'abort-generate':
      if (abortController) abortController.abort();
      break;
    case 'check-cached':
      handleCheckCached(requestId);
      break;
    case 'delete-cache':
      handleDeleteCache(e.data.modelId, requestId);
      break;
    case 'get-loaded-model':
      self.postMessage({ type: 'loaded-model', requestId, modelId: currentModelId });
      break;
    case 'unload':
      if (currentPipeline?.dispose) {
        try { currentPipeline.dispose(); } catch {}
      }
      currentPipeline = null;
      currentModelId = null;
      self.postMessage({ type: 'unloaded', requestId });
      break;
    case 'cancel-load':
      // Can't truly cancel a pipeline load, but mark as not loading
      isLoading = false;
      break;
  }
});
