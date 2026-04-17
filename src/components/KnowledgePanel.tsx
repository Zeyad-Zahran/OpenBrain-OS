import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, Trash2, Brain, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSettings } from '@/hooks/useAppSettings';
import { t } from '@/lib/i18n';
import { extractTextFromPdf } from '@/lib/pdf-extractor';
import {
  getAllKnowledgeDocs,
  addKnowledgeDoc,
  deleteKnowledgeDoc,
  getAllMemoryEntries,
  addMemoryEntry,
  deleteMemoryEntry,
  clearAllMemory,
  type KnowledgeDocument,
  type UserMemoryEntry,
} from '@/lib/db';

interface KnowledgePanelProps {
  onBack: () => void;
}

export function KnowledgePanel({ onBack }: KnowledgePanelProps) {
  const { locale } = useAppSettings();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [memories, setMemories] = useState<UserMemoryEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newFact, setNewFact] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllKnowledgeDocs().then(setDocs);
    getAllMemoryEntries().then(setMemories);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let content = '';
      if (file.type === 'application/pdf') {
        const result = await extractTextFromPdf(file);
        content = result.text;
      } else {
        content = await file.text();
      }

      const doc: KnowledgeDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        content: content.slice(0, 50000), // Limit to 50k chars
        addedAt: Date.now(),
        size: file.size,
      };
      await addKnowledgeDoc(doc);
      setDocs((prev) => [doc, ...prev]);
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteDoc = async (id: string) => {
    await deleteKnowledgeDoc(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddFact = async () => {
    if (!newFact.trim()) return;
    const entry: UserMemoryEntry = {
      id: crypto.randomUUID(),
      fact: newFact.trim(),
      category: 'info',
      createdAt: Date.now(),
    };
    await addMemoryEntry(entry);
    setMemories((prev) => [entry, ...prev]);
    setNewFact('');
  };

  const handleDeleteMemory = async (id: string) => {
    await deleteMemoryEntry(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearMemory = async () => {
    await clearAllMemory();
    setMemories([]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{t(locale, 'knowledgeBase')}</h2>
      </div>

      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Tabs defaultValue="documents">
            <TabsList className="w-full">
              <TabsTrigger value="documents" className="flex-1 gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {t(locale, 'documents')}
              </TabsTrigger>
              <TabsTrigger value="memory" className="flex-1 gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                {t(locale, 'userMemory')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-4 mt-4">
              <p className="text-xs text-muted-foreground">{t(locale, 'knowledgeInfo')}</p>

              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt,.md,.csv,.json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {t(locale, 'uploadDocument')}
                </Button>
              </div>

              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {t(locale, 'noDocuments')}
                </p>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatSize(doc.size)} · {doc.content.length.toLocaleString()} chars
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteDoc(doc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="memory" className="space-y-4 mt-4">
              <p className="text-xs text-muted-foreground">{t(locale, 'memoryInfo')}</p>

              <div className="flex gap-2">
                <Input
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  placeholder={t(locale, 'addFactPlaceholder')}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFact()}
                />
                <Button onClick={handleAddFact} disabled={!newFact.trim()} size="sm">
                  {t(locale, 'add')}
                </Button>
              </div>

              {memories.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive"
                    onClick={handleClearMemory}
                  >
                    {t(locale, 'clearAll')}
                  </Button>
                </div>
              )}

              {memories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {t(locale, 'noMemories')}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm group"
                    >
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {m.category}
                      </Badge>
                      <span className="flex-1 min-w-0 truncate">{m.fact}</span>
                      <button
                        onClick={() => handleDeleteMemory(m.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
