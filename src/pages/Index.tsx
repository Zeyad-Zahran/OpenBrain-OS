import { useState, useCallback } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatArea } from '@/components/ChatArea';
import { SettingsPanel } from '@/components/SettingsPanel';
import { KnowledgePanel } from '@/components/KnowledgePanel';
import { useChat } from '@/hooks/useChat';
import { useAppSettings, SettingsContext, useSettingsProvider } from '@/hooks/useAppSettings';
import { getDir } from '@/lib/i18n';
import type { Conversation } from '@/lib/db';

function ChatApp() {
  const { settings, locale } = useAppSettings();
  const [view, setView] = useState<'chat' | 'settings' | 'knowledge'>('chat');
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    conversation,
    isGenerating,
    streamText,
    sendMessage,
    createNewConversation,
    loadConversation,
    setConversation,
    pdfName,
    pdfPageCount,
    attachPdf,
    removePdf,
    stopGeneration,
  } = useChat(settings);

  const handleNewChat = useCallback(() => {
    setConversation(null);
    setView('chat');
  }, [setConversation]);

  const handleSelectChat = useCallback(
    (conv: Conversation) => {
      loadConversation(conv);
      setView('chat');
    },
    [loadConversation]
  );

  const handleSend = useCallback(
    async (content: string) => {
      await sendMessage(content);
      setRefreshKey((k) => k + 1);
    },
    [sendMessage]
  );

  return (
    <div dir={getDir(locale)} className="min-h-screen flex w-full">
      <ChatSidebar
        currentConvId={conversation?.id}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onOpenSettings={() => setView('settings')}
        onOpenKnowledge={() => setView('knowledge')}
        refreshKey={refreshKey}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center border-b border-border px-2 shrink-0">
          <SidebarTrigger />
          {view === 'chat' && conversation && (
            <span className="ml-3 text-sm font-medium truncate text-muted-foreground">
              {conversation.title}
            </span>
          )}
        </header>

        <main className="flex-1 min-h-0">
          {view === 'settings' ? (
            <SettingsPanel
              onBack={() => setView('chat')}
              onModelLoaded={() => setRefreshKey((k) => k + 1)}
            />
          ) : view === 'knowledge' ? (
            <KnowledgePanel onBack={() => setView('chat')} />
          ) : (
            <ChatArea
              conversation={conversation}
              isGenerating={isGenerating}
              streamText={streamText}
              onSendMessage={handleSend}
              onStopGeneration={stopGeneration}
              pdfName={pdfName}
              pdfPageCount={pdfPageCount}
              onAttachPdf={attachPdf}
              onRemovePdf={removePdf}
              onModelLoaded={() => setRefreshKey((k) => k + 1)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function Index() {
  const settingsValue = useSettingsProvider();

  return (
    <SettingsContext.Provider value={settingsValue}>
      <SidebarProvider>
        <ChatApp />
      </SidebarProvider>
    </SettingsContext.Provider>
  );
}
