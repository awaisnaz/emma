import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Emma AI - Email Marketing Assistant',
  description: 'AI-powered email marketing assistant to help you write and manage email campaigns',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/icon.png',
        type: 'image/png',
        sizes: '32x32',
      },
    ],
    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23E11D48'/><stop offset='100%' style='stop-color:%23FB7185'/></linearGradient></defs><rect width='100' height='100' rx='20' fill='url(%23grad)'/><path d='M30 35h40M30 50h40M30 65h25' stroke='white' stroke-width='8' stroke-linecap='round'/><circle cx='75' cy='65' r='6' fill='white'><animate attributeName='opacity' values='1;0.5;1' dur='2s' repeatCount='indefinite'/></circle></svg>"
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
