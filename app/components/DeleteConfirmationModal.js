export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, mode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {mode === 'clear' ? 'Clear Chat History?' : 'Delete Session?'}
        </h3>
        
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Your chat history helps us provide personalized beauty recommendations based on:
          </p>
          
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-2">
            <li>Your skin type and concerns</li>
            <li>Previous product preferences</li>
            <li>Your beauty routine</li>
            <li>Past recommendations and feedback</li>
          </ul>

          <p className="text-gray-600 dark:text-gray-300">
            If you {mode === 'clear' ? 'clear your history' : 'delete this session'}, we'll start fresh and need to learn your preferences again.
          </p>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors"
          >
            {mode === 'clear' ? 'Clear History' : 'Delete Session'}
          </button>
        </div>
      </div>
    </div>
  );
} 