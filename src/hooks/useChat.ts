import { useState, useCallback, useRef } from 'react';
import { type Conversation, type ChatMessage, saveConversation, getMemoryContext, getKnowledgeContext } from '@/lib/db';
import { generateResponse, getLoadedModelId, abortGeneration } from '@/lib/ai-worker-client';
import { extractAndStoreMemory } from '@/lib/memory-manager';
import type { AppSettings } from '@/lib/settings';

export function useChat(settings: AppSettings) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [pdfContext, setPdfContext] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const abortedRef = useRef(false);

  const createNewConversation = useCallback(() => {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversation(conv);
    return conv;
  }, []);

  const loadConversation = useCallback((conv: Conversation) => {
    setConversation(conv);
  }, []);

  const attachPdf = useCallback((text: string, fileName: string, pageCount: number) => {
    setPdfContext(text);
    setPdfName(fileName);
    setPdfPageCount(pageCount);
  }, []);

  const removePdf = useCallback(() => {
    setPdfContext(null);
    setPdfName(null);
    setPdfPageCount(0);
  }, []);

  const stopGeneration = useCallback(() => {
    abortedRef.current = true;
    abortGeneration();
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isGenerating) return;
      const loadedId = await getLoadedModelId();
      if (!loadedId) return;

      abortedRef.current = false;
      extractAndStoreMemory(content).catch(() => {});

      let conv = conversation;
      if (!conv) {
        conv = {
          id: crypto.randomUUID(),
          title: content.slice(0, 40),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      const updatedMessages = [...conv.messages, userMsg];
      const updatedConv = {
        ...conv,
        messages: updatedMessages,
        updatedAt: Date.now(),
        title: conv.messages.length === 0 ? content.slice(0, 40) : conv.title,
      };

      setConversation(updatedConv);
      await saveConversation(updatedConv);

      setIsGenerating(true);
      setStreamText('');

      try {
        const [memoryCtx, knowledgeCtx] = await Promise.all([
          getMemoryContext(),
          getKnowledgeContext(),
        ]);

        let extraContext = '';
        if (memoryCtx) extraContext += '\n\n' + memoryCtx;
        if (knowledgeCtx) extraContext += '\n\nKnowledge base documents:\n' + knowledgeCtx;
        if (pdfContext) extraContext += '\n\nAttached document:\n' + pdfContext;

        let accumulated = '';
        const response = await generateResponse(
          updatedMessages,
          settings,
          (token) => {
            if (abortedRef.current) return;
            accumulated += token;
            setStreamText(accumulated);
          },
          extraContext || undefined
        );

        const finalText = abortedRef.current
          ? (accumulated || 'Generation stopped.')
          : (accumulated || response);

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: finalText,
          timestamp: Date.now(),
        };

        const finalConv = {
          ...updatedConv,
          messages: [...updatedMessages, aiMsg],
          updatedAt: Date.now(),
        };

        setConversation(finalConv);
        await saveConversation(finalConv);
      } catch (err) {
        console.error('Generation error:', err);
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, an error occurred while generating a response.',
          timestamp: Date.now(),
        };
        const errorConv = {
          ...updatedConv,
          messages: [...updatedMessages, errorMsg],
          updatedAt: Date.now(),
        };
        setConversation(errorConv);
        await saveConversation(errorConv);
      } finally {
        setIsGenerating(false);
        setStreamText('');
      }
    },
    [conversation, isGenerating, settings, pdfContext]
  );

  return {
    conversation,
    isGenerating,
    streamText,
    sendMessage,
    createNewConversation,
    loadConversation,
    setConversation,
    pdfContext,
    pdfName,
    pdfPageCount,
    attachPdf,
    removePdf,
    stopGeneration,
  };
}
