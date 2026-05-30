import "./globals.css";
export const metadata = {
  title: "Samtulan — Family Safe Video Platform",
  description: "India ka pehla AI + Human verified family-safe video platform",
};
export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
