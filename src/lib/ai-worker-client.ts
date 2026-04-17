import type { ChatMessage } from './db';
import type { AppSettings } from './settings';

type ProgressCallback = (progress: { status: string; progress?: number; file?: string }) => void;
type TokenCallback = (token: string) => void;

let worker: Worker | null = null;
let requestCounter = 0;
const pendingRequests = new Map<string, { resolve: Function; reject: Function; onProgress?: ProgressCallback; onToken?: TokenCallback }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./ai-worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', handleMessage);
  }
  return worker;
}

function nextId(): string {
  return `req_${++requestCounter}`;
}

function handleMessage(e: MessageEvent) {
  const { type, requestId } = e.data;
  const pending = pendingRequests.get(requestId);
  if (!pending) return;

  switch (type) {
    case 'load-progress':
      pending.onProgress?.(e.data.data);
      break;
    case 'load-result':
      pendingRequests.delete(requestId);
      pending.resolve(e.data.success);
      break;
    case 'generate-token':
      pending.onToken?.(e.data.token);
      break;
    case 'generate-result':
      pendingRequests.delete(requestId);
      pending.resolve(e.data.text);
      break;
    case 'generate-error':
      pendingRequests.delete(requestId);
      pending.reject(new Error(e.data.error));
      break;
    case 'generate-aborted':
      pendingRequests.delete(requestId);
      pending.resolve(''); // resolve with empty on abort
      break;
    case 'cache-result':
      pendingRequests.delete(requestId);
      pending.resolve(e.data.cached);
      break;
    case 'loaded-model':
      pendingRequests.delete(requestId);
      pending.resolve(e.data.modelId);
      break;
    case 'unloaded':
      pendingRequests.delete(requestId);
      pending.resolve(undefined);
      break;
    case 'delete-cache-result':
      pendingRequests.delete(requestId);
      pending.resolve(e.data.success);
      break;
  }
}

export function loadModel(modelId: string, onProgress?: ProgressCallback): Promise<boolean> {
  const id = nextId();
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject, onProgress });
    getWorker().postMessage({ type: 'load-model', requestId: id, modelId });
  });
}

export function generateResponse(
  messages: ChatMessage[],
  settings: AppSettings,
  onToken?: TokenCallback,
  pdfContext?: string
): Promise<string> {
  let systemContent = `You are ${settings.assistantName}. ${settings.systemInstructions}`;
  if (pdfContext) {
    // Truncate context to avoid overwhelming small models
    const maxContextChars = 3000;
    const truncatedContext = pdfContext.length > maxContextChars
      ? pdfContext.slice(0, maxContextChars) + '\n\n[Document truncated...]'
      : pdfContext;
    systemContent += `\n\nDocument context:\n${truncatedContext}`;
  }

  const id = nextId();
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject, onToken });
    getWorker().postMessage({
      type: 'generate',
      requestId: id,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      systemContent,
      maxTokens: settings.maxTokens,
      temperature: settings.temperature,
    });
  });
}

export function abortGeneration(): void {
  getWorker().postMessage({ type: 'abort-generate' });
}

export function checkAllCached(): Promise<Record<string, boolean>> {
  const id = nextId();
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    getWorker().postMessage({ type: 'check-cached', requestId: id });
  });
}

export function getLoadedModelId(): Promise<string | null> {
  const id = nextId();
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    getWorker().postMessage({ type: 'get-loaded-model', requestId: id });
  });
}

export function unloadModel(): Promise<void> {
  const id = nextId();
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    getWorker().postMessage({ type: 'unload', requestId: id });
  });
}

export function deleteModelCache(modelId: string): Promise<boolean> {
  const id = nextId();
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    getWorker().postMessage({ type: 'delete-cache', requestId: id, modelId });
  });
}

// Re-export these from ai-engine since they don't need the worker
export { getWebGPUSupport, getDeviceMemoryGB, suggestBestModel, isModelCached } from './ai-engine';
