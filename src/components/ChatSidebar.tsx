import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Settings, Globe, Brain, Download, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { type Conversation, getAllConversations, deleteConversation } from '@/lib/db';
import { exportAllData, importData, downloadJson, deleteAllUserData } from '@/lib/data-manager';
import { useAppSettings } from '@/hooks/useAppSettings';
import { t } from '@/lib/i18n';

interface ChatSidebarProps {
  currentConvId?: string;
  onNewChat: () => void;
  onSelectChat: (conv: Conversation) => void;
  onOpenSettings: () => void;
  onOpenKnowledge: () => void;
  refreshKey: number;
}

export function ChatSidebar({
  currentConvId,
  onNewChat,
  onSelectChat,
  onOpenSettings,
  onOpenKnowledge,
  refreshKey,
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { settings, updateSettings, locale } = useAppSettings();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    getAllConversations().then(setConversations);
  }, [refreshKey]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    getAllConversations().then(setConversations);
  };

  const toggleLocale = () => {
    updateSettings({ locale: locale === 'en' ? 'ar' : 'en' });
  };

  const handleExport = async () => {
    const json = await exportAllData();
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(json, `openbrain-backup-${date}.json`);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await importData(text, true);
        getAllConversations().then(setConversations);
      } catch (err) {
        console.error('Import failed:', err);
      }
    };
    input.click();
  };

  const handleDeleteAll = async () => {
    await deleteAllUserData();
    setConversations([]);
    setDeleteDialogOpen(false);
    window.location.reload();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full gap-2 glow-primary"
          size={collapsed ? 'icon' : 'default'}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>{t(locale, 'newChat')}</span>}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1 px-2 scrollbar-thin">
          <SidebarMenu>
            {conversations.map((conv) => (
              <SidebarMenuItem key={conv.id}>
                <SidebarMenuButton
                  onClick={() => onSelectChat(conv)}
                  isActive={conv.id === currentConvId}
                  className="group justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <span className="truncate text-sm">{conv.title}</span>
                    )}
                  </div>
                  {!collapsed && (
                    <Trash2
                      className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                      onClick={(e) => handleDelete(e, conv.id)}
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenKnowledge}>
              <Brain className="h-4 w-4" />
              {!collapsed && <span>{t(locale, 'knowledgeBase')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleExport}>
              <Download className="h-4 w-4" />
              {!collapsed && <span>{t(locale, 'exportData')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleImport}>
              <Upload className="h-4 w-4" />
              {!collapsed && <span>{t(locale, 'importData')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <SidebarMenuButton className="text-destructive hover:text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {!collapsed && <span>{t(locale, 'deleteAllData')}</span>}
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t(locale, 'deleteAllData')}</DialogTitle>
                  <DialogDescription>{t(locale, 'deleteAllDataConfirm')}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    {t(locale, 'back')}
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAll}>
                    {t(locale, 'deleteAllData')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleLocale}>
              <Globe className="h-4 w-4" />
              {!collapsed && <span>{locale === 'en' ? 'العربية' : 'English'}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
              {!collapsed && <span>{t(locale, 'settings')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
