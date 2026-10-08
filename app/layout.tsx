import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: {
    default: 'System Design Interview',
    template: '%s | System Design Interview',
  },
  description: 'Bản tiếng Việt của System Design Interview: An Insider\'s Guide.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
