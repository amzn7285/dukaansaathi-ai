import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BolVyapar AI (बोल व्यापार)',
  description: 'Boliye… Baaki Sab BolVyapar Sambhalega. Your voice-first AI business partner.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-hidden h-svh w-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
