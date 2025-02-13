import mongoose from 'mongoose';

const usersSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

// Prevent model recompilation error
const Users = mongoose.models.users || mongoose.model('users', usersSchema);

export default Users;

async function handleAuth(req, res) {
  try {
    const email = req.body.email; // or however you receive the email

    // Check if user already exists
    let user = await Users.findOne({ email });
    
    if (!user) {
      // Only create new user if email doesn't exist
      user = await Users.create({ email });
    }

    // Return user _id and email
    return res.json({ 
      success: true, 
      user: {
        _id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
} 