'use client';
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

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

  // Sync with backend when logged in
  useEffect(() => {
    if (session) {
      syncWithBackend();
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

  const syncWithBackend = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessions,
          messages: sessions.map(session => ({
            sessionId: session.id,
            messages: JSON.parse(localStorage.getItem(`messages_${session.id}`) || '[]')
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sync failed');
      }

      const data = await response.json();
      setSessions(data.sessions);
      
      if (currentSessionId) {
        const currentSessionMessages = data.messages.find(
          m => m.sessionId === currentSessionId
        )?.messages || [];
        setMessages(currentSessionMessages);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      // You might want to add a toast notification here
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Create new session if none exists
    if (!currentSessionId) {
      const newSession = {
        id: Date.now().toString(),
        title: inputMessage.slice(0, 30) + (inputMessage.length > 30 ? '...' : ''),
        timestamp: new Date().toISOString()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
    }

    const newMessage = {
      id: Date.now(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        content: "This is a simulated AI response. Replace this with your actual AI integration.",
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);

      // Update session title if it's the first message
      if (messages.length === 0) {
        setSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, title: inputMessage.slice(0, 30) + (inputMessage.length > 30 ? '...' : '') }
            : session
        ));
      }
    }, 1000);
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
        <div className="h-16 flex items-center justify-between px-4 border-b border-rose-100 dark:border-gray-700">
          <button 
            onClick={createNewSession}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-colors text-rose-600 dark:text-rose-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">New Session</span>
          </button>
          
          <button 
            className="md:hidden p-2 rounded-md hover:bg-white/50 dark:hover:bg-gray-700 text-rose-600 dark:text-rose-300"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Recent Sessions */}
        <div className="flex-1 overflow-y-auto p-4 text-gray-800 dark:text-white">
          <h2 className="text-sm font-semibold text-rose-600 dark:text-rose-300 mb-3 uppercase tracking-wide">Recent sessions</h2>
          <div className="space-y-2">
            {sessions.map((session, index) => (
              <div
                key={index}
                className={`
                  group flex items-center justify-between w-full px-3 py-2 rounded-md 
                  ${currentSessionId === session.id 
                    ? 'bg-rose-500/10 dark:bg-rose-500/20' 
                    : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700'} 
                  transition-colors cursor-pointer
                `}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  const savedMessages = localStorage.getItem(`messages_${session.id}`);
                  if (savedMessages) {
                    setMessages(JSON.parse(savedMessages));
                  }
                  setIsSidebarOpen(false);
                }}
              >
                <div className="flex items-center gap-3 text-sm text-left flex-1 min-w-0">
                  <svg className="w-4 h-4 flex-shrink-0 text-rose-400 dark:text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                  <span className="truncate font-medium">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className={`
                    p-1 rounded-md hover:bg-rose-50 dark:hover:bg-gray-600 
                    text-gray-400 hover:text-rose-500 dark:hover:text-rose-300 
                    ${currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
                    transition-opacity
                  `}
                  title="Delete chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
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

              <h1 className="text-xl font-semibold text-rose-600 dark:text-rose-300">Beauty Expert AI</h1>

              {/* Auth Button remains but styled to match */}
              {renderAuthButton()}
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden bg-gradient-to-b from-rose-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-3xl mx-auto h-full flex flex-col">
            {messages.length === 0 ? (
              // Welcome Screen
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-8">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-rose-600 dark:text-rose-300">Beauty Expert AI</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      Your personal luxury beauty advisor
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <div className="p-6 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow-lg border border-rose-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                      <div className="text-rose-500 dark:text-rose-300 mb-3">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Beauty Tips</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Get personalized skincare routines and beauty advice
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow-lg border border-rose-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                      <div className="text-rose-500 dark:text-rose-300 mb-3">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Product Advice</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Discover luxury beauty products tailored to you
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow-lg border border-rose-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                      <div className="text-rose-500 dark:text-rose-300 mb-3">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Salon Finder</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Find top-rated beauty salons near you
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Chat Messages
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[80%] rounded-xl p-4 shadow-sm
                      ${message.role === 'user' 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-rose-100 dark:border-gray-700'}
                    `}>
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-rose-100 dark:border-gray-700">
                      <div className="animate-pulse">Thinking...</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chat Input */}
            <div className="border-t border-rose-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 p-4">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
                <textarea 
                  className="w-full p-4 pr-12 rounded-xl border border-rose-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:border-rose-300 dark:focus:border-rose-500 resize-none shadow-sm"
                  placeholder="Ask about beauty tips, luxury products, or find premium salons..."
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
                <button 
                  type="submit"
                  className="absolute right-3 bottom-3 p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-gray-700"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" />
                  </svg>
                </button>
              </form>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                Beauty Expert AI provides luxury beauty advice. Always consult professionals for specific treatments.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-16 bg-white dark:bg-gray-800 border-t border-rose-100 dark:border-gray-700">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-full">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Beauty Expert AI - Your Luxury Beauty Assistant
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-300">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-300">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </footer>
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
