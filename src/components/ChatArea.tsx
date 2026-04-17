import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Cpu, ShieldCheck, Paperclip, FileText, X, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppSettings } from '@/hooks/useAppSettings';
import { t } from '@/lib/i18n';
import { extractTextFromPdf } from '@/lib/pdf-extractor';
import { ModelActivationBar } from '@/components/ModelActivationBar';
import { getLoadedModelId } from '@/lib/ai-worker-client';
import type { Conversation } from '@/lib/db';

interface ChatAreaProps {
  conversation: Conversation | null;
  isGenerating: boolean;
  streamText: string;
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  pdfName: string | null;
  pdfPageCount: number;
  onAttachPdf: (text: string, name: string, pages: number) => void;
  onRemovePdf: () => void;
  onModelLoaded: () => void;
}

export function ChatArea({
  conversation,
  isGenerating,
  streamText,
  onSendMessage,
  onStopGeneration,
  pdfName,
  pdfPageCount,
  onAttachPdf,
  onRemovePdf,
  onModelLoaded,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const { settings, locale } = useAppSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = conversation?.messages ?? [];

  useEffect(() => {
    getLoadedModelId().then((id) => setModelReady(!!id));
  }, []);

  const handleModelLoaded = () => {
    setModelReady(true);
    onModelLoaded();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, streamText]);

  const handleSend = () => {
    if (!input.trim() || isGenerating || !modelReady) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    setPdfLoading(true);
    try {
      const { text, pageCount } = await extractTextFromPdf(file);
      if (text.trim()) {
        onAttachPdf(text, file.name, pageCount);
      } else {
        console.warn('PDF extracted but no text found');
      }
    } catch (err) {
      console.error('PDF extraction failed:', err);
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const inputBar = (
    <div className="p-4 border-t border-border">
      <div className="max-w-3xl mx-auto space-y-2">
        {pdfName && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <FileText className="h-3 w-3" />
              {pdfName} ({pdfPageCount} {t(locale, 'pdfPages')})
              <button onClick={onRemovePdf} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePdfUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-12 w-12"
            onClick={() => fileInputRef.current?.click()}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(locale, 'typeMessage')}
            disabled={!modelReady || isGenerating}
            className="min-h-[48px] max-h-[120px] resize-none bg-muted/50 border-border"
            rows={1}
          />
          {isGenerating ? (
            <Button
              onClick={onStopGeneration}
              size="icon"
              variant="destructive"
              className="shrink-0 h-12 w-12"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim() || !modelReady}
              size="icon"
              className="shrink-0 h-12 w-12"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (messages.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md space-y-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center glow-primary">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {settings.assistantName}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(locale, 'startChatting')}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>{t(locale, 'privacyNote')}</span>
            </div>
            <ModelActivationBar onModelLoaded={handleModelLoaded} />
          </div>
        </div>
        {inputBar}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto py-6 px-4 space-y-1">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 py-4">
              <div
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-accent/20 text-accent'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {msg.role === 'user' ? 'You' : settings.assistantName}
                </p>
                <div className="prose prose-sm prose-invert max-w-none text-foreground [&_p]:leading-relaxed [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex gap-3 py-4">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {settings.assistantName}
                </p>
                {streamText ? (
                  <div className="prose prose-sm prose-invert max-w-none text-foreground [&_p]:leading-relaxed [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg">
                    <ReactMarkdown>{streamText + ' ▌'}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t(locale, 'thinking')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {inputBar}
    </div>
  );
}
