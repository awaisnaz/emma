'use client';
import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';

export default function Home() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState('clear'); // 'clear' or 'delete'
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const messagesEndRef = useRef(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Set mounted state
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
    setMounted(true);
  }, []);

  // Save dark mode changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    }
  }, [isDarkMode, mounted]);

  // Load sessions and messages from local storage
  useEffect(() => {
    const savedSessions = localStorage.getItem('sessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }

    const savedCurrentSession = localStorage.getItem('currentSessionId');
    if (savedCurrentSession) {
      setCurrentSessionId(savedCurrentSession);
      const savedMessages = localStorage.getItem(`messages_${savedCurrentSession}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  }, []);

  // Load chats from backend
  const loadChatsFromBackend = async () => {
    if (session?.user?.email) {
      try {
        const response = await fetch('/api/chats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) throw new Error('Failed to load chats');
        
        const data = await response.json();
        setMessages(data.chats || []);
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    }
  };

  // Modify useEffect for session to load chats
  useEffect(() => {
    if (session) {
      loadChatsFromBackend();
    }
  }, [session]);

  // Save sessions to local storage
  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Save messages to local storage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(`messages_${currentSessionId}`, JSON.stringify(messages));
    }
  }, [messages, currentSessionId]);

  // Modify handleSubmit to save chats to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    setIsLoading(true);
    const userMessage = inputMessage;
    setInputMessage(''); // Clear input immediately for better UX

    // Immediately show the user message
    setMessages(prevMessages => [...prevMessages, {
      _id: `temp-${Date.now()}`,
      content: userMessage,
      role: 'user'
    }]);

    try {
      // Save user message to backend
      await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage,
          role: 'user',
          email: session?.user?.email
        })
      });

      // Get AI response from our AI endpoint
      const aiResult = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage
        })
      });

      if (!aiResult.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const { response: aiResponse } = await aiResult.json();

      // Save AI response to backend
      await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: aiResponse,
          role: 'assistant',
          email: session?.user?.email
        })
      });

      // Fetch fresh data from backend
      const response = await fetch('/api/chats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch updated chats');
      
      const data = await response.json();
      setMessages(data.chats || []);

    } catch (error) {
      console.error('Chat operation failed:', error);
      toast.error('Failed to send message');
      
      // Remove the temporary message if there was an error
      setMessages(prevMessages => prevMessages.filter(msg => !msg._id.startsWith('temp-')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    signIn('google');
  };

  const handleSignOut = () => {
    signOut();
  };

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderAuthButton = () => {
    if (status === "loading") {
      return (
        <div className="w-8 h-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-t-rose-500 border-rose-200 rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => session ? setIsDropdownOpen(!isDropdownOpen) : handleSignIn()}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {session?.user ? (
            <>
              <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                {session.user.name}
              </span>
              <img 
                src={session.user.image} 
                alt={session.user.name} 
                className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
              />
            </>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </button>
        
        {session?.user && isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-2">
              <button
                onClick={() => {
                  signOut();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 mt-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleClearHistory = () => {
    setDeleteMode('clear');
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteMode === 'clear') {
      // Always clear local storage
      setMessages([]);
      setSessions([]);
      setCurrentSessionId(null);
      localStorage.removeItem('sessions');
      localStorage.removeItem('currentSessionId');
      
      // If user is logged in, also clear backend
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/chats', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            toast.error('Failed to clear chat history from backend');
          } else {
            toast.success('Chat history cleared successfully');
          }
        } catch (error) {
          console.error('Error clearing chat history:', error);
          toast.error('Error clearing chat history');
        }
      } else {
        // Show success message for local storage clear
        toast.success('Chat history cleared successfully');
      }
    } else if (deleteMode === 'delete' && sessionToDelete) {
      setSessions(prev => prev.filter(session => session.id !== sessionToDelete));
      if (currentSessionId === sessionToDelete) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      toast.success('Session deleted successfully');
    }
    setIsDeleteModalOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendTestEmail = async () => {
    try {
      setIsSendingEmail(true);
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: "awais.nazir.ch@gmail.com" // You can make this dynamic later
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Email sent successfully!');
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Don't render content until mounted
  if (!mounted) {
    return null; // or a loading spinner if preferred
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Change toast.Toaster to just Toaster */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDarkMode ? '#374151' : '#fff',
            color: isDarkMode ? '#fff' : '#374151',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />

      {/* Overlay for mobile - closes sidebar when clicking outside */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - reorganized layout */}
      <div className={`
        fixed md:static top-0 left-0 w-64 h-full 
        bg-gradient-to-b from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 z-50 flex flex-col
        border-r border-rose-100 dark:border-gray-700
      `}>
        {/* Sidebar Header with Dashboard title */}
        <div className="h-16 flex items-center px-6 border-b border-indigo-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-rose-300 dark:text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-lg font-semibold text-gray-800 dark:text-white">Dashboard</span>
          </div>
        </div>

        {/* Main Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Usage Card */}
            <div className="px-4 py-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Usage</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">Emails Sent</span>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">24</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">Email Replies</span>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">18</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">Scheduled Meetings</span>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing and Balance Card */}
        <div className="px-4 py-4 bg-white dark:bg-gray-800 border-t border-rose-100 dark:border-gray-700">
          <div className="space-y-3">
            {/* Pricing Info */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pricing</h3>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">First 10 new emails free</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">10¢ per email after</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">Interaction with existing emails free forever</span>
            </div>
            {/* Balance and Add Funds */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Balance: $10.00</span>
              </div>
              <button 
                onClick={() => {/* Add wallet logic */}}
                className="w-full text-sm px-3 py-1.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
              >
                Add Funds
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="h-16 flex items-center justify-between px-4 border-t border-rose-100 dark:border-gray-700 bg-white/30 dark:bg-gray-800/30">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/50 dark:hover:bg-gray-700 text-gray-500 hover:text-rose-500 dark:hover:text-rose-300 transition-colors"
            title="Clear all history"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span className="text-sm">Clear History</span>
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-md hover:bg-white/50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-rose-100 dark:border-gray-700 shadow-sm">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-full">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h1 className="text-xl font-semibold text-rose-600 dark:text-rose-300">Emma AI - Email Marketing Assistant</h1>

              {/* Auth Button remains but styled to match */}
              {renderAuthButton()}
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 relative overflow-hidden bg-white dark:bg-gray-800">
          <div className="flex h-full flex-col">
            {/* Chat messages container with scrollbar at screen edge */}
            <div className="flex-1 w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/60 hover:scrollbar-thumb-gray-400/80 dark:scrollbar-thumb-gray-600/60 dark:hover:scrollbar-thumb-gray-500/80 scrollbar-track-transparent">
              <div className="flex justify-center">
                <div className="w-full max-w-[60%] px-4">
                  <div className="flex flex-col gap-6 py-4 md:py-8">
                    {messages.length === 0 ? (
                      // Welcome Screen (centered within the 60% container)
                      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
                        <div className="text-center space-y-8">
                          <div className="space-y-2">
                            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-300">Emma AI</h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                              Your intelligent email marketing assistant
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                            <div className="p-6 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow-lg border border-indigo-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                              <div className="text-indigo-500 dark:text-indigo-300 mb-3">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Email Campaigns</h2>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Create engaging email campaigns with AI-powered content suggestions
                              </p>
                            </div>
                            <div className="p-6 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow-lg border border-indigo-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                              <div className="text-indigo-500 dark:text-indigo-300 mb-3">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Analytics & Insights</h2>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Track performance and get smart recommendations for improvement
                              </p>
                            </div>
                            <div className="p-6 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow-lg border border-indigo-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                              <div className="text-indigo-500 dark:text-indigo-300 mb-3">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                </svg>
                              </div>
                              <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Smart Responses</h2>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Automatically handle customer replies with AI-powered responses
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Chat Messages
                      messages.map((message) => (
                        <div 
                          key={message._id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`
                            max-w-[85%] rounded-2xl px-4 py-3 shadow-sm
                            ${message.role === 'user' 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'}
                          `}>
                            {message.content}
                          </div>
                        </div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                          <div className="animate-pulse flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Invisible element to scroll to */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            </div>

            {/* Chat input form */}
            <div className="w-full border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex justify-center">
                <div className="w-full max-w-[60%] px-4 py-4 md:py-6">
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <textarea 
                          className="w-full resize-none rounded-xl pl-4 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-800 dark:text-white placeholder-gray-400"
                          placeholder="Message Enterprise AI..."
                          rows={1}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors inline-flex items-center justify-center"
                        disabled={!inputMessage.trim()}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 11L12 6M12 6L17 11M12 6V20" />
                        </svg>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        mode={deleteMode}
      />
    </div>
  );
}
