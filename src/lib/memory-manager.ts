import { addMemoryEntry, type UserMemoryEntry } from './db';

/**
 * Simple pattern-based memory extractor.
 * Scans user messages for self-referential facts and stores them.
 */

const PATTERNS: { regex: RegExp; category: UserMemoryEntry['category'] }[] = [
  { regex: /(?:my name is|i'?m called|call me)\s+(\S+)/i, category: 'info' },
  { regex: /(?:i am|i'm)\s+(\d{1,3})\s*(?:years?\s*old|yo)/i, category: 'info' },
  { regex: /(?:i live in|i'm from|i am from)\s+(.+?)(?:\.|$)/i, category: 'info' },
  { regex: /(?:i work (?:at|for|in)|my job is|i'm a|i am a)\s+(.+?)(?:\.|$)/i, category: 'info' },
  { regex: /(?:i (?:like|love|enjoy|prefer))\s+(.+?)(?:\.|$)/i, category: 'preference' },
  { regex: /(?:i (?:hate|dislike|don't like))\s+(.+?)(?:\.|$)/i, category: 'preference' },
  { regex: /(?:i speak|my language is)\s+(.+?)(?:\.|$)/i, category: 'info' },
  // Arabic patterns
  { regex: /(?:اسمي|أنا اسمي)\s+(.+?)(?:\.|$)/i, category: 'info' },
  { regex: /(?:أنا من|أعيش في|أسكن في)\s+(.+?)(?:\.|$)/i, category: 'info' },
  { regex: /(?:أعمل في|أشتغل|وظيفتي)\s+(.+?)(?:\.|$)/i, category: 'info' },
  { regex: /(?:أحب|أفضل)\s+(.+?)(?:\.|$)/i, category: 'preference' },
];

export async function extractAndStoreMemory(userMessage: string): Promise<void> {
  for (const { regex, category } of PATTERNS) {
    const match = userMessage.match(regex);
    if (match) {
      const fact = match[0].trim();
      const entry: UserMemoryEntry = {
        id: crypto.randomUUID(),
        fact,
        category,
        createdAt: Date.now(),
      };
      await addMemoryEntry(entry);
    }
  }
}
