import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Belief Router",
  description: "Thesis → Trade recommendations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        background: "#050507",
        color: "#e4e4e7",
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: "100vh",
      }}>
        {children}
      </body>
    </html>
  );
}
