"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setIsVisible(false);
  };

  if (!hasMounted) return null;
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md w-full animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-card border border-border shadow-card-hover rounded-2xl overflow-hidden relative">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-2.5 rounded-full flex-shrink-0">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-card-foreground mb-1">
                Uso de Cookies
              </p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Utilizamos cookies estrictamente necesarias para garantizar el correcto
                funcionamiento del sistema y mantener su sesión segura.{" "}
                <Link
                  href="/cookies"
                  className="text-primary hover:underline font-medium"
                >
                  Leer política completa
                </Link>
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={acceptCookies}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium py-2 px-4 rounded-lg transition-colors w-full sm:w-auto shadow-warm"
                >
                  Entendido
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors absolute top-3 right-3"
              aria-label="Cerrar banner temporalmente"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
