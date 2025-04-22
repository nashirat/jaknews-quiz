import DeployButton from "@/components/deploy-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "JAK News Quiz App",
  description: "A Quiz Application for Symposium Sessions",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center bg-black">
            <div className="flex-1 w-full flex flex-col gap-6 items-center">
              <nav className="w-full flex justify-center border-b border-b-gray-800 h-16">
                <div className="w-full md:max-w-5xl flex justify-between items-center p-3 px-4 text-sm">
                  <div className="flex gap-4 items-center font-semibold">
                    <Link href={"/"} className="text-white">Jaknews 12 Quiz and BrainBee</Link>
                    <Link href={"/quizzes"} className="text-white">Manage Quizzes</Link>
                    <Link href={"/doquiz"} className="text-white">Take a Quiz</Link>
                  </div>
             
                </div>
              </nav>
              <div className="flex flex-col gap-6 w-full px-2 md:max-w-5xl">
                {children}
              </div>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
