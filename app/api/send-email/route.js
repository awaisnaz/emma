import { getServerSession } from "next-auth/next";
import { google } from 'googleapis';
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Debug session
    console.log('Session:', {
      exists: !!session,
      accessToken: !!session?.access_token,
      user: session?.user
    });

    if (!session?.access_token) {
      return Response.json({ 
        success: false, 
        error: 'Not authenticated or missing access token',
        debug: {
          sessionExists: !!session,
          hasAccessToken: !!session?.access_token
        }
      }, { status: 401 });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Set credentials directly
    oauth2Client.setCredentials({
      access_token: session.access_token,
      scope: 'https://www.googleapis.com/auth/gmail.send'
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const { to = "awais.nazir.ch@gmail.com" } = await req.json();
    const { subject, body } = generateTestEmail();

    // Create the email message
    const messageParts = [
      `From: ${session.user.email}`,
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body,
    ];
    const message = messageParts.join('\n');

    // The body needs to be base64url encoded
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return Response.json({ 
      success: true, 
      messageId: res.data.id,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Failed to send email:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to send email'
    }, { status: 500 });
  }
}

function generateTestEmail() {
  const subjects = [
    "Quick update on our project",
    "Let's catch up soon",
    "Important announcement",
    "Weekly newsletter",
    "New features available"
  ];

  const bodies = [
    "Hope you're doing well! Just wanted to touch base about our recent developments.",
    "I thought you might be interested in our latest updates.",
    "We've made some exciting progress that I'd love to share with you.",
    "Here's a quick summary of what's been happening lately.",
    "Looking forward to hearing your thoughts on this."
  ];

  return {
    subject: subjects[Math.floor(Math.random() * subjects.length)],
    body: bodies[Math.floor(Math.random() * bodies.length)]
  };
} 