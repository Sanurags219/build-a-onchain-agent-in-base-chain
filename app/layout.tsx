import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export async function generateMetadata(): Promise<Metadata> {
  const ROOT_URL = "https://ais-dev-zezwaiydiprrocqjagxzwi-615601803900.asia-southeast1.run.app";
  return {
    title: 'BaseAgent',
    description: 'Intelligent Onchain Agent on Base',
    other: {
      'fc:miniapp': JSON.stringify({
        version: 'next',
        imageUrl: `https://picsum.photos/seed/baseagenticon/200/200`,
        button: {
          title: `Launch BaseAgent`,
          action: {
            type: 'launch_miniapp',
            name: 'BaseAgent',
            url: ROOT_URL,
            splashImageUrl: `https://picsum.photos/seed/baseagentsplash/400/400`,
            splashBackgroundColor: '#0f172a',
          },
        },
      }),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased bg-slate-950 text-white min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
