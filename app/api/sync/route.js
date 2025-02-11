import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import Message from '@/models/Message';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Connect to MongoDB
    await connectDB();

    const { sessions, messages } = await req.json();
    const userId = session.user.id;

    // Update sessions
    await Promise.all(sessions.map(async (sessionData) => {
      await Session.findOneAndUpdate(
        { id: sessionData.id, userId },
        {
          title: sessionData.title,
          timestamp: sessionData.timestamp,
          userId
        },
        { upsert: true, new: true }
      );
    }));

    // Update messages
    await Promise.all(messages.flatMap(({ sessionId, messages }) =>
      messages.map(async (messageData) => {
        await Message.findOneAndUpdate(
          { id: messageData.id, sessionId, userId },
          {
            content: messageData.content,
            role: messageData.role,
            timestamp: messageData.timestamp,
            userId,
            sessionId
          },
          { upsert: true, new: true }
        );
      })
    ));

    // Get latest data
    const updatedSessions = await Session.find({ userId })
      .sort({ timestamp: -1 })
      .lean();

    const updatedMessages = await Promise.all(
      updatedSessions.map(async (session) => ({
        sessionId: session.id,
        messages: await Message.find({ sessionId: session.id })
          .sort({ timestamp: 1 })
          .lean()
      }))
    );

    return NextResponse.json({ 
      sessions: updatedSessions,
      messages: updatedMessages
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
} 