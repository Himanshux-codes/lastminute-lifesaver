import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Last-Minute Life Saver — Your AI Chief of Staff",
  description:
    "An AI productivity operating system that predicts missed deadlines and intervenes before they happen.",
};

// Reads the persisted theme choice and applies it to <html> before paint, so there's no
// flash of the wrong theme on load. Runs as an inline script because it must execute
// synchronously, before React hydrates.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem("lastminute-theme");
    if (stored === "light") document.documentElement.classList.add("light");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} dark`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-base-950 font-body text-ink antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <OfflineBanner />
              <GlobalShortcuts />
              <div id="main-content">
                <PageTransition>{children}</PageTransition>
              </div>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
