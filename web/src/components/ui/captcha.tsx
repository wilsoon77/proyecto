"use client"

import HCaptcha from "@hcaptcha/react-hcaptcha"
import { forwardRef } from "react"

interface CaptchaProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: (error: string) => void
}

/**
 * Componente de CAPTCHA usando hCaptcha
 * 
 * Para usar este componente, necesitas configurar tu Sitekey en:
 * - Variables de entorno: NEXT_PUBLIC_HCAPTCHA_SITEKEY
 * 
 * Obtén tu Sitekey en: https://dashboard.hcaptcha.com
 */
const Captcha = forwardRef<HCaptcha, CaptchaProps>(
  ({ onVerify, onExpire, onError }, ref) => {
    const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY

    // Si no hay sitekey configurada, no renderizar nada
    // Esto permite que la app funcione sin CAPTCHA durante desarrollo
    if (!sitekey) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "⚠️ hCaptcha Sitekey no configurada. " +
          "Agrega NEXT_PUBLIC_HCAPTCHA_SITEKEY a tu .env.local para habilitar CAPTCHA."
        )
      }
      return null
    }

    return (
      <div className="flex justify-center my-4">
        <HCaptcha
          ref={ref}
          sitekey={sitekey}
          onVerify={onVerify}
          onExpire={onExpire}
          onError={onError}
          theme="light"
          size="normal"
        />
      </div>
    )
  }
)

Captcha.displayName = "Captcha"

export default Captcha
