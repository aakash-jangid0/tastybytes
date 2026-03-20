import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const AI_BOT_ID = '00000000-0000-0000-0000-000000000000';

export interface AiChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  sender_type: 'customer' | 'ai';
  read?: boolean;
}

export interface AiChatState {
  isAiLoading: boolean;
  aiError: string | null;
  isAiActive: boolean;
}

/**
 * Hook for AI chat functionality.
 * Calls the Supabase Edge Function `ai-chat` for RAG-based responses.
 * Returns both the AI response and local message objects for immediate UI display.
 */
export function useAiChat(chatId: string | null, customerId: string, orderId: string) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiActive, setIsAiActive] = useState(true);

  /**
   * Send a message to the AI chatbot via the Edge Function.
   * Returns the AI response text, chatId, and message objects for local display.
   */
  const sendAiMessage = useCallback(async (message: string): Promise<{
    response: string;
    chatId: string;
    userMessage: AiChatMessage;
    aiMessage: AiChatMessage;
  } | null> => {
    if (!message.trim()) return null;

    try {
      setIsAiLoading(true);
      setAiError(null);

      const url = `${SUPABASE_URL}/functions/v1/ai-chat`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: message.trim(),
          chatId,
          customerId,
          orderId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || errData.details || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'AI response failed');
      }

      const now = new Date().toISOString();

      // Create local message objects for immediate UI display
      const userMessage: AiChatMessage = {
        id: `user-${Date.now()}`,
        chat_id: data.chatId || chatId || '',
        sender_id: customerId,
        content: message.trim(),
        sent_at: now,
        sender_type: 'customer',
        read: false,
      };

      const aiMessage: AiChatMessage = {
        id: `ai-${Date.now()}`,
        chat_id: data.chatId || chatId || '',
        sender_id: AI_BOT_ID,
        content: data.response,
        sent_at: new Date(Date.now() + 100).toISOString(), // slightly after user msg
        sender_type: 'ai',
        read: false,
      };

      return {
        response: data.response,
        chatId: data.chatId,
        userMessage,
        aiMessage,
      };
    } catch (err) {
      console.error('AI Chat error:', err);
      const raw = err instanceof Error ? err.message : 'Failed to get AI response';

      // Friendly error messages for common issues
      let friendlyMessage: string;
      if (raw.includes('429') || raw.includes('quota') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('rate')) {
        friendlyMessage = 'Our AI assistant is temporarily busy due to high demand. Please try again in a few seconds, or talk to a support agent.';
      } else if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('leaked')) {
        friendlyMessage = 'AI service is temporarily unavailable. Please try again later or talk to a support agent.';
      } else if (raw.includes('Missing environment')) {
        friendlyMessage = 'AI service is not configured. Please contact support for assistance.';
      } else {
        friendlyMessage = 'Something went wrong with the AI. Please try again or talk to a support agent.';
      }

      setAiError(friendlyMessage);
      return null;
    } finally {
      setIsAiLoading(false);
    }
  }, [chatId, customerId, orderId]);

  /**
   * Escalate the chat to a human support agent.
   */
  const escalateToHuman = useCallback(async (currentChatId: string) => {
    try {
      const { error } = await supabase
        .from('support_chats')
        .update({
          is_ai_active: false,
          metadata: {
            escalated_at: new Date().toISOString(),
            escalation_reason: 'customer_requested',
          },
        })
        .eq('id', currentChatId);

      if (error) throw error;

      setIsAiActive(false);
      return true;
    } catch (err) {
      console.error('Escalation error:', err);
      setAiError('Failed to connect to support agent');
      return false;
    }
  }, []);

  const clearAiError = useCallback(() => setAiError(null), []);

  return {
    isAiLoading,
    aiError,
    clearAiError,
    isAiActive,
    setIsAiActive,
    sendAiMessage,
    escalateToHuman,
  };
}
