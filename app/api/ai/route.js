import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Users from '@/models/users';
import Chats from '@/models/chats';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req) {
  try {
    const { message } = await req.json();
    const session = await getServerSession(authOptions);
    
    // Connect to database and get user
    await connectDB();
    const user = await Users.findOne({ email: session?.user?.email });
    
    // Get chat history
    let chatHistory = [];
    if (user) {
      chatHistory = await Chats.find({ userId: user._id })
        .sort({ createdAt: 1 })
        .select('content role')
        .limit(10);
    }

    // Format chat history for AI
    const formattedMessages = [
      {
        role: "system",
        content: "You are a helpful AI assistant focused on helping with email marketing and business automation."
      },
      ...chatHistory.map(chat => ({
        role: chat.role,
        content: chat.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Nexus AI',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API Error:', await response.text());
      return NextResponse.json(
        { error: 'Failed to get AI response' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('AI processing failed:', error);
    return NextResponse.json(
      { error: 'Failed to process with AI' }, 
      { status: 500 }
    );
  }
} 