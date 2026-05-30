import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Samtulan — Family Safe Video Platform",
  description: "India ka pehla AI + Human verified family-safe video platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
