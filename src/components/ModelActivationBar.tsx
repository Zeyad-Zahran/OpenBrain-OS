import { useState, useEffect } from 'react';
import { Cpu, Loader2, Download, Play, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAppSettings } from '@/hooks/useAppSettings';
import { t } from '@/lib/i18n';
import { AVAILABLE_MODELS, type ModelConfig } from '@/lib/settings';
import {
  loadModel,
  checkAllCached,
  getLoadedModelId,
  deleteModelCache,
} from '@/lib/ai-worker-client';

interface ModelActivationBarProps {
  onModelLoaded: () => void;
}

export function ModelActivationBar({ onModelLoaded }: ModelActivationBarProps) {
  const { settings, updateSettings, locale } = useAppSettings();
  const [cachedModels, setCachedModels] = useState<Record<string, boolean>>({});
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatus, setLoadStatus] = useState('');

  useEffect(() => {
    async function init() {
      const [cached, loaded] = await Promise.all([checkAllCached(), getLoadedModelId()]);
      setCachedModels(cached);
      setLoadedModelId(loaded);
    }
    init();
  }, []);

  const handleActivate = async (model: ModelConfig) => {
    if (loadingModelId) return;
    setLoadingModelId(model.id);
    setLoadProgress(0);
    setLoadStatus('');

    const success = await loadModel(model.id, (p) => {
      setLoadProgress(p.progress ?? 0);
      setLoadStatus(p.status);
    });

    if (success) {
      updateSettings({ selectedModelId: model.id });
      setCachedModels((prev) => ({ ...prev, [model.id]: true }));
      setLoadedModelId(model.id);
      onModelLoaded();
    }
    setLoadingModelId(null);
  };

  const handleDelete = async (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteModelCache(modelId);
    setCachedModels((prev) => ({ ...prev, [modelId]: false }));
    if (loadedModelId === modelId) setLoadedModelId(null);
  };

  if (loadedModelId) {
    const activeModel = AVAILABLE_MODELS.find((m) => m.id === loadedModelId);
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-xs">
        <Cpu className="h-3.5 w-3.5 text-primary" />
        <span className="text-muted-foreground">{activeModel?.name ?? loadedModelId}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs">
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {AVAILABLE_MODELS.filter((m) => m.id !== loadedModelId).map((model) => {
              const isCached = cachedModels[model.id] ?? false;
              return (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleActivate(model)}
                  className="gap-2"
                >
                  {isCached ? (
                    <Play className="h-3 w-3" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  <span className="flex-1">{model.name}</span>
                  {isCached && (
                    <>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {t(locale, 'cached')}
                      </Badge>
                      <button
                        onClick={(e) => handleDelete(model.id, e)}
                        className="ml-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (loadingModelId) {
    return (
      <div className="px-4 py-3 rounded-xl bg-muted/50 border border-border space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>{t(locale, 'modelLoading')}</span>
        </div>
        <Progress value={loadProgress} className="h-1.5" />
        <p className="text-[10px] text-muted-foreground text-center">
          {Math.round(loadProgress)}% — {loadStatus}
        </p>
      </div>
    );
  }

  // No model loaded — show cached models for quick activation
  const cachedList = AVAILABLE_MODELS.filter((m) => cachedModels[m.id]);
  const hasCached = cachedList.length > 0;

  return (
    <div className="px-4 py-3 rounded-xl bg-muted/50 border border-border space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4" />
        <span>{t(locale, 'modelNotLoaded')}</span>
      </div>
      {hasCached && (
        <div className="flex flex-wrap gap-2">
          {cachedList.map((model) => (
            <div key={model.id} className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => handleActivate(model)}
              >
                <Play className="h-3 w-3" />
                {model.name}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDelete(model.id, e)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
