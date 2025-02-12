'use client';
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Link from 'next/link';

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

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Session',
      timestamp: new Date().toISOString()
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const deleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      localStorage.removeItem(`messages_${sessionId}`);
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    }
  };

  const clearAllSessions = () => {
    if (window.confirm('Are you sure you want to clear all session history?')) {
      // Clear all session messages from local storage
      sessions.forEach(session => {
        localStorage.removeItem(`messages_${session.id}`);
      });
      
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  // Modify handleSubmit to save chats to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      content: inputMessage,
      role: 'user',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Save user message to backend
      await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: inputMessage,
          role: 'user',
          email: session?.user?.email
        })
      });

      // Simulate AI response (replace with your actual AI integration)
      const aiResponse = {
        content: "This is a simulated AI response. Replace this with your actual AI integration.",
        role: 'assistant',
      };

      setMessages(prev => [...prev, aiResponse]);

      // Save AI response to backend
      await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: aiResponse.content,
          role: 'assistant',
          email: session?.user?.email
        })
      });

    } catch (error) {
      console.error('Failed to save chat:', error);
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

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const renderAuthButton = () => {
    if (status === "loading") {
      return (
        <div className="w-8 h-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-t-rose-500 border-rose-200 rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="relative group">
        <button 
          onClick={() => !session ? handleSignIn() : null}
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
        
        {session?.user && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 hidden group-hover:block">
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
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

  const handleDeleteSession = (sessionId) => {
    setDeleteMode('delete');
    setSessionToDelete(sessionId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deleteMode === 'clear') {
      setMessages([]);
      setSessions([]);
      setCurrentSessionId(null);
    } else if (deleteMode === 'delete' && sessionToDelete) {
      setSessions(prev => prev.filter(session => session.id !== sessionToDelete));
      if (currentSessionId === sessionToDelete) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    }
    setIsDeleteModalOpen(false);
  };

  // Don't render content until mounted
  if (!mounted) {
    return null; // or a loading spinner if preferred
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Overlay for mobile - closes sidebar when clicking outside */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - updated with luxury theme */}
      <div className={`
        fixed md:static top-0 left-0 w-64 h-full 
        bg-gradient-to-b from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 z-50 flex flex-col
        border-r border-rose-100 dark:border-gray-700
      `}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-indigo-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-rose-300 dark:text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            <span className="text-lg font-semibold text-gray-800 dark:text-white">Integration Tools</span>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="px-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-gray-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#EA4335">
                <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Gmail</span>
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

              <h1 className="text-xl font-semibold text-rose-600 dark:text-rose-300">Nexus AI - Your Intelligent Assistant</h1>

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
                            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-300">Nexus AI</h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                              Your intelligent business assistant
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                            <div className="p-6 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow-lg border border-indigo-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                              <div className="text-indigo-500 dark:text-indigo-300 mb-3">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Book Parlour</h2>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Schedule and manage appointments easily
                              </p>
                            </div>
                            <div className="p-6 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow-lg border border-indigo-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                              <div className="text-indigo-500 dark:text-indigo-300 mb-3">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Service People</h2>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Manage your service team efficiently
                              </p>
                            </div>
                            <div className="p-6 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow-lg border border-indigo-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                              <div className="text-indigo-500 dark:text-indigo-300 mb-3">
                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Email Marketing</h2>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Create and manage email campaigns
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Chat Messages
                      messages.map((message) => (
                        <div 
                          key={message.id}
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
                          className="w-full resize-none rounded-xl pl-4 pr-32 py-3 bg-gray-100 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-800 dark:text-white placeholder-gray-400"
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
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                          <button 
                            type="button" 
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors inline-flex items-center justify-center"
                            aria-label="Add image"
                          >
                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button 
                            type="button" 
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors inline-flex items-center justify-center"
                            aria-label="Attach file"
                          >
                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                            </svg>
                          </button>
                          <button 
                            type="button" 
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors inline-flex items-center justify-center"
                            aria-label="Voice input"
                          >
                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                              <path d="M19 10v2a7 7 0 01-14 0v-2" />
                              <line x1="12" y1="19" x2="12" y2="23" />
                              <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                          </button>
                        </div>
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
