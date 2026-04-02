"use client";

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 mt-4 mx-auto flex max-w-3xl items-center justify-between px-6">
      <div
        className={cn(
          "flex w-full items-center justify-between",
          "rounded-full px-5 py-2.5",
          "bg-[rgba(237,237,237,0.72)] backdrop-blur-[24px]",
          "dark:bg-[rgba(20,20,20,0.72)]",
          "border border-black/[0.06] dark:border-white/[0.06]"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#141414] dark:bg-[#F5F5F5]" />
          <span className="text-sm font-semibold text-[#141414] dark:text-[#F5F5F5]">
            AushCRM
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#707070] transition-colors duration-150 hover:text-[#141414] dark:hover:text-[#F5F5F5]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#707070] transition-colors duration-150 hover:text-[#141414] dark:hover:text-[#F5F5F5]"
            aria-label="Toggle dark mode"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </button>

          <Link
            href="/interview"
            className="rounded-full bg-[#141414] px-4 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#141414]/90 dark:bg-[#F5F5F5] dark:text-[#141414] dark:hover:bg-[#F5F5F5]/90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
