import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  }
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema); 