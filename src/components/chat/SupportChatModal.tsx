import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupportChat } from '../../hooks/useServerlessSupportChat';
import { useAiChat } from '../../hooks/useAiChat';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageCircle,
  User,
  Headphones,
  Smile,
  MoreVertical,
  UserX,
  Bot,
  UserCheck
} from 'lucide-react';

interface SupportChatModalProps {
  orderId: string;
  customerId: string;
  onClose?: () => void;
  isOpen: boolean;
}

export const SupportChatModal: React.FC<SupportChatModalProps> = ({ orderId, customerId, onClose, isOpen }) => {
  const [issue, setIssue] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [category, setCategory] = useState('');
  const [isRegisteredCustomer, setIsRegisteredCustomer] = useState<boolean | null>(null);
  const [customerCheckLoading, setCustomerCheckLoading] = useState(true);
  const [hasEverInitialized, setHasEverInitialized] = useState<boolean | null>(null);
  const [aiChatId, setAiChatId] = useState<string | null>(null);
  const [aiMessageCount, setAiMessageCount] = useState(0);
  const [showEscalationConfirm, setShowEscalationConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chatId,
    messages,
    status,
    error,
    isLoading,
    startChat,
    sendMessage,
    markMessagesAsRead,
    currentChat
  } = useSupportChat(orderId, customerId);

  // AI Chat hook
  const {
    isAiLoading,
    aiError,
    isAiActive,
    setIsAiActive,
    sendAiMessage,
    escalateToHuman,
  } = useAiChat(aiChatId || chatId, customerId, orderId);

  // Sync AI active state from current chat data
  useEffect(() => {
    if (currentChat && typeof currentChat.is_ai_active === 'boolean') {
      setIsAiActive(currentChat.is_ai_active);
    }
  }, [currentChat, setIsAiActive]);

  // Check if the order belongs to a registered customer and if chat has been initialized before
  useEffect(() => {
    const checkCustomerRegistration = async () => {
      if (!orderId || !isOpen) return;

      setCustomerCheckLoading(true);
      try {
        // Get the order and check if it has a customer_id or user_id
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('customer_id, user_id')
          .eq('id', orderId)
          .single();

        if (orderError) {
          console.error('Error fetching order:', orderError);
          setIsRegisteredCustomer(false);
          setHasEverInitialized(false);
          return;
        }

        // Check if we have a customer_id 
        const customerIdToCheck = orderData.customer_id;

        if (!customerIdToCheck) {
          setIsRegisteredCustomer(false);
          setHasEverInitialized(false);
          return;
        }

        // Verify the customer exists in customers table (should always exist due to foreign key constraint)
        let customerExists = false;

        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, user_id')
          .eq('id', customerIdToCheck)
          .single();

        if (!customerError && customerData) {
          customerExists = true;

          // If customer has a user_id, check if it exists in profiles
          if (customerData.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', customerData.user_id)
              .single();

            if (profileData) {
              // This is a registered user with a profile
              customerExists = true;
            }
          }
        }

        setIsRegisteredCustomer(customerExists);

        // Check if any chat has ever been created for this order (regardless of status)
        if (customerExists) {
          const { data: chatHistory, error: chatError } = await supabase
            .from('support_chats')
            .select('id, status')
            .eq('order_id', orderId)
            .limit(1);

          if (!chatError && chatHistory && chatHistory.length > 0) {
            console.log('Chat has been initialized before for this order:', chatHistory[0]);
            setHasEverInitialized(true);
          } else {
            console.log('No previous chat found for this order');
            setHasEverInitialized(false);
          }
        } else {
          setHasEverInitialized(false);
        }

      } catch (error) {
        console.error('Error checking customer registration:', error);
        setIsRegisteredCustomer(false);
        setHasEverInitialized(false);
      } finally {
        setCustomerCheckLoading(false);
      }
    };

    checkCustomerRegistration();
  }, [orderId, isOpen]);

  // Debug: Log the current state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('SupportChatModal opened with:', {
        orderId,
        chatId,
        status,
        error,
        isLoading,
        messagesCount: messages?.length || 0
      });
    }
  }, [isOpen, orderId, chatId, status, error, isLoading, messages, isRegisteredCustomer, hasEverInitialized]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat is mounted
  useEffect(() => {
    if (chatId) {
      markMessagesAsRead();
    }
  }, [chatId, markMessagesAsRead]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (issue.trim() && category) {
      try {
        await startChat(issue, category);
        setHasEverInitialized(true);
        console.log('Chat started successfully');
      } catch (error) {
        console.error('Failed to start chat:', error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = newMessage.trim();
    if (!msg) return;
    setNewMessage('');

    if (isAiActive) {
      // Route to AI
      const result = await sendAiMessage(msg);
      if (result) {
        // If a new chat was created by the Edge Function, save the chatId
        if (!aiChatId && result.chatId) {
          setAiChatId(result.chatId);
          setHasEverInitialized(true);
        }
        setAiMessageCount(prev => prev + 1);
      }
    } else {
      // Route to human support
      sendMessage(msg);
    }
  };

  const handleEscalateToHuman = async () => {
    const currentId = aiChatId || chatId;
    if (!currentId) return;

    const success = await escalateToHuman(currentId);
    if (success) {
      setShowEscalationConfirm(false);
      // Reload the chat to pick up the human support flow  
      // The realtime subscription in useSupportChat will handle this
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'order-issue':
        return '📦';
      case 'food-quality':
        return '🍽️';
      case 'delivery':
        return '🚚';
      case 'payment':
        return '💳';
      default:
        return '❓';
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: <Clock className="w-4 h-4" />, text: 'Active', color: 'text-orange-600 bg-orange-100' };
      case 'resolved':
        return { icon: <CheckCircle className="w-4 h-4" />, text: 'Resolved', color: 'text-green-600 bg-green-100' };
      default:
        return { icon: <AlertCircle className="w-4 h-4" />, text: 'Pending', color: 'text-gray-600 bg-gray-100' };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={() => onClose?.()}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 500 }}
          className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[100vh] sm:h-[90vh] sm:max-h-[750px] backdrop-blur-sm border border-gray-200/50 safe-area-inset-bottom"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200/80 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white rounded-t-3xl sticky top-0 z-10 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm touch-manipulation"
                  aria-label="Close chat"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 flex-shrink-0"
                  >
                    {isAiActive ? <Bot className="w-5 h-5 sm:w-6 sm:h-6" /> : <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <motion.h3
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-bold text-lg sm:text-xl truncate"
                    >
                      {isAiActive ? 'AI Assistant' : 'Customer Support'}
                    </motion.h3>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center gap-2 flex-wrap"
                    >
                      <p className="text-sm text-blue-100 font-medium truncate">Order #{orderId.slice(-6)}</p>
                      <div className="flex items-center gap-1 text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full backdrop-blur-sm flex-shrink-0">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-2 h-2 bg-green-400 rounded-full"
                        />
                        Online
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {chatId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-white backdrop-blur-sm border border-white/20 ${status === 'active' ? 'bg-green-500/30' :
                      status === 'resolved' ? 'bg-blue-500/30' : 'bg-orange-500/30'
                      }`}
                  >
                    <motion.div
                      animate={{ rotate: status === 'active' ? 360 : 0 }}
                      transition={{ duration: 2, repeat: status === 'active' ? Infinity : 0 }}
                    >
                      {getStatusInfo(status).icon}
                    </motion.div>
                    <span className="text-xs sm:text-sm font-semibold hidden sm:inline">{getStatusInfo(status).text}</span>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 touch-manipulation"
                >
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gradient-to-b from-gray-50/50 via-white to-blue-50/30 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {customerCheckLoading || hasEverInitialized === null ? (
              // Loading state while checking customer registration and chat history
              <div className="flex items-center justify-center h-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                  />
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-gray-600 font-medium"
                  >
                    Checking your access...
                  </motion.p>
                </motion.div>
              </div>
            ) : isRegisteredCustomer === false ? (
              // Show message for non-registered customers
              <div className="flex items-center justify-center h-full p-4">
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 300 }}
                  className="text-center bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                    className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                  >
                    <UserX className="w-10 h-10 text-orange-600" />
                  </motion.div>
                  <motion.h4
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
                  >
                    Registration Required
                  </motion.h4>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-600 mb-6 leading-relaxed"
                  >
                    Live chat support is available exclusively for registered customers.
                    Please create an account to access our premium support service.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.href = '/auth?mode=signup'}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Create Account
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.href = '/auth?mode=signin'}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-300 border border-gray-200"
                    >
                      Sign In
                    </motion.button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100"
                  >
                    <p className="text-sm text-gray-600 mb-2">For immediate assistance:</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-blue-600 text-lg">+1 (555) 123-4567</span>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            ) : (hasEverInitialized === false || (hasEverInitialized === true && !chatId && !aiChatId)) ? (
              // AI-First Welcome Screen — skip category selection, start chatting immediately
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 300 }}
                className="space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-4"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl border border-white"
                  >
                    <Bot className="w-10 h-10 text-blue-600" />
                  </motion.div>
                  <motion.h4
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                  >
                    Hi! I'm TastyBytes AI Assistant 🤖
                  </motion.h4>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-600 leading-relaxed text-base"
                  >
                    I can help you with menu info, order tracking, policies, and more. Just type your question below!
                  </motion.p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-2 gap-2 sm:gap-3"
                >
                  {[
                    { text: "What's on the menu?", icon: '🍽️' },
                    { text: 'What are your hours?', icon: '🕐' },
                    { text: 'Do you have veg options?', icon: '🥗' },
                    { text: 'How can I track my order?', icon: '📦' },
                  ].map((suggestion, index) => (
                    <motion.button
                      key={suggestion.text}
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      onClick={() => setNewMessage(suggestion.text)}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="p-3 sm:p-4 border-2 border-gray-200 rounded-2xl text-left transition-all duration-300 hover:border-blue-300 hover:bg-blue-50/50 group touch-manipulation"
                    >
                      <span className="text-lg sm:text-xl mb-1 block">{suggestion.icon}</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-blue-700 leading-tight">{suggestion.text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              // Chat Messages
              <div className="space-y-6">
                {/* Chat Header Info */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-3xl p-6 mb-8 border border-blue-200 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"
                    >
                      {getCategoryIcon(currentChat?.category || category || '')}

                    </motion.div>
                    <div className="flex-1">
                      <motion.h4
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="font-bold text-gray-900 text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                      >
                        {(currentChat?.category || category || '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </motion.h4>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-gray-600 line-clamp-2 leading-relaxed mt-1"
                      >
                        {currentChat?.issue || issue}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>

                {/* Messages Container */}
                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isCustomer = message.sender_id === customerId;
                    const isAi = message.sender_type === 'ai';
                    const isAdmin = message.sender_type === 'admin';

                    return (
                      <motion.div
                        key={message.id || index}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: Math.min(index * 0.05, 0.5),
                          type: 'spring',
                          stiffness: 300,
                          damping: 20
                        }}
                        className={`flex items-end gap-3 ${isCustomer ? 'justify-end' : 'justify-start'
                          }`}
                      >
                        {/* Avatar for non-customer messages */}
                        {!isCustomer && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0 ${isAi
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                              : 'bg-gradient-to-br from-green-500 to-emerald-600'
                              }`}
                          >
                            {isAi ? <Bot className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                          </motion.div>
                        )}
                        <div className={`max-w-[85%] md:max-w-[75%] ${isCustomer ? '' : ''}`}>
                          {/* Sender label */}
                          {!isCustomer && (
                            <p className={`text-xs font-semibold mb-1 ml-1 ${isAi ? 'text-purple-600' : 'text-green-600'
                              }`}>
                              {isAi ? '🤖 AI Assistant' : '👨‍💼 Support Agent'}
                            </p>
                          )}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`rounded-3xl px-5 py-4 shadow-lg backdrop-blur-sm border ${isCustomer
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-lg border-blue-300 shadow-blue-200'
                              : isAi
                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 border-blue-200 rounded-bl-lg shadow-blue-100'
                                : 'bg-white text-gray-900 border-green-200 rounded-bl-lg shadow-green-100'
                              }`}
                          >
                            <p className="text-sm md:text-base leading-relaxed mb-3">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs opacity-75 font-medium">
                                {message.sent_at && !isNaN(new Date(message.sent_at).getTime())
                                  ? formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })
                                  : 'Just now'
                                }
                              </p>
                            </div>
                          </motion.div>
                        </div>
                        {/* Customer avatar */}
                        {isCustomer && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0"
                          >
                            You
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* AI Typing Indicator */}
                  {isAiLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-end gap-3 justify-start"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl rounded-bl-lg px-5 py-4 shadow-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 font-medium">AI is typing</span>
                          <div className="flex gap-1">
                            <motion.div
                              animate={{ scale: [1, 1.4, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 bg-purple-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.4, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-purple-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.4, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-purple-400 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Escalation Button — show after 2+ AI exchanges */}
                  {isAiActive && aiMessageCount >= 2 && !showEscalationConfirm && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center pt-2"
                    >
                      <motion.button
                        type="button"
                        onClick={() => setShowEscalationConfirm(true)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all duration-300"
                      >
                        <Headphones className="w-4 h-4" />
                        Talk to a real person
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Escalation Confirmation */}
                  {showEscalationConfirm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5 text-center"
                    >
                      <p className="text-sm font-medium text-gray-800 mb-3">Connect with a human support agent?</p>
                      <div className="flex justify-center gap-3">
                        <motion.button
                          type="button"
                          onClick={handleEscalateToHuman}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
                        >
                          Yes, connect me
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => setShowEscalationConfirm(false)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
                        >
                          Continue with AI
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Escalation Success Message */}
                  {!isAiActive && aiMessageCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 text-center"
                    >
                      <div className="flex items-center justify-center gap-2 text-green-700 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-bold">Connected to Support</span>
                      </div>
                      <p className="text-xs text-green-600">A support agent will respond shortly. You can continue typing your messages.</p>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center"
              >
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">
                  {error.includes('socket') || error.includes('connect') || error.includes('timeout')
                    ? 'Connection Issue'
                    : 'Error'
                  }
                </p>
                <p className="text-sm mb-3">
                  {error.includes('socket') || error.includes('connect') || error.includes('timeout')
                    ? 'Live chat is temporarily unavailable. You can still submit feedback or contact us through other channels.'
                    : error
                  }
                </p>
                {error.includes('socket') || error.includes('connect') || error.includes('timeout') ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm mr-2"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm"
                  >
                    Reload Page
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Message Input */}
          {(chatId || aiChatId || (isAiActive && isRegisteredCustomer)) && status !== 'resolved' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-3 sm:p-4 md:p-6 border-t border-gray-200/50 bg-gradient-to-r from-white via-blue-50/30 to-white backdrop-blur-md safe-area-inset-bottom"
            >
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-4">
                <div className="flex-1 relative">
                  <motion.input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onFocus={() => { }}
                    onBlur={() => { }}
                    onKeyDown={() => { }}
                    placeholder="Type your message..."
                    className="w-full rounded-2xl sm:rounded-3xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 sm:py-4 px-4 sm:px-6 pr-12 sm:pr-14 bg-white/80 focus:bg-white transition-all duration-300 text-sm sm:text-base placeholder-gray-400 backdrop-blur-sm hover:border-gray-300 focus:shadow-lg"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1 touch-manipulation"
                  >
                    <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.button>
                </div>
                <motion.button
                  type="submit"
                  disabled={!newMessage.trim() || isAiLoading}
                  whileHover={{ scale: newMessage.trim() && !isAiLoading ? 1.1 : 1, rotate: newMessage.trim() && !isAiLoading ? 15 : 0 }}
                  whileTap={{ scale: newMessage.trim() && !isAiLoading ? 0.9 : 1 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-3 sm:p-4 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl disabled:shadow-none hover:shadow-2xl touch-manipulation"
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              </form>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-between mt-3 sm:mt-4 text-xs text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded-lg text-gray-600 font-mono text-xs hidden sm:inline">Enter</kbd>
                  <span className="hidden sm:inline">to send</span>
                  <span className="sm:hidden">Tap send to chat</span>
                </div>
                <motion.div
                  className="flex items-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                  </div>
                  <span className="font-medium hidden sm:inline">{isAiActive ? 'AI Assistant is ready' : 'Support team is online'}</span>
                  <span className="font-medium sm:hidden">{isAiActive ? 'AI Ready' : 'Online'}</span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {status === 'resolved' && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="p-6 md:p-8 border-t border-gray-200/50 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 text-center backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                className="flex items-center justify-center gap-4 text-green-700 mb-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-bold text-2xl"
                  >
                    Chat Resolved
                  </motion.span>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-green-600 font-medium"
                  >
                    Thank you for contacting support!
                  </motion.p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-green-200"
              >
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Your issue has been successfully resolved. Our team is here 24/7 if you need any further assistance.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Close Chat
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
