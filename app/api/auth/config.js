import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from '@/lib/mongodb-adapter'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
  },
}; 