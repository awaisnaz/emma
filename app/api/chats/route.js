import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Users from '@/models/users';
import Chats from '@/models/chats';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();

    if (!session?.user?.email) {
      return NextResponse.json({ chats: [] });
    }

    // Find or create user
    let user = await Users.findOne({ email: session.user.email });
    if (!user) {
      user = await Users.create({ email: session.user.email });
    }

    // Get chats for user
    const chats = await Chats.find({ userId: user._id })
      .sort({ createdAt: 1 })
      .select('content role createdAt');

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Failed to get chats:', error);
    return NextResponse.json({ error: 'Failed to get chats' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const { content, role, email } = await req.json();
    
    await connectDB();

    // Find or create user
    let user = await Users.findOne({ email: email || session?.user?.email });
    if (!user && email) {
      user = await Users.create({ email });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create chat message
    const chat = await Chats.create({
      userId: user._id,
      content,
      role
    });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Failed to save chat:', error);
    return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user
    const user = await Users.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all chats for this user
    await Chats.deleteMany({ userId: user._id });

    return NextResponse.json({ message: 'Chats deleted successfully' });
  } catch (error) {
    console.error('Failed to delete chats:', error);
    return NextResponse.json({ error: 'Failed to delete chats' }, { status: 500 });
  }
} 