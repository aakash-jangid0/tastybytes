import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRealtimeSync } from './useRealtimeSync';
import { toast } from 'react-hot-toast';

export interface AdminChat {
  id: string;
  order_id: string;
  customer_id: string;
  status: 'active' | 'resolved' | 'closed';
  issue: string;
  category: string;
  messages: Array<{
    id: string;
    sender_id: string;
    sender_type: 'customer' | 'admin' | 'ai'; // Add sender_type field
    content: string; // Changed from 'message' to 'content' to match database
    sent_at: string;
    read: boolean;
  }>;
  created_at: string;
  last_message_at: string;
  order_details?: {
    order_number: string;
    total_amount: number;
    status: string;
  };
  customer_details?: {
    name: string;
    email: string;
    phone: string;
  };
  isCustomerTyping?: boolean;
}

export function useServerlessAdminChats() {
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Setup realtime sync for admin chats
  useRealtimeSync<AdminChat>({
    table: 'support_chats',
    onInsert: (newChat) => {
      setChats(prev => [newChat, ...prev]);
      toast.success('New support request received!');
    },
    onUpdate: (updatedChat) => {
      setChats(prev => prev.map(chat =>
        chat.id === updatedChat.id ? updatedChat : chat
      ));
    },
    onDelete: (deletedChat) => {
      setChats(prev => prev.filter(chat => chat.id !== deletedChat.id));
    }
  });

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('📊 Admin: Fetching chats with messages...');

      const { data: chats, error } = await supabase
        .from('support_chats')
        .select(`
          *,
          order_details:orders!support_chats_order_id_fkey (
            id,
            total_amount,
            status
          ),
          customer_details:customers!support_chats_customer_id_fkey (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📋 Admin: Fetched chats:', chats?.length || 0);

      // Load messages for each chat
      const chatsWithMessages = await Promise.all((chats || []).map(async (chat) => {
        try {
          const { data: messages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('sent_at', { ascending: true });

          if (messagesError) {
            console.error('Error loading messages for chat', chat.id, messagesError);
            return { ...chat, messages: [] };
          }

          console.log(`💬 Admin: Loaded ${messages?.length || 0} messages for chat ${chat.id}`);
          return { ...chat, messages: messages || [] };
        } catch (err) {
          console.error('Error loading messages for chat', chat.id, err);
          return { ...chat, messages: [] };
        }
      }));

      setChats(chatsWithMessages);
      console.log('✅ Admin: All chats loaded with messages');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chats';
      console.error('Error fetching chats:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Real-time subscription for new messages across all chats
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Admin: Setting up real-time subscription for messages');

    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          console.log('📨 Admin: Real-time message received:', payload.new);
          const newMessage = payload.new;

          console.log('🔍 Admin: Message details:', {
            id: newMessage.id,
            sender_type: newMessage.sender_type,
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            chat_id: newMessage.chat_id
          });

          // Only process customer messages (admin messages are handled optimistically)
          if (newMessage.sender_type === 'customer') {
            console.log('👤 Admin: Adding customer message to chat');

            setChats(prev => prev.map(chat => {
              if (chat.id === newMessage.chat_id) {
                // Check if message already exists to prevent duplicates
                const messageExists = chat.messages.some(msg => msg.id === newMessage.id);
                if (messageExists) {
                  console.log('⚠️ Admin: Message already exists, skipping');
                  return chat;
                }

                console.log('✅ Admin: Adding new customer message');
                return {
                  ...chat,
                  messages: [...(chat.messages || []), newMessage as AdminChat['messages'][number]],
                  last_message_at: newMessage.sent_at
                };
              }
              return chat;
            }));
          } else {
            console.log('👨‍💼 Admin: Admin message (handled optimistically)');
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Admin: Subscription status:', status);
      });

    return () => {
      console.log('🔌 Admin: Unsubscribing from real-time messages');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load messages for a specific chat
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      // Update the specific chat with its messages
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: messages || []
          };
        }
        return chat;
      }));

    } catch (err) {
      console.error('Error loading messages:', err);
      toast.error('Failed to load messages');
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (chatId: string, message: string) => {
    if (!user) {
      throw new Error('Must be logged in to send messages');
    }

    try {
      setError(null);

      // Create optimistic message
      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        sender_id: user.id,
        sender_type: 'admin' as const,
        content: message, // Changed from 'message' to 'content' to match database schema
        sent_at: new Date().toISOString(),
        read: false
      };

      // Update UI immediately with safety check
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...(chat.messages || []), optimisticMessage], // Ensure messages is an array
            last_message_at: optimisticMessage.sent_at
          };
        }
        return chat;
      }));

      // Send to server
      console.log('📤 [ADMIN] Sending message to server:', {
        chat_id: chatId,
        sender_id: user.id,
        sender_type: 'admin',
        content: message
      });

      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: message, // Changed from 'message' to 'content' to match database schema
          sender_type: 'admin',
          sent_at: new Date().toISOString(),
          read: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [ADMIN] Message insert error:', error);
        // Remove optimistic message on error
        setChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: chat.messages.filter(msg => msg.id !== optimisticId)
            };
          }
          return chat;
        }));
        throw error;
      }

      console.log('✅ [ADMIN] Message inserted successfully:', newMessage);
      console.log('🚀 [ADMIN] This should trigger real-time for customer!');

      // Update UI with real message
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === optimisticId ? newMessage : msg
            )
          };
        }
        return chat;
      }));

      return newMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Error sending message:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [user]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (chatId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .eq('sender_id', user.id);

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark messages as read';
      console.error('Error marking messages as read:', err);
      setError(errorMessage);
    }
  }, [user]);

  // Resolve chat
  const resolveChat = useCallback(async (chatId: string) => {
    if (!user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('support_chats')
        .update({ status: 'resolved' })
        .eq('id', chatId);

      if (error) throw error;

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, status: 'resolved' }
          : chat
      ));

      toast.success('Chat resolved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve chat';
      console.error('Error resolving chat:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [user]);

  // Select a chat
  const selectChat = useCallback((chatId: string | null) => {
    setActiveChat(chatId);
    if (chatId) {
      markMessagesAsRead(chatId);
    }
  }, [markMessagesAsRead]);

  // Get current chat data
  const getCurrentChat = useCallback(() => {
    if (!activeChat) return null;
    return chats.find(chat => chat.id === activeChat) || null;
  }, [activeChat, chats]);

  return {
    chats,
    isLoading,
    error,
    activeChat,
    currentChat: getCurrentChat(),
    selectChat,
    sendMessage,
    loadMessages, // Add loadMessages function
    markMessagesAsRead,
    resolveChat,
    refreshChats: fetchChats
  };
}
