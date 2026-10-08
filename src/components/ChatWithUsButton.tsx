"use client";

import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";

export function ChatWithUsButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <aside
      aria-label="Direct WhatsApp Support"
      className="fixed bottom-20 right-4 z-40 hidden sm:flex items-center no-print pointer-events-auto"
    >
      <a
        href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello Janaseva Ashrama, I would like to support the 25 boys.")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Janaseva Ashrama on WhatsApp"
        className="focus-ring tap-scale flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba59] px-4 py-2.5 text-xs font-black text-white shadow-[0_8px_25px_rgba(37,211,102,0.4)] border border-white/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        {/* WhatsApp SVG Icon */}
        <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
        </svg>
        <span className="tracking-wide">Chat with us</span>
      </a>
    </aside>
  );
}
