"use client";

import { useEffect, useRef } from "react";

interface ValidationErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export function ValidationErrorModal({
  isOpen,
  title = "Almost there! One quick detail to check",
  message,
  onClose,
}: ValidationErrorModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/75 p-4 backdrop-blur-sm animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="validation-modal-title"
      aria-describedby="validation-modal-desc"
    >
      <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-amber-500/25 transition-all sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-4 ring-amber-100/60">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
              Needs your attention
            </span>
            <h3 id="validation-modal-title" className="mt-1 font-display text-lg font-bold text-teal-950">
              {title}
            </h3>
            <p id="validation-modal-desc" className="mt-2 text-sm leading-relaxed text-teal-900/80">
              {message}
            </p>

            <div className="mt-3.5 rounded-xl bg-teal-50/70 p-3 text-xs leading-relaxed text-teal-900/75 border border-teal-900/10">
              <span className="font-bold text-teal-950">Why we ask:</span> This ensures your official 80G tax exemption certificate and WhatsApp blessing photos reach you safely!
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-teal-900/10 pt-4">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl bg-saffron px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-saffron-dark transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2"
          >
            Okay, let me fix it
          </button>
        </div>
      </div>
    </div>
  );
}
