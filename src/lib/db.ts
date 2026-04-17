import { openDB, type IDBPDatabase } from 'idb';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface UserMemoryEntry {
  id: string;
  fact: string;
  category: 'preference' | 'info' | 'context';
  createdAt: number;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  content: string;
  addedAt: number;
  size: number;
}

const DB_NAME = 'openbrain-db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('conversations')) {
          const store = db.createObjectStore('conversations', { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('userMemory')) {
          db.createObjectStore('userMemory', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('knowledgeBase')) {
          db.createObjectStore('knowledgeBase', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// === Conversations ===

export async function getAllConversations(): Promise<Conversation[]> {
  const db = await getDB();
  const all = await db.getAll('conversations');
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = await getDB();
  return db.get('conversations', id);
}

export async function saveConversation(conv: Conversation): Promise<void> {
  const db = await getDB();
  await db.put('conversations', conv);
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('conversations', id);
}

export async function clearAllConversations(): Promise<void> {
  const db = await getDB();
  await db.clear('conversations');
}

// === User Memory ===

export async function getAllMemoryEntries(): Promise<UserMemoryEntry[]> {
  const db = await getDB();
  const all = await db.getAll('userMemory');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addMemoryEntry(entry: UserMemoryEntry): Promise<void> {
  const db = await getDB();
  await db.put('userMemory', entry);
}

export async function deleteMemoryEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('userMemory', id);
}

export async function clearAllMemory(): Promise<void> {
  const db = await getDB();
  await db.clear('userMemory');
}

// === Knowledge Base ===

export async function getAllKnowledgeDocs(): Promise<KnowledgeDocument[]> {
  const db = await getDB();
  const all = await db.getAll('knowledgeBase');
  return all.sort((a, b) => b.addedAt - a.addedAt);
}

export async function addKnowledgeDoc(doc: KnowledgeDocument): Promise<void> {
  const db = await getDB();
  await db.put('knowledgeBase', doc);
}

export async function deleteKnowledgeDoc(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('knowledgeBase', id);
}

export async function clearAllKnowledge(): Promise<void> {
  const db = await getDB();
  await db.clear('knowledgeBase');
}

export async function getKnowledgeContext(): Promise<string> {
  const docs = await getAllKnowledgeDocs();
  if (docs.length === 0) return '';
  return docs.map((d) => `[Document: ${d.name}]\n${d.content}`).join('\n\n---\n\n');
}

export async function getMemoryContext(): Promise<string> {
  const entries = await getAllMemoryEntries();
  if (entries.length === 0) return '';
  return 'Known facts about the user:\n' + entries.map((e) => `- ${e.fact}`).join('\n');
}
