import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const newSession = await Session.create({
      userId: session.user.id,
      name: 'New Chat',
      createdAt: new Date(),
    });

    return NextResponse.json(newSession);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 