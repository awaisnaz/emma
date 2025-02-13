import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.send',
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Save the access token and refresh token in the JWT on the initial login
        return {
          ...token,
          access_token: account.access_token,
          expires_at: Math.floor(Date.now() / 1000 + account.expires_in),
          refresh_token: account.refresh_token,
        }
      } else if (Date.now() < token.expires_at * 1000) {
        // If the access token has not expired yet, return it
        return token
      }
      // If the access token has expired, try to refresh it
      return token;
    },
    async session({ session, token }) {
      // Send the access token to the client
      session.access_token = token.access_token;
      session.user.email = token.email;
      return session;
    },
  },
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 
