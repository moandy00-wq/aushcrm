import Link from "next/link";

const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-black/[0.06] dark:border-white/[0.06]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#141414] dark:bg-[#F5F5F5]" />
            <span className="text-sm font-semibold text-[#141414] dark:text-[#F5F5F5]">
              AushCRM
            </span>
          </div>
          <span className="text-xs text-[#707070]">
            &copy; 2026 AushCRM. All rights reserved.
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-[#707070] transition-colors duration-150 hover:text-[#141414] dark:hover:text-[#F5F5F5]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
