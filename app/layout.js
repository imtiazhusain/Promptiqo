import './globals.css';

export const metadata = {
  title: 'ChatDPT',
  description: 'A smart personal assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-neutral-900 text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
