import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const dummyChats = [
  { _id: 'dummy-1', name: 'Chat about React Hooks' },
  { _id: 'dummy-2', name: 'NextJS Project Discussion' },
  { _id: 'dummy-3', name: 'Database Design Help' },
  { _id: 'dummy-4', name: 'API Integration Questions' },
  { _id: 'dummy-5', name: 'Debugging Session' },
];

const Sidebar = () => {
  const [sessions, setSessions] = useState(dummyChats);
  const router = useRouter();

  const handleNewSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to create session');
      // Refresh sessions list or update UI
      router.refresh();
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete session');
      router.refresh();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <div className="flex flex-col h-full p-2">
      <button 
        onClick={handleNewSession}
        className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 transition-colors"
      >
        <PlusIcon className="w-5 h-5" />
        New Session
      </button>
      
      <div className="flex-1 overflow-y-auto mt-4">
        {sessions?.map((session) => (
          <div 
            key={session._id} 
            className="flex items-center justify-between p-2 hover:bg-gray-700 rounded group cursor-pointer mb-1"
          >
            <Link 
              href={`/chat/${session._id}`}
              className="flex-1 truncate text-sm text-gray-300"
            >
              {session.name || 'New Chat'}
            </Link>
            <button
              onClick={() => handleDeleteSession(session._id)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 