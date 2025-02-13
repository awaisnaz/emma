import mongoose from 'mongoose';

const chatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });  // This automatically adds createdAt and updatedAt fields

// Prevent model recompilation error
const Chats = mongoose.models.chats || mongoose.model('chats', chatsSchema);

export default Chats; 