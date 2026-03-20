import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  sender_type: 'customer' | 'admin' | 'ai';
  read?: boolean;
}

export interface SupportChat {
  id: string;
  order_id: string;
  customer_id: string;
  category?: string;
  issue?: string;
  status: 'active' | 'closed' | 'resolved';
  is_ai_active?: boolean;
  last_message_at: string;
  customer_details?: {
    name: string;
    email: string;
    phone: string;
  };
  order_details?: {
    total_amount: number;
    status: string;
    order_number: string;
  };
}

export function useSupportChat(orderId: string, customerId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<SupportChat | null>(null);

  // Load chat and messages directly from Supabase
  const loadChat = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Find active chat for this order + customer
      const { data: chats, error: chatError } = await supabase
        .from('support_chats')
        .select('*')
        .eq('order_id', orderId)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (chatError) {
        console.error('Error loading chat:', chatError);
        throw chatError;
      }

      const chat = chats?.[0] as SupportChat | undefined;

      if (chat) {
        setChatId(chat.id);
        setCurrentChat(chat);

        // Load messages for this chat
        const { data: msgs, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('sent_at', { ascending: true });

        if (msgError) throw msgError;
        setMessages(msgs || []);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, customerId]);

  // Load a specific chat by ID (used when AI creates a chat)
  const loadChatById = useCallback(async (id: string) => {
    try {
      const { data: chat, error: chatError } = await supabase
        .from('support_chats')
        .select('*')
        .eq('id', id)
        .single();

      if (chatError) throw chatError;
      if (chat) {
        setChatId(chat.id);
        setCurrentChat(chat as SupportChat);

        const { data: msgs, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('sent_at', { ascending: true });

        if (msgError) throw msgError;
        setMessages(msgs || []);
      }
    } catch (err) {
      console.error('Error loading chat by ID:', err);
    }
  }, []);

  // Send a message (for human support mode)
  const sendMessage = async (message: string) => {
    if (!message.trim() || !chatId) return;

    try {
      setError(null);

      // Optimistic update
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        sender_id: customerId,
        content: message.trim(),
        sent_at: new Date().toISOString(),
        sender_type: 'customer',
        read: false,
      };
      setMessages(prev => [...prev, optimisticMsg]);

      // Insert message into Supabase
      const { data: savedMsg, error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: customerId,
          sender_type: 'customer',
          content: message.trim(),
        })
        .select()
        .single();

      if (insertError) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        throw insertError;
      }

      // Replace optimistic message with real one
      if (savedMsg) {
        setMessages(prev =>
          prev.map(m => (m.id === optimisticMsg.id ? savedMsg : m))
        );
      }

      // Update last_message_at
      await supabase
        .from('support_chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  // Start a new chat (for human support mode with category selection)
  const startChat = async (issue: string, category: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: newChat, error: chatError } = await supabase
        .from('support_chats')
        .insert({
          customer_id: customerId,
          order_id: orderId,
          issue,
          category,
          status: 'active',
          is_ai_active: false,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      if (newChat) {
        setChatId(newChat.id);
        setCurrentChat(newChat as SupportChat);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error starting chat:', err);
      setError('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!chatId) return;
    try {
      await supabase
        .from('chat_messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .eq('read', false);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [chatId]);

  // Add a message locally (used by AI chat to inject messages without re-fetching)
  const addMessageLocally = useCallback((msg: Message) => {
    setMessages(prev => {
      const exists = prev.some(m => m.id === msg.id);
      if (exists) return prev;
      return [...prev, msg];
    });
  }, []);

  // Load chat on mount
  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Add message if it's from admin or AI (customer messages handled optimistically)
          if (newMessage.sender_type === 'admin' || newMessage.sender_type === 'ai') {
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Real-time subscription for chat status changes
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-status:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_chats',
          filter: `id=eq.${chatId}`,
        },
        (payload) => {
          const updated = payload.new as SupportChat;
          setCurrentChat(prev =>
            prev ? { ...prev, ...updated } : null
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Reset all chat state (for starting a new conversation after resolved)
  const resetChat = useCallback(() => {
    setChatId(null);
    setCurrentChat(null);
    setMessages([]);
    setError(null);
  }, []);

  const status = currentChat?.status || 'active';

  return {
    messages,
    isLoading,
    error,
    chatId,
    setChatId,
    currentChat,
    setCurrentChat,
    status,
    sendMessage,
    markMessagesAsRead,
    startChat,
    loadChat,
    loadChatById,
    addMessageLocally,
    resetChat,
  };
}
