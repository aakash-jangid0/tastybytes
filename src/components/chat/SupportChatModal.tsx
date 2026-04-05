import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Bot,
  Headphones,
  MoreVertical,
  UserX,
  UserCheck,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

interface SupportChatModalProps {
  orderId: string;
  customerId: string;
  onClose?: () => void;
  isOpen: boolean;
}

export const SupportChatModal: React.FC<SupportChatModalProps> = ({ orderId, customerId, onClose, isOpen }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isRegisteredCustomer, setIsRegisteredCustomer] = useState<boolean | null>(null);
  const [customerCheckLoading, setCustomerCheckLoading] = useState(true);
  const [hasEverInitialized, setHasEverInitialized] = useState<boolean | null>(null);
  const [showEscalationConfirm, setShowEscalationConfirm] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const {
    chatId,
    setChatId,
    messages,
    status,
    error,
    isLoading,
    sendMessage,
    markMessagesAsRead,
    currentChat,
    setCurrentChat,
    loadChatById,
    addMessageLocally,
    startChat,
    resetChat,
  } = useSupportChat(orderId, customerId);

  const {
    isAiLoading,
    aiError,
    clearAiError,
    isAiActive,
    setIsAiActive,
    sendAiMessage,
    escalateToHuman,
  } = useAiChat(chatId, customerId, orderId);

  // Sync AI active state from current chat data
  useEffect(() => {
    if (currentChat && typeof currentChat.is_ai_active === 'boolean') {
      setIsAiActive(currentChat.is_ai_active);
    }
  }, [currentChat, setIsAiActive]);

  // Reset transient UI state when modal reopens
  useEffect(() => {
    if (isOpen) {
      setShowEscalationConfirm(false);
      setShowOptionsMenu(false);
      setLastFailedMessage(null);
      clearAiError();
    }
  }, [isOpen, clearAiError]);

  // Check if the order belongs to a registered customer
  useEffect(() => {
    const checkCustomerRegistration = async () => {
      if (!orderId || !isOpen) return;

      setCustomerCheckLoading(true);
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('customer_id, user_id')
          .eq('id', orderId)
          .single();

        if (orderError) {
          setIsRegisteredCustomer(false);
          setHasEverInitialized(false);
          return;
        }

        const customerIdToCheck = orderData.customer_id;
        if (!customerIdToCheck) {
          setIsRegisteredCustomer(false);
          setHasEverInitialized(false);
          return;
        }

        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, user_id')
          .eq('id', customerIdToCheck)
          .single();

        if (customerError || !customerData) {
          setIsRegisteredCustomer(false);
          setHasEverInitialized(false);
          return;
        }

        setIsRegisteredCustomer(true);

        // Check if any active/non-resolved chat exists for this order
        const { data: chatHistory } = await supabase
          .from('support_chats')
          .select('id, status')
          .eq('order_id', orderId)
          .neq('status', 'resolved')
          .limit(1);

        setHasEverInitialized(chatHistory && chatHistory.length > 0);
      } catch {
        setIsRegisteredCustomer(false);
        setHasEverInitialized(false);
      } finally {
        setCustomerCheckLoading(false);
      }
    };

    checkCustomerRegistration();
  }, [orderId, isOpen]);

  // Close options menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptionsMenu]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat is open
  useEffect(() => {
    if (chatId) {
      markMessagesAsRead();
    }
  }, [chatId, markMessagesAsRead]);

  // --- Core actions ---

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = newMessage.trim();
    if (!msg) return;
    setNewMessage('');
    clearAiError();
    setLastFailedMessage(null);

    if (isAiActive) {
      // Add user message to UI immediately (optimistic)
      const tempUserMsg = {
        id: `user-${Date.now()}`,
        chat_id: chatId || '',
        sender_id: customerId,
        content: msg,
        sent_at: new Date().toISOString(),
        sender_type: 'customer' as const,
        read: false,
      };

      addMessageLocally(tempUserMsg);

      // If this is the first message, mark as initialized so the messages view shows
      if (!chatId) {
        setHasEverInitialized(true);
      }

      // AI mode: send to edge function
      const result = await sendAiMessage(msg);
      if (result) {
        setLastFailedMessage(null);
        if (!chatId && result.chatId) {
          setChatId(result.chatId);
          await loadChatById(result.chatId);
        } else {
          addMessageLocally(result.aiMessage);
        }
      } else {
        // AI failed — store message for retry
        setLastFailedMessage(msg);
      }
    } else {
      // Human support mode
      sendMessage(msg);
    }
  };

  const handleRetryLastMessage = async () => {
    if (!lastFailedMessage) return;
    const msg = lastFailedMessage;
    clearAiError();
    setLastFailedMessage(null);

    const result = await sendAiMessage(msg);
    if (result) {
      if (!chatId && result.chatId) {
        setChatId(result.chatId);
        await loadChatById(result.chatId);
      } else {
        addMessageLocally(result.aiMessage);
      }
    } else {
      setLastFailedMessage(msg);
    }
  };

  // Switch to human support — works with or without an existing chatId
  const handleSwitchToHuman = useCallback(async () => {
    setShowEscalationConfirm(false);
    setShowOptionsMenu(false);

    if (chatId) {
      // Existing chat — escalate it
      await escalateToHuman(chatId);
    } else {
      // No chat yet — create a new human-support chat
      await startChat('Customer requested human support', 'general');
      setIsAiActive(false);
      setHasEverInitialized(true);
    }
  }, [chatId, escalateToHuman, startChat, setIsAiActive]);

  const handleStartNewConversation = () => {
    resetChat();
    setHasEverInitialized(false);
    setShowEscalationConfirm(false);
    setLastFailedMessage(null);
    clearAiError();
    setIsAiActive(true);
  };

  const getStatusInfo = (s: string) => {
    switch (s) {
      case 'active':
        return { icon: <Clock className="w-4 h-4" />, text: 'Active', color: 'text-orange-600 bg-orange-100' };
      case 'resolved':
        return { icon: <CheckCircle className="w-4 h-4" />, text: 'Resolved', color: 'text-green-600 bg-green-100' };
      default:
        return { icon: <AlertCircle className="w-4 h-4" />, text: 'Pending', color: 'text-gray-600 bg-gray-100' };
    }
  };

  if (!isOpen) return null;

  const showWelcome = hasEverInitialized === false;
  const showMessages = (chatId || (hasEverInitialized && messages.length > 0)) && !showWelcome;
  const isSendDisabled = !newMessage.trim() || (isAiLoading && isAiActive);
  const showInput = (chatId || (isAiActive && isRegisteredCustomer) || (!isAiActive && isRegisteredCustomer)) && status !== 'resolved';

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
          {/* ═══ Header ═══ */}
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
                    <h3 className="font-bold text-lg sm:text-xl truncate">
                      {isAiActive ? 'AI Assistant' : 'Customer Support'}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-blue-100 font-medium truncate">Order #{orderId.slice(-6)}</p>
                      <div className="flex items-center gap-1 text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full backdrop-blur-sm flex-shrink-0">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-2 h-2 bg-green-400 rounded-full"
                        />
                        Online
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {chatId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-white backdrop-blur-sm border border-white/20 ${
                      status === 'active' ? 'bg-green-500/30' :
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
                {/* Three-dot menu */}
                <div className="relative" ref={optionsMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowOptionsMenu(prev => !prev)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 touch-manipulation"
                  >
                    <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                  <AnimatePresence>
                    {showOptionsMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                      >
                        {isAiActive ? (
                          <button
                            onClick={handleSwitchToHuman}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                          >
                            <Headphones className="w-4 h-4" />
                            <span className="font-medium">Talk to a real person</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setShowOptionsMenu(false);
                              setIsAiActive(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <Bot className="w-4 h-4" />
                            <span className="font-medium">Switch to AI Assistant</span>
                          </button>
                        )}
                        <div className="border-t border-gray-100" />
                        <button
                          onClick={() => {
                            setShowOptionsMenu(false);
                            onClose?.();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span className="font-medium">Close chat</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Chat Content ═══ */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gradient-to-b from-gray-50/50 via-white to-blue-50/30 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" data-lenis-prevent>
            {customerCheckLoading || hasEverInitialized === null ? (
              /* ── Loading ── */
              <div className="flex items-center justify-center h-full">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
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
              /* ── Not registered ── */
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
                  <h4 className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Registration Required
                  </h4>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Live chat support is available exclusively for registered customers.
                    Please create an account to access our premium support service.
                  </p>
                  <div className="space-y-3">
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
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                    <p className="text-sm text-gray-600 mb-2">For immediate assistance:</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-blue-600 text-lg">+1 (555) 123-4567</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : showWelcome ? (
              /* ── Welcome Screen ── */
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 300 }}
                className="space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 backdrop-blur-sm"
              >
                <div className="text-center mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl border border-white"
                  >
                    <Bot className="w-10 h-10 text-blue-600" />
                  </motion.div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Hi! I'm TastyBytes AI Assistant
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-base">
                    I can help you with menu info, order tracking, policies, and more. Just type your question below!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { text: "What's on the menu?", icon: '\u{1F37D}\u{FE0F}' },
                    { text: 'What are your hours?', icon: '\u{1F550}' },
                    { text: 'Do you have veg options?', icon: '\u{1F957}' },
                    { text: 'How can I track my order?', icon: '\u{1F4E6}' },
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
                </div>

                {/* Link to talk to a real person directly */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-center pt-2"
                >
                  <button
                    type="button"
                    onClick={handleSwitchToHuman}
                    className="text-sm text-gray-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    Or talk to a support agent for personalized help
                  </button>
                </motion.div>
              </motion.div>
            ) : showMessages ? (
              /* ── Chat Messages ── */
              <div className="space-y-6">
                {/* Messages */}
                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isCustomer = message.sender_type === 'customer';
                    const isAi = message.sender_type === 'ai';

                    return (
                      <motion.div
                        key={message.id || index}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: Math.min(index * 0.05, 0.5),
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                        }}
                        className={`flex items-end gap-3 ${isCustomer ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Non-customer avatar */}
                        {!isCustomer && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0 ${
                              isAi
                                ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                : 'bg-gradient-to-br from-green-500 to-emerald-600'
                            }`}
                          >
                            {isAi ? <Bot className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                          </motion.div>
                        )}
                        <div className="max-w-[85%] md:max-w-[75%]">
                          {!isCustomer && (
                            <p className={`text-xs font-semibold mb-1 ml-1 ${isAi ? 'text-purple-600' : 'text-green-600'}`}>
                              {isAi ? 'AI Assistant' : 'Support Agent'}
                            </p>
                          )}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`rounded-3xl px-5 py-4 shadow-lg backdrop-blur-sm border ${
                              isCustomer
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
                                  : 'Just now'}
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
                            {[0, 0.2, 0.4].map((delay, i) => (
                              <motion.div
                                key={i}
                                animate={{ scale: [1, 1.4, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay }}
                                className="w-2 h-2 bg-purple-400 rounded-full"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
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
                          onClick={handleSwitchToHuman}
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

                  {/* AI Error Banner */}
                  {aiError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 font-medium mb-2">{aiError}</p>
                          <div className="flex flex-wrap gap-2">
                            {lastFailedMessage && (
                              <motion.button
                                type="button"
                                onClick={handleRetryLastMessage}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Try again
                              </motion.button>
                            )}
                            <motion.button
                              type="button"
                              onClick={handleSwitchToHuman}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <Headphones className="w-3 h-3" />
                              Talk to agent
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => { clearAiError(); setLastFailedMessage(null); }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Dismiss
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Connected to Support banner */}
                  {!isAiActive && chatId && (
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
            ) : null}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center mt-4"
              >
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Connection Error</p>
                <p className="text-sm mb-3">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm"
                >
                  Reload Page
                </button>
              </motion.div>
            )}
          </div>

          {/* ═══ Input Area ═══ */}
          {showInput && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border-t border-gray-200/50 bg-gradient-to-r from-white via-blue-50/30 to-white backdrop-blur-md safe-area-inset-bottom"
            >
              {/* Persistent "Talk to a real person" pill — always visible in AI mode */}
              {isAiActive && !showEscalationConfirm && (
                <div className="flex justify-center pt-3 px-3">
                  <button
                    type="button"
                    onClick={() => setShowEscalationConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-full border border-gray-200 hover:border-orange-200 transition-all duration-200"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    Talk to a real person instead
                  </button>
                </div>
              )}

              <div className="p-3 sm:p-4 md:px-6 md:pb-6 md:pt-3">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isAiActive ? "Ask me anything..." : "Type your message..."}
                      className="w-full rounded-2xl sm:rounded-3xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 sm:py-4 px-4 sm:px-6 bg-white/80 focus:bg-white transition-all duration-300 text-sm sm:text-base placeholder-gray-400 backdrop-blur-sm hover:border-gray-300 focus:shadow-lg"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={isSendDisabled}
                    whileHover={{ scale: !isSendDisabled ? 1.1 : 1, rotate: !isSendDisabled ? 15 : 0 }}
                    whileTap={{ scale: !isSendDisabled ? 0.9 : 1 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-3 sm:p-4 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl disabled:shadow-none hover:shadow-2xl touch-manipulation"
                  >
                    <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.button>
                </form>
                <div className="flex items-center justify-between mt-2 sm:mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-100 rounded-lg text-gray-600 font-mono text-xs hidden sm:inline">Enter</kbd>
                    <span className="hidden sm:inline">to send</span>
                    <span className="sm:hidden">Tap send to chat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 0.3, 0.6].map((delay, i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay }}
                          className="w-1.5 h-1.5 bg-green-400 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="font-medium">{isAiActive ? 'AI Ready' : 'Online'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Resolved Footer ═══ */}
          {status === 'resolved' && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="p-6 md:p-8 border-t border-gray-200/50 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 text-center backdrop-blur-md"
            >
              <div className="flex items-center justify-center gap-4 text-green-700 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-2xl">Chat Resolved</span>
                  <p className="text-sm text-green-600 font-medium">Thank you for contacting support!</p>
                </div>
              </div>
              <div className="bg-white/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-green-200">
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Your issue has been successfully resolved. Our team is here 24/7 if you need any further assistance.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Close Chat
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartNewConversation}
                    className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 border border-gray-200 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Start new conversation
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
