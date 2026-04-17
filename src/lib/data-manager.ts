import { getAllConversations, getAllMemoryEntries, getAllKnowledgeDocs, saveConversation, addMemoryEntry, addKnowledgeDoc, clearAllConversations, clearAllMemory, clearAllKnowledge } from './db';
import type { Conversation, UserMemoryEntry, KnowledgeDocument } from './db';

export interface ExportData {
  version: 1;
  exportedAt: number;
  conversations: Conversation[];
  memory: UserMemoryEntry[];
  knowledge: KnowledgeDocument[];
}

export async function exportAllData(): Promise<string> {
  const [conversations, memory, knowledge] = await Promise.all([
    getAllConversations(),
    getAllMemoryEntries(),
    getAllKnowledgeDocs(),
  ]);

  const data: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    conversations,
    memory,
    knowledge,
  };

  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string, merge = false): Promise<{ conversations: number; memory: number; knowledge: number }> {
  const data: ExportData = JSON.parse(jsonString);

  if (!data.version || !Array.isArray(data.conversations)) {
    throw new Error('Invalid export file format');
  }

  if (!merge) {
    await Promise.all([clearAllConversations(), clearAllMemory(), clearAllKnowledge()]);
  }

  const promises: Promise<void>[] = [];

  for (const conv of data.conversations) {
    promises.push(saveConversation(conv));
  }
  for (const mem of data.memory ?? []) {
    promises.push(addMemoryEntry(mem));
  }
  for (const doc of data.knowledge ?? []) {
    promises.push(addKnowledgeDoc(doc));
  }

  await Promise.all(promises);

  return {
    conversations: data.conversations.length,
    memory: data.memory?.length ?? 0,
    knowledge: data.knowledge?.length ?? 0,
  };
}

export function downloadJson(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function deleteAllUserData(): Promise<void> {
  await Promise.all([clearAllConversations(), clearAllMemory(), clearAllKnowledge()]);
  localStorage.removeItem('openbrain-settings');
}
