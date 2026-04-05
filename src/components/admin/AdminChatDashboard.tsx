import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServerlessAdminChats } from '../../hooks/useServerlessAdminChats';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageCircle, 
  CheckCircle, 
  Search,
  Send,
  User,
  Briefcase,
  Coffee,
  Globe,
  Crown,
  Bolt,
  Shield,
  Settings,
  Smile,
  Heart,
  Headphones,
  RefreshCw,
  Zap
} from 'lucide-react';

export const AdminChatDashboard: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chats,
    isLoading,
    error,
    sendMessage,
    markMessagesAsRead,
    resolveChat
  } = useServerlessAdminChats();

  // Get current chat
  const currentChat = chats.find(chat => chat.id === selectedChat) || null;

  // Analytics
  const activeChats = chats.filter(c => c.status === 'active').length;
  const resolvedChats = chats.filter(c => c.status === 'resolved').length;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat) {
      markMessagesAsRead(selectedChat);
    }
  }, [selectedChat, markMessagesAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;

    try {
      await sendMessage(currentChat.id, newMessage);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleResolveChat = async (chatId: string) => {
    try {
      await resolveChat(chatId);
    } catch (err) {
      console.error('Failed to resolve chat:', err);
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.issue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200';
      case 'resolved':
        return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200';
      default:
        return 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'order-issue':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200';
      case 'food-quality':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200';
      case 'delivery':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200';
      case 'payment':
        return 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'order-issue':
        return <Briefcase className="w-4 h-4" />;
      case 'food-quality':
        return <Coffee className="w-4 h-4" />;
      case 'delivery':
        return <Globe className="w-4 h-4" />;
      case 'payment':
        return <Crown className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="flex items-center justify-center h-screen">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse mx-auto mb-4"></div>
              <motion.div
                className="absolute inset-0 w-20 h-20 rounded-full border-4 border-blue-500 border-t-transparent mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Support Dashboard</h3>
            <p className="text-gray-600">Getting your customer conversations ready...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="flex items-center justify-center h-screen">
          <motion.div 
            className="text-center max-w-md mx-auto p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-400 to-pink-500 mx-auto mb-6 flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Connection Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <motion.button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Try Again
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Beautiful Header with Analytics */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Customer Support Hub
                </h1>
                <p className="text-gray-600">Real-time chat management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Analytics Cards in Header */}
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-amber-500 text-white"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center space-x-2">
                    <Bolt className="w-4 h-4 text-orange-100" />
                    <div>
                      <p className="text-xs font-medium text-orange-100">Active</p>
                      <p className="text-sm font-bold">{activeChats}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 text-white"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-100" />
                    <div>
                      <p className="text-xs font-medium text-emerald-100">Resolved</p>
                      <p className="text-sm font-bold">{resolvedChats}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Live & Connected
                </span>
              </div>
              <motion.button
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Chat List */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Conversations</h2>
              
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex space-x-1 bg-gray-100 rounded-2xl p-1">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'resolved', label: 'Resolved' }
                ].map((filter) => (
                  <motion.button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      statusFilter === filter.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    whileHover={{ scale: statusFilter !== filter.value ? 1.02 : 1 }}
                  >
                    {filter.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto" data-lenis-prevent>
              {filteredChats.length === 0 ? (
                <motion.div 
                  className="flex flex-col items-center justify-center h-64 text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Search className="w-12 h-12 mb-4 text-gray-400" />
                  <p className="text-center">No conversations found</p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {filteredChats.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => setSelectedChat(chat.id)}
                      className={`flex items-center justify-between p-3 m-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm border-l-4 ${
                        selectedChat === chat.id
                          ? 'bg-blue-50 border-l-blue-500 shadow-sm'
                          : 'bg-white hover:bg-gray-50 border-l-gray-300'
                      }`}
                      whileHover={{ scale: 1.005 }}
                    >
                      {/* Left side - Avatar and Info */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between w-full">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              Order #{chat.order_id.slice(-6)}
                            </h3>
                            <span className={`px-3 py-0.5 rounded text-xs font-medium w-20 text-center ${getCategoryColor(chat.category)}`}>
                              {getCategoryIcon(chat.category)}
                              <span className="ml-1">{chat.category?.replace('-', ' ') || 'general'}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <MessageCircle className="w-3 h-3" />
                                <span>{chat.messages.length}</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            {currentChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">Order #{currentChat.order_id.slice(-6)}</h2>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(currentChat.status)}`}>
                            {currentChat.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {currentChat.status === 'active' && (
                      <motion.button
                        onClick={() => handleResolveChat(currentChat.id)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg flex items-center space-x-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Resolve</span>
                      </motion.button>
                    )}
                  </div>

                  <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      {getCategoryIcon(currentChat.category)}
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {currentChat.category?.replace('-', ' ').toUpperCase() || 'GENERAL'}
                      </h4>
                    </div>
                    <p className="text-gray-700 text-sm">{currentChat.issue}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white" data-lenis-prevent>
                  <AnimatePresence>
                    {currentChat.messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`flex ${message.sender_id === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] flex ${message.sender_id === 'admin' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.sender_id === 'admin'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500'
                          }`}>
                            {message.sender_id === 'admin' ? (
                              <Shield className="w-4 h-4 text-white" />
                            ) : (
                              <User className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className={`rounded-2xl p-4 shadow-sm ${
                            message.sender_id === 'admin'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-2 ${
                              message.sender_id === 'admin' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {currentChat.status === 'active' ? (
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your response..."
                          className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 placeholder-gray-500"
                        />
                        <Smile className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      <motion.button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center space-x-2"
                        whileHover={{ scale: newMessage.trim() ? 1.05 : 1 }}
                        whileTap={{ scale: newMessage.trim() ? 0.95 : 1 }}
                      >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </motion.button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50 text-center">
                    <div className="flex items-center justify-center space-x-2 text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-semibold text-sm">Chat Resolved</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      This conversation has been successfully resolved! 🎉
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mb-6 flex items-center justify-center">
                    <MessageCircle className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Conversation</h3>
                  <p className="text-gray-600 mb-6">Choose a chat to start helping customers</p>
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Bolt className="w-4 h-4 text-orange-500" />
                      <span>Quick responses</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>Happy customers</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

