import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Samtulan | India's Family-Safe Video Platform",
  description: "Samtulan is India's first AI-verified family safe video platform. Watch, share, and create with confidence.",
  keywords: "family-safe video, clean content, video platform, AI moderation, Samtulan",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
