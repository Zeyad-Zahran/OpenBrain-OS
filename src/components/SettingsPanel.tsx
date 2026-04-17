import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Check, Loader2, Zap, AlertTriangle, HardDrive, Play, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppSettings } from '@/hooks/useAppSettings';
import { t } from '@/lib/i18n';
import { AVAILABLE_MODELS, type ModelConfig } from '@/lib/settings';
import {
  loadModel,
  checkAllCached,
  getLoadedModelId,
  getWebGPUSupport,
  getDeviceMemoryGB,
  suggestBestModel,
  deleteModelCache,
} from '@/lib/ai-worker-client';

interface SettingsPanelProps {
  onBack: () => void;
  onModelLoaded: () => void;
}

export function SettingsPanel({ onBack, onModelLoaded }: SettingsPanelProps) {
  const { settings, updateSettings, locale } = useAppSettings();
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatus, setLoadStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [cachedModels, setCachedModels] = useState<Record<string, boolean>>({});

  const webgpu = getWebGPUSupport();
  const [loadedModel, setLoadedModel] = useState<string | null>(null);
  const deviceRAM = getDeviceMemoryGB();
  const recommendedModelId = suggestBestModel();

  useEffect(() => {
    async function init() {
      const [cached, loaded] = await Promise.all([checkAllCached(), getLoadedModelId()]);
      setCachedModels(cached);
      setLoadedModel(loaded);
    }
    init();
  }, []);

  const handleLoadModel = async (model: ModelConfig) => {
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
      setLoadedModel(model.id);
      onModelLoaded();
    }
    setLoadingModelId(null);
  };

  const handleDeleteModel = async (modelId: string) => {
    await deleteModelCache(modelId);
    setCachedModels((prev) => ({ ...prev, [modelId]: false }));
    if (loadedModel === modelId) setLoadedModel(null);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{t(locale, 'settings')}</h2>
      </div>

      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Device info */}
          <Card className={webgpu ? 'border-primary/30' : 'border-destructive/30'}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                {webgpu ? (
                  <>
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-sm">{t(locale, 'webgpuSupported')}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="text-sm">{t(locale, 'webgpuNotSupported')}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                <span>{t(locale, 'deviceRam')}: ~{deviceRAM} GB ({t(locale, 'approxByBrowser')})</span>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="models">
            <TabsList className="w-full">
              <TabsTrigger value="models" className="flex-1">
                {t(locale, 'modelManager')}
              </TabsTrigger>
              <TabsTrigger value="personality" className="flex-1">
                {t(locale, 'personality')}
              </TabsTrigger>
              <TabsTrigger value="general" className="flex-1">
                {t(locale, 'general')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="models" className="space-y-4 mt-4">
              <p className="text-xs text-muted-foreground">{t(locale, 'modelInfo')}</p>
              {AVAILABLE_MODELS.map((model) => {
                const isLoaded = loadedModel === model.id;
                const isCached = cachedModels[model.id] ?? false;
                const isCurrentlyLoading = loadingModelId === model.id;
                const isRecommended = model.id === recommendedModelId;

                return (
                  <Card key={model.id} className={isLoaded ? 'border-primary/50' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                            {model.name}
                            {isLoaded && (
                              <Badge variant="secondary" className="text-primary text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            {!isLoaded && isCached && (
                              <Badge variant="outline" className="text-xs">
                                {t(locale, 'cached')}
                              </Badge>
                            )}
                            {isRecommended && (
                              <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary">
                                <Star className="h-3 w-3" />
                                {t(locale, 'recommended')}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">{model.description}</CardDescription>
                          {model.arabicSupport && (
                            <span className="text-xs text-primary mt-1 inline-block">
                              ✓ {t(locale, 'arabicSupported')}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t(locale, 'downloadSize')}: {model.size} · RAM: ≥{model.minRamGB} GB
                        </span>
                        <div className="flex items-center gap-2">
                          {isCached && !isLoaded && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-destructive hover:text-destructive h-8 px-2"
                              onClick={() => handleDeleteModel(model.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!isLoaded && !isCurrentlyLoading && (
                            <Button
                              size="sm"
                              onClick={() => handleLoadModel(model)}
                              className="gap-1.5"
                              variant={isCached ? 'outline' : 'default'}
                            >
                              {isCached ? (
                                <>
                                  <Play className="h-3.5 w-3.5" />
                                  {t(locale, 'activate')}
                                </>
                              ) : (
                                <>
                                  <Download className="h-3.5 w-3.5" />
                                  {t(locale, 'download')}
                                </>
                              )}
                            </Button>
                          )}
                          {isCurrentlyLoading && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                        </div>
                      </div>
                      {isCurrentlyLoading && (
                        <div className="space-y-1.5">
                          <Progress value={loadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground text-center">
                            {Math.round(loadProgress)}% — {loadStatus}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="personality" className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label>{t(locale, 'assistantName')}</Label>
                <Input
                  value={settings.assistantName}
                  onChange={(e) => updateSettings({ assistantName: e.target.value })}
                  placeholder="OpenBrain"
                />
              </div>
              <div className="space-y-2">
                <Label>{t(locale, 'systemInstructions')}</Label>
                <Textarea
                  value={settings.systemInstructions}
                  onChange={(e) => updateSettings({ systemInstructions: e.target.value })}
                  rows={5}
                  className="resize-none"
                />
              </div>
              <Button onClick={handleSave} className="gap-2">
                {saved ? <Check className="h-4 w-4" /> : null}
                {saved ? t(locale, 'saved') : t(locale, 'save')}
              </Button>
            </TabsContent>

            <TabsContent value="general" className="space-y-5 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t(locale, 'temperature')}</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.temperature.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([v]) => updateSettings({ temperature: v })}
                  min={0}
                  max={1.5}
                  step={0.1}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t(locale, 'maxTokens')}</Label>
                  <span className="text-sm text-muted-foreground">{settings.maxTokens}</span>
                </div>
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={([v]) => updateSettings({ maxTokens: v })}
                  min={64}
                  max={2048}
                  step={64}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
