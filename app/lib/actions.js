'use server'

import { Chat } from '../models/Chat';
import { connectDB } from './mongoose';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createChat(userId) {
  await connectDB();
  const chat = await Chat.create({
    userId,
    title: 'New Chat',
  });
  return chat;
}

export async function sendMessage(chatId, content, userId) {
  await connectDB();
  
  // Add user message
  const chat = await Chat.findById(chatId);
  if (!chat || chat.userId !== userId) {
    throw new Error('Chat not found or unauthorized');
  }

  chat.messages.push({
    content,
    role: 'user',
  });

  // Generate AI response
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  // Add AI response
  const aiMessage = {
    content: completion.choices[0].message.content,
    role: 'assistant',
  };
  chat.messages.push(aiMessage);

  await chat.save();
  return aiMessage;
}

export async function getChats(userId) {
  await connectDB();
  return await Chat.find({ userId }).sort({ createdAt: -1 });
} 