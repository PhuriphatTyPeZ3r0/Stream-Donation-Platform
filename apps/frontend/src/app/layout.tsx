import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'StreamPay',
  description: 'Stream Donation Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
