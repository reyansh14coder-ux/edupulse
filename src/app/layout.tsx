import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vidyora — Continuous student support, powered by data",
    template: "%s · Vidyora",
  },
  description:
    "Vidyora collects marks, attendance, homework and school activity into one student progress database — then turns it into insights for teachers, parents and students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, jakarta.variable, "h-full antialiased")}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
