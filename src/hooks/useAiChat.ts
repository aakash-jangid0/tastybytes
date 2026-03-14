import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface AiChatState {
    isAiLoading: boolean;
    aiError: string | null;
    isAiActive: boolean;
}

/**
 * Hook for AI chat functionality.
 * Calls the Supabase Edge Function `ai-chat` for RAG-based responses.
 * Manages escalation to human support.
 */
export function useAiChat(chatId: string | null, customerId: string, orderId: string) {
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [isAiActive, setIsAiActive] = useState(true);

    /**
     * Send a message to the AI chatbot via the Edge Function.
     * Returns the AI response text and the chatId (in case a new chat was created).
     */
    const sendAiMessage = useCallback(async (message: string): Promise<{
        response: string;
        chatId: string;
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
                    chatId: chatId,
                    customerId,
                    orderId,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'AI response failed');
            }

            return {
                response: data.response,
                chatId: data.chatId,
            };
        } catch (err) {
            console.error('AI Chat error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
            setAiError(errorMessage);
            return null;
        } finally {
            setIsAiLoading(false);
        }
    }, [chatId, customerId, orderId]);

    /**
     * Escalate the chat to a human support agent.
     * Sets is_ai_active = false on the support_chats row.
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

    return {
        isAiLoading,
        aiError,
        isAiActive,
        setIsAiActive,
        sendAiMessage,
        escalateToHuman,
    };
}
