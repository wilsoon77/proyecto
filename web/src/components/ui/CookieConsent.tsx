"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Verificamos si ya existe el consentimiento en localStorage
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Pequeño retraso para que la animación de entrada sea visible
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

  // Prevenir problemas de hidratación
  if (!hasMounted) return null;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md w-full animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl overflow-hidden relative">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-full flex-shrink-0">
              <Cookie className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Uso de Cookies
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                Utilizamos cookies estrictamente necesarias para garantizar el correcto 
                funcionamiento del sistema y mantener su sesión segura.{" "}
                <Link 
                  href="/cookies" 
                  className="text-amber-600 dark:text-amber-500 hover:underline font-medium"
                >
                  Leer política completa
                </Link>
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={acceptCookies}
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white text-xs font-medium py-2 px-4 rounded-lg transition-colors w-full sm:w-auto"
                >
                  Entendido
                </button>
              </div>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md transition-colors absolute top-3 right-3"
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
